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
    alerts,
  } = state;

  const roverLinkLabel =
    rover.connectionStatus === 'connected' ? 'Connected' :
    rover.connectionStatus === 'connecting' ? 'Connecting' :
    'Disconnected';

  const missionLabel =
    mission.status === 'no_mission' ? 'None' :
    mission.status.charAt(0).toUpperCase() + mission.status.slice(1);

  return (
    <div className="fade-in cc-page" aria-label="Command Center dashboard">
      <div className="cc-hero">
        <div>
          <h1 className="display-headline">Command Center</h1>
          <p className="page-sub">
            Central operational dashboard — all systems display real-time status
          </p>
        </div>
        <div
          className="cc-hero-clock"
          aria-live="polite"
          aria-label="Current time"
        >
          <LiveClock showDate />
        </div>
      </div>

      <div className="cc-metric-strip">
        <div className="cc-metric">
          <span className="label-caps">Rover</span>
          <span className="stat-counter">{roverLinkLabel}</span>
        </div>
        <div className="cc-metric">
          <span className="label-caps">Wearables</span>
          <span className="stat-counter">{wearables.connectedCount}</span>
        </div>
        <div className="cc-metric">
          <span className="label-caps">Active Hazards</span>
          <span className="stat-counter">{hazards.activeHazards.length}</span>
        </div>
        <div className="cc-metric">
          <span className="label-caps">Alerts</span>
          <span className="stat-counter">{alerts.activeCount}</span>
        </div>
        <div className="cc-metric">
          <span className="label-caps">Mission</span>
          <span className="stat-counter">{missionLabel}</span>
        </div>
      </div>

      <div className="cc-primary">
        <RoverStatus rover={rover} />
        <MissionStatus mission={mission} />
      </div>

      <MineMap />

      <div className="cc-workspace">
        <CameraFeed />
        <EnvironmentSummary environment={environment} />
      </div>

      <EmergencyStop roverConnectionStatus={rover.connectionStatus} />

      <div className="cc-rail">
        <HazardPanel hazards={hazards} />
        <WearableStatus wearables={wearables} />
        <RescueRoutePanel route={activeRoute} />
        <CommunicationStatus communication={communication} />
        <SystemHealth health={systemHealth} />
      </div>
    </div>
  );
}
