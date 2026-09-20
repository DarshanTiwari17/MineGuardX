// Prototype-only display overlay. Does not replace live state or services.
import type {
  RoverState,
  WearableState,
  HazardState,
  RescueRoute,
  CommunicationState,
  Mission,
  AlertState,
  SystemHealth,
  MineMapState,
  AIDetection,
  EnvironmentSnapshot,
  LiveMonitoringState,
} from '../types';

interface OverlayState {
  rover: RoverState;
  environment: EnvironmentSnapshot;
  wearables: WearableState;
  hazards: HazardState;
  activeRoute: RescueRoute | null;
  communication: CommunicationState;
  mission: Mission;
  alerts: AlertState;
  systemHealth: SystemHealth;
  cameras: LiveMonitoringState;
  mineMap: MineMapState;
  emergencyStopArmed: boolean;
  isInitializing: boolean;
}

const now = () => new Date().toISOString();

const DEMO_ROVER: RoverState = {
  connectionStatus: 'connected',
  batteryLevel: 84,
  location: { x: 42, y: 8, zone: 'Main Drift', depthMetres: 120 },
  operatingMode: 'autonomous',
  lastCommunication: now(),
  signalStrength: 76,
  roverId: 'RVR-01',
  firmwareVersion: '1.4.2',
};

const DEMO_MISSION: Mission = {
  id: 'MSN-DEMO-01',
  type: 'reconnaissance',
  status: 'active',
  startTime: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
  endTime: null,
  roverId: 'RVR-01',
  operator: { id: 'OP-01', name: 'Operator', role: 'Command' },
  objective: 'Survey Main Drift and confirm personnel link',
  target: 'Level 03 — Shaft A',
  timeline: [
    {
      id: 'evt-1',
      type: 'MISSION_STARTED',
      timestamp: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
      description: 'Reconnaissance mission started',
      severity: 'info',
    },
  ],
};

const DEMO_WEARABLES: WearableState = {
  connectedCount: 1,
  wearables: [
    {
      id: 'WRB-01',
      minerName: 'A. Khan',
      minerId: 'EMP-104',
      status: 'connected',
      batteryLevel: 71,
      motion: 'stationary',
      vitals: { heartRate: 78, spO2: 98, bodyTemp: 36.6 },
      location: { x: 58, y: 12, zone: 'Main Drift', lastUpdated: now() },
      lastHeartbeat: now(),
      sosTriggered: false,
      deviceInfo: 'Demo wearable',
    },
  ],
  emergencies: [],
};

const DEMO_HAZARDS: HazardState = {
  activeHazards: [
    {
      id: 'HZD-01',
      type: 'STRUCTURAL_OBSTRUCTION',
      severity: 'warning',
      status: 'ACTIVE',
      location: { x: 90, y: 4, zone: 'Crosscut 2' },
      detectedAt: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
      updatedAt: now(),
      source: 'AI_MODEL',
      confidence: 0.81,
      description: 'Debris noted on right wall',
    },
  ],
  historicalHazards: [],
  sensorStatus: {
    gasSensors: 'Connected',
    environmentSensors: 'Connected',
    rgbCamera: 'Connected',
    nightCamera: 'Disconnected',
    thermalCamera: 'Disconnected',
    aiDetection: 'Unavailable',
    rover: 'Connected',
  },
};

const DEMO_ROUTE: RescueRoute = {
  id: 'RTE-01',
  targetWearableId: 'WRB-01',
  targetMinerName: 'A. Khan',
  status: 'active',
  distanceMetres: 240,
  etaSeconds: 420,
  riskLevel: 'low',
  waypoints: [
    { id: 'wp-1', x: -250, y: -85, zone: 'Shaft Station', label: 'Start', visited: true },
    { id: 'wp-2', x: -80, y: -85, zone: 'Main Haulage', label: 'Rover', visited: true },
    { id: 'wp-3', x: 150, y: -85, zone: 'East Junction', label: 'Junction', visited: false },
    { id: 'wp-4', x: 150, y: 160, zone: 'East Raise', label: 'Descent', visited: false },
    { id: 'wp-5', x: 170, y: 160, zone: 'Pump Room', label: 'Miner', visited: false },
  ],
  calculatedAt: now(),
  lastUpdated: now(),
};

const DEMO_COMMS: CommunicationState = {
  roverLink: 'online',
  rescueNodes: [
    {
      id: 'NODE-A',
      label: 'Shaft 2 Gateway',
      location: 'Main Haulage West',
      status: 'online',
      signalStrength: 82,
      lastSeen: now(),
    },
  ],
  signalStrength: 82,
  latencyMs: 48,
  networkStatus: 'online',
  protocol: 'LoRa mesh',
  frequencyBand: '868 MHz',
};

const DEMO_ALERTS: AlertState = {
  alerts: [
    {
      id: 'ALT-01',
      severity: 'warning',
      category: 'hazard',
      title: 'Obstruction flagged',
      message: 'AI noted debris in East Raise',
      timestamp: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
      acknowledged: false,
      hazardId: 'HZD-01',
      wearableId: null,
    },
  ],
  activeCount: 1,
};

function connectedHealth(): SystemHealth {
  const ok = {
    status: 'connected' as const,
    detail: 'Demo',
    lastChecked: now(),
    responseTimeMs: 24,
  };
  return {
    backend: ok,
    database: ok,
    roverConnection: ok,
    sensors: ok,
    cameras: ok,
    communication: ok,
    aiServices: { ...ok, status: 'unavailable', detail: 'Not connected' },
  };
}

const DEMO_MAP: MineMapState = {
  connected: true,
  mineName: 'West Vein Survey',
  activeLevel: 'Level 03',
  availableLevels: ['Level 03'],
  tunnels: [
    { id: 'tn-1', name: 'Main Haulage', start: { x: -300, y: -85 }, end: { x: 270, y: -85 }, widthMeters: 6, status: 'clear' },
    { id: 'tn-2', name: 'Central Cavern', start: { x: -80, y: -20 }, end: { x: -40, y: 140 }, widthMeters: 20, status: 'clear' },
    { id: 'tn-3', name: 'South Winze', start: { x: 15, y: -20 }, end: { x: 15, y: 240 }, widthMeters: 5, status: 'clear' },
    { id: 'tn-4', name: 'East Raise', start: { x: 150, y: -40 }, end: { x: 150, y: 100 }, widthMeters: 5, status: 'hazardous' },
    { id: 'tn-5', name: 'Pump Room', start: { x: 100, y: 160 }, end: { x: 240, y: 160 }, widthMeters: 10, status: 'clear' },
  ],
  rover: {
    position: { x: -80, y: -85 },
    headingDegrees: 90,
    mode: 'autonomous',
    lastUpdated: now(),
  },
  roverPath: {
    points: [{ x: -250, y: -85 }, { x: -150, y: -85 }, { x: -80, y: -85 }],
    lastUpdated: now(),
  },
  minerLocations: [
    {
      wearableId: 'WRB-01',
      minerName: 'A. Khan',
      position: { x: 170, y: 160 },
      status: 'normal',
      emergency: false,
      lastUpdated: now(),
      isStale: false,
    },
  ],
  hazards: [
    {
      id: 'HZD-01',
      type: 'STRUCTURAL_OBSTRUCTION',
      severity: 'warning',
      position: { x: 150, y: 30 },
      radiusMeters: 14,
    },
  ],
  blockedAreas: [],
  communicationNodes: [
    {
      id: 'NODE-A',
      name: 'Shaft 2 Gateway',
      position: { x: -250, y: -100 },
      status: 'online',
      signalStrengthDbm: -62,
      batteryPercent: 90,
      lastCommunication: now(),
    },
  ],
  explorationZones: [],
  rescueRoute: DEMO_ROUTE,
  layerVisibility: {
    layout: true,
    rover: true,
    roverPath: true,
    miners: true,
    hazards: true,
    blockedAreas: true,
    communicationNodes: true,
    exploredAreas: true,
    unexploredAreas: true,
    rescueRoute: true,
  },
  selectedObjectId: null,
  selectedObjectType: null,
};

const DEMO_DETECTION: AIDetection = {
  id: 'det-1',
  type: 'structural_obstruction',
  confidence: 0.81,
  timestamp: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
  location: 'Crosscut 2',
  cameraId: 'rgb',
};

export function applyDemoOverlay(real: OverlayState): OverlayState {
  const health = connectedHealth();
  health.sensors = real.systemHealth.sensors;

  return {
    ...real,
    rover: DEMO_ROVER,
    wearables: DEMO_WEARABLES,
    hazards: {
      ...DEMO_HAZARDS,
      sensorStatus: {
        ...DEMO_HAZARDS.sensorStatus,
        gasSensors: real.environment.readings.methane.value != null ? 'Connected' : real.hazards.sensorStatus.gasSensors,
        environmentSensors:
          real.environment.readings.temperature.value != null || real.environment.readings.humidity.value != null
            ? 'Connected'
            : real.hazards.sensorStatus.environmentSensors,
      },
    },
    activeRoute: DEMO_ROUTE,
    communication: DEMO_COMMS,
    mission: DEMO_MISSION,
    alerts: DEMO_ALERTS,
    systemHealth: health,
    mineMap: {
      ...DEMO_MAP,
      layerVisibility: real.mineMap.layerVisibility,
      selectedObjectId: real.mineMap.selectedObjectId,
      selectedObjectType: real.mineMap.selectedObjectType,
    },
    environment: real.environment,
    cameras: {
      ...real.cameras,
      detections: real.cameras.detections.length > 0 ? real.cameras.detections : [DEMO_DETECTION],
    },
  };
}
