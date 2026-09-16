// ============================================================
// MapInfoPanel — Detail panel for selected spatial entities
// Only displays real data. Shows spatial summary when none selected.
// ============================================================

import {
  Users,
  Bot,
  AlertTriangle,
  Radio,
  Ban,
  X,
  Compass,
  MapPin,
  Clock,
} from 'lucide-react';
import type { MineMapState, RoverState } from '../../types';
import StatusBadge from '../shared/StatusBadge';

interface MapInfoPanelProps {
  mapState: MineMapState;
  rover: RoverState;
  onClearSelection: () => void;
}

export default function MapInfoPanel({
  mapState,
  rover,
  onClearSelection,
}: MapInfoPanelProps) {
  const { selectedObjectId, selectedObjectType, minerLocations, hazards, communicationNodes, blockedAreas } = mapState;

  // Render selected entity details if one is selected
  if (selectedObjectType === 'rover') {
    const loc = mapState.rover;
    const isConnected = rover.connectionStatus === 'connected';

    return (
      <div className="map-info-panel active">
        <div className="info-panel-header">
          <div className="info-header-title">
            <Bot size={14} color="var(--color-info)" aria-hidden="true" />
            <span>Rescue Rover</span>
          </div>
          <button
            type="button"
            className="btn btn-ghost info-close-btn"
            onClick={onClearSelection}
            title="Clear selection"
            aria-label="Close details"
          >
            <X size={13} />
          </button>
        </div>

        <div className="info-panel-body">
          <div className="info-field">
            <span className="info-label">Status</span>
            <StatusBadge
              variant={isConnected ? 'connected' : 'disconnected'}
              label={isConnected ? 'Connected' : 'Offline'}
            />
          </div>

          <div className="info-field">
            <span className="info-label">Operating Mode</span>
            <span className="info-val">{loc.mode.toUpperCase()}</span>
          </div>

          <div className="info-field">
            <span className="info-label">Coordinates</span>
            <span className="info-val unavailable">
              {loc.position
                ? `X: ${loc.position.x}m, Y: ${loc.position.y}m`
                : 'Rover location unavailable'}
            </span>
          </div>

          <div className="info-field">
            <span className="info-label">Heading</span>
            <span className="info-val unavailable">
              {loc.headingDegrees !== null ? `${loc.headingDegrees}°` : '--'}
            </span>
          </div>

          <div className="info-field">
            <span className="info-label">Last Telemetry</span>
            <span className="info-val unavailable">
              {loc.lastUpdated
                ? new Date(loc.lastUpdated).toLocaleTimeString()
                : '--'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (selectedObjectType === 'miner' && selectedObjectId) {
    const miner = minerLocations.find((m) => m.wearableId === selectedObjectId);
    if (miner) {
      return (
        <div className="map-info-panel active">
          <div className="info-panel-header">
            <div className="info-header-title">
              <Users size={14} color="var(--color-connected)" aria-hidden="true" />
              <span>Miner Wearable</span>
            </div>
            <button
              type="button"
              className="btn btn-ghost info-close-btn"
              onClick={onClearSelection}
              title="Clear selection"
              aria-label="Close details"
            >
              <X size={13} />
            </button>
          </div>

          <div className="info-panel-body">
            <div className="info-field">
              <span className="info-label">Wearable ID</span>
              <span className="info-val">{miner.wearableId}</span>
            </div>

            <div className="info-field">
              <span className="info-label">Status</span>
              <StatusBadge
                variant={miner.emergency ? 'critical' : miner.status === 'normal' ? 'connected' : 'warning'}
                label={miner.emergency ? 'EMERGENCY / SOS' : miner.isStale ? 'Offline / Stale' : 'Connected'}
              />
            </div>

            <div className="info-field">
              <span className="info-label">Position</span>
              <span className="info-val">
                {miner.position
                  ? `X: ${miner.position.x}m, Y: ${miner.position.y}m`
                  : 'Position unavailable'}
              </span>
            </div>

            {miner.isStale && (
              <div className="info-field alert-box">
                <Clock size={12} aria-hidden="true" />
                <span>
                  Last known location — updated{' '}
                  {miner.staleDurationSeconds ?? 0}s ago
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
  }

  if (selectedObjectType === 'hazard' && selectedObjectId) {
    const hazard = hazards.find((h) => h.id === selectedObjectId);
    if (hazard) {
      const isCritical = hazard.severity === 'critical' || hazard.severity === 'high';
      return (
        <div className="map-info-panel active">
          <div className="info-panel-header">
            <div className="info-header-title">
              <AlertTriangle size={14} color={isCritical ? 'var(--color-critical)' : 'var(--color-warning)'} aria-hidden="true" />
              <span>Hazard — {hazard.type.replace(/_/g, ' ')}</span>
            </div>
            <button
              type="button"
              className="btn btn-ghost info-close-btn"
              onClick={onClearSelection}
              aria-label="Close details"
            >
              <X size={13} />
            </button>
          </div>

          <div className="info-panel-body">
            <div className="info-field">
              <span className="info-label">Type</span>
              <span className="info-val">{hazard.type.replace(/_/g, ' ')}</span>
            </div>
            <div className="info-field">
              <span className="info-label">Severity</span>
              <StatusBadge
                variant={isCritical ? 'critical' : 'warning'}
                label={hazard.severity.toUpperCase()}
              />
            </div>
            <div className="info-field">
              <span className="info-label">Coordinates</span>
              <span className="info-val">
                X: {hazard.position.x}m, Y: {hazard.position.y}m
              </span>
            </div>
            <div className="info-field">
              <span className="info-label">Hazard ID</span>
              <span className="info-val unavailable" style={{ fontSize: '10px' }}>{hazard.id}</span>
            </div>
          </div>
        </div>
      );
    }
  }

  if (selectedObjectType === 'node' && selectedObjectId) {
    const node = communicationNodes.find((n) => n.id === selectedObjectId);
    if (node) {
      return (
        <div className="map-info-panel active">
          <div className="info-panel-header">
            <div className="info-header-title">
              <Radio size={14} color="#a855f7" aria-hidden="true" />
              <span>Comms Node</span>
            </div>
            <button
              type="button"
              className="btn btn-ghost info-close-btn"
              onClick={onClearSelection}
              aria-label="Close details"
            >
              <X size={13} />
            </button>
          </div>
          <div className="info-panel-body">
            <div className="info-field">
              <span className="info-label">Node ID</span>
              <span className="info-val">{node.id}</span>
            </div>
            <div className="info-field">
              <span className="info-label">Link Status</span>
              <StatusBadge
                variant={node.status === 'online' ? 'connected' : 'disconnected'}
                label={node.status.toUpperCase()}
              />
            </div>
          </div>
        </div>
      );
    }
  }

  if (selectedObjectType === 'blocked' && selectedObjectId) {
    const blk = blockedAreas.find((b) => b.id === selectedObjectId);
    if (blk) {
      return (
        <div className="map-info-panel active">
          <div className="info-panel-header">
            <div className="info-header-title">
              <Ban size={14} color="var(--color-critical)" aria-hidden="true" />
              <span>Blocked Sector</span>
            </div>
            <button
              type="button"
              className="btn btn-ghost info-close-btn"
              onClick={onClearSelection}
              aria-label="Close details"
            >
              <X size={13} />
            </button>
          </div>
          <div className="info-panel-body">
            <div className="info-field">
              <span className="info-label">Reason</span>
              <span className="info-val">{blk.reason}</span>
            </div>
          </div>
        </div>
      );
    }
  }

  // Default: Spatial Summary when no entity selected
  return (
    <div className="map-info-panel default">
      <div className="info-panel-header">
        <div className="info-header-title">
          <Compass size={14} color="var(--color-info)" aria-hidden="true" />
          <span>Mine Spatial Summary</span>
        </div>
      </div>

      <div className="info-panel-body">
        <div className="info-summary-row">
          <span className="info-label">Map Link</span>
          <span className="info-val unavailable">
            {mapState.connected ? 'ONLINE' : 'UNAVAILABLE'}
          </span>
        </div>

        <div className="info-summary-row">
          <span className="info-label">Connected Miners</span>
          <span className="info-val">{minerLocations.length}</span>
        </div>

        <div className="info-summary-row">
          <span className="info-label">Active Hazards</span>
          <span className="info-val">{hazards.length}</span>
        </div>

        <div className="info-summary-row">
          <span className="info-label">Comms Nodes</span>
          <span className="info-val">{communicationNodes.length}</span>
        </div>

        <div className="info-summary-row">
          <span className="info-label">Rover Telemetry</span>
          <span className="info-val unavailable">
            {rover.connectionStatus === 'connected' ? 'TRACKING' : 'DISCONNECTED'}
          </span>
        </div>

        <div className="info-hint">
          <MapPin size={11} aria-hidden="true" />
          <span>Click any marker or tunnel to inspect coordinates and telemetry.</span>
        </div>
      </div>
    </div>
  );
}
