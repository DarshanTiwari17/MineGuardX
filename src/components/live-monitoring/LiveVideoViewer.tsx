// ============================================================
// LiveVideoViewer — Primary industrial video display area
// Displays direct ESP32-CAM / network camera footage without control panels.
// Supports stream error handling, retry mechanism, and fullscreen.
// ============================================================

import { useState, useRef, useEffect } from 'react';
import {
  WifiOff,
  Maximize2,
  Minimize2,
  Clock,
  Scan,
  RotateCw,
  AlertTriangle,
} from 'lucide-react';
import type { CameraInfo, CameraType, AIDetection, RecordingState } from '../../types';
import { ESP32_CAM_STREAM_ENDPOINTS } from '../../config/cameraConfig';
import CameraSelector from './CameraSelector';
import AIOverlay from './AIOverlay';
import StatusBadge from '../shared/StatusBadge';

interface LiveVideoViewerProps {
  activeCamera: CameraType;
  cameras: Record<CameraType, CameraInfo>;
  detections: AIDetection[];
  recording: RecordingState;
  onSelectCamera: (camera: CameraType) => void;
  /** If true, show compact styling for Command Center */
  compact?: boolean;
}

export default function LiveVideoViewer({
  activeCamera,
  cameras,
  detections,
  recording,
  onSelectCamera,
  compact = false,
}: LiveVideoViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [liveTimestamp, setLiveTimestamp] = useState(new Date());
  const [loadError, setLoadError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [endpointIndex, setEndpointIndex] = useState(0);
  const viewerRef = useRef<HTMLDivElement>(null);

  const currentCamera = cameras[activeCamera];
  const isConnected = currentCamera?.connected ?? false;

  // Use current camera streamUrl or fallback to ESP32 stream endpoints
  const rawStreamUrl =
    currentCamera?.streamUrl || ESP32_CAM_STREAM_ENDPOINTS[endpointIndex];

  // Reset load error state when camera or stream URL changes
  useEffect(() => {
    setLoadError(false);
    setIsLoaded(false);
  }, [rawStreamUrl, activeCamera, retryKey]);

  // Real-time ticking HUD clock
  useEffect(() => {
    const timer = setInterval(() => setLiveTimestamp(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Listen for fullscreen change events (e.g. Esc pressed)
  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  function toggleFullscreen() {
    if (!viewerRef.current) return;

    if (!isFullscreen) {
      if (viewerRef.current.requestFullscreen) {
        viewerRef.current.requestFullscreen().catch(() => {
          setIsFullscreen(true);
        });
      } else {
        setIsFullscreen(true);
      }
    } else {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {
          setIsFullscreen(false);
        });
      } else {
        setIsFullscreen(false);
      }
    }
  }

  function handleRetry() {
    setLoadError(false);
    setIsLoaded(false);
    // Cycle to next candidate stream endpoint if primary fails
    if (endpointIndex < ESP32_CAM_STREAM_ENDPOINTS.length - 1) {
      setEndpointIndex((prev) => prev + 1);
    } else {
      setEndpointIndex(0);
    }
    setRetryKey((prev) => prev + 1);
  }

  function handleStreamError() {
    setLoadError(true);
    setIsLoaded(false);
  }

  // Derived connection & stream statuses
  const isLive = isConnected && !!rawStreamUrl && !loadError;
  const statusBadgeVariant = loadError ? 'critical' : isLive ? 'connected' : 'disconnected';
  const statusBadgeLabel = loadError
    ? 'Camera Error'
    : isLive
    ? isLoaded
      ? 'Feed Live'
      : 'Connecting...'
    : 'Camera Offline';

  const hudStatusText = loadError
    ? 'ERROR'
    : isLive
    ? isLoaded
      ? 'LIVE'
      : 'CONNECTING'
    : 'OFFLINE';
  const hudStatusClass = loadError ? 'critical' : isLive ? 'ok' : 'offline';

  // Camera specific offline messages
  const offlineHeadline =
    activeCamera === 'thermal'
      ? 'THERMAL CAMERA OFFLINE'
      : activeCamera === 'night'
      ? 'NIGHT VISION OFFLINE'
      : 'NO LIVE FEED';

  const offlineSubtitle =
    activeCamera === 'thermal'
      ? 'Awaiting long-wave infrared sensor connection'
      : activeCamera === 'night'
      ? 'Awaiting infrared camera night-vision stream'
      : 'Awaiting ESP32-CAM stream connection';

  const resolutionText = currentCamera?.resolution || '--';
  const fpsText =
    currentCamera?.fps !== null && currentCamera?.fps !== undefined
      ? `${currentCamera.fps} FPS`
      : '--';

  // Construct URL with optional retry query to bypass browser cache
  const activeStreamSource = rawStreamUrl
    ? retryKey > 0
      ? `${rawStreamUrl}${rawStreamUrl.includes('?') ? '&' : '?'}retry=${retryKey}`
      : rawStreamUrl
    : null;

  return (
    <div
      ref={viewerRef}
      className={`live-video-viewer ${isFullscreen ? 'is-fullscreen' : ''} ${
        compact ? 'compact' : ''
      } mode-${activeCamera}`}
      data-testid="primary-video-viewer"
    >
      {/* ── Top Bar: Camera Selector + Mode Indicator + Fullscreen ── */}
      <div className="viewer-topbar">
        <div className="viewer-topbar-left">
          <CameraSelector
            activeCamera={activeCamera}
            cameras={cameras}
            onSelectCamera={onSelectCamera}
            size={compact ? 'sm' : 'md'}
          />
        </div>

        <div className="viewer-topbar-right">
          <StatusBadge variant={statusBadgeVariant} label={statusBadgeLabel} />

          {recording.isRecording && (
            <span className="badge critical rec-indicator" aria-label="Recording active">
              REC
            </span>
          )}

          <button
            type="button"
            className="btn btn-ghost viewer-fs-btn"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Fullscreen View'}
            aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            {!compact && <span>{isFullscreen ? 'Exit' : 'Fullscreen'}</span>}
          </button>
        </div>
      </div>

      {/* ── Main Viewport Area ── */}
      <div className="viewer-screen" role="region" aria-label={`${currentCamera?.name} view`}>
        {/* Synthetic Tactical Reticle / Corner Crosshairs */}
        <div className="tactical-corners" aria-hidden="true">
          <span className="corner top-left" />
          <span className="corner top-right" />
          <span className="corner bottom-left" />
          <span className="corner bottom-right" />
        </div>

        {isConnected && activeStreamSource && !loadError ? (
          <div
            className="stream-viewport-container"
            style={{ width: '100%', height: '100%', position: 'relative' }}
          >
            {activeStreamSource.endsWith('.mp4') || activeStreamSource.endsWith('.m3u8') ? (
              <video
                key={activeStreamSource}
                src={activeStreamSource}
                autoPlay
                muted
                playsInline
                className="real-stream-video"
                onLoadedData={() => setIsLoaded(true)}
                onError={handleStreamError}
                aria-label={`${currentCamera.name} live feed`}
              />
            ) : (
              /* Direct MJPEG / JPEG Stream Image Element for ESP32-CAM */
              <img
                key={activeStreamSource}
                src={activeStreamSource}
                alt={`${currentCamera.name} live feed`}
                className="real-stream-img"
                onLoad={() => {
                  setIsLoaded(true);
                  setLoadError(false);
                }}
                onError={handleStreamError}
              />
            )}
          </div>
        ) : (
          /* Industrial Error / Offline / Unavailable State */
          <div className="viewer-offline-state" role="status">
            <div
              className="offline-icon-ring"
              style={{ borderColor: loadError ? 'var(--color-critical)' : undefined }}
            >
              {loadError ? (
                <AlertTriangle
                  size={compact ? 32 : 48}
                  color="var(--color-critical)"
                  aria-hidden="true"
                />
              ) : (
                <WifiOff
                  size={compact ? 32 : 48}
                  color="var(--color-offline)"
                  aria-hidden="true"
                />
              )}
            </div>

            <div className="offline-status-text">
              <div className="offline-headline">
                {loadError ? 'CAMERA CONNECTION ERROR' : offlineHeadline}
              </div>
              <div className="offline-sub">
                {loadError
                  ? `Unable to load stream from ${rawStreamUrl}`
                  : offlineSubtitle}
              </div>
              <div className="offline-desc">
                {loadError
                  ? 'Ensure ESP32-CAM is powered and connected to the same LAN'
                  : 'Camera not connected'}
              </div>
            </div>

            {loadError && (
              <button
                type="button"
                className="btn btn-primary retry-btn"
                onClick={handleRetry}
                style={{
                  marginTop: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                }}
              >
                <RotateCw size={14} />
                <span>Retry Connection</span>
              </button>
            )}

            <div className="offline-meta-pill" style={{ marginTop: '12px' }}>
              <Scan size={12} aria-hidden="true" />
              <span>
                ROVER CAMERA NODE // PORT 0
                {activeCamera === 'rgb' ? '1' : activeCamera === 'night' ? '02' : '03'}
              </span>
            </div>
          </div>
        )}

        {/* AI Detection Overlay Layer */}
        <AIOverlay
          detections={detections}
          activeCamera={activeCamera}
          showWatermark={!compact}
        />
      </div>

      {/* ── Bottom HUD: Telemetry & Camera Information ── */}
      <div className="viewer-hud">
        <div className="hud-cell">
          <span className="hud-label">CAM SOURCE</span>
          <span className="hud-val">{currentCamera?.name || activeCamera.toUpperCase()}</span>
        </div>

        <div className="hud-cell">
          <span className="hud-label">STATUS</span>
          <span className={`hud-val ${hudStatusClass}`}>{hudStatusText}</span>
        </div>

        <div className="hud-cell">
          <span className="hud-label">RESOLUTION</span>
          <span className="hud-val unavailable">{resolutionText}</span>
        </div>

        <div className="hud-cell">
          <span className="hud-label">FPS</span>
          <span className="hud-val unavailable">{fpsText}</span>
        </div>

        <div className="hud-cell">
          <span className="hud-label">REC STATE</span>
          <span className="hud-val unavailable">
            {recording.isRecording ? 'RECORDING' : 'UNAVAILABLE'}
          </span>
        </div>

        <div className="hud-cell" style={{ marginLeft: 'auto' }}>
          <span className="hud-label">
            <Clock size={10} style={{ display: 'inline', marginRight: '4px' }} />
            TIMESTAMP
          </span>
          <span className="hud-val hud-time">{liveTimestamp.toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
}
