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
  EnvironmentSnapshot,
  EnvironmentalReading,
  LiveMonitoringState,
} from '../types';

export type DemoPhase = 'normal' | 'methane_alarm' | 'recovered';

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
  activeHazards: [],
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

const DEMO_ALERTS: AlertState = { alerts: [], activeCount: 0 };

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
    { id: 'tn-4', name: 'East Raise', start: { x: 150, y: -40 }, end: { x: 150, y: 100 }, widthMeters: 5, status: 'clear' },
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
  hazards: [],
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

function demoReading(
  sensorId: string,
  sensorType: string,
  parameter: string,
  value: number,
  unit: string,
  timestamp: string,
  thresholdHigh?: number,
  thresholdLow?: number,
  status: EnvironmentalReading['status'] = 'ok',
): EnvironmentalReading {
  return {
    sensorId,
    sensorType,
    parameter,
    value,
    unit,
    timestamp,
    status,
    dataFreshness: 'LIVE',
    source: 'Demo simulation',
    thresholdHigh,
    thresholdLow,
  };
}

function demoEnvironment(real: EnvironmentSnapshot, phase: DemoPhase, timestamp: string): EnvironmentSnapshot {
  const methaneAlarm = phase === 'methane_alarm';
  const readings = {
    ...real.readings,
    methane: demoReading('DEMO-MQ4', 'MQ-4 Methane', 'Methane', methaneAlarm ? 1.2 : 0.2, '% vol', timestamp, 1.0, undefined, methaneAlarm ? 'critical' : 'ok'),
    co: demoReading('DEMO-MQ7', 'MQ-7 Carbon Monoxide', 'Carbon Monoxide', 5, 'ppm', timestamp, 35),
    co2: demoReading('DEMO-CO2', 'Carbon Dioxide', 'Carbon Dioxide', 800, 'ppm', timestamp, 5000),
    h2s: demoReading('DEMO-H2S', 'Hydrogen Sulfide', 'Hydrogen Sulfide', 0.2, 'ppm', timestamp, 10),
    o2: demoReading('DEMO-O2', 'Oxygen', 'Oxygen', 20.9, '%', timestamp, undefined, 19.5),
    temperature: demoReading('DEMO-TEMP', 'Temperature Sensor', 'Temperature', 24, '°C', timestamp, 35),
    humidity: demoReading('DEMO-HUMIDITY', 'Humidity Sensor', 'Humidity', 65, '%', timestamp, 90),
  };

  const sensorDefinitions: [string, string, string[]][] = [
    ['DEMO-MQ4', 'MQ-4 Methane', ['Methane']],
    ['DEMO-MQ7', 'MQ-7 Carbon Monoxide', ['Carbon Monoxide']],
    ['DEMO-CO2', 'Carbon Dioxide', ['Carbon Dioxide']],
    ['DEMO-H2S', 'Hydrogen Sulfide', ['Hydrogen Sulfide']],
    ['DEMO-O2', 'Oxygen', ['Oxygen']],
    ['DEMO-TEMP', 'Temperature Sensor', ['Temperature']],
    ['DEMO-HUMIDITY', 'Humidity Sensor', ['Humidity']],
  ];

  return {
    ...real,
    readings,
    sensors: sensorDefinitions.map(([sensorId, sensorType, parameters]) => ({
      sensorId,
      sensorType,
      parameters,
      status: 'CONNECTED' as const,
      lastCommunication: timestamp,
      location: { x: 42, y: 8, zone: 'Main Drift' },
      errorState: null,
    })),
    overallStatus: methaneAlarm ? 'HIGH' : 'NORMAL',
    dataSource: 'Demo simulation',
    lastUpdated: timestamp,
  };
}

export function applyDemoOverlay(real: OverlayState, phase: DemoPhase): OverlayState {
  const timestamp = now();
  const methaneAlarm = phase === 'methane_alarm';
  const methaneHazard = methaneAlarm ? {
    id: 'DEMO-METHANE-01',
    type: 'METHANE' as const,
    severity: 'high' as const,
    status: 'ACTIVE' as const,
    location: { x: 90, y: 4, zone: 'Crosscut 2' },
    detectedAt: timestamp,
    updatedAt: timestamp,
    source: 'GAS_SENSOR' as const,
    confidence: 0.98,
    sensorId: 'DEMO-MQ4',
    description: 'Methane concentration exceeded the 1.0% action threshold.',
    value: 1.2,
    unit: '% vol',
  } : null;
  const health = connectedHealth();
  health.sensors = real.systemHealth.sensors;

  return {
    ...real,
    rover: DEMO_ROVER,
    wearables: DEMO_WEARABLES,
    environment: demoEnvironment(real.environment, phase, timestamp),
    hazards: {
      ...DEMO_HAZARDS,
      activeHazards: methaneHazard ? [methaneHazard] : [],
      sensorStatus: {
        ...DEMO_HAZARDS.sensorStatus,
        aiDetection: methaneAlarm ? 'Connected' : 'Unavailable',
      },
    },
    activeRoute: DEMO_ROUTE,
    communication: DEMO_COMMS,
    mission: DEMO_MISSION,
    alerts: methaneAlarm ? {
      alerts: [{
        id: 'DEMO-ALERT-METHANE-01',
        severity: 'critical',
        category: 'hazard',
        title: 'Methane concentration elevated',
        message: 'MQ-4 reading is 1.2% vol, above the 1.0% action threshold in Crosscut 2.',
        timestamp,
        acknowledged: false,
        hazardId: 'DEMO-METHANE-01',
        wearableId: null,
      }],
      activeCount: 1,
    } : DEMO_ALERTS,
    systemHealth: health,
    mineMap: {
      ...DEMO_MAP,
      tunnels: DEMO_MAP.tunnels.map((tunnel) => tunnel.id === 'tn-4'
        ? { ...tunnel, status: methaneAlarm ? 'hazardous' as const : 'clear' as const }
        : tunnel),
      hazards: methaneAlarm ? [{
        id: 'DEMO-METHANE-01',
        type: 'METHANE',
        severity: 'high',
        position: { x: 150, y: 30 },
        radiusMeters: 10,
      }] : [],
      layerVisibility: real.mineMap.layerVisibility,
      selectedObjectId: real.mineMap.selectedObjectId,
      selectedObjectType: real.mineMap.selectedObjectType,
    },
    cameras: {
      ...real.cameras,
      detections: real.cameras.detections,
    },
  };
}
