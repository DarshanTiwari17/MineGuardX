// ============================================================
// Mission — mission tracking data + Mission Timeline Events
// ============================================================

export type MissionStatus =
  | 'active'
  | 'standby'
  | 'completed'
  | 'aborted'
  | 'no_mission';

export type MissionType =
  | 'rescue'
  | 'reconnaissance'
  | 'inspection'
  | 'mapping'
  | 'emergency';

export type MissionEventType =
  | 'MISSION_STARTED'
  | 'MISSION_COMPLETED'
  | 'MISSION_ABORTED'
  | 'HAZARD_DETECTED'
  | 'HAZARD_ACKNOWLEDGED'
  | 'HAZARD_RESOLVED'
  | 'WEARABLE_CONNECTED'
  | 'WEARABLE_DISCONNECTED'
  | 'WEARABLE_EMERGENCY'
  | 'WEARABLE_EMERGENCY_RESOLVED'
  | 'ROVER_DEPLOYED'
  | 'ROVER_RETURNED'
  | 'OPERATOR_NOTE';

export interface MissionEvent {
  id: string;
  type: MissionEventType;
  timestamp: string; // ISO
  description: string;
  location?: { x: number; y: number; zone: string } | null;
  /** ID of the referenced entity (hazard ID, wearable ID, etc.) */
  entityId?: string | null;
  severity?: 'info' | 'warning' | 'high' | 'critical';
}

export interface MissionOperator {
  id: string;
  name: string;
  role: string;
}

export interface Mission {
  /** Unique mission identifier, e.g. MSN-2024-001 */
  id: string;
  type: MissionType;
  status: MissionStatus;
  /** ISO timestamp when mission was started */
  startTime: string | null;
  /** ISO timestamp when mission was ended (if completed/aborted) */
  endTime: string | null;
  /** Rover assigned to this mission */
  roverId: string | null;
  operator: MissionOperator | null;
  /** Brief mission objective description */
  objective: string | null;
  /** Target zone or miner */
  target: string | null;
  /** Chronological event timeline */
  timeline: MissionEvent[];
}

export const INITIAL_MISSION: Mission = {
  id: '—',
  type: 'rescue',
  status: 'no_mission',
  startTime: null,
  endTime: null,
  roverId: null,
  operator: null,
  objective: null,
  target: null,
  timeline: [],
};
