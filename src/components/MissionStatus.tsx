// ============================================================
// MissionStatus — current mission overview card
// ============================================================

import { ScrollText } from 'lucide-react';
import type { Mission } from '../types';
import StatusCard from './shared/StatusCard';
import StatusBadge from './shared/StatusBadge';
import EmptyState from './shared/EmptyState';

interface MissionStatusProps {
  mission: Mission;
}

const NA = <span className="data-value unavailable">—</span>;

function DataRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="data-row">
      <span className="data-label">{label}</span>
      {value}
    </div>
  );
}

function formatDuration(startTime: string | null): string {
  if (!startTime) return '—';
  const startMs = new Date(startTime).getTime();
  const nowMs   = Date.now();
  const diffSec = Math.floor((nowMs - startMs) / 1000);
  const h = Math.floor(diffSec / 3600);
  const m = Math.floor((diffSec % 3600) / 60);
  const s = diffSec % 60;
  return h > 0 ? `${h}h ${m}m ${s}s` : m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function MissionStatus({ mission }: MissionStatusProps) {
  const statusVariant =
    mission.status === 'active'     ? 'info'        :
    mission.status === 'standby'    ? 'warning'     :
    mission.status === 'completed'  ? 'connected'   :
    mission.status === 'aborted'    ? 'critical'    : 'unavailable';

  const statusLabel =
    mission.status === 'no_mission' ? 'No active mission' :
    mission.status.charAt(0).toUpperCase() + mission.status.slice(1);

  if (mission.status === 'no_mission') {
    return (
      <StatusCard
        title="Mission Status"
        icon={<ScrollText size={13} />}
        badge={<StatusBadge variant="unavailable" label="No active mission" />}
        testId="mission-status-card"
      >
        <EmptyState
          icon={<ScrollText size={32} />}
          title="No active mission"
          subtitle="Mission details will appear here once a rescue mission is initiated from the Rescue Operations panel."
        />
      </StatusCard>
    );
  }

  return (
    <StatusCard
      title="Mission Status"
      icon={<ScrollText size={13} />}
      badge={<StatusBadge variant={statusVariant} label={statusLabel} />}
      testId="mission-status-card"
    >
      <DataRow label="Mission ID"   value={<span className="data-value font-mono">{mission.id}</span>} />
      <DataRow label="Type"         value={mission.type ? <span className="data-value" style={{ textTransform: 'capitalize' }}>{mission.type}</span> : NA} />
      <DataRow label="Status"       value={<StatusBadge variant={statusVariant} label={statusLabel} showDot={false} />} />
      <DataRow label="Objective"    value={mission.objective ? <span className="data-value">{mission.objective}</span> : NA} />
      <DataRow label="Target"       value={mission.target ? <span className="data-value">{mission.target}</span> : NA} />
      <DataRow label="Start Time"   value={mission.startTime ? <span className="data-value">{new Date(mission.startTime).toLocaleTimeString()}</span> : NA} />
      <DataRow label="Duration"     value={<span className="data-value">{formatDuration(mission.startTime)}</span>} />
      <DataRow label="Rover"        value={mission.roverId ? <span className="data-value font-mono">{mission.roverId}</span> : NA} />
      <DataRow
        label="Operator"
        value={mission.operator
          ? <span className="data-value">{mission.operator.name} ({mission.operator.role})</span>
          : NA}
      />
    </StatusCard>
  );
}
