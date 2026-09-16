// ============================================================
// MineMapPage — Dedicated tactical underground mine map console
// Feature 3: Spatial tracking, layer toggles, legend, and details.
// ============================================================

import { Map, Radio, Activity, RefreshCw } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import MineMapCanvas from '../components/mine-map/MineMapCanvas';
import MapControls from '../components/mine-map/MapControls';
import MapLegend from '../components/mine-map/MapLegend';
import MapInfoPanel from '../components/mine-map/MapInfoPanel';
import StatusBadge from '../components/shared/StatusBadge';
import type { MapLayerVisibility, MapObjectType } from '../types';

export default function MineMapPage() {
  const { state, dispatch } = useAppContext();
  const { mineMap, rover, wearables, hazards, environment } = state;

  function handleToggleLayer(layerKey: keyof MapLayerVisibility) {
    dispatch({
      type: 'SET_MAP_LAYER_VISIBILITY',
      payload: { [layerKey]: !mineMap.layerVisibility[layerKey] },
    });
  }

  function handleSelectObject(obj: { id: string; type: MapObjectType } | null) {
    dispatch({ type: 'SELECT_MAP_OBJECT', payload: obj });
  }

  function handleClearSelection() {
    dispatch({ type: 'SELECT_MAP_OBJECT', payload: null });
  }

  const isMapConnected = mineMap.connected;
  const isRoverConnected = rover.connectionStatus === 'connected';

  return (
    <div className="mine-map-page fade-in" aria-label="Tactical Mine Map Console">
      {/* ── Page Header ── */}
      <div className="mm-header">
        <div>
          <div className="mm-title-row">
            <h1 className="page-title">Mine Map</h1>
            <StatusBadge
              variant={isMapConnected ? 'connected' : 'disconnected'}
              label={isMapConnected ? 'Map Online' : 'Map Offline'}
            />
          </div>
          <p className="page-sub">
            Spatial tactical tracking — tunnels, rover telemetry, miner locations, and hazard avoidance
          </p>
        </div>

        <div className="mm-meta-badges">
          <div className="mm-meta-chip">
            <Radio size={12} aria-hidden="true" />
            <span>Rover Link:</span>
            <span className={isRoverConnected ? 'text-ok' : 'text-offline'}>
              {isRoverConnected ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>

          <div className="mm-meta-chip">
            <Activity size={12} aria-hidden="true" />
            <span>Connected Miners:</span>
            <span className={wearables.connectedCount > 0 ? 'text-ok' : 'text-muted'}>
              {wearables.connectedCount}
            </span>
          </div>

          <div className="mm-meta-chip">
            <Map size={12} aria-hidden="true" />
            <span>Active Hazards:</span>
            <span className={hazards.activeHazards.length > 0 ? 'text-critical' : 'text-muted'}>
              {hazards.activeHazards.length}
            </span>
          </div>
        </div>
      </div>

      {/* ── Main Map Workspace Grid ── */}
      <div className="mm-grid">
        {/* Center / Dominant Column: Primary Map Canvas */}
        <div className="mm-canvas-stage">
          <div className="mm-canvas-card">
            {/* Top Toolbar overlay */}
            <div className="mm-canvas-toolbar">
              <div className="mm-level-selector">
                <span className="mm-level-label">MINE LEVEL:</span>
                <span className="mm-level-val">LEVEL 03 — MAIN VEIN [SHAFT A]</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="mm-coord-readout">
                  ORIGIN: LAT 0.000 / LON 0.000 (LOCAL MINE DATUM)
                </span>
                <button
                  type="button"
                  className="btn btn-ghost mm-refresh-btn"
                  title="Refresh spatial vector cache"
                  aria-label="Refresh spatial vectors"
                  disabled
                >
                  <RefreshCw size={12} />
                </button>
              </div>
            </div>

            {/* The Interactive Coordinate Viewport */}
            <MineMapCanvas
              mapState={mineMap}
              environment={environment}
              onSelectObject={handleSelectObject}
            />
          </div>
        </div>

        {/* Side Panel: Controls, Legend, Selection Inspector */}
        <div className="mm-side-panel">
          {/* Layer Filter Controls */}
          <MapControls
            visibility={mineMap.layerVisibility}
            mapState={mineMap}
            onToggleLayer={handleToggleLayer}
          />

          {/* Selected Entity Details or Spatial Summary */}
          <MapInfoPanel
            mapState={mineMap}
            rover={rover}
            onClearSelection={handleClearSelection}
          />

          {/* Map Symbology Legend */}
          <MapLegend />
        </div>
      </div>
    </div>
  );
}
