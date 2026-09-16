// ============================================================
// SystemHealth — compact system subsystem health panel
// All subsystems start as "unavailable" until backend connects
// ============================================================

import { Activity, Server, Database, Bot, Wind, Video, Radio, Brain } from 'lucide-react';
import type { SystemHealth as SystemHealthType, SubsystemStatus } from '../types';
import StatusCard from './shared/StatusCard';
import StatusBadge from './shared/StatusBadge';

interface SystemHealthProps {
  health: SystemHealthType;
}

type SubsystemVariant = 'connected' | 'disconnected' | 'warning' | 'unavailable' | 'critical';

function statusVariant(s: SubsystemStatus): SubsystemVariant {
  return s === 'connected'    ? 'connected'    :
         s === 'warning'      ? 'warning'      :
         s === 'error'        ? 'critical'     :
         s === 'disconnected' ? 'disconnected' : 'unavailable';
}

function statusLabel(s: SubsystemStatus): string {
  return s === 'connected'    ? 'Connected'    :
         s === 'warning'      ? 'Warning'      :
         s === 'error'        ? 'Error'        :
         s === 'disconnected' ? 'Disconnected' : 'Unavailable';
}

interface HealthItemProps {
  label: string;
  icon: React.ReactNode;
  status: SubsystemStatus;
  detail?: string | null;
  responseTimeMs?: number | null;
}

function HealthItem({ label, icon, status, detail, responseTimeMs }: HealthItemProps) {
  const variant = statusVariant(status);
  const label_ = statusLabel(status);

  return (
    <div
      className="health-item"
      role="status"
      aria-label={`${label}: ${label_}`}
      data-testid={`health-${label.toLowerCase().replace(/\s/g, '-')}`}
    >
      <div className="health-item-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ color: 'var(--text-disabled)', opacity: 0.7 }} aria-hidden="true">{icon}</span>
        {label}
      </div>
      <div className="health-item-status">
        <span className={`status-dot ${variant}`} aria-hidden="true" />
        <span
          style={{
            color:
              variant === 'connected'    ? 'var(--color-connected)' :
              variant === 'warning'      ? 'var(--color-warning)'   :
              variant === 'critical'     ? 'var(--color-critical)'  :
              variant === 'disconnected' ? 'var(--color-offline)'   : 'var(--text-disabled)',
            fontSize: '12px',
            fontWeight: 600,
          }}
        >
          {label_}
        </span>
      </div>
      {detail && (
        <div style={{ fontSize: '10px', color: 'var(--text-disabled)', lineHeight: 1.4 }}>
          {detail}
        </div>
      )}
      {responseTimeMs !== null && responseTimeMs !== undefined && (
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {responseTimeMs}ms
        </div>
      )}
    </div>
  );
}

export default function SystemHealth({ health }: SystemHealthProps) {
  const statuses = Object.values(health).map(s => s.status);
  const hasCritical = statuses.some(s => s === 'error');
  const hasWarning  = statuses.some(s => s === 'warning');
  const allOk       = statuses.every(s => s === 'connected');

  const overallVariant = hasCritical ? 'critical' : hasWarning ? 'warning' : allOk ? 'connected' : 'unavailable';
  const overallLabel   = hasCritical ? 'Critical' : hasWarning ? 'Warning' : allOk ? 'All systems OK' : 'Unavailable';

  return (
    <StatusCard
      title="System Health"
      icon={<Activity size={13} />}
      badge={<StatusBadge variant={overallVariant} label={overallLabel} />}
      testId="system-health-card"
    >
      <div className="system-health-grid">
        <HealthItem label="Backend"         icon={<Server    size={12} />} {...health.backend}         />
        <HealthItem label="Database"        icon={<Database  size={12} />} {...health.database}        />
        <HealthItem label="Rover Conn."     icon={<Bot       size={12} />} {...health.roverConnection} />
        <HealthItem label="Sensors"         icon={<Wind      size={12} />} {...health.sensors}         />
        <HealthItem label="Cameras"         icon={<Video     size={12} />} {...health.cameras}         />
        <HealthItem label="Communication"   icon={<Radio     size={12} />} {...health.communication}   />
        <HealthItem label="AI Services"     icon={<Brain     size={12} />} {...health.aiServices}      />
      </div>
    </StatusCard>
  );
}
