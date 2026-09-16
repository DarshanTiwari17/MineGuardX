// ============================================================
// AIDetectionPanel — Compact panel of real-time AI detections
// Strictly shows "No AI detections" when no models/streams are connected.
// ============================================================

import {
  Brain,
  ShieldCheck,
  User,
  AlertTriangle,
  Flame,
  Wind,
  Layers,
  Sparkles,
} from 'lucide-react';
import type { AIDetection } from '../../types';

interface AIDetectionPanelProps {
  detections: AIDetection[];
  onClear?: () => void;
}

function getIconForType(type: AIDetection['type']) {
  switch (type) {
    case 'person':
    case 'miner':
    case 'thermal_human':
      return User;
    case 'fall':
      return AlertTriangle;
    case 'fire':
      return Flame;
    case 'smoke':
      return Wind;
    case 'structural_obstruction':
      return Layers;
    default:
      return Sparkles;
  }
}

function formatTypeName(type: AIDetection['type']): string {
  switch (type) {
    case 'person':
      return 'Person detected';
    case 'miner':
      return 'Miner detected';
    case 'thermal_human':
      return 'Thermal human detected';
    case 'fall':
      return 'Fall detected';
    case 'fire':
      return 'Fire / Heat detected';
    case 'smoke':
      return 'Smoke detected';
    case 'structural_obstruction':
      return 'Structural obstruction';
    default:
      return 'Anomaly detected';
  }
}

export default function AIDetectionPanel({ detections }: AIDetectionPanelProps) {
  return (
    <div className="ai-detection-panel" aria-label="AI Detection Feed">
      <div className="panel-subhead">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Brain size={14} color="var(--color-info)" aria-hidden="true" />
          <span>AI Computer Vision Feed</span>
        </div>
        <span className="panel-subhead-count">
          {detections.length} Active
        </span>
      </div>

      <div className="ai-detection-list">
        {detections.length === 0 ? (
          <div className="ai-empty-state" role="status">
            <ShieldCheck size={28} color="var(--text-disabled)" aria-hidden="true" />
            <span className="ai-empty-title">No AI detections</span>
            <span className="ai-empty-sub">
              Awaiting computer vision stream and inference events
            </span>
          </div>
        ) : (
          detections.map((d) => {
            const IconComponent = getIconForType(d.type);
            const isCritical =
              d.type === 'fire' || d.type === 'fall' || d.confidence >= 0.85;

            return (
              <div
                key={d.id}
                className={`ai-detection-card ${isCritical ? 'critical' : 'normal'}`}
              >
                <div className="ai-card-header">
                  <div className="ai-card-type">
                    <IconComponent size={14} aria-hidden="true" />
                    <span className="ai-card-name">{formatTypeName(d.type)}</span>
                  </div>
                  <span className="ai-card-conf">
                    {Math.round(d.confidence * 100)}%
                  </span>
                </div>

                <div className="ai-card-meta">
                  <span>Source: {d.cameraId.toUpperCase()}</span>
                  <span>{new Date(d.timestamp).toLocaleTimeString()}</span>
                  {d.location && <span>Loc: {d.location}</span>}
                  {d.thermalTempC !== undefined && d.thermalTempC !== null && (
                    <span>Temp: {d.thermalTempC}°C</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
