// ============================================================
// RoverStatus — displays real-time rover telemetry
// All fields show "No data" until rover backend is connected
// ============================================================

import { Bot } from 'lucide-react';
import type { RoverState } from '../types';
import StatusCard from './shared/StatusCard';
import StatusBadge from './shared/StatusBadge';

interface RoverStatusProps {
  rover: RoverState;
}

const NA = <span className="data-value unavailable">No data</span>;

function DataRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="data-row">
      <span className="data-label">{label}</span>
      {value}
    </div>
  );
}

export default function RoverStatus({ rover }: RoverStatusProps) {
  const connectionVariant =
    rover.connectionStatus === 'connected'  ? 'connected' :
    rover.connectionStatus === 'connecting' ? 'warning'   : 'disconnected';

  const connectionLabel =
    rover.connectionStatus === 'connected'  ? 'Connected' :
    rover.connectionStatus === 'connecting' ? 'Connecting…' : 'Disconnected';

  const batteryValue = rover.batteryLevel !== null
    ? <span className="data-value">{rover.batteryLevel}%</span>
    : NA;

  const locationValue = rover.location
    ? <span className="data-value">{rover.location.zone} ({rover.location.x}, {rover.location.y})</span>
    : NA;

  const modeValue = rover.operatingMode
    ? <span className="data-value" style={{ textTransform: 'capitalize' }}>{rover.operatingMode}</span>
    : NA;

  const lastCommValue = rover.lastCommunication
    ? <span className="data-value">{new Date(rover.lastCommunication).toLocaleTimeString()}</span>
    : NA;

  const signalValue = rover.signalStrength !== null
    ? <span className="data-value">{rover.signalStrength}%</span>
    : NA;

  return (
    <StatusCard
      title="Rover Status"
      icon={<Bot size={13} />}
      badge={<StatusBadge variant={connectionVariant} label={connectionLabel} />}
      testId="rover-status-card"
    >
      <div className="widget-stats">
        <div className="widget-stat">
          <span className="label-caps">Battery</span>
          <div className="stat-counter">
            {rover.batteryLevel !== null ? rover.batteryLevel : '—'}
            {rover.batteryLevel !== null && <span className="stat-unit">%</span>}
          </div>
        </div>
        <div className="widget-stat">
          <span className="label-caps">Signal</span>
          <div className="stat-counter">
            {rover.signalStrength !== null ? rover.signalStrength : '—'}
            {rover.signalStrength !== null && <span className="stat-unit">%</span>}
          </div>
        </div>
      </div>
      <DataRow label="Rover ID"          value={rover.roverId ? <span className="data-value font-mono">{rover.roverId}</span> : NA} />
      <DataRow label="Battery"           value={batteryValue} />
      <DataRow label="Current Location"  value={locationValue} />
      <DataRow label="Operating Mode"    value={modeValue} />
      <DataRow label="Signal Strength"   value={signalValue} />
      <DataRow label="Last Communication" value={lastCommValue} />
      <DataRow
        label="Firmware"
        value={rover.firmwareVersion
          ? <span className="data-value font-mono">{rover.firmwareVersion}</span>
          : NA}
      />
    </StatusCard>
  );
}
