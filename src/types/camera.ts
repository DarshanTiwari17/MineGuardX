// ============================================================
// Camera & Live Monitoring Data Models
//
// Strict Rule: No fake streams, mock FPS, or artificial AI detections.
// When backend is disconnected, values default to null / disconnected.
// ============================================================

export type CameraType = 'rgb' | 'night' | 'thermal';

export type CameraStatus = 'connected' | 'disconnected' | 'streaming' | 'error';

export interface CameraInfo {
  id: string;
  name: string;
  type: CameraType;
  connected: boolean;
  status: CameraStatus;
  /** e.g. "1920x1080" or null if unavailable */
  resolution: string | null;
  /** Frame rate or null if unavailable */
  fps: number | null;
  /** ISO string or null if unavailable */
  lastFrameAt: string | null;
  roverId: string | null;
  roverLocation: string | null;
  /** Stream URL or null if disconnected */
  streamUrl: string | null;
}

export type AIDetectionType =
  | 'person'
  | 'miner'
  | 'thermal_human'
  | 'fall'
  | 'fire'
  | 'smoke'
  | 'structural_obstruction'
  | 'other_hazard';

export interface AIDetection {
  id: string;
  type: AIDetectionType;
  /** Detection confidence score between 0 and 1 */
  confidence: number;
  /** ISO timestamp when detection occurred */
  timestamp: string;
  /** Location in mine if localized (e.g. "Sector B, Tunnel 3") or null */
  location: string | null;
  /** ID or type of camera that produced the detection */
  cameraId: CameraType;
  /** Bounding box in percentage [0-100] coordinates: x, y, width, height */
  bbox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  /** Estimated temperature in Celsius for thermal detections */
  thermalTempC?: number | null;
}

export interface RecordingState {
  isRecording: boolean;
  /** Whether recording backend is accessible */
  canRecord: boolean;
  recordedDurationSeconds: number;
  lastSnapshotAt: string | null;
  status: 'idle' | 'recording' | 'unavailable' | 'error';
  statusMessage?: string;
}

export interface ThermalHotspot {
  x: number;
  y: number;
  tempC: number;
}

export interface LiveMonitoringState {
  activeCamera: CameraType;
  cameras: Record<CameraType, CameraInfo>;
  detections: AIDetection[];
  recording: RecordingState;
  thermalHotspots: ThermalHotspot[];
}

import { DEFAULT_CAMERA_URL } from '../config/cameraConfig';

export const INITIAL_CAMERA_STATE: LiveMonitoringState = {
  activeCamera: 'rgb',
  cameras: {
    rgb: {
      id: 'cam-rgb-01',
      name: 'RGB Optical Camera',
      type: 'rgb',
      connected: true,
      status: 'connected',
      resolution: null,
      fps: null,
      lastFrameAt: null,
      roverId: 'ROVER-01',
      roverLocation: 'Sector B, Main Shaft',
      streamUrl: DEFAULT_CAMERA_URL,
    },
    night: {
      id: 'cam-night-01',
      name: 'Night Vision IR Camera',
      type: 'night',
      connected: false,
      status: 'disconnected',
      resolution: null,
      fps: null,
      lastFrameAt: null,
      roverId: null,
      roverLocation: null,
      streamUrl: null,
    },
    thermal: {
      id: 'cam-thermal-01',
      name: 'Long-Wave Infrared Thermal Camera',
      type: 'thermal',
      connected: false,
      status: 'disconnected',
      resolution: null,
      fps: null,
      lastFrameAt: null,
      roverId: null,
      roverLocation: null,
      streamUrl: null,
    },
  },
  detections: [],
  recording: {
    isRecording: false,
    canRecord: false,
    recordedDurationSeconds: 0,
    lastSnapshotAt: null,
    status: 'unavailable',
    statusMessage: 'Recording service unavailable — backend disconnected',
  },
  thermalHotspots: [],
};
