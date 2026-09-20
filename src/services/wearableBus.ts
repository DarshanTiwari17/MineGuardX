// ============================================================
// Wearable Bus — Real-time cross-tab / cross-window sync
// Connects the simulated mobile wearable to the rescue dashboard
// ============================================================

import type {
  Wearable,
  WearableBusEvent,
  WearableConnectPayload,
  WearableLocation,
  WearableMotionStatus,
  WearableVitals,
  EmergencyType,
  EmergencySeverity,
} from '../types/wearable';
import { io, Socket } from 'socket.io-client';

const CHANNEL_NAME = 'mineguardx_wearable_bus';
const STORAGE_EVENT_KEY = 'mineguardx_last_wearable_event';
const STORAGE_WEARABLES_KEY = 'mineguardx_connected_wearables';

// Persistent device identity key — each browser/device stores its own wearable ID
const DEVICE_WEARABLE_ID_KEY = 'mineguardx_device_wearable_id';

let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
  }
} catch {
  // Fallback to storage events
  broadcastChannel = null;
}

// 3. Socket.IO for cross-device network sync
let socket: Socket | null = null;
try {
  if (typeof window !== 'undefined') {
    socket = io(); // Connects to the same host/port serving the page
  }
} catch {
  socket = null;
}

/**
 * Generate a crypto-random 4-character uppercase hex suffix for wearable IDs.
 */
function generateHexSuffix(): string {
  const arr = new Uint8Array(2);
  crypto.getRandomValues(arr);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

/**
 * Register or retrieve a persistent wearable device identity for this browser/device.
 * Simulates backend-assigned identity: if this device already has an ID, reuse it.
 * Otherwise generate a new unique WB-XXXX ID.
 */
export function registerWearableDevice(): string {
  try {
    const existing = localStorage.getItem(DEVICE_WEARABLE_ID_KEY);
    if (existing) return existing;
  } catch {
    // storage unavailable
  }

  const newId = `WB-${generateHexSuffix()}`;

  try {
    localStorage.setItem(DEVICE_WEARABLE_ID_KEY, newId);
  } catch {
    // storage unavailable — ID will be ephemeral for this session
  }

  return newId;
}

/**
 * Get the persistent wearable ID for this device, or null if not yet registered.
 */
export function getDeviceWearableId(): string | null {
  try {
    return localStorage.getItem(DEVICE_WEARABLE_ID_KEY);
  } catch {
    return null;
  }
}

/**
 * Broadcast an event to all open tabs / windows AND over the network
 */
export function publishWearableEvent(event: WearableBusEvent): void {
  // 1. BroadcastChannel (local browser tabs)
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(event);
    } catch {
      // ignore
    }
  }

  // 2. LocalStorage for cross-window / cross-tab fallback
  try {
    localStorage.setItem(
      STORAGE_EVENT_KEY,
      JSON.stringify({ ...event, _rnd: Math.random() })
    );
  } catch {
    // ignore
  }

  // 3. Socket.IO (cross-device over network)
  if (socket && socket.connected) {
    try {
      socket.emit('wearable_bus_event', event);
    } catch {
      // ignore
    }
  }
}

/**
 * Subscribe to wearable bus events from other tabs or devices
 */
export function subscribeWearableEvents(
  callback: (event: WearableBusEvent) => void
): () => void {
  const handleBcMessage = (ev: MessageEvent) => {
    if (ev.data && ev.data.type) {
      callback(ev.data as WearableBusEvent);
    }
  };

  const handleStorage = (ev: StorageEvent) => {
    if (ev.key === STORAGE_EVENT_KEY && ev.newValue) {
      try {
        const parsed = JSON.parse(ev.newValue);
        if (parsed && parsed.type) {
          callback(parsed as WearableBusEvent);
        }
      } catch {
        // ignore
      }
    }
  };

  const handleSocketMessage = (data: any) => {
    if (data && data.type) {
      callback(data as WearableBusEvent);
    }
  };

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBcMessage);
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorage);
  }
  if (socket) {
    socket.on('wearable_bus_event', handleSocketMessage);
  }

  return () => {
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBcMessage);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorage);
    }
    if (socket) {
      socket.off('wearable_bus_event', handleSocketMessage);
    }
  };
}

/**
 * Read currently connected wearables saved in local storage (real session state)
 */
export function getSavedConnectedWearables(): Wearable[] {
  try {
    const raw = localStorage.getItem(STORAGE_WEARABLES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Persist connected wearables array in storage
 */
export function saveConnectedWearables(wearables: Wearable[]): void {
  try {
    localStorage.setItem(STORAGE_WEARABLES_KEY, JSON.stringify(wearables));
  } catch {
    // ignore
  }
}

/**
 * Emit a CONNECT event from the Mobile Wearable device
 */
export function emitWearableConnect(payload: WearableConnectPayload): void {
  publishWearableEvent({
    type: 'WEARABLE_CONNECT',
    payload,
  });
}

/**
 * Emit a DISCONNECT event from the Mobile Wearable device
 */
export function emitWearableDisconnect(wearableId: string): void {
  publishWearableEvent({
    type: 'WEARABLE_DISCONNECT',
    payload: {
      wearableId,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Emit SOS alert from Mobile Wearable device
 */
export function emitWearableSos(
  wearableId: string,
  minerName: string,
  location: WearableLocation
): void {
  publishWearableEvent({
    type: 'WEARABLE_SOS',
    payload: {
      wearableId,
      minerName,
      location,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Emit resolve SOS alert
 */
export function emitWearableResolveSos(wearableId: string): void {
  publishWearableEvent({
    type: 'WEARABLE_RESOLVE_SOS',
    payload: {
      wearableId,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Emit location updates from Mobile Wearable device
 */
export function emitWearableLocationUpdate(
  wearableId: string,
  location: WearableLocation
): void {
  publishWearableEvent({
    type: 'WEARABLE_LOCATION_UPDATE',
    payload: {
      wearableId,
      location,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Emit telemetry / heartbeat
 */
export function emitWearableHeartbeat(
  wearableId: string,
  batteryLevel: number,
  motion: WearableMotionStatus,
  vitals: WearableVitals
): void {
  publishWearableEvent({
    type: 'WEARABLE_HEARTBEAT',
    payload: {
      wearableId,
      batteryLevel,
      motion,
      vitals,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Emit an emergency event from the Wearable
 */
export function emitWearableEmergency(
  wearableId: string,
  type: EmergencyType,
  severity: EmergencySeverity,
  location: WearableLocation | null,
  confidence?: number
): void {
  const eventId = `EVT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  publishWearableEvent({
    type: 'WEARABLE_EMERGENCY_EVENT',
    payload: {
      eventId,
      wearableId,
      type,
      severity,
      confidence,
      timestamp: new Date().toISOString(),
      location,
    },
  });
}
