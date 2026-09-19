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
  /** Methane — CH₄ */
  methane: EnvironmentalReading;
  /** Carbon monoxide */
  co: EnvironmentalReading;
  /** Carbon dioxide */
  co2: EnvironmentalReading;
  /** Hydrogen sulfide */
  h2s: EnvironmentalReading;
  /** Oxygen level */
  o2: EnvironmentalReading;
  /** Ambient temperature */
  temperature: EnvironmentalReading;
  /** Relative humidity */
  humidity: EnvironmentalReading;
  /** Rover Distance monitoring */
  distance: EnvironmentalReading;
}

export interface EnvironmentSnapshot {
  readings: SensorData;
  sensors: EnvironmentalSensor[];
  overallStatus: 'NORMAL' | 'WARNING' | 'HIGH' | 'CRITICAL' | 'UNKNOWN' | 'OFFLINE';
  history: EnvironmentHistory[];
  dataSource?: string;
  lastUpdated?: string | null;
}

const offlineSensor = (unit: string = 'Sensor value'): EnvironmentalReading => ({
  value: null,
  unit,
  status: 'offline',
  dataFreshness: 'UNAVAILABLE',
  timestamp: null,
  thresholdLow: null,
  thresholdHigh: null,
  source: 'ThingSpeak',
});

export const INITIAL_SENSOR_DATA: SensorData = {
  methane: offlineSensor(''),
  co: offlineSensor(''),
  co2: offlineSensor(''),
  h2s: offlineSensor(''),
  o2: offlineSensor(''),
  temperature: offlineSensor(''),
  humidity: offlineSensor(''),
  distance: offlineSensor(''),
};

export const INITIAL_ENVIRONMENT_SNAPSHOT: EnvironmentSnapshot = {
  readings: INITIAL_SENSOR_DATA,
  sensors: [],
  overallStatus: 'UNKNOWN',
  history: [],
  dataSource: 'ThingSpeak',
  lastUpdated: null,
};

