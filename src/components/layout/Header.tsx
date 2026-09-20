import { useState, useEffect } from 'react';
import { User, Bell, Moon, Sun } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import LiveClock from '../shared/LiveClock';
import StatusBadge from '../shared/StatusBadge';

export default function Header() {
  const { state, demoMode, toggleDemoMode } = useAppContext();
  const { mission, alerts, rover } = state;

  const [theme, setTheme] = useState('light');
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

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
      <div className="header-brand">
        <span className="header-brand-dot" aria-hidden="true" />
        <span className="header-brand-name">MineGuardX</span>
        <span className="header-brand-badge">Rescue-OS</span>
      </div>

      <StatusBadge variant={missionBadgeVariant} label={missionStatusLabel} />

      <StatusBadge
        variant={roverBadgeVariant}
        label={`Rover: ${rover.connectionStatus === 'connected' ? 'Connected' : rover.connectionStatus === 'connecting' ? 'Connecting…' : 'Disconnected'}`}
      />

      <div className="header-spacer" />

      {alerts.activeCount > 0 ? (
        <button
          className="btn btn-ghost header-icon-btn"
          title={`${alerts.activeCount} active alert(s)`}
          aria-label={`${alerts.activeCount} active alerts`}
        >
          <Bell size={16} />
          <span className="header-alert-count">{alerts.activeCount}</span>
        </button>
      ) : (
        <button
          className="btn btn-ghost header-icon-btn"
          title="No active alerts"
          aria-label="No active alerts"
        >
          <Bell size={16} />
        </button>
      )}

      <div className="header-clock" aria-live="polite" aria-label="Current time">
        <LiveClock />
      </div>

      <button
        className="btn btn-ghost header-icon-btn"
        onClick={toggleTheme}
        aria-label="Toggle theme"
      >
        {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
      </button>

      <button
        type="button"
        className="header-operator"
        onClick={toggleDemoMode}
        title={demoMode ? 'Sign out of demo view' : 'Sign in to show demo data'}
        aria-label={demoMode ? 'Sign out' : 'Sign in'}
        aria-pressed={demoMode}
      >
        <User size={14} color="var(--text-muted)" aria-hidden="true" />
        <span className="header-operator-name">Operator</span>
        <StatusBadge
          variant={demoMode ? 'connected' : 'unavailable'}
          label={demoMode ? 'Signed in' : 'Not signed in'}
        />
      </button>
    </header>
  );
}
