"""
MineGuard YOLO Pose Detection Server
=====================================
FastAPI + WebSocket server that:
1. Receives raw JPEG frames from the browser live camera stream
2. Runs YOLO pose detection on each frame
3. Applies temporal stabilization (no raw-prediction flicker)
4. Returns structured JSON detections to the frontend

Run:
    python yolo_server.py
    (requires: fastapi, uvicorn, ultralytics, opencv-python, numpy)
"""

import math
import time
import json
import asyncio
import ipaddress
import logging
import os
import urllib.error
import urllib.request
from collections import deque
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

import numpy as np
import cv2
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from ultralytics import YOLO

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

# ---------------------------------------------------------------------------
logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(message)s")
log = logging.getLogger("yolo_server")

# ---------------------------------------------------------------------------
# Temporal configuration
# ---------------------------------------------------------------------------

class TemporalConfig(BaseModel):
    history_window: int = 10
    fall_confirm_threshold: float = 0.6
    fall_recovery_threshold: float = 0.4
    fall_min_persistence_sec: float = 2.0
    person_ttl_sec: float = 5.0
    count_smoothing_window: int = 8
    keypoint_min_confidence: float = 0.2
    fall_angle_threshold: float = 55.0
    fall_aspect_ratio_threshold: float = 1.5


CONFIG = TemporalConfig()
MODEL: Optional[YOLO] = None


def load_model():
    global MODEL
    try:
        MODEL = YOLO("yolo26n-pose.pt")
        log.info("YOLO model loaded: yolo26n-pose.pt")
    except Exception as e:
        log.error(f"Failed to load YOLO model: {e}")
        MODEL = None


# ---------------------------------------------------------------------------
# Posture analysis (same logic as existing main.py)
# ---------------------------------------------------------------------------

def calculate_posture(kp, kp_conf):
    """Returns (posture_str, angle_deg, aspect_ratio)."""
    def valid(idx):
        return len(kp_conf) > idx and kp_conf[idx] >= CONFIG.keypoint_min_confidence

    if not (valid(5) and valid(6) and valid(11) and valid(12)):
        return "UNKNOWN", 0.0, 0.0

    left_shoulder  = kp[5];  right_shoulder = kp[6]
    left_hip       = kp[11]; right_hip      = kp[12]

    shoulder_cx = (left_shoulder[0] + right_shoulder[0]) / 2
    shoulder_cy = (left_shoulder[1] + right_shoulder[1]) / 2
    hip_cx      = (left_hip[0] + right_hip[0]) / 2
    hip_cy      = (left_hip[1] + right_hip[1]) / 2

    dx = hip_cx - shoulder_cx
    dy = hip_cy - shoulder_cy
    angle = abs(math.degrees(math.atan2(dx, max(abs(dy), 1e-6))))

    xs, ys = [], []
    for idx in [5, 6, 11, 12, 15, 16]:
        if valid(idx):
            xs.append(kp[idx][0]); ys.append(kp[idx][1])

    body_width  = max(xs) - min(xs) if xs else 0
    body_height = max(ys) - min(ys) if ys else 1
    if body_height < 1: body_height = 1
    aspect_ratio = body_width / body_height

    posture = "FALL" if (
        angle > CONFIG.fall_angle_threshold or
        aspect_ratio > CONFIG.fall_aspect_ratio_threshold
    ) else "STANDING"

    return posture, angle, aspect_ratio


# ---------------------------------------------------------------------------
# Temporal stabilizer
# ---------------------------------------------------------------------------

@dataclass
class PersonState:
    person_id: int
    history: deque = field(default_factory=lambda: deque(maxlen=10))
    fall_confirmed: bool = False
    fall_confirmed_at: float = 0.0
    last_seen_at: float = field(default_factory=time.monotonic)
    bbox: Optional[dict] = None
    confidence: float = 0.0


class TemporalStabilizer:
    def __init__(self):
        self._states: dict = {}

    def _get(self, pid):
        if pid not in self._states:
            self._states[pid] = PersonState(person_id=pid)
        return self._states[pid]

    def update(self, person_id, raw_posture, bbox_px, confidence):
        now = time.monotonic()
        s = self._get(person_id)
        s.last_seen_at = now
        s.bbox = bbox_px
        s.confidence = confidence

        if s.history.maxlen != CONFIG.history_window:
            old = list(s.history)
            s.history = deque(old[-CONFIG.history_window:], maxlen=CONFIG.history_window)

        if raw_posture in ("FALL", "STANDING"):
            s.history.append(raw_posture)

        if not s.history:
            return s.fall_confirmed

        fall_frac  = s.history.count("FALL")    / len(s.history)
        stand_frac = s.history.count("STANDING") / len(s.history)

        if not s.fall_confirmed:
            if fall_frac >= CONFIG.fall_confirm_threshold:
                s.fall_confirmed = True
                s.fall_confirmed_at = now
        else:
            elapsed = now - s.fall_confirmed_at
            if stand_frac > (1.0 - CONFIG.fall_recovery_threshold) and elapsed >= CONFIG.fall_min_persistence_sec:
                s.fall_confirmed = False

        return s.fall_confirmed

    def evict_stale(self):
        now = time.monotonic()
        stale = [pid for pid, s in self._states.items() if now - s.last_seen_at > CONFIG.person_ttl_sec]
        for pid in stale:
            del self._states[pid]


class CountSmoother:
    def __init__(self):
        self._history: deque = deque(maxlen=8)

    def push(self, count):
        self._history = deque(self._history, maxlen=CONFIG.count_smoothing_window)
        self._history.append(count)
        return max(set(self._history), key=list(self._history).count)


stabilizer   = TemporalStabilizer()
count_smoother = CountSmoother()
last_detections: dict = {"timestamp": None, "people_detected": 0, "any_fall": False, "detections": []}


def run_yolo_on_frame(jpeg_bytes):
    global last_detections

    if MODEL is None:
        return last_detections

    try:
        nparr = np.frombuffer(jpeg_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if frame is None:
            return last_detections

        h, w = frame.shape[:2]
        results = MODEL(frame, verbose=False)
        result  = results[0]

        raw_count = 0
        detections_out = []

        if result.keypoints is not None and result.boxes is not None:
            kp_xy   = result.keypoints.xy.cpu().numpy()
            kp_conf = result.keypoints.conf.cpu().numpy()
            boxes   = result.boxes.xyxy.cpu().numpy()
            box_conf= result.boxes.conf.cpu().numpy()

            raw_count = len(kp_xy)

            for idx, (kp, kpc, box, det_conf) in enumerate(zip(kp_xy, kp_conf, boxes, box_conf)):
                if len(kp) < 17:
                    continue

                posture, angle, ratio = calculate_posture(kp, kpc)

                x1, y1, x2, y2 = map(float, box)
                bbox_px = {"x1": x1, "y1": y1, "x2": x2, "y2": y2}

                fall_confirmed = stabilizer.update(
                    person_id=idx,
                    raw_posture=posture,
                    bbox_px=bbox_px,
                    confidence=float(det_conf),
                )

                entry = {
                    "id": idx + 1,
                    "position": "fall" if fall_confirmed else "standing",
                    "confidence": round(float(det_conf), 3),
                    "fall_confirmed": fall_confirmed,
                }

                if fall_confirmed:
                    entry["bounding_box"] = {"x1": round(x1,1), "y1": round(y1,1), "x2": round(x2,1), "y2": round(y2,1)}
                    entry["bounding_box_pct"] = {
                        "x":      (x1 / w) * 100,
                        "y":      (y1 / h) * 100,
                        "width":  ((x2 - x1) / w) * 100,
                        "height": ((y2 - y1) / h) * 100,
                    }

                detections_out.append(entry)

        stabilizer.evict_stale()
        stable_count = count_smoother.push(raw_count)

        last_detections = {
            "timestamp":      time.strftime("%Y-%m-%dT%H:%M:%S"),
            "people_detected": stable_count,
            "any_fall":       any(d["fall_confirmed"] for d in detections_out),
            "detections":     detections_out,
        }

    except Exception as e:
        log.warning(f"YOLO inference error: {e}")

    return last_detections


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------

app = FastAPI(title="MineGuard YOLO Server", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


@app.on_event("startup")
async def on_startup():
    load_model()


@app.get("/health")
async def health():
    return {"status": "ok", "model_loaded": MODEL is not None}


@app.post("/ai/analyze")
def analyze_with_grok(payload: dict, request: Request):
    if request.client is None or not ipaddress.ip_address(request.client.host).is_loopback:
        raise HTTPException(status_code=403, detail="AI analysis is available only to local clients.")

    api_key = os.getenv("GROK_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="GROK_API_KEY is not configured in the project .env file.")

    request_payload = dict(payload)
    request_payload["model"] = os.getenv("GROK_MODEL", "grok-4.7")
    grok_request = urllib.request.Request(
        "https://api.x.ai/v1/chat/completions",
        data=json.dumps(request_payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(grok_request, timeout=60) as response:
            result = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        try:
            error_payload = json.loads(error.read().decode("utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError):
            error_payload = {}
        error_detail = error_payload.get("error", {})
        if isinstance(error_detail, dict):
            error_detail = error_detail.get("message", "")
        if not isinstance(error_detail, str) or not error_detail:
            error_detail = error_payload.get("message", "")
        detail = f"Grok API returned HTTP {error.code}"
        if isinstance(error_detail, str) and error_detail:
            detail += f": {error_detail[:500]}"
        raise HTTPException(status_code=502, detail=detail) from error
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, UnicodeDecodeError) as error:
        raise HTTPException(status_code=502, detail="Could not complete Grok AI analysis.") from error

    return JSONResponse(content=result)


@app.get("/yolo/detections")
async def get_detections():
    return JSONResponse(content=last_detections)


@app.get("/yolo/config")
async def get_config():
    return CONFIG.model_dump()


@app.put("/yolo/config")
async def update_config(new_config: TemporalConfig):
    global CONFIG
    CONFIG = new_config
    return CONFIG.model_dump()


@app.websocket("/ws/yolo")
async def yolo_ws(websocket: WebSocket):
    await websocket.accept()
    log.info(f"WS client connected: {websocket.client}")
    try:
        while True:
            message = await websocket.receive()

            if "bytes" in message and message["bytes"]:
                result = await asyncio.get_event_loop().run_in_executor(
                    None, run_yolo_on_frame, message["bytes"]
                )
                await websocket.send_text(json.dumps(result))

            elif "text" in message and message["text"]:
                try:
                    payload = json.loads(message["text"])
                    if payload.get("type") == "ping":
                        await websocket.send_text(json.dumps({"type": "pong"}))
                except Exception:
                    pass

    except WebSocketDisconnect:
        log.info("WS client disconnected")
    except Exception as e:
        log.error(f"WS error: {e}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("yolo_server:app", host="0.0.0.0", port=8765, reload=False, log_level="info")
