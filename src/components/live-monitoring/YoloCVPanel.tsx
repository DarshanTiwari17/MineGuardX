// ============================================================
// YoloCVPanel — AI Computer Vision Feed (text-only)
// Displays YOLO stabilized detections as structured text.
//
// Rules (per spec):
//  - NO video, NO processed footage, NO skeletons, NO bounding boxes
//  - Text ONLY: people count + per-person status
//  - Shows ⚠️ FALL DETECTED alert when any fall is confirmed
//  - Count and statuses come from stabilized YOLO output
// ============================================================

import { Brain, ShieldCheck, Users, AlertTriangle, Activity, Wifi, WifiOff, Loader } from 'lucide-react';
import type { YoloDetectionResult } from '../../hooks/useYoloPoseDetection';
import type { YoloConnectionStatus } from '../../hooks/useYoloPoseDetection';

interface YoloCVPanelProps {
  yoloDetections: YoloDetectionResult;
  connectionStatus: YoloConnectionStatus;
  connectionError: string | null;
}

function ConnectionBadge({ status, error }: { status: YoloConnectionStatus; error: string | null }) {
  const label =
    status === 'connected'   ? 'AI Active'   :
    status === 'connecting'  ? 'Connecting…'   :
    status === 'error'       ? 'Server Error'  :
    'Offline';

  const color =
    status === 'connected'  ? 'var(--color-connected)' :
    status === 'connecting' ? 'var(--color-warning)'   :
    status === 'error'      ? 'var(--color-critical)'  :
    'var(--color-offline)';

  const Icon =
    status === 'connected'  ? Wifi       :
    status === 'connecting' ? Loader     :
    WifiOff;

  return (
    <span
      title={error ?? label}
      style={{
        display:     'inline-flex',
        alignItems:  'center',
        gap:         '4px',
        fontSize:    '11px',
        fontWeight:  600,
        color,
        fontFamily:  'var(--font-mono, monospace)',
      }}
    >
      <Icon size={11} aria-hidden="true" />
      {label}
    </span>
  );
}

export default function YoloCVPanel({
  yoloDetections,
  connectionStatus,
  connectionError,
}: YoloCVPanelProps) {
  const { people_detected, any_fall, detections } = yoloDetections;
  const isConnected = connectionStatus === 'connected';

  return (
    <div className="ai-detection-panel" aria-label="AI Computer Vision Feed">
      {/* ── Header ── */}
      <div className="panel-subhead">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Brain size={14} color="var(--color-info)" aria-hidden="true" />
          <span>AI Computer Vision Feed</span>
        </div>
        <ConnectionBadge status={connectionStatus} error={connectionError} />
      </div>

      {/* ── Body ── */}
      <div className="ai-detection-list">
        {/* Offline / error state */}
        {!isConnected && (
          <div className="ai-empty-state" role="status">
            <Activity size={28} color="var(--text-disabled)" aria-hidden="true" />
            <span className="ai-empty-title">
              {connectionStatus === 'connecting' ? 'Connecting to AI…' : 'AI Offline'}
            </span>
            <span className="ai-empty-sub">
              {connectionError ?? 'Start backend/yolo_server.py to enable AI detection'}
            </span>
          </div>
        )}

        {/* Connected + no persons yet */}
        {isConnected && people_detected === 0 && (
          <div className="ai-empty-state" role="status">
            <ShieldCheck size={28} color="var(--text-disabled)" aria-hidden="true" />
            <span className="ai-empty-title">No persons detected</span>
            <span className="ai-empty-sub">Camera field of view is clear</span>
          </div>
        )}

        {/* Connected + persons detected */}
        {isConnected && people_detected > 0 && (
          <>
            {/* People count row */}
            <div
              style={{
                display:       'flex',
                alignItems:    'center',
                gap:           '8px',
                padding:       '10px 12px',
                borderRadius:  '6px',
                background:    'var(--bg-secondary)',
                marginBottom:  '8px',
                borderLeft:    `3px solid ${any_fall ? 'var(--color-critical)' : 'var(--color-info)'}`,
              }}
              aria-label={`${people_detected} people detected`}
            >
              <Users size={14} color="var(--color-info)" aria-hidden="true" />
              <span style={{ fontWeight: 600, fontSize: '13px' }}>
                People Detected:&nbsp;
                <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono, monospace)' }}>
                  {people_detected}
                </span>
              </span>
            </div>

            {/* Per-person status rows */}
            {detections.map((person) => {
              const isFall = person.fall_confirmed;
              return (
                <div
                  key={person.id}
                  className={`ai-detection-card ${isFall ? 'critical' : 'normal'}`}
                  aria-label={`Person ${person.id}: ${isFall ? 'FALL' : 'STANDING'}`}
                >
                  <div className="ai-card-header">
                    <div className="ai-card-type">
                      {isFall ? (
                        <AlertTriangle size={14} color="var(--color-critical)" aria-hidden="true" />
                      ) : (
                        <ShieldCheck size={14} color="var(--color-connected)" aria-hidden="true" />
                      )}
                      <span className="ai-card-name">
                        Person {person.id}
                      </span>
                    </div>
                    <span
                      className="ai-card-conf"
                      style={{
                        color:      isFall ? 'var(--color-critical)' : 'var(--color-connected)',
                        fontWeight: isFall ? 700 : 500,
                        fontFamily: 'var(--font-mono, monospace)',
                        fontSize:   '12px',
                      }}
                    >
                      {isFall ? 'FALL' : 'STANDING'}
                    </span>
                  </div>

                  <div className="ai-card-meta">
                    <span>Confidence: {Math.round(person.confidence * 100)}%</span>
                    {isFall && <span style={{ color: 'var(--color-critical)' }}>⚠ Fall confirmed</span>}
                  </div>
                </div>
              );
            })}

            {/* FALL DETECTED alert banner */}
            {any_fall && (
              <div
                role="alert"
                style={{
                  display:       'flex',
                  alignItems:    'center',
                  gap:           '8px',
                  padding:       '10px 12px',
                  borderRadius:  '6px',
                  background:    'rgba(239,68,68,0.12)',
                  border:        '1px solid var(--color-critical)',
                  marginTop:     '8px',
                  color:         'var(--color-critical)',
                  fontWeight:    700,
                  fontSize:      '13px',
                }}
              >
                <AlertTriangle size={16} aria-hidden="true" />
                ⚠️ FALL DETECTED
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
