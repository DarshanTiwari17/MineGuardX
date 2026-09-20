// ============================================================
// EnvironmentSummary — compact environmental sensor card
// Dynamically displays ONLY sensors with real, valid data.
// Hides unavailable sensors without placeholders.
// ============================================================

import { Wind, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { EnvironmentSnapshot, SensorStatus } from '../types';
import StatusCard from './shared/StatusCard';
import StatusBadge from './shared/StatusBadge';

interface EnvironmentSummaryProps {
  environment: EnvironmentSnapshot;
}

interface SensorRowProps {
  name: string;
  value: number | null;
  unit: string;
  status: SensorStatus;
  /** e.g. "MQ-4" or "CH₄" */
  formula?: string;
}

function SensorRow({ name, value, unit, status, formula }: SensorRowProps) {
  // REQUIREMENT: Hide sensor completely from UI if value is null, undefined, or invalid
  if (value === null || value === undefined || isNaN(value)) {
    return null;
  }

  const displayValue = `${value}${unit ? ` ${unit}` : ''}`;
  const valueClass = `sensor-value ${status}`;

  const dotVariant: Record<string, string> = {
    ok: 'connected',
    warning: 'warning',
    critical: 'critical',
    offline: 'unavailable',
    stale: 'warning',
    unknown: 'unavailable',
  };

  return (
    <div className="sensor-row" role="row" aria-label={`${name}: ${displayValue}`}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span className={`status-dot ${dotVariant[status] || 'connected'}`} aria-hidden="true" />
        <span className="sensor-name">
          {name}
          {formula && (
            <span style={{ color: 'var(--text-disabled)', marginLeft: '4px', fontSize: '11px' }}>
              {formula}
            </span>
          )}
        </span>
      </div>
      <span className={valueClass} aria-label={displayValue}>
        {displayValue}
      </span>
      <StatusBadge
        variant={status === 'ok' ? 'connected' : status === 'warning' ? 'warning' : 'critical'}
        label={status.charAt(0).toUpperCase() + status.slice(1)}
        showDot={false}
      />
    </div>
  );
}

export default function EnvironmentSummary({ environment }: EnvironmentSummaryProps) {
  const { readings, overallStatus } = environment;

  // Check if at least one sensor has valid numeric data
  const activeSensorsCount = Object.values(readings).filter(
    (s) => s && s.value !== null && s.value !== undefined && !isNaN(s.value)
  ).length;

  return (
    <StatusCard
      title="Environment"
      icon={<Wind size={13} />}
      badge={
        <StatusBadge
          variant={activeSensorsCount > 0 ? 'connected' : 'disconnected'}
          label={activeSensorsCount > 0 ? `${activeSensorsCount} Active ${activeSensorsCount === 1 ? 'Sensor' : 'Sensors'}` : 'Sensors offline'}
        />
      }
      testId="environment-summary-card"
    >
      <div className="sensor-grid" role="table" aria-label="Environmental sensor readings">
        {/* All sensor definitions preserved — rows return null when value is null */}
        <SensorRow name="MQ-4 Methane" formula="CH₄" {...readings.methane} />
        <SensorRow name="MQ-7 Carbon Monoxide" formula="CO" {...readings.co} />
        <SensorRow name="Distance" {...readings.distance} />
        <SensorRow name="Carbon Dioxide" formula="CO₂" {...readings.co2} />
        <SensorRow name="Hydrogen Sulfide" formula="H₂S" {...readings.h2s} />
        <SensorRow name="Oxygen" formula="O₂" {...readings.o2} />
        <SensorRow name="Temperature" {...readings.temperature} />
        <SensorRow name="Humidity" {...readings.humidity} />

        {activeSensorsCount === 0 && (
          <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-disabled)', fontSize: '13px' }}>
            No live sensor data streaming
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: '12px',
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Status:</span>
          <StatusBadge
            variant={
              overallStatus === 'NORMAL'
                ? 'connected'
                : overallStatus === 'WARNING'
                ? 'warning'
                : overallStatus === 'CRITICAL'
                ? 'critical'
                : 'unavailable'
            }
            label={overallStatus}
            showDot={true}
          />
        </div>
        <Link
          to="/environment"
          className="btn-link-action"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500,
          }}
        >
          <span>Open Environment</span>
          <ExternalLink size={12} />
        </Link>
      </div>
    </StatusCard>
  );
}
