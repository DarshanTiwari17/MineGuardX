// ============================================================
// Live Monitoring — Tactical industrial rescue camera console
// Feature 2: Multi-spectral camera feeds, AI detection overlay,
// hardware diagnostics, and recording toolbar.
// ============================================================

import { Video, Shield, Radio, Activity } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import LiveVideoViewer from '../components/live-monitoring/LiveVideoViewer';
import CameraStatusPanel from '../components/live-monitoring/CameraStatusPanel';
import AIDetectionPanel from '../components/live-monitoring/AIDetectionPanel';
import RecordingControls from '../components/live-monitoring/RecordingControls';
import StatusBadge from '../components/shared/StatusBadge';
import type { CameraType, RecordingState } from '../types';

export default function LiveMonitoring() {
  const { state, dispatch } = useAppContext();
  const { cameras, rover } = state;
  const { activeCamera, detections, recording } = cameras;

  function handleSelectCamera(cam: CameraType) {
    dispatch({ type: 'SET_ACTIVE_CAMERA', payload: cam });
  }

  function handleRecordingChange(recState: Partial<RecordingState>) {
    dispatch({ type: 'SET_RECORDING_STATE', payload: recState });
  }

  const activeCamInfo = cameras.cameras[activeCamera];
  const isRoverConnected = rover.connectionStatus === 'connected';

  return (
    <div className="live-monitoring-page fade-in" aria-label="Live Monitoring Console">
      {/* ── Page Header ── */}
      <div className="lm-header">
        <div>
          <div className="lm-title-row">
            <h1 className="page-title">Live Monitoring</h1>
            <StatusBadge
              variant={activeCamInfo?.connected ? 'connected' : 'disconnected'}
              label={activeCamInfo?.connected ? 'Feed Active' : 'Feed Offline'}
            />
          </div>
          <p className="page-sub">
            Tactical optical & thermal rover visual intelligence — multi-spectral feed console
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
            <span className="text-offline">DISCONNECTED</span>
          </div>
        </div>
      </div>

      {/* ── Main Monitoring Layout Grid ── */}
      <div className="lm-grid">
        {/* Left / Center Column: Primary Video Viewer + Recording Controls */}
        <div className="lm-main-stage">
          <LiveVideoViewer
            activeCamera={activeCamera}
            cameras={cameras.cameras}
            detections={detections}
            recording={recording}
            onSelectCamera={handleSelectCamera}
          />

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
          <CameraStatusPanel
            cameras={cameras.cameras}
            activeCamera={activeCamera}
            onSelectCamera={handleSelectCamera}
          />

          <AIDetectionPanel detections={detections} />

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
                <strong>RGB:</strong> Standard daylight & high-lumen LED illumination
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
