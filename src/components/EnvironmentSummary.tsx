// ============================================================
// EnvironmentSummary — compact environmental sensor card
// Shows all 7 gases/metrics; all display "--" until sensors connect
// ============================================================

import { Wind } from 'lucide-react';
import type { EnvironmentSnapshot, SensorStatus } from '../types';
import StatusCard from './shared/StatusCard';
import StatusBadge from './shared/StatusBadge';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface EnvironmentSummaryProps {
  environment: EnvironmentSnapshot;
}

interface SensorRowProps {
  name: string;
  value: number | null;
  unit: string;
  status: SensorStatus;
  /** e.g. "CH₄" */
  formula?: string;
}

function SensorRow({ name, value, unit, status, formula }: SensorRowProps) {
  const displayValue = value !== null ? `${value} ${unit}` : '—';
  const valueClass = `sensor-value ${value === null ? 'offline' : status}`;

  const dotVariant: Record<SensorStatus, string> = {
    ok: 'connected',
    warning: 'warning',
    critical: 'critical',
    offline: 'unavailable',
  };

  return (
    <div className="sensor-row" role="row" aria-label={`${name}: ${displayValue}`}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span className={`status-dot ${dotVariant[status]}`} aria-hidden="true" />
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
        variant={value === null ? 'unavailable' : status === 'ok' ? 'connected' : status === 'warning' ? 'warning' : 'critical'}
        label={value === null ? 'Offline' : status.charAt(0).toUpperCase() + status.slice(1)}
        showDot={false}
      />
    </div>
  );
}

export default function EnvironmentSummary({ environment }: EnvironmentSummaryProps) {
  const navigate = useNavigate();
  const { readings, overallStatus } = environment;
  
  const allOffline = Object.values(readings).every(s => s.status === 'offline' || s.status === 'unknown');

  return (
    <StatusCard
      title="Environment"
      icon={<Wind size={13} />}
      badge={
        <StatusBadge
          variant={allOffline ? 'disconnected' : 'warning'}
          label={allOffline ? 'Sensors offline' : 'Partial data'}
        />
      }
      testId="environment-summary-card"
    >
      <div className="sensor-grid" role="table" aria-label="Environmental sensor readings">
        <SensorRow name="Methane"     formula="CH₄"  {...readings.methane}     />
        <SensorRow name="Carbon Monoxide" formula="CO"  {...readings.co}       />
        <SensorRow name="Carbon Dioxide" formula="CO₂" {...readings.co2}      />
        <SensorRow name="Hydrogen Sulfide" formula="H₂S" {...readings.h2s}    />
        <SensorRow name="Oxygen"      formula="O₂"   {...readings.o2}          />
        <SensorRow name="Temperature"               {...readings.temperature}  />
        <SensorRow name="Humidity"                  {...readings.humidity}     />
      </div>
      <div style={{ marginTop: '12px', borderTop: '1px solid var(--border-light)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Status:</span>
          <StatusBadge 
            variant={overallStatus === 'NORMAL' ? 'connected' : overallStatus === 'WARNING' ? 'warning' : overallStatus === 'CRITICAL' ? 'critical' : 'unavailable'} 
            label={overallStatus} 
            showDot={true} 
          />
        </div>
        <button 
          onClick={() => navigate('/environment')}
          className="btn-text" 
          style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          Open Environment <ChevronRight size={14} />
        </button>
      </div>
    </StatusCard>
  );
}
