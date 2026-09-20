// ============================================================
// StationQRDisplay — Wearable Connection Hub
// Allows launching mobile wearable clients that auto-connect
// to the dashboard via BroadcastChannel / localStorage bus.
// ============================================================

import { useState } from 'react';
import {
  Smartphone,
  ExternalLink,
  ShieldCheck,
  Radio,
  Wifi,
} from 'lucide-react';

interface StationQRDisplayProps {
  connectedCount: number;
}

export function StationQRDisplay({ connectedCount }: StationQRDisplayProps) {
  const [launchCount, setLaunchCount] = useState(0);

  // Generate pairing URL pointing to the app's mobile client route
  const clientOrigin =
    typeof window !== 'undefined' ? window.location.origin : '';
  const pairingUrl = `${clientOrigin}/mobile-wearable`;

  const handleLaunchSimulator = () => {
    // Each launch opens a new window with a unique name so multiple wearables
    // can coexist. The mobile client generates its own persistent device ID.
    const windowName = `MineGuardXWearable_${Date.now()}`;
    window.open(
      pairingUrl,
      windowName,
      'width=420,height=820,menubar=no,toolbar=no,location=no,status=no'
    );
    setLaunchCount((c) => c + 1);
  };

  return (
    <div className="station-qr-card card">
      <div className="station-qr-header">
        <div className="station-qr-title">
          <Wifi className="station-icon" size={20} />
          <h3>Wearable Connection Hub</h3>
        </div>
        <span
          className={`station-badge ${
            connectedCount > 0 ? 'badge-active' : 'badge-idle'
          }`}
        >
          <Radio size={13} className={connectedCount > 0 ? 'pulse-anim' : ''} />
          {connectedCount > 0
            ? `${connectedCount} Device(s) Linked`
            : 'Listening for Connections'}
        </span>
      </div>

      <div className="station-qr-body">
        {/* Connection Info Panel */}
        <div className="station-qr-details">
          <div className="station-info-row">
            <span className="info-label">Connection Mode:</span>
            <span className="info-val font-mono">AUTO-CONNECT</span>
          </div>

          <div className="station-info-row">
            <span className="info-label">Gateway Status:</span>
            <span className="info-val font-mono" style={{ color: '#22c55e' }}>ONLINE</span>
          </div>

          {launchCount > 0 && (
            <div className="station-info-row">
              <span className="info-label">Sessions Launched:</span>
              <span className="info-val font-mono">{launchCount}</span>
            </div>
          )}

          <div className="station-action-buttons">
            <button
              className="btn btn-primary btn-launch-mobile"
              onClick={handleLaunchSimulator}
            >
              <Smartphone size={16} />
              <span>Launch Mobile Wearable Client</span>
              <ExternalLink size={14} />
            </button>
          </div>

          <div className="pairing-security-note">
            <ShieldCheck size={14} className="security-icon" />
            <span>
              Each launched client registers as a unique wearable device.
              Real-time BroadcastChannel telemetry bridge active.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
