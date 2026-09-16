// ============================================================
// AppContext — global application state
//
// All state starts disconnected / empty.
// Future: replace dispatch calls with WebSocket event handlers
// or polling intervals that call the API service layer.
// ============================================================

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  type ReactNode,
  type Dispatch,
} from 'react';

import type {
  RoverState,
  WearableState,
  HazardState,
  Hazard,
  HazardStatus,
  MissionEvent,
  RescueRoute,
  CommunicationState,
  Mission,
  Alert,
  AlertState,
  SystemHealth,
  LiveMonitoringState,
  CameraType,
  AIDetection,
  RecordingState,
  CameraInfo,
  MineMapState,
  MapLayerVisibility,
  MapObjectType,
  Wearable,
  WearableConnectPayload,
  WearableDisconnectPayload,
  WearableHeartbeatPayload,
  WearableSosPayload,
  WearableLocationUpdatePayload,
  WearableEmergencyPayload,
  SensorSourceStatus,
} from '../types';

import {
  subscribeWearableEvents,
  saveConnectedWearables,
} from '../services/wearableBus';

import {
  subscribeHazardEvents,
  saveHazards,
  type HazardDetectedPayload,
  type HazardStatusPayload,
} from '../services/hazardBus';

import { subscribeEnvironmentEvents } from '../services/environmentBus';

import {
  INITIAL_ROVER_STATE,
  INITIAL_SENSOR_DATA,
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

import {
  fetchRoverState,
  fetchEnvironmentSnapshot,
  fetchWearableState,
  fetchHazardState,
  fetchActiveRoute,
  fetchCommunicationState,
  fetchActiveMission,
  fetchAlerts,
  fetchSystemHealth,
  fetchCameraState,
  fetchMineMapState,
} from '../services/api';

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

export interface AppState {
  rover: RoverState;
  environment: EnvironmentSnapshot;
  wearables: WearableState;
  hazards: HazardState;
  activeRoute: RescueRoute | null;
  communication: CommunicationState;
  mission: Mission;
  alerts: AlertState;
  systemHealth: SystemHealth;
  cameras: LiveMonitoringState;
  mineMap: MineMapState;
  /** UI-only: is the emergency stop armed */
  emergencyStopArmed: boolean;
  /** Is the app in initial loading phase */
  isInitializing: boolean;
}

import { INITIAL_ENVIRONMENT_SNAPSHOT } from '../types/sensors';

const INITIAL_APP_STATE: AppState = {
  rover: INITIAL_ROVER_STATE,
  environment: INITIAL_ENVIRONMENT_SNAPSHOT,
  wearables: INITIAL_WEARABLE_STATE,
  hazards: INITIAL_HAZARD_STATE,
  activeRoute: INITIAL_ROUTE,
  communication: INITIAL_COMMUNICATION_STATE,
  mission: INITIAL_MISSION,
  alerts: INITIAL_ALERT_STATE,
  systemHealth: INITIAL_SYSTEM_HEALTH,
  cameras: INITIAL_CAMERA_STATE,
  mineMap: INITIAL_MINE_MAP_STATE,
  emergencyStopArmed: false,
  isInitializing: true,
};

// ---------------------------------------------------------------------------
// Action types
// ---------------------------------------------------------------------------

export type AppAction =
  | { type: 'SET_ROVER_STATE'; payload: RoverState }
  | { type: 'ENVIRONMENT_UPDATE'; payload: EnvironmentSnapshot }
  | { type: 'SET_WEARABLE_STATE'; payload: WearableState }
  | { type: 'SET_HAZARD_STATE'; payload: HazardState }
  | { type: 'SET_ACTIVE_ROUTE'; payload: RescueRoute | null }
  | { type: 'SET_COMMUNICATION_STATE'; payload: CommunicationState }
  | { type: 'SET_MISSION'; payload: Mission }
  | { type: 'SET_ALERTS'; payload: AlertState }
  | { type: 'SET_SYSTEM_HEALTH'; payload: SystemHealth }
  | { type: 'SET_CAMERA_STATE'; payload: LiveMonitoringState }
  | { type: 'SET_ACTIVE_CAMERA'; payload: CameraType }
  | {
      type: 'SET_CAMERA_STATUS';
      payload: {
        camera: CameraType;
        status: CameraInfo['status'];
        connected: boolean;
      };
    }
  | { type: 'ADD_AI_DETECTION'; payload: AIDetection }
  | { type: 'CLEAR_AI_DETECTIONS' }
  | { type: 'SET_RECORDING_STATE'; payload: Partial<RecordingState> }
  | { type: 'SET_MINE_MAP_STATE'; payload: MineMapState }
  | { type: 'SET_MAP_LAYER_VISIBILITY'; payload: Partial<MapLayerVisibility> }
  | {
      type: 'SELECT_MAP_OBJECT';
      payload: { id: string; type: MapObjectType } | null;
    }
  | { type: 'WEARABLE_DEVICE_CONNECTED'; payload: WearableConnectPayload }
  | { type: 'WEARABLE_DEVICE_DISCONNECTED'; payload: WearableDisconnectPayload }
  | { type: 'WEARABLE_DEVICE_HEARTBEAT'; payload: WearableHeartbeatPayload }
  | { type: 'WEARABLE_DEVICE_SOS'; payload: WearableSosPayload }
  | {
      type: 'WEARABLE_RESOLVE_SOS';
      payload: { wearableId: string; timestamp: string };
    }
  | {
      type: 'WEARABLE_DEVICE_LOCATION';
      payload: WearableLocationUpdatePayload;
    }
  | {
      type: 'WEARABLE_EMERGENCY_DETECTED';
      payload: WearableEmergencyPayload;
    }
  | { type: 'ACKNOWLEDGE_WEARABLE_EMERGENCY'; payload: { eventId: string } }
  | { type: 'RESOLVE_WEARABLE_EMERGENCY'; payload: { eventId: string; timestamp: string } }
  | { type: 'HAZARD_DETECTED'; payload: HazardDetectedPayload }
  | { type: 'HAZARD_ACKNOWLEDGED'; payload: HazardStatusPayload }
  | { type: 'HAZARD_RESOLVED'; payload: HazardStatusPayload }
  | { type: 'UPDATE_SENSOR_STATUS'; payload: Partial<SensorSourceStatus> }
  | { type: 'SET_EMERGENCY_STOP_ARMED'; payload: boolean }
  | { type: 'SET_INITIALIZING'; payload: boolean };

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_ROVER_STATE':
      return { ...state, rover: action.payload };
    case 'ENVIRONMENT_UPDATE':
      return { ...state, environment: action.payload };
    case 'SET_WEARABLE_STATE':
      return {
        ...state,
        wearables: {
          ...action.payload,
          // Normalize: old persisted state may not have emergencies array
          emergencies: action.payload.emergencies ?? [],
        },
      };
    case 'SET_HAZARD_STATE':
      return {
        ...state,
        hazards: {
          ...action.payload,
          // Normalize: old persisted state may not have historicalHazards or sensorStatus
          activeHazards: action.payload.activeHazards ?? [],
          historicalHazards: action.payload.historicalHazards ?? [],
          sensorStatus: action.payload.sensorStatus ?? INITIAL_HAZARD_STATE.sensorStatus,
        },
      };
    case 'SET_ACTIVE_ROUTE':
      return { ...state, activeRoute: action.payload };
    case 'SET_COMMUNICATION_STATE':
      return { ...state, communication: action.payload };
    case 'SET_MISSION':
      return {
        ...state,
        mission: {
          ...action.payload,
          // Normalize: old persisted missions may not have timeline
          timeline: action.payload.timeline ?? [],
        },
      };
    case 'SET_ALERTS':
      return { ...state, alerts: action.payload };
    case 'SET_SYSTEM_HEALTH':
      return { ...state, systemHealth: action.payload };
    case 'SET_CAMERA_STATE':
      return { ...state, cameras: action.payload };
    case 'SET_ACTIVE_CAMERA':
      return {
        ...state,
        cameras: {
          ...state.cameras,
          activeCamera: action.payload,
        },
      };
    case 'SET_CAMERA_STATUS': {
      const { camera, status, connected } = action.payload;
      return {
        ...state,
        cameras: {
          ...state.cameras,
          cameras: {
            ...state.cameras.cameras,
            [camera]: {
              ...state.cameras.cameras[camera],
              status,
              connected,
            },
          },
        },
      };
    }
    case 'ADD_AI_DETECTION': {
      const detection = action.payload;
      const updatedDetections = [detection, ...state.cameras.detections];

      // Requirement 11: Alert integration
      // If detection is high confidence or danger hazard, automatically escalate to alert center
      const isDangerous =
        detection.type === 'fire' ||
        detection.type === 'fall' ||
        detection.type === 'smoke' ||
        detection.type === 'structural_obstruction' ||
        detection.confidence >= 0.85;

      let updatedAlerts = state.alerts;
      if (isDangerous) {
        const detectionLabel = detection.type.replace(/_/g, ' ').toUpperCase();
        const newAlert: Alert = {
          id: `alert-det-${detection.id}`,
          severity:
            detection.type === 'fire' || detection.type === 'fall'
              ? 'critical'
              : 'warning',
          category: 'ai',
          title: `AI Detection: ${detectionLabel}`,
          message: `${detectionLabel} detected (${Math.round(
            detection.confidence * 100
          )}% confidence)${detection.location ? ` in ${detection.location}` : ''}`,
          timestamp: detection.timestamp,
          acknowledged: false,
          hazardId: null,
          wearableId: null,
        };

        updatedAlerts = {
          ...state.alerts,
          alerts: [newAlert, ...state.alerts.alerts],
          activeCount: state.alerts.activeCount + 1,
        };
      }

      return {
        ...state,
        cameras: {
          ...state.cameras,
          detections: updatedDetections,
        },
        alerts: updatedAlerts,
      };
    }
    case 'CLEAR_AI_DETECTIONS':
      return {
        ...state,
        cameras: {
          ...state.cameras,
          detections: [],
        },
      };
    case 'SET_RECORDING_STATE':
      return {
        ...state,
        cameras: {
          ...state.cameras,
          recording: {
            ...state.cameras.recording,
            ...action.payload,
          },
        },
      };
    case 'SET_MINE_MAP_STATE':
      return { ...state, mineMap: action.payload };
    case 'SET_MAP_LAYER_VISIBILITY':
      return {
        ...state,
        mineMap: {
          ...state.mineMap,
          layerVisibility: {
            ...state.mineMap.layerVisibility,
            ...action.payload,
          },
        },
      };
    case 'SELECT_MAP_OBJECT':
      return {
        ...state,
        mineMap: {
          ...state.mineMap,
          selectedObjectId: action.payload?.id ?? null,
          selectedObjectType: action.payload?.type ?? null,
        },
      };
    case 'WEARABLE_DEVICE_CONNECTED': {
      const {
        wearableId,
        minerName,
        minerId,
        batteryLevel,
        location,
        deviceInfo,
        timestamp,
      } = action.payload;

      const existingIdx = state.wearables.wearables.findIndex(
        (w) => w.id === wearableId
      );

      const updatedWearable: Wearable = {
        id: wearableId,
        minerName,
        minerId,
        status: 'connected',
        batteryLevel,
        motion: 'stationary',
        vitals: { heartRate: 78, spO2: 98, bodyTemp: 36.6 },
        location,
        lastHeartbeat: timestamp,
        sosTriggered: false,
        deviceInfo,
      };

      const updatedWearablesList =
        existingIdx >= 0
          ? state.wearables.wearables.map((w, idx) =>
              idx === existingIdx ? updatedWearable : w
            )
          : [...state.wearables.wearables, updatedWearable];

      const connectedCount = updatedWearablesList.filter(
        (w) => w.status === 'connected' || w.status === 'sos'
      ).length;

      saveConnectedWearables(updatedWearablesList);

      // Sync to Mine Map
      const existingLocIdx = state.mineMap.minerLocations.findIndex(
        (l) => l.wearableId === wearableId
      );

      const updatedMinerLoc = {
        wearableId,
        minerName,
        position: {
          x: location.x,
          y: location.y,
          level: 'Sub-Level 2',
          sector: location.zone,
        },
        status: 'normal' as const,
        emergency: false,
        lastUpdated: timestamp,
        isStale: false,
      };

      const updatedMinerLocations =
        existingLocIdx >= 0
          ? state.mineMap.minerLocations.map((l, idx) =>
              idx === existingLocIdx ? updatedMinerLoc : l
            )
          : [...state.mineMap.minerLocations, updatedMinerLoc];

      return {
        ...state,
        wearables: {
          connectedCount,
          wearables: updatedWearablesList,
        },
        mineMap: {
          ...state.mineMap,
          minerLocations: updatedMinerLocations,
        },
      };
    }

    case 'WEARABLE_DEVICE_DISCONNECTED': {
      const { wearableId, timestamp } = action.payload;

      const updatedWearablesList = state.wearables.wearables.map((w) => {
        if (w.id === wearableId) {
          return {
            ...w,
            status: 'disconnected' as const,
            lastHeartbeat: timestamp,
          };
        }
        return w;
      });

      const connectedCount = updatedWearablesList.filter(
        (w) => w.status === 'connected' || w.status === 'sos'
      ).length;

      saveConnectedWearables(updatedWearablesList);

      const updatedMinerLocations = state.mineMap.minerLocations.map((l) => {
        if (l.wearableId === wearableId) {
          return {
            ...l,
            status: 'offline' as const,
            isStale: true,
            lastUpdated: timestamp,
          };
        }
        return l;
      });

      return {
        ...state,
        wearables: {
          connectedCount,
          wearables: updatedWearablesList,
        },
        mineMap: {
          ...state.mineMap,
          minerLocations: updatedMinerLocations,
        },
      };
    }

    case 'WEARABLE_DEVICE_SOS': {
      const { wearableId, minerName, location, timestamp } = action.payload;

      const updatedWearablesList = state.wearables.wearables.map((w) => {
        if (w.id === wearableId) {
          // Check if there are active emergencies to determine status
          const hasEmergencies = state.wearables.emergencies.some(e => e.wearableId === wearableId && e.status === 'ACTIVE');
          return {
            ...w,
            status: hasEmergencies ? 'emergency' : 'sos',
            sosTriggered: true,
            location,
            lastHeartbeat: timestamp,
          };
        }
        return w;
      });

      saveConnectedWearables(updatedWearablesList);

      const updatedMinerLocations = state.mineMap.minerLocations.map((l) => {
        if (l.wearableId === wearableId) {
          return {
            ...l,
            status: 'emergency' as const,
            emergency: true,
            lastUpdated: timestamp,
            isStale: false,
          };
        }
        return l;
      });

      const newAlert: Alert = {
        id: `alert-sos-${wearableId}-${Date.now()}`,
        severity: 'critical',
        category: 'wearable',
        title: `EMERGENCY SOS: ${minerName || wearableId}`,
        message: `Distress signal triggered in zone ${location.zone} (X: ${location.x}m, Y: ${location.y}m)`,
        timestamp,
        acknowledged: false,
        hazardId: null,
        wearableId,
      };

      return {
        ...state,
        wearables: {
          ...state.wearables,
          wearables: updatedWearablesList,
        },
        mineMap: {
          ...state.mineMap,
          minerLocations: updatedMinerLocations,
        },
        alerts: {
          ...state.alerts,
          alerts: [newAlert, ...state.alerts.alerts],
          activeCount: state.alerts.activeCount + 1,
        },
      };
    }

    case 'WEARABLE_RESOLVE_SOS': {
      const { wearableId, timestamp } = action.payload;

      const updatedWearablesList = state.wearables.wearables.map((w) => {
        if (w.id === wearableId) {
          return {
            ...w,
            status: 'connected' as const,
            sosTriggered: false,
            lastHeartbeat: timestamp,
          };
        }
        return w;
      });

      saveConnectedWearables(updatedWearablesList);

      const updatedMinerLocations = state.mineMap.minerLocations.map((l) => {
        if (l.wearableId === wearableId) {
          return {
            ...l,
            status: 'normal' as const,
            emergency: false,
            lastUpdated: timestamp,
          };
        }
        return l;
      });

      return {
        ...state,
        wearables: {
          ...state.wearables,
          wearables: updatedWearablesList,
        },
        mineMap: {
          ...state.mineMap,
          minerLocations: updatedMinerLocations,
        },
      };
    }

    case 'WEARABLE_DEVICE_HEARTBEAT': {
      const { wearableId, batteryLevel, motion, vitals, timestamp } =
        action.payload;

      const updatedWearablesList = state.wearables.wearables.map((w) => {
        if (w.id === wearableId) {
          return {
            ...w,
            batteryLevel,
            motion,
            vitals,
            lastHeartbeat: timestamp,
          };
        }
        return w;
      });

      saveConnectedWearables(updatedWearablesList);

      return {
        ...state,
        wearables: {
          ...state.wearables,
          wearables: updatedWearablesList,
        },
      };
    }

    case 'WEARABLE_DEVICE_LOCATION': {
      const { wearableId, location, timestamp } = action.payload;

      const updatedWearablesList = state.wearables.wearables.map((w) => {
        if (w.id === wearableId) {
          return {
            ...w,
            location,
            lastHeartbeat: timestamp,
          };
        }
        return w;
      });

      saveConnectedWearables(updatedWearablesList);

      const updatedMinerLocations = state.mineMap.minerLocations.map((l) => {
        if (l.wearableId === wearableId) {
          return {
            ...l,
            position: {
              x: location.x,
              y: location.y,
              level: 'Sub-Level 2',
              sector: location.zone,
            },
            lastUpdated: timestamp,
            isStale: false,
          };
        }
        return l;
      });

      return {
        ...state,
        wearables: {
          ...state.wearables,
          wearables: updatedWearablesList,
        },
        mineMap: {
          ...state.mineMap,
          minerLocations: updatedMinerLocations,
        },
      };
    }

    case 'WEARABLE_EMERGENCY_DETECTED': {
      const {
        eventId,
        wearableId,
        type,
        severity,
        confidence,
        timestamp,
        location,
      } = action.payload;

      // Deduplication — guard against undefined in old persisted state
      const existingEmergencies = state.wearables.emergencies ?? [];
      if (existingEmergencies.some((e) => e.eventId === eventId)) {
        return state;
      }

      const newEmergency = {
        eventId,
        wearableId,
        type,
        severity,
        confidence,
        timestamp,
        location,
        status: 'ACTIVE' as const,
      };

      const updatedEmergencies = [newEmergency, ...(state.wearables.emergencies ?? [])];

      const updatedWearablesList = state.wearables.wearables.map((w) => {
        if (w.id === wearableId) {
          return {
            ...w,
            status: 'emergency' as const,
          };
        }
        return w;
      });

      saveConnectedWearables(updatedWearablesList);

      const updatedMinerLocations = state.mineMap.minerLocations.map((l) => {
        if (l.wearableId === wearableId) {
          return {
            ...l,
            status: 'emergency' as const,
            emergency: true,
            lastUpdated: timestamp,
          };
        }
        return l;
      });

      const wearable = state.wearables.wearables.find(w => w.id === wearableId);
      const nameStr = wearable?.minerName ? `${wearable.minerName} (${wearableId})` : wearableId;

      const newAlert: Alert = {
        id: `alert-emerg-${eventId}`,
        severity: severity,
        category: 'wearable',
        title: `EMERGENCY: ${type.replace(/_/g, ' ')}`,
        message: `Detected for ${nameStr}. ${confidence ? `Confidence: ${Math.round(confidence * 100)}%` : ''}`,
        timestamp,
        acknowledged: false,
        hazardId: null,
        wearableId,
      };

      return {
        ...state,
        wearables: {
          ...state.wearables,
          wearables: updatedWearablesList,
          emergencies: updatedEmergencies,
        },
        mineMap: {
          ...state.mineMap,
          minerLocations: updatedMinerLocations,
        },
        alerts: {
          ...state.alerts,
          alerts: [newAlert, ...state.alerts.alerts],
          activeCount: state.alerts.activeCount + 1,
        },
      };
    }

    case 'ACKNOWLEDGE_WEARABLE_EMERGENCY': {
      const { eventId } = action.payload;
      
      const updatedEmergencies = state.wearables.emergencies.map(e => {
        if (e.eventId === eventId && e.status === 'ACTIVE') {
          return { ...e, status: 'ACKNOWLEDGED' as const, acknowledgedAt: new Date().toISOString() };
        }
        return e;
      });

      const alertId = `alert-emerg-${eventId}`;
      const updatedAlerts = state.alerts.alerts.map(a => {
        if (a.id === alertId) {
          return { ...a, acknowledged: true };
        }
        return a;
      });
      
      const activeCount = updatedAlerts.filter(a => !a.acknowledged).length;

      return {
        ...state,
        wearables: {
          ...state.wearables,
          emergencies: updatedEmergencies,
        },
        alerts: {
          ...state.alerts,
          alerts: updatedAlerts,
          activeCount,
        }
      };
    }

    case 'RESOLVE_WEARABLE_EMERGENCY': {
      const { eventId, timestamp } = action.payload;
      
      let targetWearableId: string | null = null;
      
      const updatedEmergencies = state.wearables.emergencies.map(e => {
        if (e.eventId === eventId) {
          targetWearableId = e.wearableId;
          return { ...e, status: 'RESOLVED' as const, resolvedAt: timestamp };
        }
        return e;
      });

      if (!targetWearableId) return state;

      // Check if wearable still has other active emergencies
      const hasOtherEmergencies = updatedEmergencies.some(e => e.wearableId === targetWearableId && (e.status === 'ACTIVE' || e.status === 'ACKNOWLEDGED'));

      const updatedWearablesList = state.wearables.wearables.map(w => {
        if (w.id === targetWearableId) {
          return {
            ...w,
            status: hasOtherEmergencies ? w.status : (w.status === 'disconnected' ? 'disconnected' : 'connected'),
            sosTriggered: hasOtherEmergencies ? w.sosTriggered : false,
          };
        }
        return w;
      });

      saveConnectedWearables(updatedWearablesList);

      const updatedMinerLocations = state.mineMap.minerLocations.map(l => {
        if (l.wearableId === targetWearableId) {
          const isOffline = state.wearables.wearables.find(w => w.id === targetWearableId)?.status === 'disconnected';
          return {
            ...l,
            status: hasOtherEmergencies ? 'emergency' : (isOffline ? 'offline' : 'normal'),
            emergency: hasOtherEmergencies,
            lastUpdated: timestamp,
          };
        }
        return l;
      });

      return {
        ...state,
        wearables: {
          ...state.wearables,
          wearables: updatedWearablesList,
          emergencies: updatedEmergencies,
        },
        mineMap: {
          ...state.mineMap,
          minerLocations: updatedMinerLocations,
        },
      };
    }

    case 'SET_EMERGENCY_STOP_ARMED':
      return { ...state, emergencyStopArmed: action.payload };
    case 'SET_INITIALIZING':
      return { ...state, isInitializing: action.payload };

    case 'HAZARD_DETECTED': {
      const p = action.payload;
      // Guard against undefined arrays in old persisted state
      const activeHazards = state.hazards.activeHazards ?? [];
      const historicalHazards = state.hazards.historicalHazards ?? [];
      // Deduplication by hazardId
      if (activeHazards.some(h => h.id === p.hazardId) ||
          historicalHazards.some(h => h.id === p.hazardId)) {
        return state;
      }

      const newHazard: Hazard = {
        id: p.hazardId,
        type: p.type,
        severity: p.severity,
        status: 'ACTIVE',
        location: p.location,
        detectedAt: p.timestamp,
        updatedAt: p.timestamp,
        source: p.source,
        confidence: p.confidence,
        sensorId: p.sensorId,
        description: p.description,
        value: p.value,
        unit: p.unit,
      };

      const updatedActiveHazards = [newHazard, ...activeHazards];
      saveHazards(updatedActiveHazards);

      // Generate alert
      const newAlert: Alert = {
        id: `alert-hazard-${p.hazardId}`,
        severity: p.severity === 'high' ? 'critical' : p.severity === 'info' ? 'info' : p.severity as Alert['severity'],
        category: 'hazard',
        title: `HAZARD: ${p.type.replace(/_/g, ' ')}`,
        message: `${p.description || p.type.replace(/_/g, ' ')} detected${p.location ? ` at Zone ${p.location.zone}` : ''}.${p.confidence ? ` Confidence: ${Math.round(p.confidence * 100)}%` : ''}`,
        timestamp: p.timestamp,
        acknowledged: false,
        hazardId: p.hazardId,
        wearableId: null,
      };

      // Generate mission timeline event
      const missionEvent: MissionEvent = {
        id: `evt-hazard-${p.hazardId}`,
        type: 'HAZARD_DETECTED',
        timestamp: p.timestamp,
        description: `${p.type.replace(/_/g, ' ')} hazard detected${p.location ? ` in Zone ${p.location.zone}` : ''}`,
        location: p.location ? { x: p.location.x, y: p.location.y, zone: p.location.zone } : null,
        entityId: p.hazardId,
        severity: p.severity,
      };

      // Update mine map if location available
      let updatedMineMap = state.mineMap;
      if (p.location) {
        const existingMapHazardIdx = state.mineMap.hazards.findIndex(h => h.id === p.hazardId);
        const mapHazard = {
          id: p.hazardId,
          type: p.type as string,
          severity: p.severity,
          position: { x: p.location.x, y: p.location.y },
          radiusMeters: 15,
        };
        const updatedMapHazards = existingMapHazardIdx >= 0
          ? state.mineMap.hazards.map((h, i) => i === existingMapHazardIdx ? mapHazard : h)
          : [...state.mineMap.hazards, mapHazard];
        updatedMineMap = { ...state.mineMap, hazards: updatedMapHazards };
      }

      return {
        ...state,
        hazards: {
          ...state.hazards,
          activeHazards: updatedActiveHazards,
        },
        mineMap: updatedMineMap,
        alerts: {
          ...state.alerts,
          alerts: [newAlert, ...state.alerts.alerts],
          activeCount: state.alerts.activeCount + 1,
        },
        mission: {
          ...state.mission,
          timeline: [missionEvent, ...(state.mission.timeline ?? [])],
        },
      };
    }

    case 'HAZARD_ACKNOWLEDGED': {
      const { hazardId, timestamp } = action.payload;
      const safeActive = state.hazards.activeHazards ?? [];
      const updatedActive = safeActive.map(h =>
        h.id === hazardId ? { ...h, status: 'ACKNOWLEDGED' as HazardStatus, acknowledgedAt: timestamp, updatedAt: timestamp } : h
      );
      saveHazards(updatedActive);

      const missionEvent: MissionEvent = {
        id: `evt-hazard-ack-${hazardId}-${Date.now()}`,
        type: 'HAZARD_ACKNOWLEDGED',
        timestamp,
        description: `Hazard ${hazardId} acknowledged by operator`,
        entityId: hazardId,
        severity: 'info',
      };

      // Also acknowledge corresponding alert
      const alertId = `alert-hazard-${hazardId}`;
      const updatedAlerts = state.alerts.alerts.map(a =>
        a.id === alertId ? { ...a, acknowledged: true } : a
      );

      return {
        ...state,
        hazards: { ...state.hazards, activeHazards: updatedActive },
        alerts: { ...state.alerts, alerts: updatedAlerts, activeCount: updatedAlerts.filter(a => !a.acknowledged).length },
        mission: { ...state.mission, timeline: [missionEvent, ...state.mission.timeline] },
      };
    }

    case 'HAZARD_RESOLVED': {
      const { hazardId, timestamp } = action.payload;
      const safeActive2 = state.hazards.activeHazards ?? [];
      const safeHistorical2 = state.hazards.historicalHazards ?? [];
      const resolvedHazard = safeActive2.find(h => h.id === hazardId);
      if (!resolvedHazard) return state;

      const resolved: Hazard = { ...resolvedHazard, status: 'RESOLVED', resolvedAt: timestamp, updatedAt: timestamp };
      const updatedActive = safeActive2.filter(h => h.id !== hazardId);
      saveHazards(updatedActive);

      // Remove from mine map
      const updatedMapHazards = state.mineMap.hazards.filter(h => h.id !== hazardId);

      const missionEvent: MissionEvent = {
        id: `evt-hazard-res-${hazardId}-${Date.now()}`,
        type: 'HAZARD_RESOLVED',
        timestamp,
        description: `Hazard ${resolvedHazard.type.replace(/_/g, ' ')} resolved`,
        entityId: hazardId,
        severity: 'info',
      };

      return {
        ...state,
        hazards: {
          ...state.hazards,
          activeHazards: updatedActive,
          historicalHazards: [resolved, ...safeHistorical2],
        },
        mineMap: { ...state.mineMap, hazards: updatedMapHazards },
        mission: { ...state.mission, timeline: [missionEvent, ...state.mission.timeline] },
      };
    }

    case 'UPDATE_SENSOR_STATUS': {
      return {
        ...state,
        hazards: {
          ...state.hazards,
          sensorStatus: { ...state.hazards.sensorStatus, ...action.payload },
        },
      };
    }

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface AppContextValue {
  state: AppState;
  dispatch: Dispatch<AppAction>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, INITIAL_APP_STATE);

  // Initial data load — currently returns disconnected states from stubs.
  // TODO: After initial load, connect WebSocket for live updates.
  useEffect(() => {
    async function initialize() {
      try {
        const [
          rover,
          environment,
          wearables,
          hazards,
          activeRoute,
          communication,
          mission,
          alerts,
          systemHealth,
          cameras,
          mineMap,
        ] = await Promise.all([
          fetchRoverState(),
          fetchEnvironmentSnapshot(),
          fetchWearableState(),
          fetchHazardState(),
          fetchActiveRoute(),
          fetchCommunicationState(),
          fetchActiveMission(),
          fetchAlerts(),
          fetchSystemHealth(),
          fetchCameraState(),
          fetchMineMapState(),
        ]);

        dispatch({ type: 'SET_ROVER_STATE', payload: rover });
        dispatch({ type: 'ENVIRONMENT_UPDATE', payload: environment });
        dispatch({ type: 'SET_WEARABLE_STATE', payload: wearables });
        dispatch({ type: 'SET_HAZARD_STATE', payload: hazards });
        dispatch({ type: 'SET_ACTIVE_ROUTE', payload: activeRoute });
        dispatch({ type: 'SET_COMMUNICATION_STATE', payload: communication });
        dispatch({ type: 'SET_MISSION', payload: mission });
        dispatch({ type: 'SET_ALERTS', payload: alerts });
        dispatch({ type: 'SET_SYSTEM_HEALTH', payload: systemHealth });
        dispatch({ type: 'SET_CAMERA_STATE', payload: cameras });
        dispatch({ type: 'SET_MINE_MAP_STATE', payload: mineMap });
      } catch (error) {
        console.error('[AppContext] Initialization error:', error);
      } finally {
        dispatch({ type: 'SET_INITIALIZING', payload: false });
      }
    }

    initialize();
  }, []);

  // Listen for real-time events from simulated mobile wearable client
  useEffect(() => {
    const unsubscribe = subscribeWearableEvents((event) => {
      switch (event.type) {
        case 'WEARABLE_CONNECT':
          dispatch({
            type: 'WEARABLE_DEVICE_CONNECTED',
            payload: event.payload,
          });
          break;
        case 'WEARABLE_DISCONNECT':
          dispatch({
            type: 'WEARABLE_DEVICE_DISCONNECTED',
            payload: event.payload,
          });
          break;
        case 'WEARABLE_SOS':
          dispatch({
            type: 'WEARABLE_DEVICE_SOS',
            payload: event.payload,
          });
          break;
        case 'WEARABLE_RESOLVE_SOS':
          dispatch({
            type: 'WEARABLE_RESOLVE_SOS',
            payload: event.payload,
          });
          break;
        case 'WEARABLE_HEARTBEAT':
          dispatch({
            type: 'WEARABLE_DEVICE_HEARTBEAT',
            payload: event.payload,
          });
          break;
        case 'WEARABLE_LOCATION_UPDATE':
          dispatch({
            type: 'WEARABLE_DEVICE_LOCATION',
            payload: event.payload,
          });
          break;
        case 'WEARABLE_EMERGENCY_EVENT':
          dispatch({
            type: 'WEARABLE_EMERGENCY_DETECTED',
            payload: event.payload,
          });
          break;
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Listen for real-time hazard events from the hazard event bus
  useEffect(() => {
    const unsubscribe = subscribeHazardEvents((event) => {
      switch (event.type) {
        case 'HAZARD_DETECTED':
          dispatch({ type: 'HAZARD_DETECTED', payload: event.payload });
          break;
        case 'HAZARD_ACKNOWLEDGED':
          dispatch({ type: 'HAZARD_ACKNOWLEDGED', payload: event.payload });
          break;
        case 'HAZARD_RESOLVED':
          dispatch({ type: 'HAZARD_RESOLVED', payload: event.payload });
          break;
      }
    });
    return () => unsubscribe();
  }, []);

  // Listen for real-time environmental updates
  useEffect(() => {
    const unsubscribe = subscribeEnvironmentEvents((event) => {
      if (event.type === 'ENVIRONMENT_UPDATE') {
        dispatch({ type: 'ENVIRONMENT_UPDATE', payload: event.payload });
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useAppContext must be used within <AppProvider>');
  }
  return ctx;
}
