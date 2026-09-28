// ============================================================
// useYoloPoseDetection — Custom hook
// Captures JPEG frames from the browser MediaStream,
// sends them to the YOLO WebSocket server, and returns
// stabilized structured detection data.
//
// IMPORTANT: This hook does NOT open a second camera.
// It accepts a MediaStream (already used by the live camera)
// samples frames via a hidden canvas, and sends JPEGs to backend.
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface YoloBoundingBoxPx {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface YoloBoundingBoxPct {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface YoloPersonDetection {
  id: number;
  /** 'standing' | 'fall' */
  position: string;
  confidence: number;
  fall_confirmed: boolean;
  bounding_box?: YoloBoundingBoxPx;
  bounding_box_pct?: YoloBoundingBoxPct;
}

export interface YoloDetectionResult {
  timestamp: string | null;
  people_detected: number;
  any_fall: boolean;
  detections: YoloPersonDetection[];
}

export type YoloConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const YOLO_WS_URL = 'ws://localhost:8765/ws/yolo';

/** How many ms between frames sent to YOLO (throttle inference rate). */
const INFERENCE_INTERVAL_MS = 200; // ~5 fps inference

/** JPEG quality for capture canvas (0–1) */
const JPEG_QUALITY = 0.75;

/** Capture canvas dimensions (resize before sending to save bandwidth) */
const CAPTURE_W = 640;
const CAPTURE_H = 480;

const EMPTY_RESULT: YoloDetectionResult = {
  timestamp: null,
  people_detected: 0,
  any_fall: false,
  detections: [],
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

interface UseYoloPoseDetectionOptions {
  /** The live camera MediaStream (from getUserMedia). Frames sampled from this. */
  mediaStream: MediaStream | null;
  /** Whether the YOLO pipeline should be actively running */
  enabled: boolean;
}

interface UseYoloPoseDetectionReturn {
  detections: YoloDetectionResult;
  connectionStatus: YoloConnectionStatus;
  error: string | null;
}

export function useYoloPoseDetection({
  mediaStream,
  enabled,
}: UseYoloPoseDetectionOptions): UseYoloPoseDetectionReturn {
  const [detections, setDetections] = useState<YoloDetectionResult>(EMPTY_RESULT);
  const [connectionStatus, setConnectionStatus] = useState<YoloConnectionStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);

  const wsRef       = useRef<WebSocket | null>(null);
  const canvasRef   = useRef<HTMLCanvasElement | null>(null);
  const videoRef    = useRef<HTMLVideoElement | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef  = useRef(true);
  const pendingRef  = useRef(false); // prevent overlapping sends

  // Create hidden canvas + video element once
  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width  = CAPTURE_W;
    canvas.height = CAPTURE_H;
    canvasRef.current = canvas;

    const video = document.createElement('video');
    video.autoplay    = true;
    video.muted       = true;
    video.playsInline = true;
    videoRef.current  = video;

    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Wire media stream to the hidden video element
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (mediaStream) {
      video.srcObject = mediaStream;
      video.play().catch(() => {/* autoplay blocked, ignore */});
    } else {
      video.srcObject = null;
    }
  }, [mediaStream]);

  // Capture one frame from the hidden video and send to WebSocket
  const captureAndSend = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    if (pendingRef.current) return;

    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    pendingRef.current = true;
    ctx.drawImage(video, 0, 0, CAPTURE_W, CAPTURE_H);

    canvas.toBlob(
      (blob) => {
        if (!blob) { pendingRef.current = false; return; }
        blob.arrayBuffer()
          .then((buf) => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(buf);
            }
            pendingRef.current = false;
          })
          .catch(() => { pendingRef.current = false; });
      },
      'image/jpeg',
      JPEG_QUALITY,
    );
  }, []);

  // WebSocket connection lifecycle — reconnects when enabled changes
  useEffect(() => {
    mountedRef.current = true;

    if (!enabled) {
      wsRef.current?.close();
      wsRef.current = null;
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      setConnectionStatus('disconnected');
      setDetections(EMPTY_RESULT);
      return;
    }

    let retryTimeout: ReturnType<typeof setTimeout> | null = null;
    let retryCount = 0;
    const MAX_RETRIES = 5;

    function connect() {
      if (!mountedRef.current) return;
      setConnectionStatus('connecting');
      setError(null);

      const ws = new WebSocket(YOLO_WS_URL);
      ws.binaryType = 'arraybuffer';
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) { ws.close(); return; }
        setConnectionStatus('connected');
        setError(null);
        retryCount = 0;
        intervalRef.current = setInterval(captureAndSend, INFERENCE_INTERVAL_MS);
      };

      ws.onmessage = (evt) => {
        if (!mountedRef.current) return;
        try {
          const data = JSON.parse(evt.data as string) as YoloDetectionResult;
          if (data && 'people_detected' in data) {
            setDetections(data);
          }
        } catch (_) {
          // ignore parse errors
        }
      };

      ws.onerror = () => {
        if (!mountedRef.current) return;
        setConnectionStatus('error');
        setError('Person detection is unavailable. Check the backend connection.');
      };

      ws.onclose = () => {
        if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
        if (!mountedRef.current) return;
        setConnectionStatus('disconnected');

        // Auto-retry with exponential back-off
        if (enabled && retryCount < MAX_RETRIES) {
          retryCount++;
          const delay = Math.min(1000 * 2 ** retryCount, 30_000);
          retryTimeout = setTimeout(connect, delay);
        }
      };
    }

    connect();

    return () => {
      mountedRef.current = false;
      if (retryTimeout) clearTimeout(retryTimeout);
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      wsRef.current?.close();
      wsRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, captureAndSend]);

  return { detections, connectionStatus, error };
}
