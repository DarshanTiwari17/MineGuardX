// ============================================================
// MineMap — Compact Operational Live Mine Map for Command Center
// Integrated with real spatial state, wearable counts, hazard counts,
// rover status, and direct navigation to the full Mine Map console.
// ============================================================

import { Link } from 'react-router-dom';
import { Map, ExternalLink } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import MineMapCanvas from './mine-map/MineMapCanvas';
import StatusBadge from './shared/StatusBadge';

export default function MineMap() {
  const { state } = useAppContext();
  const { mineMap, rover, wearables, hazards, environment } = state;

  const isMapConnected = mineMap.connected;
  const roverStatusText =
    rover.connectionStatus === 'connected' ? 'Tracking' : 'Unavailable';
  const roverVariant =
    rover.connectionStatus === 'connected' ? 'connected' : 'disconnected';

  return (
    <div className="mine-map-container" data-testid="command-center-mine-map">
      {/* ── Header with Operational Summaries (Requirement 15 & 16) ── */}
      <div className="mine-map-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="card-title">
            <Map size={13} aria-hidden="true" />
            Live Mine Map
          </span>
          <StatusBadge
            variant={isMapConnected ? 'connected' : 'disconnected'}
            label={isMapConnected ? 'Map Online' : 'Map Offline'}
          />
        </div>

        {/* Spatial Summary Metrics Driven by Real Data */}
        <div className="cc-map-summary-chips">
          <div className="cc-map-chip">
            <span className="chip-label">Rover:</span>
            <span className={`chip-val ${roverVariant}`}>{roverStatusText}</span>
          </div>

          <div className="cc-map-chip">
            <span className="chip-label">Connected Miners:</span>
            <span className="chip-val">{wearables.connectedCount}</span>
          </div>

          <div className="cc-map-chip">
            <span className="chip-label">Active Hazards:</span>
            <span
              className={`chip-val ${hazards.activeHazards.length > 0 ? 'critical' : ''}`}
            >
              {hazards.activeHazards.length}
            </span>
          </div>

          {/* Open Mine Map Action Link */}
          <Link
            to="/mine-map"
            className="btn btn-ghost"
            style={{
              padding: '3px 8px',
              fontSize: '11px',
              gap: '4px',
              color: 'var(--color-info)',
              textDecoration: 'none',
              marginLeft: '4px',
            }}
            title="Open dedicated Mine Map console"
            aria-label="Open dedicated Mine Map page"
          >
            <span>Open Mine Map</span>
            <ExternalLink size={11} aria-hidden="true" />
          </Link>
        </div>
      </div>

      {/* ── Compact Spatial Canvas Viewport ── */}
      <div className="cc-map-viewport">
        <MineMapCanvas mapState={mineMap} environment={environment} compact />
      </div>
    </div>
  );
}
