// ============================================================
// RoverState — represents the real-time state of the rescue rover
// All fields nullable: null = data not yet available from hardware
// ============================================================

export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting';
export type OperatingMode = 'autonomous' | 'manual' | 'standby' | 'emergency';

export interface RoverLocation {
  /** Absolute X coordinate in the mine coordinate system */
  x: number;
  /** Absolute Y coordinate in the mine coordinate system */
  y: number;
  /** Named zone or tunnel section */
  zone: string;
  /** Depth below surface in metres */
  depthMetres: number | null;
}

export interface RoverState {
  connectionStatus: ConnectionStatus;
  /** Battery charge level 0–100%, null if not available */
  batteryLevel: number | null;
  /** Current location in mine coordinate space */
  location: RoverLocation | null;
  operatingMode: OperatingMode | null;
  /** ISO timestamp of last received telemetry packet */
  lastCommunication: string | null;
  /** Signal strength 0–100 */
  signalStrength: number | null;
  /** Rover hardware/firmware identifier */
  roverId: string | null;
  /** Firmware version string */
  firmwareVersion: string | null;
}

export const INITIAL_ROVER_STATE: RoverState = {
  connectionStatus: 'disconnected',
  batteryLevel: null,
  location: null,
  operatingMode: null,
  lastCommunication: null,
  signalStrength: null,
  roverId: null,
  firmwareVersion: null,
};
