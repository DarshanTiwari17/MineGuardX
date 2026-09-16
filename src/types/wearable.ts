// ============================================================
// Wearable — miner wearable device data
// Populated only when a real device connects via mobile interface
// ============================================================

export type WearableStatus = 'connected' | 'disconnected' | 'low_battery' | 'sos' | 'normal' | 'warning' | 'emergency' | 'offline' | 'unknown';
export type WearableMotionStatus = 'moving' | 'stationary' | 'fall_detected';

export interface WearableVitals {
  heartRate: number | null; // bpm
  spO2: number | null;      // %
  bodyTemp: number | null;  // °C
}

export interface WearableLocation {
  x: number;
  y: number;
  zone: string;
  lastUpdated: string; // ISO timestamp
}

export type EmergencyType = 'SOS' | 'FALL' | 'ABNORMAL_MOVEMENT' | 'NO_MOTION';
export type EmergencySeverity = 'info' | 'warning' | 'critical';
export type EmergencyStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';

export interface WearableEmergencyEvent {
  eventId: string;
  wearableId: string;
  type: EmergencyType;
  severity: EmergencySeverity;
  confidence?: number;
  timestamp: string;
  location: WearableLocation | null;
  status: EmergencyStatus;
  acknowledgedAt?: string;
  resolvedAt?: string;
}

export interface Wearable {
  /** Unique wearable device ID (e.g. WRB-9421) */
  id: string;
  /** Miner's name (populated from device registration) */
  minerName: string | null;
  /** Miner employee ID */
  minerId: string | null;
  status: WearableStatus;
  batteryLevel: number | null; // 0–100
  motion: WearableMotionStatus;
  vitals: WearableVitals | null;
  location: WearableLocation | null;
  /** ISO timestamp of last received heartbeat */
  lastHeartbeat: string | null;
  /** True if miner has triggered SOS */
  sosTriggered: boolean;
  /** Browser/device user agent or platform info */
  deviceInfo?: string;
}

/** Application wearable state — empty array = no devices connected */
export interface WearableState {
  connectedCount: number;
  wearables: Wearable[];
  emergencies: WearableEmergencyEvent[];
}

export const INITIAL_WEARABLE_STATE: WearableState = {
  connectedCount: 0,
  wearables: [],
  emergencies: [],
};

// ============================================================
// Wearable Bus Event Messages (Cross-Tab / Cross-Window Sync)
// ============================================================

export type WearableBusEventType =
  | 'WEARABLE_CONNECT'
  | 'WEARABLE_DISCONNECT'
  | 'WEARABLE_HEARTBEAT'
  | 'WEARABLE_SOS'
  | 'WEARABLE_RESOLVE_SOS'
  | 'WEARABLE_LOCATION_UPDATE'
  | 'WEARABLE_EMERGENCY_EVENT';

export interface WearableConnectPayload {
  wearableId: string;
  minerName: string;
  minerId: string;
  batteryLevel: number;
  location: WearableLocation;
  deviceInfo?: string;
  timestamp: string;
}

export interface WearableDisconnectPayload {
  wearableId: string;
  timestamp: string;
}

export interface WearableHeartbeatPayload {
  wearableId: string;
  batteryLevel: number;
  motion: WearableMotionStatus;
  vitals: WearableVitals;
  timestamp: string;
}

export interface WearableSosPayload {
  wearableId: string;
  minerName: string;
  location: WearableLocation;
  timestamp: string;
}

export interface WearableLocationUpdatePayload {
  wearableId: string;
  location: WearableLocation;
  timestamp: string;
}

export interface WearableEmergencyPayload {
  eventId: string;
  wearableId: string;
  type: EmergencyType;
  severity: EmergencySeverity;
  confidence?: number;
  timestamp: string;
  location: WearableLocation | null;
}

export type WearableBusEvent =
  | { type: 'WEARABLE_CONNECT'; payload: WearableConnectPayload }
  | { type: 'WEARABLE_DISCONNECT'; payload: WearableDisconnectPayload }
  | { type: 'WEARABLE_HEARTBEAT'; payload: WearableHeartbeatPayload }
  | { type: 'WEARABLE_SOS'; payload: WearableSosPayload }
  | { type: 'WEARABLE_RESOLVE_SOS'; payload: { wearableId: string; timestamp: string } }
  | { type: 'WEARABLE_LOCATION_UPDATE'; payload: WearableLocationUpdatePayload }
  | { type: 'WEARABLE_EMERGENCY_EVENT'; payload: WearableEmergencyPayload };

