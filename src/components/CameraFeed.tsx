// ============================================================
// CameraFeed — Compact Operational Live Monitoring for Command Center
// Integrated with browser camera, AI detection overlay,
// and deep link to the full Live Monitoring console.
// ============================================================

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Video, ExternalLink } from 'lucide-react';
import BrowserCameraViewer from './live-monitoring/BrowserCameraViewer';
import StatusCard from './shared/StatusCard';
import StatusBadge from './shared/StatusBadge';
import { useBrowserCamera } from '../hooks/useBrowserCamera';
import { useYoloPoseDetection } from '../hooks/useYoloPoseDetection';
import { yoloStore } from '../services/yoloStore';

export default function CameraFeed() {
  // ── Browser Camera (getUserMedia) ────────────────────────────────────────
  const {
    stream,
    permissionStatus,
    error: cameraError,
    retry: retryCamera,
  } = useBrowserCamera({ enabled: true });

  // ── AI Pose Detection (WebSocket to backend) ───────────────────────────
  const {
    detections: yoloDetections,
    connectionStatus: yoloStatus,
    error: yoloError,
  } = useYoloPoseDetection({
    mediaStream: stream,
    enabled: !!stream,
  });

  const aiIsActive = yoloStatus === 'connected';
  const cameraIsLive = permissionStatus === 'granted' && !!stream;

  // Publish AI detections to the module store so other pages can consume them if needed
  useEffect(() => {
    yoloStore.publish(yoloDetections);
  }, [yoloDetections]);

  const badgeVariant = cameraIsLive ? 'connected' : (permissionStatus === 'denied' ? 'critical' : 'disconnected');
  const badgeLabel = cameraIsLive ? 'Feed Live' : (permissionStatus === 'requesting' ? 'Connecting...' : (permissionStatus === 'denied' ? 'Permission Denied' : 'Offline'));

  return (
    <StatusCard
      title="Live Monitoring"
      icon={<Video size={13} />}
      badge={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <StatusBadge variant={badgeVariant} label={badgeLabel} />
          {aiIsActive && (
            <span
              className="badge"
              style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--color-critical)', border: '1px solid var(--color-critical)', fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', letterSpacing: '0.05em' }}
              title="AI pose detection active"
            >
              AI
            </span>
          )}
          <Link
            to="/live-monitoring"
            className="btn btn-ghost"
            style={{
              padding: '3px 8px',
              fontSize: '11px',
              gap: '4px',
              color: 'var(--color-info)',
              textDecoration: 'none',
            }}
            title="Open dedicated Live Monitoring console"
            aria-label="Open full Live Monitoring page"
          >
            <span>Open Live Monitoring</span>
            <ExternalLink size={11} aria-hidden="true" />
          </Link>
        </div>
      }
      testId="camera-monitoring-card"
    >
      <div className="command-center-live-feed">
        <div
          className="live-video-viewer compact mode-rgb"
          style={{ height: '100%' }}
        >
          <div className="viewer-screen" style={{ height: '100%', minHeight: '300px', position: 'relative' }}>
            <BrowserCameraViewer
              stream={stream}
              permissionStatus={permissionStatus}
              cameraError={cameraError}
              yoloDetections={yoloDetections}
              onRetry={retryCamera}
              compact
            />
            {/* AI error banner (non-blocking) */}
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
        </div>
      </div>
    </StatusCard>
  );
}
