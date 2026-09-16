// ============================================================
// CameraFeed — Compact Operational Live Monitoring for Command Center
// Integrated with global camera state, AI detection indicators,
// camera switching, and deep link to the full Live Monitoring console.
// ============================================================

import { Link } from 'react-router-dom';
import { Video, ExternalLink } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import LiveVideoViewer from './live-monitoring/LiveVideoViewer';
import StatusCard from './shared/StatusCard';
import StatusBadge from './shared/StatusBadge';
import type { CameraType } from '../types';

export default function CameraFeed() {
  const { state, dispatch } = useAppContext();
  const { cameras } = state;
  const { activeCamera, detections, recording } = cameras;

  const currentCam = cameras.cameras[activeCamera];
  const isConnected = currentCam?.connected ?? false;

  function handleSelectCamera(cam: CameraType) {
    dispatch({ type: 'SET_ACTIVE_CAMERA', payload: cam });
  }

  const badgeVariant = isConnected ? 'connected' : 'disconnected';
  const badgeLabel = isConnected ? 'Feed Live' : 'Camera Offline';

  return (
    <StatusCard
      title="Live Monitoring"
      icon={<Video size={13} />}
      badge={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <StatusBadge variant={badgeVariant} label={badgeLabel} />
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
        <LiveVideoViewer
          activeCamera={activeCamera}
          cameras={cameras.cameras}
          detections={detections}
          recording={recording}
          onSelectCamera={handleSelectCamera}
          compact
        />
      </div>
    </StatusCard>
  );
}
