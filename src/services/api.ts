// ============================================================
// API Service Layer — all functions return null / empty state
// until real Raspberry Pi / backend endpoints are integrated.
//
// INTEGRATION GUIDE:
// Replace each function body with a real fetch() or WebSocket
// call to your backend API. Keep the return types identical
// so UI components require no changes.
// ============================================================

import type {
  RoverState,
  WearableState,
  HazardState,
  RescueRoute,
  CommunicationState,
  Mission,
  AlertState,
  SystemHealth,
  LiveMonitoringState,
  AIDetection,
  CameraType,
  MineMapState,
} from '../types';

import {
  INITIAL_ROVER_STATE,
  INITIAL_WEARABLE_STATE,
  INITIAL_HAZARD_STATE,
  INITIAL_ROUTE,
  INITIAL_COMMUNICATION_STATE,
  INITIAL_MISSION,
  INITIAL_ALERT_STATE,
  INITIAL_SYSTEM_HEALTH,
  INITIAL_CAMERA_STATE,
  INITIAL_MINE_MAP_STATE,
} from '../types';

// ---------------------------------------------------------------------------
// Rover
// ---------------------------------------------------------------------------

/**
 * Fetch current rover telemetry.
 * TODO: Replace with GET /api/rover/status
 */
export async function fetchRoverState(): Promise<RoverState> {
  // TODO: const response = await fetch('/api/rover/status');
  // TODO: return response.json();
  return INITIAL_ROVER_STATE;
}

/**
 * Send emergency stop command to rover.
 * TODO: Replace with POST /api/rover/emergency-stop
 */
export async function sendEmergencyStop(): Promise<boolean> {
  // TODO: const response = await fetch('/api/rover/emergency-stop', { method: 'POST' });
  // TODO: return response.ok;
  console.warn('[EmergencyStop] Not connected to rover backend. Command not sent.');
  return false;
}

// ---------------------------------------------------------------------------
// Sensors
// ---------------------------------------------------------------------------

import type { EnvironmentSnapshot } from '../types/sensors';
import { getSavedEnvironmentSnapshot } from './environmentBus';

/**
 * Fetch latest environmental sensor snapshot.
 * TODO: Replace with GET /api/sensors/environment
 */
export async function fetchEnvironmentSnapshot(): Promise<EnvironmentSnapshot> {
  const saved = getSavedEnvironmentSnapshot();
  return saved;
}

import { getSavedConnectedWearables } from './wearableBus';

// ---------------------------------------------------------------------------
// Wearables
// ---------------------------------------------------------------------------

/**
 * Fetch currently connected miner wearables.
 * Checks local device connection sessions and falls back to INITIAL_WEARABLE_STATE.
 * TODO: Replace with GET /api/wearables/connected
 */
export async function fetchWearableState(): Promise<WearableState> {
  // Real wearable sessions from mobile client connection
  const saved = getSavedConnectedWearables();
  if (saved.length > 0) {
    const connectedCount = saved.filter(
      (w) => w.status === 'connected' || w.status === 'sos'
    ).length;
    return {
      connectedCount,
      wearables: saved,
      emergencies: [], // Emergencies aren't persisted to local storage currently
    };
  }
  return INITIAL_WEARABLE_STATE;
}

import { getSavedHazards } from './hazardBus';

/**
 * Fetch active hazard events.
 * Checks local hazard persistence and falls back to INITIAL_HAZARD_STATE.
 * TODO: Replace with GET /api/hazards/active
 */
export async function fetchHazardState(): Promise<HazardState> {
  const saved = getSavedHazards();
  if (saved.length > 0) {
    return {
      activeHazards: saved,
      historicalHazards: [],
      sensorStatus: INITIAL_HAZARD_STATE.sensorStatus,
    };
  }
  return INITIAL_HAZARD_STATE;
}

// ---------------------------------------------------------------------------
// Rescue Route
// ---------------------------------------------------------------------------

/**
 * Fetch current active rescue route.
 * TODO: Replace with GET /api/rescue/route/active
 */
export async function fetchActiveRoute(): Promise<RescueRoute | null> {
  // TODO: const response = await fetch('/api/rescue/route/active');
  // TODO: if (response.status === 404) return null;
  // TODO: return response.json();
  return INITIAL_ROUTE;
}

// ---------------------------------------------------------------------------
// Communication
// ---------------------------------------------------------------------------

/**
 * Fetch communication link status.
 * TODO: Replace with GET /api/communication/status
 */
export async function fetchCommunicationState(): Promise<CommunicationState> {
  // TODO: const response = await fetch('/api/communication/status');
  // TODO: return response.json();
  return INITIAL_COMMUNICATION_STATE;
}

// ---------------------------------------------------------------------------
// Mission
// ---------------------------------------------------------------------------

/**
 * Fetch current active mission.
 * TODO: Replace with GET /api/missions/active
 */
export async function fetchActiveMission(): Promise<Mission> {
  // TODO: const response = await fetch('/api/missions/active');
  // TODO: if (response.status === 404) return INITIAL_MISSION;
  // TODO: return response.json();
  return INITIAL_MISSION;
}

// ---------------------------------------------------------------------------
// Alerts
// ---------------------------------------------------------------------------

/**
 * Fetch system alerts.
 * TODO: Replace with GET /api/alerts?status=active
 */
export async function fetchAlerts(): Promise<AlertState> {
  // TODO: const response = await fetch('/api/alerts?status=active');
  // TODO: return response.json();
  return INITIAL_ALERT_STATE;
}

// ---------------------------------------------------------------------------
// System Health
// ---------------------------------------------------------------------------

/**
 * Fetch system health check.
 * TODO: Replace with GET /api/system/health
 */
export async function fetchSystemHealth(): Promise<SystemHealth> {
  // TODO: const response = await fetch('/api/system/health');
  // TODO: return response.json();
  return INITIAL_SYSTEM_HEALTH;
}

// ---------------------------------------------------------------------------
// Live Monitoring & Camera Feeds
// ---------------------------------------------------------------------------

/**
 * Fetch current camera configuration and statuses.
 * TODO: Replace with GET /api/cameras/status
 */
export async function fetchCameraState(): Promise<LiveMonitoringState> {
  // TODO: const response = await fetch('/api/cameras/status');
  // TODO: return response.json();
  return INITIAL_CAMERA_STATE;
}

/**
 * Fetch current real-time AI detections.
 * TODO: Replace with GET /api/ai/detections
 */
export async function fetchAIDetections(): Promise<AIDetection[]> {
  // TODO: const response = await fetch('/api/ai/detections');
  // TODO: return response.json();
  return [];
}

/**
 * Start video recording for a camera feed.
 * Returns failure since recording backend is not yet connected.
 * TODO: Replace with POST /api/cameras/:cameraId/record/start
 */
export async function startRecording(
  _cameraId: CameraType
): Promise<{ success: boolean; error: string }> {
  // When rover backend is ready:
  // const response = await fetch(`/api/cameras/${_cameraId}/record/start`, { method: 'POST' });
  // return response.json();
  return {
    success: false,
    error: 'Recording service unavailable: rover backend not connected',
  };
}

/**
 * Stop video recording for a camera feed.
 * TODO: Replace with POST /api/cameras/:cameraId/record/stop
 */
export async function stopRecording(
  _cameraId: CameraType
): Promise<{ success: boolean; error: string }> {
  return {
    success: false,
    error: 'Recording service unavailable: rover backend not connected',
  };
}

/**
 * Capture high-resolution snapshot from a camera feed.
 * TODO: Replace with POST /api/cameras/:cameraId/snapshot
 */
export async function captureSnapshot(
  _cameraId: CameraType
): Promise<{ success: boolean; error: string }> {
  return {
    success: false,
    error: 'Snapshot capture unavailable: camera offline',
  };
}

// ---------------------------------------------------------------------------
// Mine Map & Spatial Telemetry
// ---------------------------------------------------------------------------

/**
 * Fetch current underground mine map, tunnel layout, rover tracking, and markers.
 * TODO: Replace with GET /api/map/state
 */
export async function fetchMineMapState(): Promise<MineMapState> {
  const saved = getSavedConnectedWearables();
  if (saved.length > 0) {
    const minerLocations = saved.map((w) => ({
      wearableId: w.id,
      minerName: w.minerName || 'Miner',
      position: w.location
        ? {
            x: w.location.x,
            y: w.location.y,
            level: 'Sub-Level 2',
            sector: w.location.zone,
          }
        : null,
      status: (w.status === 'sos'
        ? 'emergency'
        : w.status === 'connected'
        ? 'normal'
        : 'offline') as 'normal' | 'emergency' | 'offline',
      emergency: w.status === 'sos',
      lastUpdated: w.location?.lastUpdated || w.lastHeartbeat,
      isStale: w.status === 'disconnected',
    }));

    return {
      ...INITIAL_MINE_MAP_STATE,
      minerLocations,
    };
  }
  return INITIAL_MINE_MAP_STATE;
}


