// ============================================================
// EmergencyStop — highly visible E-Stop control
//
// IMPORTANT: This is a UI-only control in this version.
// It is NOT connected to a physical emergency stop circuit.
//
// Integration point:
//   The onEmergencyStop prop calls sendEmergencyStop() from
//   the API service layer. Replace that stub with a real
//   rover backend POST request when hardware is available.
//
// Safety design:
//   - Button is DISABLED when rover is not connected
//   - Requires an arm/confirm step before sending command
//   - Visual state clearly communicates "not connected"
// ============================================================

import { useState } from 'react';
import { OctagonX, ShieldAlert, ShieldOff } from 'lucide-react';
import type { ConnectionStatus } from '../types';
import { sendEmergencyStop } from '../services/api';

interface EmergencyStopProps {
  roverConnectionStatus: ConnectionStatus;
  /** Override the default stop handler (e.g. for testing) */
  onEmergencyStop?: () => Promise<boolean>;
}

type StopState = 'idle' | 'armed' | 'sending' | 'sent' | 'error';

export default function EmergencyStop({
  roverConnectionStatus,
  onEmergencyStop = sendEmergencyStop,
}: EmergencyStopProps) {
  const [stopState, setStopState] = useState<StopState>('idle');
  const isConnected = roverConnectionStatus === 'connected';

  async function handleArm() {
    setStopState('armed');
  }

  async function handleConfirmStop() {
    setStopState('sending');
    try {
      // TODO: This calls the API stub. When rover backend is ready,
      // api.sendEmergencyStop() will POST to /api/rover/emergency-stop
      const success = await onEmergencyStop();
      setStopState(success ? 'sent' : 'error');
    } catch {
      setStopState('error');
    }
  }

  function handleDisarm() {
    setStopState('idle');
  }

  const isArmed   = stopState === 'armed';
  const isSending = stopState === 'sending';
  const isSent    = stopState === 'sent';
  const isError   = stopState === 'error';

  return (
    <div className="emergency-stop-section" data-testid="emergency-stop">
      <div className="emergency-stop-header">
        <span className="card-title" style={{ color: 'var(--color-critical)' }}>
          <OctagonX size={13} aria-hidden="true" />
          Emergency Stop
        </span>
        {/* Safety label */}
        <span
          style={{
            fontSize: '11px',
            color: 'var(--text-disabled)',
            fontStyle: 'italic',
          }}
          role="note"
        >
          {isConnected
            ? 'Rover connected — control active'
            : 'Rover not connected — control disabled'}
        </span>
      </div>

      <div className="emergency-stop-inner">
        {/* Info text */}
        <div className="emergency-stop-info">
          <p className="emergency-stop-label">
            Immediately halts all rover movement and switches to emergency standby mode.
            Use only in case of imminent danger to personnel or equipment.
          </p>
          {!isConnected && (
            <p className="emergency-stop-status" aria-live="polite">
              ⚠ Emergency stop is unavailable: rover is not connected to this system.
            </p>
          )}
          {isSent && (
            <p style={{ color: 'var(--color-connected)', fontSize: '12px', fontWeight: 600 }} aria-live="assertive">
              ✓ Stop command transmitted to rover.
            </p>
          )}
          {isError && (
            <p style={{ color: 'var(--color-critical)', fontSize: '12px', fontWeight: 600 }} aria-live="assertive">
              ✗ Stop command failed — check rover connection.
            </p>
          )}
        </div>

        {/* Control buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          {!isArmed ? (
            <button
              id="emergency-stop-btn"
              className="btn-emergency"
              disabled={!isConnected || isSending || isSent}
              onClick={handleArm}
              aria-label="Arm emergency stop — requires confirmation"
              aria-disabled={!isConnected}
            >
              <OctagonX size={24} aria-hidden="true" />
              EMERGENCY STOP
              <span className="btn-sub">
                {!isConnected ? 'Rover Disconnected' : 'Click to arm'}
              </span>
            </button>
          ) : (
            <>
              <button
                id="emergency-stop-confirm-btn"
                className="btn-emergency"
                style={{
                  background: 'var(--emergency-primary)',
                  animation: 'pulse-critical 1s infinite',
                }}
                disabled={isSending}
                onClick={handleConfirmStop}
                aria-label="Confirm emergency stop — this will halt the rover"
              >
                <ShieldAlert size={24} aria-hidden="true" />
                {isSending ? 'SENDING…' : 'CONFIRM STOP'}
                <span className="btn-sub">Action cannot be undone</span>
              </button>
              <button
                id="emergency-stop-disarm-btn"
                className="btn btn-ghost"
                onClick={handleDisarm}
                disabled={isSending}
                aria-label="Disarm emergency stop"
              >
                <ShieldOff size={13} aria-hidden="true" />
                Disarm
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
