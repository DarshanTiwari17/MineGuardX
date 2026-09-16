import { User, Bell } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import LiveClock from '../shared/LiveClock';
import StatusBadge from '../shared/StatusBadge';

export default function Header() {
  const { state } = useAppContext();
  const { mission, alerts, rover } = state;

  const missionStatusLabel =
    mission.status === 'no_mission' ? 'No Active Mission' :
    mission.status === 'active'     ? 'Mission Active' :
    mission.status === 'standby'    ? 'Standby' :
    mission.status === 'completed'  ? 'Mission Complete' :
    mission.status === 'aborted'    ? 'Mission Aborted' :
    'Unknown';

  const missionBadgeVariant =
    mission.status === 'active'    ? 'info' :
    mission.status === 'standby'   ? 'warning' :
    mission.status === 'aborted'   ? 'critical' :
    'unavailable';

  const roverBadgeVariant =
    rover.connectionStatus === 'connected'   ? 'connected' :
    rover.connectionStatus === 'connecting'  ? 'warning' :
    'disconnected';

  return (
    <header className="app-header" role="banner">
      {/* Left: Title */}
      <div className="header-title">Mine Rescue Control</div>
      <div className="header-divider" aria-hidden="true" />

      {/* Mission status */}
      <StatusBadge variant={missionBadgeVariant} label={missionStatusLabel} />

      {/* Rover connection */}
      <StatusBadge
        variant={roverBadgeVariant}
        label={`Rover: ${rover.connectionStatus === 'connected' ? 'Connected' : rover.connectionStatus === 'connecting' ? 'Connecting…' : 'Disconnected'}`}
      />

      {/* Spacer */}
      <div className="header-spacer" />

      {/* Active alerts */}
      {alerts.activeCount > 0 ? (
        <button
          className="btn btn-ghost"
          style={{ gap: '6px', padding: '6px 10px', color: 'var(--color-critical)', borderColor: 'rgba(239,68,68,0.3)' }}
          title={`${alerts.activeCount} active alert(s)`}
          aria-label={`${alerts.activeCount} active alerts`}
        >
          <Bell size={14} />
          <span style={{ fontSize: '12px', fontWeight: 700 }}>{alerts.activeCount}</span>
        </button>
      ) : (
        <button
          className="btn btn-ghost"
          style={{ gap: '6px', padding: '6px 10px' }}
          title="No active alerts"
          aria-label="No active alerts"
        >
          <Bell size={14} />
          <span style={{ fontSize: '12px' }}>0</span>
        </button>
      )}

      {/* Clock */}
      <div className="header-clock" aria-live="polite" aria-label="Current time">
        <LiveClock />
      </div>

      <div className="header-divider" aria-hidden="true" />

      {/* Operator */}
      <div className="header-operator">
        <User size={14} color="var(--text-muted)" aria-hidden="true" />
        <span className="header-operator-name">Operator</span>
        <StatusBadge variant="unavailable" label="Not signed in" />
      </div>
    </header>
  );
}
