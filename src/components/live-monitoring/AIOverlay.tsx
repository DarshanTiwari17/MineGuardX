// ============================================================
// AIOverlay — reusable bounding box and detection badge layer
// Consumes structured AIDetection[] data. Zero mock detections.
// ============================================================

import { ShieldAlert } from 'lucide-react';
import type { AIDetection } from '../../types';

interface AIOverlayProps {
  detections: AIDetection[];
  activeCamera: string;
  showWatermark?: boolean;
}

function getDetectionColor(type: AIDetection['type']): string {
  switch (type) {
    case 'fire':
    case 'fall':
      return 'var(--color-critical)';
    case 'smoke':
    case 'structural_obstruction':
      return 'var(--color-warning)';
    case 'thermal_human':
    case 'person':
    case 'miner':
      return 'var(--color-info)';
    default:
      return 'var(--color-connected)';
  }
}

function formatTypeLabel(type: AIDetection['type']): string {
  switch (type) {
    case 'person':
      return 'PERSON';
    case 'miner':
      return 'MINER';
    case 'thermal_human':
      return 'THERMAL HUMAN';
    case 'fall':
      return 'FALL DETECTED';
    case 'fire':
      return 'FIRE / HEAT';
    case 'smoke':
      return 'SMOKE';
    case 'structural_obstruction':
      return 'OBSTRUCTION';
    default:
      return 'HAZARD';
  }
}

export default function AIOverlay({
  detections,
  activeCamera,
  showWatermark = true,
}: AIOverlayProps) {
  // Filter detections belonging to current camera if specified
  const activeDetections = detections.filter(
    (d) => !d.cameraId || d.cameraId === activeCamera
  );

  if (activeDetections.length === 0) {
    if (!showWatermark) return null;
    return (
      <div
        className="ai-overlay-watermark"
        aria-label="AI overlay status"
      >
        <span className="ai-watermark-pill">
          <ShieldAlert size={11} aria-hidden="true" />
          No AI detections
        </span>
      </div>
    );
  }

  return (
    <div
      className="ai-overlay-layer"
      role="region"
      aria-label="Real-time AI detection overlays"
    >
      {activeDetections.map((detection) => {
        const color = getDetectionColor(detection.type);
        const label = formatTypeLabel(detection.type);
        const confidencePct = Math.round(detection.confidence * 100);
        const bbox = detection.bbox;

        // If bounding box coordinates exist [0-100%]
        if (bbox) {
          return (
            <div
              key={detection.id}
              className="ai-bbox"
              style={{
                left: `${bbox.x}%`,
                top: `${bbox.y}%`,
                width: `${bbox.width}%`,
                height: `${bbox.height}%`,
                borderColor: color,
              }}
            >
              <div
                className="ai-bbox-label"
                style={{ backgroundColor: color }}
              >
                <span>
                  {label} — {confidencePct}%
                </span>
                {detection.thermalTempC !== undefined &&
                  detection.thermalTempC !== null && (
                    <span className="ai-bbox-temp">
                      {detection.thermalTempC}°C
                    </span>
                  )}
              </div>
            </div>
          );
        }

        // Fallback badge if no bbox coordinates provided
        return (
          <div
            key={detection.id}
            className="ai-banner-tag"
            style={{ borderColor: color }}
          >
            <span
              className="ai-tag-dot"
              style={{ backgroundColor: color }}
              aria-hidden="true"
            />
            <span className="ai-tag-text">
              {label} — {confidencePct}%
            </span>
            {detection.location && (
              <span className="ai-tag-loc">({detection.location})</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
