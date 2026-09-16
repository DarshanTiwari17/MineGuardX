// ============================================================
// SensorData — environmental sensor readings
// value: null means sensor is offline / not yet streaming
// ============================================================

export type SensorStatus = 'ok' | 'warning' | 'critical' | 'offline' | 'unknown' | 'stale';

export type DataFreshness = 'LIVE' | 'STALE' | 'OFFLINE' | 'UNAVAILABLE' | 'UNKNOWN';

export interface EnvironmentalSensor {
  sensorId: string;
  sensorType: string;
  parameters: string[];
  status: 'CONNECTED' | 'STALE' | 'DISCONNECTED' | 'ERROR' | 'UNKNOWN';
  lastCommunication: string | null;
  location: { x: number; y: number; z?: number; zone?: string } | null;
  errorState: string | null;
}

export interface EnvironmentalReading {
  sensorId?: string;
  sensorType?: string;
  parameter?: string;
  /** Numeric reading; null if sensor is offline */
  value: number | null;
  unit: string;
  timestamp: string | null;
  location?: { x: number; y: number; z?: number; zone?: string } | null;
  status: SensorStatus;
  dataFreshness: DataFreshness;
  source?: string;
  /** Min safe threshold */
  thresholdLow?: number | null;
  /** Max safe threshold */
  thresholdHigh?: number | null;
}

export interface EnvironmentHistory {
  id: string;
  timestamp: string;
  sensorId: string;
  parameter: string;
  value: number;
  unit: string;
  location?: { x: number; y: number; z?: number; zone?: string } | null;
  status: SensorStatus;
}

export interface SensorData {
  /** Methane — CH₄ (% LEL or ppm) */
  methane: EnvironmentalReading;
  /** Carbon monoxide (ppm) */
  co: EnvironmentalReading;
  /** Carbon dioxide (%) */
  co2: EnvironmentalReading;
  /** Hydrogen sulfide (ppm) */
  h2s: EnvironmentalReading;
  /** Oxygen level (%) */
  o2: EnvironmentalReading;
  /** Ambient temperature (°C) */
  temperature: EnvironmentalReading;
  /** Relative humidity (%) */
  humidity: EnvironmentalReading;
}

export interface EnvironmentSnapshot {
  readings: SensorData;
  sensors: EnvironmentalSensor[];
  overallStatus: 'NORMAL' | 'WARNING' | 'HIGH' | 'CRITICAL' | 'UNKNOWN' | 'OFFLINE';
  history: EnvironmentHistory[];
}

const offlineSensor = (unit: string): EnvironmentalReading => ({
  value: null,
  unit,
  status: 'offline',
  dataFreshness: 'OFFLINE',
  timestamp: null,
  thresholdLow: null,
  thresholdHigh: null,
});

export const INITIAL_SENSOR_DATA: SensorData = {
  methane: offlineSensor('% LEL'),
  co: offlineSensor('ppm'),
  co2: offlineSensor('%'),
  h2s: offlineSensor('ppm'),
  o2: offlineSensor('%'),
  temperature: offlineSensor('°C'),
  humidity: offlineSensor('%'),
};

export const INITIAL_ENVIRONMENT_SNAPSHOT: EnvironmentSnapshot = {
  readings: INITIAL_SENSOR_DATA,
  sensors: [],
  overallStatus: 'UNKNOWN',
  history: [],
};
