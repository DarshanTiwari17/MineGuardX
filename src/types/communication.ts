// ============================================================
// CommunicationState — network and communication link status
// ============================================================

export type LinkStatus = 'online' | 'offline' | 'degraded' | 'unavailable';

export interface RescueNode {
  id: string;
  label: string;
  location: string | null;
  status: LinkStatus;
  signalStrength: number | null; // 0–100
  lastSeen: string | null;       // ISO timestamp
}

export interface CommunicationState {
  /** Main rover uplink */
  roverLink: LinkStatus;
  /** Rescue comm-node mesh */
  rescueNodes: RescueNode[];
  /** Signal strength 0–100, null if not available */
  signalStrength: number | null;
  /** Round-trip latency in ms, null if not available */
  latencyMs: number | null;
  /** Overall network status */
  networkStatus: LinkStatus;
  /** Protocol in use */
  protocol: string | null;
  /** Frequency band */
  frequencyBand: string | null;
}

export const INITIAL_COMMUNICATION_STATE: CommunicationState = {
  roverLink: 'offline',
  rescueNodes: [],
  signalStrength: null,
  latencyMs: null,
  networkStatus: 'unavailable',
  protocol: null,
  frequencyBand: null,
};
