// ============================================================
// Camera Configuration
// Centralized configuration for ESP32-CAM and network streams.
// ============================================================

export const ESP32_CAM_BASE_URL = 'http://192.168.29.80/';

/**
 * The actual underlying live camera stream endpoints served by ESP32-CAM.
 * Official Arduino ESP32 CameraWebServer runs the MJPEG stream server on port 81 (/stream).
 */
export const ESP32_CAM_STREAM_ENDPOINTS = [
  'http://192.168.29.80:81/stream',
  'http://192.168.29.80:81/',
  'http://192.168.29.80/stream',
  'http://192.168.29.80/capture',
];

/** Primary default stream endpoint (Port 81 is standard ESP32-CAM stream server port) */
export const DEFAULT_CAMERA_URL = ESP32_CAM_STREAM_ENDPOINTS[0];
