// ============================================================
// CameraSelector — industrial switch for RGB / Night / Thermal
// ============================================================

import { Video, Eye, Thermometer } from 'lucide-react';
import type { CameraType, CameraInfo } from '../../types';

interface CameraSelectorProps {
  activeCamera: CameraType;
  cameras: Record<CameraType, CameraInfo>;
  onSelectCamera: (camera: CameraType) => void;
  size?: 'sm' | 'md' | 'lg';
}

interface CameraOption {
  type: CameraType;
  label: string;
  shortLabel: string;
  icon: typeof Video;
  color: string;
}

const CAMERA_OPTIONS: CameraOption[] = [
  {
    type: 'rgb',
    label: 'RGB Optical',
    shortLabel: 'RGB',
    icon: Video,
    color: 'var(--color-info)',
  },
  {
    type: 'night',
    label: 'Night Vision IR',
    shortLabel: 'NIGHT',
    icon: Eye,
    color: 'var(--color-connected)',
  },
  {
    type: 'thermal',
    label: 'Thermal Infrared',
    shortLabel: 'THERMAL',
    icon: Thermometer,
    color: 'var(--color-warning)',
  },
];

export default function CameraSelector({
  activeCamera,
  cameras,
  onSelectCamera,
  size = 'md',
}: CameraSelectorProps) {
  return (
    <div
      className={`camera-selector ${size}`}
      role="tablist"
      aria-label="Camera feed selector"
    >
      {CAMERA_OPTIONS.map((opt) => {
        const isSelected = activeCamera === opt.type;
        const info = cameras[opt.type];
        const isConnected = info?.connected ?? false;
        const IconComponent = opt.icon;

        return (
          <button
            key={opt.type}
            type="button"
            role="tab"
            aria-selected={isSelected}
            aria-label={`${opt.label} camera ${isConnected ? 'live' : 'offline'}`}
            className={`camera-selector-btn ${isSelected ? 'active' : ''}`}
            onClick={() => onSelectCamera(opt.type)}
            data-testid={`cam-select-${opt.type}`}
          >
            <IconComponent
              size={size === 'sm' ? 12 : 14}
              color={isSelected ? opt.color : 'currentColor'}
              aria-hidden="true"
            />
            <span className="cam-btn-text">
              {size === 'sm' ? opt.shortLabel : opt.shortLabel}
            </span>
            <span
              className={`cam-status-dot ${isConnected ? 'live' : 'offline'}`}
              title={isConnected ? 'Live' : 'Offline'}
              aria-hidden="true"
            />
          </button>
        );
      })}
    </div>
  );
}
