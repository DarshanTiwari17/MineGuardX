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

const CHANNEL_NAME = 'mineguardx_wearable_bus';
const STORAGE_EVENT_KEY = 'mineguardx_last_wearable_event';
const STORAGE_WEARABLES_KEY = 'mineguardx_connected_wearables';

// Master Rescue Station Verification Code
export const STATION_VERIFICATION_CODE = 'MINE-8421';

let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
  }
} catch {
  // Fallback to storage events
  broadcastChannel = null;
}

/**
 * Validate Station Code entered on Mobile Wearable
 */
export function validateStationCode(code: string): boolean {
  if (!code) return false;
  const clean = code.trim().toUpperCase();
  return clean === STATION_VERIFICATION_CODE;
}

/**
 * Broadcast an event to all open tabs / windows
 */
export function publishWearableEvent(event: WearableBusEvent): void {
  // 1. BroadcastChannel
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
}

/**
 * Subscribe to wearable bus events from other tabs
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

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBcMessage);
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorage);
  }

  return () => {
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBcMessage);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorage);
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
