// ============================================================
// Hazard — AI-detected or sensor-triggered hazard events
// ============================================================

export type HazardSeverity = 'info' | 'warning' | 'high' | 'critical';

export type HazardType =
  | 'METHANE'
  | 'CO'
  | 'CO2'
  | 'H2S'
  | 'LOW_OXYGEN'
  | 'HIGH_TEMPERATURE'
  | 'HIGH_HUMIDITY'
  | 'FIRE'
  | 'SMOKE'
  | 'DUST'
  | 'POOR_VISIBILITY'
  | 'STRUCTURAL_OBSTRUCTION'
  | 'TUNNEL_COLLAPSE'
  | 'ROCKFALL'
  | 'FLOODING'
  | 'THERMAL_ANOMALY';

export type HazardSource =
  | 'GAS_SENSOR'
  | 'ENVIRONMENT_SENSOR'
  | 'RGB_CAMERA'
  | 'NIGHT_CAMERA'
  | 'THERMAL_CAMERA'
  | 'AI_MODEL'
  | 'ROVER'
  | 'OPERATOR'
  | 'BACKEND';

export type HazardStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED' | 'UNKNOWN';

export interface HazardLocation {
  x: number;
  y: number;
  z?: number;
  zone: string;
  accuracy?: number;
  source?: string;
}

export interface Hazard {
  id: string;
  type: HazardType;
  severity: HazardSeverity;
  status: HazardStatus;
  location: HazardLocation | null;
  detectedAt: string; // ISO timestamp
  updatedAt: string;  // ISO timestamp
  source: HazardSource;
  confidence?: number; // 0.0-1.0
  sensorId?: string;
  description?: string;
  value?: number; // Optional sensor value (e.g. gas concentration, temp)
  unit?: string;  // Optional unit (e.g. "ppm", "°C")
  resolvedAt?: string;
  acknowledgedAt?: string;
}

export interface SensorSourceStatus {
  gasSensors: 'Connected' | 'Disconnected' | 'Unavailable' | 'Error';
  environmentSensors: 'Connected' | 'Disconnected' | 'Unavailable' | 'Error';
  rgbCamera: 'Connected' | 'Disconnected' | 'Unavailable' | 'Error';
  nightCamera: 'Connected' | 'Disconnected' | 'Unavailable' | 'Error';
  thermalCamera: 'Connected' | 'Disconnected' | 'Unavailable' | 'Error';
  aiDetection: 'Connected' | 'Disconnected' | 'Unavailable' | 'Error';
  rover: 'Connected' | 'Disconnected' | 'Unavailable' | 'Error';
}

export interface HazardState {
  activeHazards: Hazard[];
  historicalHazards: Hazard[];
  sensorStatus: SensorSourceStatus;
}

export const INITIAL_HAZARD_STATE: HazardState = {
  activeHazards: [],
  historicalHazards: [],
  sensorStatus: {
    gasSensors: 'Unavailable',
    environmentSensors: 'Unavailable',
    rgbCamera: 'Unavailable',
    nightCamera: 'Unavailable',
    thermalCamera: 'Unavailable',
    aiDetection: 'Unavailable',
    rover: 'Disconnected',
  }
};
