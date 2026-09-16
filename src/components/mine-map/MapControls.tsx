// ============================================================
// MapControls — Layer toggle switches and spatial viewport controls
// ============================================================

import {
  Layers,
  Bot,
  Route,
  Users,
  AlertTriangle,
  Ban,
  Radio,
  Eye,
  EyeOff,
  Navigation,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react';
import type { MapLayerVisibility, MineMapState } from '../../types';

interface MapControlsProps {
  visibility: MapLayerVisibility;
  mapState: MineMapState;
  onToggleLayer: (layer: keyof MapLayerVisibility) => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetView?: () => void;
  compact?: boolean;
}

interface LayerOption {
  key: keyof MapLayerVisibility;
  label: string;
  icon: typeof Layers;
  count?: number;
  color?: string;
}

export default function MapControls({
  visibility,
  mapState,
  onToggleLayer,
  onZoomIn,
  onZoomOut,
  onResetView,
  compact = false,
}: MapControlsProps) {
  const LAYERS: LayerOption[] = [
    {
      key: 'layout',
      label: 'Mine Layout',
      icon: Layers,
      count: mapState.tunnels.length,
    },
    {
      key: 'rover',
      label: 'Rover Position',
      icon: Bot,
      color: 'var(--color-info)',
      count: mapState.rover.position ? 1 : 0,
    },
    {
      key: 'roverPath',
      label: 'Rover Path',
      icon: Route,
      color: 'var(--color-info)',
      count: mapState.roverPath.points.length,
    },
    {
      key: 'miners',
      label: 'Connected Miners',
      icon: Users,
      color: 'var(--color-connected)',
      count: mapState.minerLocations.length,
    },
    {
      key: 'hazards',
      label: 'Active Hazards',
      icon: AlertTriangle,
      color: 'var(--color-warning)',
      count: mapState.hazards.length,
    },
    {
      key: 'blockedAreas',
      label: 'Blocked Areas',
      icon: Ban,
      color: 'var(--color-critical)',
      count: mapState.blockedAreas.length,
    },
    {
      key: 'communicationNodes',
      label: 'Comms Nodes',
      icon: Radio,
      count: mapState.communicationNodes.length,
    },
    {
      key: 'exploredAreas',
      label: 'Explored Areas',
      icon: Eye,
      count: mapState.explorationZones.filter((z) => z.status === 'explored').length,
    },
    {
      key: 'unexploredAreas',
      label: 'Unexplored Areas',
      icon: EyeOff,
      count: mapState.explorationZones.filter((z) => z.status === 'unexplored').length,
    },
    {
      key: 'rescueRoute',
      label: 'Rescue Route',
      icon: Navigation,
      color: 'var(--color-connected)',
      count: mapState.rescueRoute ? 1 : 0,
    },
  ];

  return (
    <div className={`map-controls-container ${compact ? 'compact' : ''}`}>
      {/* Zoom / View controls */}
      <div className="map-view-actions">
        <button
          type="button"
          className="btn btn-ghost map-action-btn"
          onClick={onZoomIn}
          title="Zoom in (+)"
          aria-label="Zoom in"
        >
          <ZoomIn size={14} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="btn btn-ghost map-action-btn"
          onClick={onZoomOut}
          title="Zoom out (-)"
          aria-label="Zoom out"
        >
          <ZoomOut size={14} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="btn btn-ghost map-action-btn"
          onClick={onResetView}
          title="Reset origin and scale"
          aria-label="Reset map view"
        >
          <RotateCcw size={14} aria-hidden="true" />
        </button>
      </div>

      {!compact && (
        <div className="map-layer-toggles">
          <div className="map-layer-heading">Map Layers</div>
          <div className="map-layer-list">
            {LAYERS.map((layer) => {
              const isActive = visibility[layer.key];
              const IconComp = layer.icon;

              return (
                <button
                  key={layer.key}
                  type="button"
                  className={`layer-toggle-btn ${isActive ? 'active' : 'inactive'}`}
                  onClick={() => onToggleLayer(layer.key)}
                  aria-pressed={isActive}
                  title={`Toggle ${layer.label}`}
                >
                  <IconComp
                    size={12}
                    color={isActive && layer.color ? layer.color : 'currentColor'}
                    aria-hidden="true"
                  />
                  <span className="layer-toggle-name">{layer.label}</span>
                  <span
                    className={`layer-count-chip ${layer.count === 0 ? 'zero' : ''}`}
                  >
                    {layer.count ?? 0}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
