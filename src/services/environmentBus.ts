// ============================================================
// environmentBus.ts — Cross-tab/window environmental event bus
// Uses BroadcastChannel with localStorage fallback.
// ============================================================

import type { EnvironmentSnapshot } from '../types/sensors';
import { INITIAL_ENVIRONMENT_SNAPSHOT } from '../types/sensors';

const ENV_CHANNEL = 'mineguardx-env-bus';
const ENV_STORAGE_KEY = 'mineguardx-env-snapshot';
const ENV_LOCAL_EVENT = 'mineguardx:env:local';

export type EnvironmentBusMessage =
  | { type: 'ENVIRONMENT_UPDATE'; payload: EnvironmentSnapshot };

type EnvironmentBusCallback = (event: EnvironmentBusMessage) => void;

let channel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === 'undefined') return null;
  if (!channel) channel = new BroadcastChannel(ENV_CHANNEL);
  return channel;
}

export function subscribeEnvironmentEvents(callback: EnvironmentBusCallback): () => void {
  const bc = getChannel();

  const bcHandler = bc
    ? (event: MessageEvent<EnvironmentBusMessage>) => { callback(event.data); }
    : null;
  if (bc && bcHandler) bc.addEventListener('message', bcHandler);

  const localHandler = (e: Event) => {
    const msg = (e as CustomEvent<EnvironmentBusMessage>).detail;
    callback(msg);
  };
  window.addEventListener(ENV_LOCAL_EVENT, localHandler);

  const storageHandler = (e: StorageEvent) => {
    if (e.key === ENV_CHANNEL && e.newValue) {
      try {
        const msg = JSON.parse(e.newValue) as EnvironmentBusMessage;
        callback(msg);
      } catch (_) { /* ignore */ }
    }
  };
  if (!bc) window.addEventListener('storage', storageHandler);

  return () => {
    if (bc && bcHandler) bc.removeEventListener('message', bcHandler);
    window.removeEventListener(ENV_LOCAL_EVENT, localHandler);
    if (!bc) window.removeEventListener('storage', storageHandler);
  };
}

function broadcast(msg: EnvironmentBusMessage) {
  const bc = getChannel();
  window.dispatchEvent(new CustomEvent(ENV_LOCAL_EVENT, { detail: msg }));
  if (bc) {
    bc.postMessage(msg);
  } else {
    localStorage.setItem(ENV_CHANNEL, JSON.stringify(msg));
  }
}

export function emitEnvironmentUpdate(snapshot: EnvironmentSnapshot) {
  broadcast({ type: 'ENVIRONMENT_UPDATE', payload: snapshot });
}

export function saveEnvironmentSnapshot(snapshot: EnvironmentSnapshot) {
  try {
    localStorage.setItem(ENV_STORAGE_KEY, JSON.stringify(snapshot));
  } catch (_) { /* ignore */ }
}

export function getSavedEnvironmentSnapshot(): EnvironmentSnapshot {
  try {
    const raw = localStorage.getItem(ENV_STORAGE_KEY);
    if (!raw) return INITIAL_ENVIRONMENT_SNAPSHOT;
    return JSON.parse(raw) as EnvironmentSnapshot;
  } catch (_) {
    return INITIAL_ENVIRONMENT_SNAPSHOT;
  }
}
