// ============================================================
// hazardBus.ts — Cross-tab/window hazard event bus
// Uses BroadcastChannel with localStorage fallback.
// Pattern mirrors wearableBus.ts for architectural consistency.
// ============================================================

import type { Hazard, HazardType, HazardSeverity, HazardSource, HazardLocation } from '../types/hazard';

const HAZARD_CHANNEL = 'mineguardx-hazard-bus';
const HAZARD_STORAGE_KEY = 'mineguardx-hazards';
const HAZARD_LOCAL_EVENT = 'mineguardx:hazard:local';

export type HazardBusEventType =
  | 'HAZARD_DETECTED'
  | 'HAZARD_ACKNOWLEDGED'
  | 'HAZARD_RESOLVED';

export interface HazardDetectedPayload {
  hazardId: string;
  type: HazardType;
  severity: HazardSeverity;
  source: HazardSource;
  location: HazardLocation | null;
  timestamp: string;
  confidence?: number;
  sensorId?: string;
  description?: string;
  value?: number;
  unit?: string;
}

export interface HazardStatusPayload {
  hazardId: string;
  timestamp: string;
}

export type HazardBusMessage =
  | { type: 'HAZARD_DETECTED'; payload: HazardDetectedPayload }
  | { type: 'HAZARD_ACKNOWLEDGED'; payload: HazardStatusPayload }
  | { type: 'HAZARD_RESOLVED'; payload: HazardStatusPayload };

type HazardBusCallback = (event: HazardBusMessage) => void;

let channel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === 'undefined') return null;
  if (!channel) channel = new BroadcastChannel(HAZARD_CHANNEL);
  return channel;
}

/** Subscribe to hazard bus events; returns an unsubscribe function */
export function subscribeHazardEvents(callback: HazardBusCallback): () => void {
  const bc = getChannel();

  // Handler for cross-tab BroadcastChannel messages
  const bcHandler = bc
    ? (event: MessageEvent<HazardBusMessage>) => { callback(event.data); }
    : null;
  if (bc && bcHandler) bc.addEventListener('message', bcHandler);

  // Handler for same-tab local dispatches
  const localHandler = (e: Event) => {
    const msg = (e as CustomEvent<HazardBusMessage>).detail;
    callback(msg);
  };
  window.addEventListener(HAZARD_LOCAL_EVENT, localHandler);

  // localStorage fallback for cross-tab when BroadcastChannel is unavailable
  const storageHandler = (e: StorageEvent) => {
    if (e.key === HAZARD_CHANNEL && e.newValue) {
      try {
        const msg = JSON.parse(e.newValue) as HazardBusMessage;
        callback(msg);
      } catch (_) { /* ignore */ }
    }
  };
  if (!bc) window.addEventListener('storage', storageHandler);

  return () => {
    if (bc && bcHandler) bc.removeEventListener('message', bcHandler);
    window.removeEventListener(HAZARD_LOCAL_EVENT, localHandler);
    if (!bc) window.removeEventListener('storage', storageHandler);
  };
}

function broadcast(msg: HazardBusMessage) {
  const bc = getChannel();

  // Always fire locally (same-tab) so the dashboard reacts immediately
  window.dispatchEvent(new CustomEvent(HAZARD_LOCAL_EVENT, { detail: msg }));

  if (bc) {
    // Cross-tab delivery via BroadcastChannel
    bc.postMessage(msg);
  } else {
    // Fallback: storage event for cross-tab when BroadcastChannel is unavailable
    localStorage.setItem(HAZARD_CHANNEL, JSON.stringify(msg));
  }
}

// ---------------------------------------------------------------------------
// Emit helpers
// ---------------------------------------------------------------------------

export function emitHazardEvent(
  type: HazardType,
  severity: HazardSeverity,
  source: HazardSource,
  location: HazardLocation | null,
  options?: {
    confidence?: number;
    sensorId?: string;
    description?: string;
    value?: number;
    unit?: string;
  }
): string {
  const hazardId = `HZD-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  const timestamp = new Date().toISOString();
  const payload: HazardDetectedPayload = {
    hazardId,
    type,
    severity,
    source,
    location,
    timestamp,
    ...options,
  };
  broadcast({ type: 'HAZARD_DETECTED', payload });
  return hazardId;
}

export function acknowledgeHazardEvent(hazardId: string) {
  broadcast({ type: 'HAZARD_ACKNOWLEDGED', payload: { hazardId, timestamp: new Date().toISOString() } });
}

export function resolveHazardEvent(hazardId: string) {
  broadcast({ type: 'HAZARD_RESOLVED', payload: { hazardId, timestamp: new Date().toISOString() } });
}

// ---------------------------------------------------------------------------
// Local persistence (active hazards only, persisted across refreshes)
// ---------------------------------------------------------------------------

export function saveHazards(hazards: Hazard[]) {
  try {
    localStorage.setItem(HAZARD_STORAGE_KEY, JSON.stringify(hazards));
  } catch (_) { /* ignore */ }
}

export function getSavedHazards(): Hazard[] {
  try {
    const raw = localStorage.getItem(HAZARD_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Hazard[];
  } catch (_) {
    return [];
  }
}
