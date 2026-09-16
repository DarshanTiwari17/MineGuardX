// ============================================================
// Command Center — main operational screen
// Assembles all dashboard components into the master layout
// ============================================================

import { useAppContext } from '../context/AppContext';
import RoverStatus from '../components/RoverStatus';
import MineMap from '../components/MineMap';
import CameraFeed from '../components/CameraFeed';
import EnvironmentSummary from '../components/EnvironmentSummary';
import WearableStatus from '../components/WearableStatus';
import HazardPanel from '../components/HazardPanel';
import RescueRoutePanel from '../components/RescueRoutePanel';
import CommunicationStatus from '../components/CommunicationStatus';
import EmergencyStop from '../components/EmergencyStop';
import MissionStatus from '../components/MissionStatus';
import SystemHealth from '../components/SystemHealth';
import LiveClock from '../components/shared/LiveClock';

export default function CommandCenter() {
  const { state } = useAppContext();
  const {
    rover,
    environment,
    wearables,
    hazards,
    activeRoute,
    communication,
    mission,
    systemHealth,
  } = state;

  return (
    <div className="fade-in" aria-label="Command Center dashboard">
      {/* Page heading */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <h1 className="page-title">Command Center</h1>
            <p className="page-sub">
              Central operational dashboard — all systems display real-time status
            </p>
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '22px',
              fontWeight: 700,
              color: 'var(--text-secondary)',
              letterSpacing: '0.06em',
            }}
            aria-live="polite"
            aria-label="Current time"
          >
            <LiveClock showDate />
          </div>
        </div>
      </div>

      {/* ── Row 1: Rover Status + Mission Status ────────────────── */}
      <div className="cc-row-2" style={{ marginBottom: '16px' }}>
        <RoverStatus rover={rover} />
        <MissionStatus mission={mission} />
      </div>

      {/* ── Row 2: Mine Map (full width) ────────────────────────── */}
      <div style={{ marginBottom: '16px' }}>
        <MineMap />
      </div>

      {/* ── Row 3: Camera Feed + Environment ────────────────────── */}
      <div className="cc-row-2" style={{ marginBottom: '16px' }}>
        <CameraFeed />
        <EnvironmentSummary environment={environment} />
      </div>

      {/* ── Row 4: Wearables | Hazards | Rescue Route ───────────── */}
      <div className="cc-row-3" style={{ marginBottom: '16px' }}>
        <WearableStatus wearables={wearables} />
        <HazardPanel hazards={hazards} />
        <RescueRoutePanel route={activeRoute} />
      </div>

      {/* ── Row 5: Communication + System Health ────────────────── */}
      <div className="cc-row-2" style={{ marginBottom: '16px' }}>
        <CommunicationStatus communication={communication} />
        <SystemHealth health={systemHealth} />
      </div>

      {/* ── Row 6: Emergency Stop (full width) ─────────────────── */}
      <div style={{ marginBottom: '8px' }}>
        <EmergencyStop roverConnectionStatus={rover.connectionStatus} />
      </div>
    </div>
  );
}
