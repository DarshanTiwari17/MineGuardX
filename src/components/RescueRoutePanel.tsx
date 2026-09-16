// ============================================================
// RescueRoutePanel — rescue route planner summary
//
// Initial state: no active route.
// Real routes will be provided by the dynamic route planner.
// ============================================================

import { Route, Navigation } from 'lucide-react';
import type { RescueRoute } from '../types';
import StatusCard from './shared/StatusCard';
import StatusBadge from './shared/StatusBadge';
import EmptyState from './shared/EmptyState';

interface RescueRoutePanelProps {
  route: RescueRoute | null;
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

function formatEta(seconds: number | null): string {
  if (seconds === null) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function RescueRoutePanel({ route }: RescueRoutePanelProps) {
  if (!route) {
    return (
      <StatusCard
        title="Rescue Route"
        icon={<Route size={13} />}
        badge={<StatusBadge variant="unavailable" label="No route" />}
        testId="rescue-route-card"
      >
        <EmptyState
          icon={<Navigation size={32} />}
          title="No active rescue route"
          subtitle="A dynamic rescue route will be planned here when a target miner is identified and the route planner is activated."
        />
      </StatusCard>
    );
  }

  const statusVariant =
    route.status === 'active'      ? 'info'         :
    route.status === 'calculating' ? 'warning'       :
    route.status === 'completed'   ? 'connected'     :
    route.status === 'aborted'     ? 'critical'      : 'unavailable';

  const riskVariant =
    route.riskLevel === 'critical' ? 'critical' :
    route.riskLevel === 'high'     ? 'critical' :
    route.riskLevel === 'medium'   ? 'warning'  :
    route.riskLevel === 'low'      ? 'connected' : 'unavailable';

  return (
    <StatusCard
      title="Rescue Route"
      icon={<Route size={13} />}
      badge={<StatusBadge variant={statusVariant} label={route.status.replace('_', ' ')} />}
      testId="rescue-route-card"
    >
      <DataRow
        label="Target Miner"
        value={route.targetMinerName
          ? <span className="data-value">{route.targetMinerName}</span>
          : NA}
      />
      <DataRow
        label="Route Status"
        value={<StatusBadge variant={statusVariant} label={route.status.replace('_', ' ')} showDot={false} />}
      />
      <DataRow
        label="Distance"
        value={route.distanceMetres !== null
          ? <span className="data-value">{route.distanceMetres} m</span>
          : NA}
      />
      <DataRow
        label="ETA"
        value={route.etaSeconds !== null
          ? <span className="data-value">{formatEta(route.etaSeconds)}</span>
          : NA}
      />
      <DataRow
        label="Route Risk"
        value={route.riskLevel
          ? <StatusBadge variant={riskVariant} label={route.riskLevel} showDot={false} />
          : NA}
      />
      <DataRow
        label="Waypoints"
        value={<span className="data-value">{route.waypoints.length}</span>}
      />
    </StatusCard>
  );
}
