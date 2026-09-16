// ============================================================
// Mine Map Spatial Data Models
//
// Strict Rule: No fake mine coordinates, miner positions, rover paths,
// or artificial hazards. Everything defaults to empty / unavailable
// until real survey vectors or sensor telemetry are connected.
// ============================================================

import type { RescueRoute } from './route';

/** 3D local coordinate in mine reference frame (meters from shaft origin) */
export interface MapPoint {
  x: number;
  y: number;
  z?: number;
  level?: string;
  sector?: string;
}

export interface MineTunnel {
  id: string;
  name: string;
  start: MapPoint;
  end: MapPoint;
  widthMeters?: number;
  status: 'clear' | 'blocked' | 'hazardous' | 'unexplored';
}

export type RoverNavMode =
  | 'manual'
  | 'autonomous'
  | 'returning'
  | 'rescue'
  | 'stopped'
  | 'offline';

export interface RoverMapLocation {
  position: MapPoint | null;
  /** Heading angle in degrees (0 = North, 90 = East) or null */
  headingDegrees: number | null;
  mode: RoverNavMode;
  lastUpdated: string | null;
}

export interface RoverPath {
  points: MapPoint[];
  lastUpdated: string | null;
}

export type MinerMarkerStatus = 'normal' | 'warning' | 'emergency' | 'offline';

export interface MinerLocation {
  wearableId: string;
  minerName?: string;
  position: MapPoint | null;
  status: MinerMarkerStatus;
  emergency: boolean;
  lastUpdated: string | null;
  /** True when telemetry packet is older than threshold (stale marker) */
  isStale: boolean;
  staleDurationSeconds?: number;
}

export interface HazardMapItem {
  id: string;
  type: string;
  severity: 'info' | 'warning' | 'high' | 'critical';
  position: MapPoint;
  radiusMeters?: number;
}

export interface BlockedArea {
  id: string;
  name: string;
  center: MapPoint;
  boundary?: MapPoint[];
  reason: string;
  detectedAt: string;
}

export interface CommunicationNode {
  id: string;
  name: string;
  position: MapPoint;
  status: 'online' | 'offline';
  signalStrengthDbm: number | null;
  batteryPercent: number | null;
  lastCommunication: string | null;
  neighbors?: string[];
}

export interface ExplorationZone {
  id: string;
  name: string;
  status: 'explored' | 'unexplored';
  boundary?: MapPoint[];
}

export interface MapLayerVisibility {
  layout: boolean;
  rover: boolean;
  roverPath: boolean;
  miners: boolean;
  hazards: boolean;
  blockedAreas: boolean;
  communicationNodes: boolean;
  exploredAreas: boolean;
  unexploredAreas: boolean;
  rescueRoute: boolean;
}

export type MapObjectType = 'rover' | 'miner' | 'hazard' | 'node' | 'blocked';

export interface MineMapState {
  connected: boolean;
  mineName: string | null;
  activeLevel: string | null;
  availableLevels: string[];
  tunnels: MineTunnel[];
  rover: RoverMapLocation;
  roverPath: RoverPath;
  minerLocations: MinerLocation[];
  hazards: HazardMapItem[];
  blockedAreas: BlockedArea[];
  communicationNodes: CommunicationNode[];
  explorationZones: ExplorationZone[];
  rescueRoute: RescueRoute | null;
  layerVisibility: MapLayerVisibility;
  selectedObjectId: string | null;
  selectedObjectType: MapObjectType | null;
}

export const INITIAL_MAP_LAYER_VISIBILITY: MapLayerVisibility = {
  layout: true,
  rover: true,
  roverPath: true,
  miners: true,
  hazards: true,
  blockedAreas: true,
  communicationNodes: true,
  exploredAreas: true,
  unexploredAreas: true,
  rescueRoute: true,
};

export const INITIAL_MINE_MAP_STATE: MineMapState = {
  connected: false,
  mineName: null,
  activeLevel: null,
  availableLevels: [],
  tunnels: [],
  rover: {
    position: null,
    headingDegrees: null,
    mode: 'offline',
    lastUpdated: null,
  },
  roverPath: {
    points: [],
    lastUpdated: null,
  },
  minerLocations: [],
  hazards: [],
  blockedAreas: [],
  communicationNodes: [],
  explorationZones: [],
  rescueRoute: null,
  layerVisibility: INITIAL_MAP_LAYER_VISIBILITY,
  selectedObjectId: null,
  selectedObjectType: null,
};
