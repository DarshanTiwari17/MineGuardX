// ============================================================
// MineMapCanvas — Primary spatial coordinate map renderer
// Zero mock data: strictly renders "MINE MAP DATA UNAVAILABLE"
// when no mine layout vectors or telemetry packets are loaded.
// ============================================================

import { useState, useRef } from 'react';
import {
  Compass,
  MapPinOff,
  Navigation2,
  Crosshair,
  Wind,
} from 'lucide-react';
import type { MineMapState, MapObjectType, EnvironmentSnapshot } from '../../types';

interface MineMapCanvasProps {
  mapState: MineMapState;
  environment?: EnvironmentSnapshot;
  onSelectObject?: (obj: { id: string; type: MapObjectType } | null) => void;
  compact?: boolean;
}

export default function MineMapCanvas({
  mapState,
  environment,
  onSelectObject,
  compact = false,
}: MineMapCanvasProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const {
    connected,
    tunnels,
    rover,
    roverPath,
    minerLocations,
    hazards,
    blockedAreas,
    communicationNodes,
    rescueRoute,
    layerVisibility,
    selectedObjectId,
  } = mapState;

  const hasData = connected && (tunnels.length > 0 || minerLocations.length > 0 || rover.position !== null);

  function handleMouseDown(e: React.MouseEvent) {
    setIsDragging(true);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  }

  function handleMouseUp() {
    setIsDragging(false);
  }

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((z) => Math.min(Math.max(z * factor, 0.5), 3));
  }

  return (
    <div
      className={`mine-map-canvas-container ${compact ? 'compact' : ''}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      role="region"
      aria-label="Underground Mine Map Spatial Viewport"
      tabIndex={0}
    >
      {/* ── North Compass & Orientation Indicator ── */}
      <div className="map-compass-badge" aria-hidden="true">
        <Compass size={16} className="compass-icon" />
        <span className="compass-text">N</span>
      </div>

      {/* ── Scale Indicator Bar ── */}
      <div className="map-scale-bar" aria-hidden="true">
        <div className="scale-line" />
        <span className="scale-label">50m</span>
      </div>

      {/* ── Main SVG Coordinate Space ── */}
      <svg
        className="mine-map-svg"
        viewBox="-500 -350 1000 700"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Defs for gradients, patterns, and markers */}
        <defs>
          <pattern
            id="mine-grid-pattern"
            width="50"
            height="50"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 50 0 L 0 0 0 50"
              fill="none"
              stroke="rgba(59, 130, 246, 0.07)"
              strokeWidth="1"
            />
          </pattern>

          <pattern
            id="blocked-hatch"
            width="10"
            height="10"
            patternTransform="rotate(45 0 0)"
            patternUnits="userSpaceOnUse"
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="10"
              stroke="rgba(239, 68, 68, 0.4)"
              strokeWidth="2"
            />
          </pattern>
        </defs>

        {/* Tactical Grid Background */}
        <rect
          x="-1000"
          y="-1000"
          width="2000"
          height="2000"
          fill="url(#mine-grid-pattern)"
        />

        {/* Origin Axes */}
        <line
          x1="-450"
          y1="0"
          x2="450"
          y2="0"
          stroke="rgba(59, 130, 246, 0.15)"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
        <line
          x1="0"
          y1="-300"
          x2="0"
          y2="300"
          stroke="rgba(59, 130, 246, 0.15)"
          strokeWidth="1"
          strokeDasharray="4 4"
        />

        {/* Origin Crosshair */}
        <circle cx="0" cy="0" r="3" fill="rgba(59, 130, 246, 0.4)" />
        <text
          x="6"
          y="14"
          fill="rgba(255, 255, 255, 0.2)"
          fontSize="9"
          fontFamily="monospace"
        >
          [0,0] SHAFT 1
        </text>

        {/* ── Layer Rendering Pipeline (When real spatial data is loaded) ── */}
        <g
          transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}
          className="mine-spatial-layers"
        >
          {/* 1. Mine Tunnels */}
          {layerVisibility.layout &&
            tunnels.map((tunnel) => (
              <line
                key={tunnel.id}
                x1={tunnel.start.x}
                y1={tunnel.start.y}
                x2={tunnel.end.x}
                y2={tunnel.end.y}
                stroke={
                  tunnel.status === 'blocked'
                    ? 'var(--color-critical)'
                    : tunnel.status === 'hazardous'
                    ? 'var(--color-warning)'
                    : 'rgba(59, 130, 246, 0.5)'
                }
                strokeWidth={tunnel.widthMeters ? tunnel.widthMeters * 2 : 12}
                strokeLinecap="round"
                className="map-tunnel-vector"
              />
            ))}

          {/* 2. Blocked Areas */}
          {layerVisibility.blockedAreas &&
            blockedAreas.map((blk) => (
              <g
                key={blk.id}
                onClick={() =>
                  onSelectObject?.({ id: blk.id, type: 'blocked' })
                }
                className="map-interactive-item"
              >
                <circle
                  cx={blk.center.x}
                  cy={blk.center.y}
                  r={30}
                  fill="url(#blocked-hatch)"
                  stroke="var(--color-critical)"
                  strokeWidth="1.5"
                />
              </g>
            ))}

          {/* 3. Rover Path Trajectory */}
          {layerVisibility.roverPath && roverPath.points.length > 1 && (
            <polyline
              points={roverPath.points.map((p) => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke="var(--color-info)"
              strokeWidth="2"
              strokeDasharray="4 2"
              className="rover-path-line"
            />
          )}

          {/* 4. Future Rescue Route */}
          {layerVisibility.rescueRoute && rescueRoute && (
            <polyline
              points={rescueRoute.waypoints.map((w) => `${w.x},${w.y}`).join(' ')}
              fill="none"
              stroke="var(--color-connected)"
              strokeWidth="3"
              strokeDasharray="6 3"
              className="rescue-route-line"
            />
          )}

          {/* 5. Communication Nodes Mesh */}
          {layerVisibility.communicationNodes &&
            communicationNodes.map((node) => (
              <g
                key={node.id}
                transform={`translate(${node.position.x}, ${node.position.y})`}
                onClick={() => onSelectObject?.({ id: node.id, type: 'node' })}
                className="map-interactive-item"
              >
                <circle
                  r="8"
                  fill="rgba(168, 85, 247, 0.2)"
                  stroke="#a855f7"
                  strokeWidth="1.5"
                />
                <circle r="3" fill="#a855f7" />
              </g>
            ))}

          {/* 6. Active Hazards */}
          {layerVisibility.hazards &&
            hazards.map((h) => {
              const isFire = ['FIRE', 'SMOKE', 'THERMAL_ANOMALY'].includes(h.type);
              const isGas = ['METHANE', 'CO', 'CO2', 'H2S', 'LOW_OXYGEN'].includes(h.type);
              const isFlood = h.type === 'FLOODING';
              const hazardColor = isFire ? '#ef4444' : isGas ? '#f97316' : isFlood ? '#38bdf8' : 'var(--color-warning)';
              const hazardFill = isFire ? 'rgba(239,68,68,0.18)' : isGas ? 'rgba(249,115,22,0.15)' : isFlood ? 'rgba(56,189,248,0.15)' : 'rgba(245,158,11,0.15)';

              return (
                <g
                  key={h.id}
                  transform={`translate(${h.position.x}, ${h.position.y})`}
                  onClick={() => onSelectObject?.({ id: h.id, type: 'hazard' })}
                  className="map-interactive-item"
                >
                  <circle r={h.radiusMeters || 20} fill={hazardFill} stroke={hazardColor} strokeWidth="1.5" />
                  <polygon points="0,-9 8,6 -8,6" fill={hazardColor} />
                  {(h.severity === 'critical' || h.severity === 'high') && (
                    <circle r={(h.radiusMeters || 20) + 6} fill="none" stroke={hazardColor} strokeWidth="1" strokeDasharray="3 3" className="emergency-ping" />
                  )}
                </g>
              );
            })}

          {/* 6.5 Environmental Sensors */}
          {environment && environment.sensors.map((sensor) => {
            if (!sensor.location) return null;
            return (
              <g
                key={sensor.sensorId}
                transform={`translate(${sensor.location.x}, ${sensor.location.y})`}
                className="map-interactive-item"
              >
                <circle r="12" fill="var(--bg-card)" stroke="var(--color-info)" strokeWidth="1.5" />
                <Wind size={12} color="var(--color-info)" style={{ transform: 'translate(-6px, -6px)' }} />
              </g>
            );
          })}

          {/* 7. Connected Miners */}
          {layerVisibility.miners &&
            minerLocations.map((miner) => {
              if (!miner.position) return null;
              const isSelected = selectedObjectId === miner.wearableId;
              const color = miner.emergency
                ? 'var(--color-critical)'
                : miner.status === 'normal'
                ? 'var(--color-connected)'
                : miner.isStale
                ? 'var(--color-offline)'
                : 'var(--color-warning)';

              return (
                <g
                  key={miner.wearableId}
                  transform={`translate(${miner.position.x}, ${miner.position.y})`}
                  onClick={() =>
                    onSelectObject?.({
                      id: miner.wearableId,
                      type: 'miner',
                    })
                  }
                  className="map-interactive-item"
                >
                  {miner.emergency && (
                    <circle
                      r="16"
                      fill="none"
                      stroke="var(--color-critical)"
                      strokeWidth="2"
                      className="emergency-ping"
                    />
                  )}
                  <circle
                    r="6"
                    fill={color}
                    stroke={isSelected ? '#fff' : 'rgba(0,0,0,0.5)'}
                    strokeWidth={isSelected ? '2' : '1'}
                  />
                  <text
                    x="9"
                    y="4"
                    fill="#fff"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    {miner.minerName || miner.wearableId}
                  </text>
                </g>
              );
            })}

          {/* 8. Rover Marker */}
          {layerVisibility.rover && rover.position && (
            <g
              transform={`translate(${rover.position.x}, ${rover.position.y})`}
              onClick={() => onSelectObject?.({ id: 'rover', type: 'rover' })}
              className="map-interactive-item"
            >
              <circle
                r="10"
                fill="rgba(59, 130, 246, 0.25)"
                stroke="var(--color-info)"
                strokeWidth="2"
              />
              <g
                transform={`rotate(${rover.headingDegrees ?? 0})`}
              >
                <Navigation2
                  size={12}
                  color="var(--color-info)"
                  fill="var(--color-info)"
                />
              </g>
            </g>
          )}
        </g>
      </svg>

      {/* ── Strict Empty State when No Real Map Data Exists (Requirement 1) ── */}
      {!hasData && (
        <div className="map-empty-overlay" role="status">
          <div className="map-empty-content">
            <div className="map-radar-circle" aria-hidden="true">
              <Crosshair size={compact ? 36 : 48} color="var(--color-offline)" />
              <div className="radar-sweep" />
            </div>

            <div className="map-empty-text">
              <div className="map-empty-headline">MINE MAP DATA UNAVAILABLE</div>
              <div className="map-empty-sub">Waiting for map data</div>
              <div className="map-empty-detail">
                No telemetry vectors, SLAM grid, or spatial node link active
              </div>
            </div>

            <div className="map-empty-meta">
              <MapPinOff size={12} aria-hidden="true" />
              <span>SPATIAL ENGINE // AWAITING ROS2 MAP TOPIC OR CAD SURVEY</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
