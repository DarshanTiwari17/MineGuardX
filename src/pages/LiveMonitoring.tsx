// ============================================================
// Live Monitoring — Tactical industrial rescue camera console
// Feature 2: Multi-spectral camera feeds, AI detection overlay,
// hardware diagnostics, and recording toolbar.
//
// YOLO Integration:
//  - Browser camera (getUserMedia) is shown in LIVE CAMERA FEED
//  - Same stream is sampled and sent to YOLO WebSocket backend
//  - Confirmed FALL → red bounding box on the live camera footage
//  - Standing persons → NO box, NO skeleton, NO label
//  - AI Computer Vision Feed → text-only YOLO result panel
// ============================================================

import { useEffect } from 'react';
import { Video, Shield, Radio, Activity } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import RecordingControls from '../components/live-monitoring/RecordingControls';
import BrowserCameraViewer from '../components/live-monitoring/BrowserCameraViewer';
import { yoloStore } from '../services/yoloStore';
import YoloCVPanel from '../components/live-monitoring/YoloCVPanel';
import StatusBadge from '../components/shared/StatusBadge';
import { useBrowserCamera } from '../hooks/useBrowserCamera';
import { useYoloPoseDetection } from '../hooks/useYoloPoseDetection';
import type { CameraType, RecordingState } from '../types';

export default function LiveMonitoring() {
  const { state, dispatch } = useAppContext();
  const { cameras, rover } = state;
  const { activeCamera, recording } = cameras;

  function handleSelectCamera(cam: CameraType) {
    dispatch({ type: 'SET_ACTIVE_CAMERA', payload: cam });
  }

  function handleRecordingChange(recState: Partial<RecordingState>) {
    dispatch({ type: 'SET_RECORDING_STATE', payload: recState });
  }

  const isRoverConnected = rover.connectionStatus === 'connected';

  // ── Browser Camera (getUserMedia) ────────────────────────────────────────
  const {
    stream,
    permissionStatus,
    error: cameraError,
    retry: retryCamera,
  } = useBrowserCamera({ enabled: true });

  // ── YOLO Pose Detection (WebSocket to backend) ───────────────────────────
  const {
    detections: yoloDetections,
    connectionStatus: yoloStatus,
    error: yoloError,
  } = useYoloPoseDetection({
    mediaStream: stream,
    enabled: !!stream,
  });

  const yoloIsActive = yoloStatus === 'connected';
  const cameraIsLive = permissionStatus === 'granted' && !!stream;

  // Publish YOLO detections to the module store so AIDetection page can consume them
  useEffect(() => {
    yoloStore.publish(yoloDetections);
  }, [yoloDetections]);

  return (
    <div className="live-monitoring-page fade-in" aria-label="Live Monitoring Console">
      {/* ── Page Header ── */}
      <div className="lm-header">
        <div>
          <div className="lm-title-row">
            <h1 className="page-title">Live Monitoring</h1>
            <StatusBadge
              variant={cameraIsLive ? 'connected' : 'disconnected'}
              label={cameraIsLive ? 'Feed Active' : 'Feed Offline'}
            />
          </div>
          <p className="page-sub">
            Tactical optical &amp; thermal rover visual intelligence — multi-spectral feed console
          </p>
        </div>

        <div className="lm-meta-badges">
          <div className="lm-meta-chip">
            <Radio size={12} aria-hidden="true" />
            <span>Rover Link:</span>
            <span className={isRoverConnected ? 'text-ok' : 'text-offline'}>
              {isRoverConnected ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>

          <div className="lm-meta-chip">
            <Activity size={12} aria-hidden="true" />
            <span>AI Model:</span>
            <span className={yoloIsActive ? 'text-ok' : 'text-offline'}>
              {yoloStatus === 'connecting' ? 'CONNECTING' : yoloIsActive ? 'ACTIVE' : 'OFFLINE'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Main Monitoring Layout Grid ── */}
      <div className="lm-grid">
        {/* Left / Center Column: Primary Video Viewer + Recording Controls */}
        <div className="lm-main-stage">
          {/* ── Live Camera Feed card ── */}
          <div
            className="live-video-viewer mode-rgb"
            data-testid="primary-video-viewer"
            aria-label="Live Camera Feed"
          >
            {/* Top bar */}
            <div className="viewer-topbar">
              <div className="viewer-topbar-left" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  <Video size={13} color="var(--color-info)" aria-hidden="true" />
                  <span style={{ whiteSpace: 'nowrap' }}>LIVE CAMERA</span>
                </div>
                {/* Compact Camera Selection Buttons */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <button
                    className={`btn btn-sm ${activeCamera === 'rgb' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => handleSelectCamera('rgb')}
                    style={{ fontSize: '11px', padding: '4px 10px' }}
                  >
                    RGB Camera
                  </button>
                  <button
                    className={`btn btn-sm ${activeCamera === 'night' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => handleSelectCamera('night')}
                    style={{ fontSize: '11px', padding: '4px 10px' }}
                  >
                    Night Vision
                  </button>
                  <button
                    className={`btn btn-sm ${activeCamera === 'thermal' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => handleSelectCamera('thermal')}
                    style={{ fontSize: '11px', padding: '4px 10px' }}
                  >
                    Long Wave Thermal
                  </button>
                </div>
              </div>
              <div className="viewer-topbar-right">
                <StatusBadge
                  variant={cameraIsLive ? 'connected' : permissionStatus === 'denied' ? 'critical' : 'disconnected'}
                  label={
                    cameraIsLive            ? 'Live'              :
                    permissionStatus === 'requesting' ? 'Connecting…'     :
                    permissionStatus === 'denied'     ? 'Permission Denied':
                    'Offline'
                  }
                />
                {yoloIsActive && (
                  <span
                    className="badge"
                    style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--color-critical)', border: '1px solid var(--color-critical)', fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', letterSpacing: '0.05em' }}
                    title="AI pose detection active"
                  >
                    AI
                  </span>
                )}
              </div>
            </div>

            {/* Viewport */}
            <div
              className="viewer-screen"
              role="region"
              aria-label="Live browser camera view"
              style={{ position: 'relative' }}
            >
              {/* Tactical corner reticles */}
              <div className="tactical-corners" aria-hidden="true">
                <span className="corner top-left" />
                <span className="corner top-right" />
                <span className="corner bottom-left" />
                <span className="corner bottom-right" />
              </div>

              {/* Camera + YOLO fall overlay */}
              <BrowserCameraViewer
                stream={stream}
                permissionStatus={permissionStatus}
                cameraError={cameraError}
                yoloDetections={yoloDetections}
                onRetry={retryCamera}
              />

              {/* YOLO error banner (non-blocking) */}
              {yoloError && cameraIsLive && (
                <div
                  role="status"
                  style={{
                    position:      'absolute',
                    bottom:        '8px',
                    left:          '8px',
                    right:         '8px',
                    background:    'rgba(0,0,0,0.75)',
                    color:         'var(--color-warning)',
                    fontSize:      '11px',
                    padding:       '6px 10px',
                    borderRadius:  '4px',
                    border:        '1px solid var(--color-warning)',
                    pointerEvents: 'none',
                  }}
                >
                  ⚠ AI: {yoloError}
                </div>
              )}
            </div>

            {/* Bottom HUD */}
            <div className="viewer-hud">
              <div className="hud-cell">
                <span className="hud-label">CAM SOURCE</span>
                <span className="hud-val">BROWSER CAM</span>
              </div>
              <div className="hud-cell">
                <span className="hud-label">STATUS</span>
                <span className={`hud-val ${cameraIsLive ? 'ok' : 'offline'}`}>
                  {cameraIsLive ? 'LIVE' : permissionStatus === 'requesting' ? 'CONNECTING' : 'OFFLINE'}
                </span>
              </div>
              <div className="hud-cell">
                <span className="hud-label">AI MODEL</span>
                <span className={`hud-val ${yoloIsActive ? 'ok' : 'offline'}`}>
                  {yoloIsActive ? 'ACTIVE' : yoloStatus === 'connecting' ? 'CONNECTING' : 'OFFLINE'}
                </span>
              </div>
              <div className="hud-cell">
                <span className="hud-label">PEOPLE</span>
                <span className="hud-val" style={{ fontFamily: 'var(--font-mono, monospace)' }}>
                  {yoloIsActive ? yoloDetections.people_detected : '--'}
                </span>
              </div>
              <div className="hud-cell">
                <span className="hud-label">FALL ALERT</span>
                <span
                  className="hud-val"
                  style={{
                    color: yoloDetections.any_fall ? 'var(--color-critical)' : undefined,
                    fontWeight: yoloDetections.any_fall ? 700 : undefined,
                  }}
                >
                  {yoloIsActive ? (yoloDetections.any_fall ? 'DETECTED' : 'CLEAR') : '--'}
                </span>
              </div>
              <div className="hud-cell">
                <span className="hud-label">REC STATE</span>
                <span className="hud-val unavailable">
                  {recording.isRecording ? 'RECORDING' : 'UNAVAILABLE'}
                </span>
              </div>
            </div>
          </div>

          {/* Recording controls card */}
          <div className="lm-controls-card">
            <div className="lm-controls-label">
              <Shield size={13} color="var(--text-muted)" aria-hidden="true" />
              <span>Rover Video Stream Controls</span>
            </div>
            <RecordingControls
              activeCamera={activeCamera}
              recording={recording}
              onStateChange={handleRecordingChange}
            />
          </div>
        </div>

        {/* Right Column: Hardware Diagnostics & AI Detection Feed */}
        <div className="lm-side-stage">
          {/* AI Computer Vision Feed — text only, AI driven */}
          <YoloCVPanel
            yoloDetections={yoloDetections}
            connectionStatus={yoloStatus}
            connectionError={yoloError}
          />

          {/* Camera Specifications / Mission Guidance */}
          <div className="lm-info-card">
            <div className="info-card-title">
              <Video size={13} color="var(--color-info)" aria-hidden="true" />
              <span>Multi-Spectral Specs</span>
            </div>
            <p className="info-card-desc">
              Three camera nodes operate concurrently on the rover chassis. Switch views
              instantly above.
            </p>
            <ul className="info-specs-list">
              <li>
                <strong>RGB:</strong> Standard daylight &amp; high-lumen LED illumination
              </li>
              <li>
                <strong>Night:</strong> Infrared (850nm) monochrome for zero-light shafts
              </li>
              <li>
                <strong>Thermal:</strong> LWIR (8–14μm) body heat and anomaly detection
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
