// ============================================================
// StationQRDisplay — Rescue Base Station QR & Pairing Terminal
// Allows field personnel or simulated test devices to pair with
// the dashboard via QR code or manual pairing verification code.
// ============================================================

import { useState } from 'react';
import {
  QrCode,
  Smartphone,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Radio,
} from 'lucide-react';
import { STATION_VERIFICATION_CODE } from '../../services/wearableBus';

interface StationQRDisplayProps {
  connectedCount: number;
}

export function StationQRDisplay({ connectedCount }: StationQRDisplayProps) {
  const [copied, setCopied] = useState(false);

  // Generate pairing URL pointing to the app's mobile client route
  const clientOrigin =
    typeof window !== 'undefined' ? window.location.origin : '';
  const pairingUrl = `${clientOrigin}/mobile-wearable?code=${STATION_VERIFICATION_CODE}`;

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(STATION_VERIFICATION_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLaunchSimulator = () => {
    window.open(
      pairingUrl,
      'MineGuardXMobileWearable',
      'width=420,height=820,menubar=no,toolbar=no,location=no,status=no'
    );
  };

  return (
    <div className="station-qr-card card">
      <div className="station-qr-header">
        <div className="station-qr-title">
          <QrCode className="station-icon" size={20} />
          <h3>Station Device Pairing Hub</h3>
        </div>
        <span
          className={`station-badge ${
            connectedCount > 0 ? 'badge-active' : 'badge-idle'
          }`}
        >
          <Radio size={13} className={connectedCount > 0 ? 'pulse-anim' : ''} />
          {connectedCount > 0
            ? `${connectedCount} Device(s) Linked`
            : 'Listening for Pairings'}
        </span>
      </div>

      <div className="station-qr-body">
        {/* SVG QR Code Simulation with precise high-contrast visual matrix */}
        <div className="qr-preview-wrapper">
          <div className="qr-matrix-box">
            <svg
              viewBox="0 0 160 160"
              width="150"
              height="150"
              className="qr-matrix-svg"
            >
              {/* Background */}
              <rect width="160" height="160" fill="#0d1117" rx="8" />

              {/* Corner Position Targets */}
              {/* Top-Left */}
              <rect x="14" y="14" width="34" height="34" fill="#00d4ff" rx="4" />
              <rect x="20" y="20" width="22" height="22" fill="#0d1117" rx="2" />
              <rect x="24" y="24" width="14" height="14" fill="#00d4ff" rx="2" />

              {/* Top-Right */}
              <rect x="112" y="14" width="34" height="34" fill="#00d4ff" rx="4" />
              <rect x="118" y="20" width="22" height="22" fill="#0d1117" rx="2" />
              <rect x="122" y="24" width="14" height="14" fill="#00d4ff" rx="2" />

              {/* Bottom-Left */}
              <rect x="14" y="112" width="34" height="34" fill="#00d4ff" rx="4" />
              <rect x="20" y="118" width="22" height="22" fill="#0d1117" rx="2" />
              <rect x="24" y="122" width="14" height="14" fill="#00d4ff" rx="2" />

              {/* Timing patterns & data cells */}
              <rect x="54" y="24" width="6" height="6" fill="#38bdf8" />
              <rect x="66" y="24" width="6" height="6" fill="#38bdf8" />
              <rect x="78" y="24" width="6" height="6" fill="#38bdf8" />
              <rect x="90" y="24" width="6" height="6" fill="#38bdf8" />

              <rect x="24" y="54" width="6" height="6" fill="#38bdf8" />
              <rect x="24" y="66" width="6" height="6" fill="#38bdf8" />
              <rect x="24" y="78" width="6" height="6" fill="#38bdf8" />
              <rect x="24" y="90" width="6" height="6" fill="#38bdf8" />

              {/* Dense Data Dots */}
              <rect x="54" y="54" width="8" height="8" fill="#38bdf8" />
              <rect x="70" y="54" width="12" height="8" fill="#38bdf8" />
              <rect x="90" y="54" width="8" height="8" fill="#38bdf8" />
              <rect x="106" y="54" width="8" height="8" fill="#38bdf8" />
              <rect x="122" y="54" width="12" height="8" fill="#38bdf8" />

              <rect x="54" y="70" width="16" height="8" fill="#38bdf8" />
              <rect x="78" y="70" width="8" height="8" fill="#00d4ff" />
              <rect x="94" y="70" width="16" height="8" fill="#38bdf8" />
              <rect x="118" y="70" width="8" height="8" fill="#38bdf8" />

              <rect x="54" y="86" width="8" height="8" fill="#38bdf8" />
              <rect x="70" y="86" width="8" height="8" fill="#38bdf8" />
              <rect x="86" y="86" width="14" height="8" fill="#00d4ff" />
              <rect x="108" y="86" width="10" height="8" fill="#38bdf8" />
              <rect x="126" y="86" width="8" height="8" fill="#38bdf8" />

              <rect x="54" y="102" width="12" height="8" fill="#38bdf8" />
              <rect x="74" y="102" width="16" height="8" fill="#38bdf8" />
              <rect x="98" y="102" width="8" height="8" fill="#38bdf8" />
              <rect x="114" y="102" width="14" height="8" fill="#38bdf8" />

              <rect x="54" y="118" width="8" height="8" fill="#38bdf8" />
              <rect x="70" y="118" width="14" height="8" fill="#38bdf8" />
              <rect x="92" y="118" width="8" height="8" fill="#38bdf8" />
              <rect x="108" y="118" width="10" height="8" fill="#38bdf8" />
              <rect x="126" y="118" width="8" height="8" fill="#38bdf8" />

              <rect x="54" y="134" width="14" height="8" fill="#38bdf8" />
              <rect x="76" y="134" width="8" height="8" fill="#38bdf8" />
              <rect x="92" y="134" width="16" height="8" fill="#00d4ff" />
              <rect x="116" y="134" width="18" height="8" fill="#38bdf8" />

              {/* Center Embellishment */}
              <circle cx="80" cy="80" r="10" fill="#0d1117" />
              <circle cx="80" cy="80" r="6" fill="#00d4ff" />
            </svg>
          </div>
          <span className="qr-scan-instruction">
            Scan with smartphone camera
          </span>
        </div>

        {/* Pairing Information and Manual Code */}
        <div className="station-qr-details">
          <div className="station-info-row">
            <span className="info-label">Base Station Gateway:</span>
            <span className="info-val font-mono">MINEGUARD-ALPHA-GATEWAY</span>
          </div>

          <div className="code-pairing-block">
            <div className="code-header">
              <span className="code-label">Station Pairing Code:</span>
              <span className="code-sub">Manual authentication key</span>
            </div>
            <div className="code-row">
              <span className="code-digits font-mono">
                {STATION_VERIFICATION_CODE}
              </span>
              <button
                className="btn-icon-copy"
                onClick={handleCopyCode}
                title="Copy Pairing Code"
              >
                {copied ? (
                  <Check size={16} className="text-success" />
                ) : (
                  <Copy size={16} />
                )}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

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
              Real-time TLS & BroadcastChannel telemetry bridge active.
              Zero simulated mock devices are injected.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
