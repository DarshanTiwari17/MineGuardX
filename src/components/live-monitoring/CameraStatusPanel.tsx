// ============================================================
// CameraStatusPanel — Diagnostic and telemetry table for all 3 cameras
// Strictly shows "--" or "Unavailable" for unconnected fields.
// ============================================================

import { Video, Eye, Thermometer } from 'lucide-react';
import type { CameraInfo, CameraType } from '../../types';
import StatusBadge from '../shared/StatusBadge';

interface CameraStatusPanelProps {
  cameras: Record<CameraType, CameraInfo>;
  activeCamera?: CameraType;
  onSelectCamera?: (camera: CameraType) => void;
}

interface CameraCardProps {
  info: CameraInfo;
  icon: typeof Video;
  accent: string;
  isActive: boolean;
  onSelect?: () => void;
}

function CameraCard({ info, icon: Icon, accent, isActive, onSelect }: CameraCardProps) {
  const isConnected = info.connected;
  const resolutionText = info.resolution || '--';
  const fpsText = info.fps !== null ? `${info.fps} fps` : '--';
  const lastFrameText = info.lastFrameAt
    ? new Date(info.lastFrameAt).toLocaleTimeString()
    : '--';

  return (
    <div
      className={`camera-status-item ${isActive ? 'active-target' : ''}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      aria-pressed={isActive}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect?.();
        }
      }}
    >
      <div className="camera-status-item-header">
        <div className="cam-header-title">
          <Icon size={14} color={accent} aria-hidden="true" />
          <span className="cam-title-name">{info.name}</span>
        </div>
        <StatusBadge
          variant={isConnected ? 'connected' : 'disconnected'}
          label={isConnected ? 'Connected' : 'Offline'}
        />
      </div>

      <div className="camera-status-item-grid">
        <div className="cam-stat-cell">
          <span className="cam-stat-label">Resolution</span>
          <span className="cam-stat-val unavailable">{resolutionText}</span>
        </div>
        <div className="cam-stat-cell">
          <span className="cam-stat-label">Frame Rate</span>
          <span className="cam-stat-val unavailable">{fpsText}</span>
        </div>
        <div className="cam-stat-cell" style={{ gridColumn: 'span 2' }}>
          <span className="cam-stat-label">Last Frame</span>
          <span className="cam-stat-val unavailable">{lastFrameText}</span>
        </div>
      </div>
    </div>
  );
}

export default function CameraStatusPanel({
  cameras,
  activeCamera,
  onSelectCamera,
}: CameraStatusPanelProps) {
  return (
    <div className="camera-status-panel" aria-label="Camera Hardware Diagnostics">
      <div className="panel-subhead">
        <span>Hardware Link Status</span>
        <span className="panel-subhead-count">3 Devices</span>
      </div>

      <div className="camera-status-cards">
        <CameraCard
          info={cameras.rgb}
          icon={Video}
          accent="var(--color-info)"
          isActive={activeCamera === 'rgb'}
          onSelect={() => onSelectCamera?.('rgb')}
        />
        <CameraCard
          info={cameras.night}
          icon={Eye}
          accent="var(--color-connected)"
          isActive={activeCamera === 'night'}
          onSelect={() => onSelectCamera?.('night')}
        />
        <CameraCard
          info={cameras.thermal}
          icon={Thermometer}
          accent="var(--color-warning)"
          isActive={activeCamera === 'thermal'}
          onSelect={() => onSelectCamera?.('thermal')}
        />
      </div>
    </div>
  );
}
