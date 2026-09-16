// ============================================================
// MobileWearable — Mobile Web Simulated Miner Wearable Device
//
// Allows a smartphone or separate browser tab to act as a real
// field-connected miner wearable unit transmitting telemetry,
// location updates, and emergency SOS signals to the dashboard.
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Smartphone,
  Shield,
  Radio,
  AlertTriangle,
  Heart,
  Activity,
  Battery,
  MapPin,
  LogOut,
  ScanLine,
  Navigation,
  ArrowRight,
  Wind,
} from 'lucide-react';
import {
  validateStationCode,
  emitWearableConnect,
  emitWearableDisconnect,
  emitWearableSos,
  emitWearableResolveSos,
  emitWearableHeartbeat,
  emitWearableLocationUpdate,
  STATION_VERIFICATION_CODE,
  emitWearableEmergency,
} from '../services/wearableBus';
import { emitHazardEvent } from '../services/hazardBus';
import { emitEnvironmentUpdate, getSavedEnvironmentSnapshot } from '../services/environmentBus';
import type { EnvironmentSnapshot } from '../types/sensors';
import type { WearableMotionStatus } from '../types/wearable';

export function MobileWearable() {
  const [searchParams] = useSearchParams();

  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [pairingCode, setPairingCode] = useState(
    searchParams.get('code') || ''
  );
  const [minerName, setMinerName] = useState('R. Sterling');
  const [minerId, setMinerId] = useState('MNR-4092');
  const [selectedZone, setSelectedZone] = useState('Zone C - Gallery 4');
  const [posX, setPosX] = useState(48.0);
  const [posY, setPosY] = useState(115.0);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Device telemetry state
  const [wearableId] = useState(
    () => `WRB-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [batteryLevel] = useState(94);
  const [motion, setMotion] = useState<WearableMotionStatus>('moving');
  const [heartRate, setHeartRate] = useState(76);
  const [isSosActive, setIsSosActive] = useState(false);
  const [sosConfirming, setSosConfirming] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const heartbeatTimerRef = useRef<number | null>(null);

  // Audio beep generator for SOS siren
  const playSirenBeep = () => {
    try {
      const audioCtx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch {
      // Audio context restricted by browser
    }
  };

  // Clean up heartbeat on unmount or disconnect
  useEffect(() => {
    return () => {
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
      }
    };
  }, []);

  // Window unload listener: emit disconnect so dashboard immediately knows
  useEffect(() => {
    const handleUnload = () => {
      if (isConnected) {
        emitWearableDisconnect(wearableId);
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [isConnected, wearableId]);

  // Periodic heartbeat broadcast while connected
  useEffect(() => {
    if (isConnected) {
      heartbeatTimerRef.current = window.setInterval(() => {
        // Subtle vital drift for realism
        const nextHr = Math.max(
          65,
          Math.min(130, heartRate + Math.floor(Math.random() * 5 - 2))
        );
        setHeartRate(nextHr);

        emitWearableHeartbeat(wearableId, batteryLevel, motion, {
          heartRate: nextHr,
          spO2: 98,
          bodyTemp: 36.7,
        });
      }, 4000);
    } else if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
    }

    return () => {
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
      }
    };
  }, [isConnected, wearableId, batteryLevel, motion, heartRate]);

  // Connect handler
  const handleConnect = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setConnectionError(null);

    const valid = validateStationCode(pairingCode);
    if (!valid) {
      setConnectionError(
        `Invalid Base Station Code. Expected verification format "${STATION_VERIFICATION_CODE}".`
      );
      return;
    }

    const timestamp = new Date().toISOString();
    emitWearableConnect({
      wearableId,
      minerName: minerName.trim() || 'Field Miner',
      minerId: minerId.trim() || 'MNR-0000',
      batteryLevel,
      location: {
        x: posX,
        y: posY,
        zone: selectedZone,
        lastUpdated: timestamp,
      },
      deviceInfo: navigator.userAgent.includes('Mobile')
        ? 'Mobile Handheld'
        : 'Browser Device Emulator',
      timestamp,
    });

    setIsConnected(true);
  };

  // Disconnect handler
  const handleDisconnect = () => {
    emitWearableDisconnect(wearableId);
    setIsConnected(false);
    setIsSosActive(false);
  };

  // SOS Toggle
  const handleToggleSos = () => {
    if (!isSosActive) {
      setSosConfirming(true);
    } else {
      setIsSosActive(false);
      emitWearableResolveSos(wearableId); // Deprecated essentially, but keeping for compatibility. Real resolution is done from dashboard.
    }
  };

  const confirmSos = () => {
    setSosConfirming(false);
    setIsSosActive(true);
    playSirenBeep();
    emitWearableEmergency(
      wearableId,
      'SOS',
      'critical',
      { x: posX, y: posY, zone: selectedZone, lastUpdated: new Date().toISOString() }
    );
  };

  const cancelSosConfirm = () => {
    setSosConfirming(false);
  };

  const triggerEvent = (type: 'FALL' | 'ABNORMAL_MOVEMENT' | 'NO_MOTION') => {
    const confidence = type === 'NO_MOTION' ? undefined : 0.90 + Math.random() * 0.08;
    const severity = type === 'FALL' ? 'critical' : 'warning';
    
    emitWearableEmergency(
      wearableId,
      type,
      severity,
      { x: posX, y: posY, zone: selectedZone, lastUpdated: new Date().toISOString() },
      confidence
    );
  };

  const triggerHazard = (type: 'METHANE' | 'CO' | 'FIRE' | 'SMOKE' | 'HIGH_TEMPERATURE' | 'STRUCTURAL_OBSTRUCTION' | 'ROCKFALL' | 'FLOODING') => {
    const severityMap: Record<string, 'warning' | 'high' | 'critical'> = {
      METHANE: 'warning', CO: 'high', FIRE: 'critical', SMOKE: 'warning',
      HIGH_TEMPERATURE: 'warning', STRUCTURAL_OBSTRUCTION: 'high',
      ROCKFALL: 'critical', FLOODING: 'high',
    };
    emitHazardEvent(
      type,
      severityMap[type] || 'warning',
      'AI_MODEL',
      { x: posX, y: posY, zone: selectedZone },
      { description: `${type.replace(/_/g, ' ')} detected near wearable position`, confidence: 0.85 + Math.random() * 0.13 }
    );
  };

  const triggerEnvironmentUpdate = (type: 'NORMAL' | 'HIGH_CO' | 'LOW_O2' | 'HIGH_TEMP') => {
    const timestamp = new Date().toISOString();
    const snapshot: EnvironmentSnapshot = { ...getSavedEnvironmentSnapshot() };
    
    // Add history record helper
    const addHistory = (param: string, value: number, unit: string, status: 'ok' | 'warning' | 'critical') => {
      snapshot.history.push({
        id: crypto.randomUUID(),
        timestamp,
        sensorId: 'SIM-ENV-01',
        parameter: param,
        value,
        unit,
        location: { x: posX, y: posY, zone: selectedZone },
        status
      });
    };

    if (type === 'NORMAL') {
      snapshot.overallStatus = 'NORMAL';
      snapshot.readings.co = { value: 5, unit: 'ppm', status: 'ok', dataFreshness: 'LIVE', timestamp };
      snapshot.readings.o2 = { value: 20.9, unit: '%', status: 'ok', dataFreshness: 'LIVE', timestamp };
      snapshot.readings.temperature = { value: 24, unit: '°C', status: 'ok', dataFreshness: 'LIVE', timestamp };
      addHistory('CO', 5, 'ppm', 'ok');
    } else if (type === 'HIGH_CO') {
      snapshot.overallStatus = 'CRITICAL';
      snapshot.readings.co = { value: 120, unit: 'ppm', status: 'critical', dataFreshness: 'LIVE', timestamp };
      addHistory('CO', 120, 'ppm', 'critical');
      // trigger hazard if we simulate high CO
      triggerHazard('CO');
    } else if (type === 'LOW_O2') {
      snapshot.overallStatus = 'CRITICAL';
      snapshot.readings.o2 = { value: 18.5, unit: '%', status: 'critical', dataFreshness: 'LIVE', timestamp };
      addHistory('O2', 18.5, '%', 'critical');
    } else if (type === 'HIGH_TEMP') {
      snapshot.overallStatus = 'WARNING';
      snapshot.readings.temperature = { value: 38, unit: '°C', status: 'warning', dataFreshness: 'LIVE', timestamp };
      addHistory('Temperature', 38, '°C', 'warning');
    }

    emitEnvironmentUpdate(snapshot);
  };

  // Simulate walking / spatial movement
  const handleNudgeLocation = (dx: number, dy: number) => {
    const nextX = Math.round((posX + dx) * 10) / 10;
    const nextY = Math.round((posY + dy) * 10) / 10;
    setPosX(nextX);
    setPosY(nextY);
    setMotion('moving');

    if (isConnected) {
      emitWearableLocationUpdate(wearableId, {
        x: nextX,
        y: nextY,
        zone: selectedZone,
        lastUpdated: new Date().toISOString(),
      });
    }
  };

  // Scan simulation
  const handleSimulateScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setPairingCode(STATION_VERIFICATION_CODE);
      setIsScanning(false);
      setConnectionError(null);
    }, 900);
  };

  return (
    <div className="mobile-wearable-container">
      {/* Mobile Device Frame Container */}
      <div className="mobile-device-shell">
        {/* Device Status Bar */}
        <div className="mobile-top-bar">
          <span className="mobile-time font-mono">
            {new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          <div className="mobile-signal-icons">
            <Radio size={13} className={isConnected ? 'text-success' : 'text-muted'} />
            <Battery size={14} className="text-success" />
            <span className="font-mono text-xs">{batteryLevel}%</span>
          </div>
        </div>

        {/* Device App Header */}
        <header className="mobile-app-header">
          <div className="brand-badge">
            <Smartphone size={16} />
            <span>MineGuardX Wearable OS</span>
          </div>
          <span
            className={`connection-pill ${
              isConnected
                ? isSosActive
                  ? 'pill-sos'
                  : 'pill-online'
                : 'pill-offline'
            }`}
          >
            {isConnected ? (isSosActive ? 'EMERGENCY SOS' : 'LINKED') : 'UNPAIRED'}
          </span>
        </header>

        {/* ============================================================ */}
        {/* VIEW 1: PAIRING & CONNECTION SCREEN */}
        {/* ============================================================ */}
        {!isConnected ? (
          <div className="mobile-body pairing-view">
            <div className="pairing-hero">
              <div className="pairing-icon-box">
                <Shield size={32} className="text-cyan" />
              </div>
              <h2>Miner Device Pairing</h2>
              <p className="pairing-desc">
                Connect your wearable to the underground Command Center base station.
              </p>
            </div>

            {/* Quick QR Scan Simulation */}
            <div className="scan-trigger-box">
              <button
                type="button"
                className="btn-scan-qr"
                onClick={handleSimulateScan}
                disabled={isScanning}
              >
                <ScanLine size={18} className={isScanning ? 'pulse-anim' : ''} />
                <span>{isScanning ? 'Scanning Station QR...' : 'Scan Station QR Code'}</span>
              </button>
            </div>

            <div className="divider-line">
              <span>OR ENTER VERIFICATION CODE</span>
            </div>

            <form onSubmit={handleConnect} className="pairing-form">
              <div className="form-group">
                <label>Base Station Verification Code</label>
                <input
                  type="text"
                  className="input-code font-mono uppercase"
                  placeholder="e.g. MINE-8421"
                  value={pairingCode}
                  onChange={(e) => setPairingCode(e.target.value.toUpperCase())}
                  required
                />
                <span className="form-hint">
                  Default station code: <code>MINE-8421</code>
                </span>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Miner Name</label>
                  <input
                    type="text"
                    value={minerName}
                    onChange={(e) => setMinerName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Employee ID</label>
                  <input
                    type="text"
                    value={minerId}
                    onChange={(e) => setMinerId(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Assigned Sector</label>
                <select
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value)}
                >
                  <option value="Zone A - Main Drift">Zone A - Main Drift</option>
                  <option value="Zone B - Extraction Face">Zone B - Extraction Face</option>
                  <option value="Zone C - Gallery 4">Zone C - Gallery 4</option>
                  <option value="Zone D - Shaft Pocket">Zone D - Shaft Pocket</option>
                </select>
              </div>

              {connectionError && (
                <div className="connection-error-box">
                  <AlertTriangle size={15} />
                  <span>{connectionError}</span>
                </div>
              )}

              <button type="submit" className="btn-connect-action">
                <span>Authorize & Connect Wearable</span>
                <ArrowRight size={16} />
              </button>
            </form>
          </div>
        ) : (
          /* ============================================================ */
          /* VIEW 2: CONNECTED ACTIVE WEARABLE DASHBOARD */
          /* ============================================================ */
          <div className="mobile-body connected-view">
            {/* Device Identity Card */}
            <div className="connected-id-card">
              <div className="id-left">
                <div className="device-tag font-mono">{wearableId}</div>
                <div className="miner-name-text">{minerName}</div>
                <span className="miner-id-text text-muted font-mono">{minerId}</span>
              </div>
              <div className="id-right">
                <span className="live-indicator">
                  <span className="live-dot pulse-anim" />
                  REAL-TIME
                </span>
              </div>
            </div>

            {/* HIGH-PRIORITY EMERGENCY SOS BUTTON */}
            <div className="sos-section">
              {sosConfirming ? (
                <div className="sos-confirm-box">
                  <div className="sos-confirm-text">CONFIRM EMERGENCY?</div>
                  <div className="sos-confirm-actions">
                    <button className="btn-sos-cancel" onClick={cancelSosConfirm}>CANCEL</button>
                    <button className="btn-sos-confirm" onClick={confirmSos}>SEND SOS</button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className={`btn-huge-sos ${isSosActive ? 'sos-activated' : ''}`}
                  onClick={handleToggleSos}
                >
                  <div className="sos-inner-circle">
                    <AlertTriangle size={36} />
                    <span className="sos-text">
                      {isSosActive ? 'SOS ACTIVE (Cannot cancel from device)' : 'EMERGENCY SOS'}
                    </span>
                    <span className="sos-sub">
                      {isSosActive
                        ? 'Distress signal sending to Command Center'
                        : 'Press to broadcast distress beacon'}
                    </span>
                  </div>
                </button>
              )}
            </div>

            {/* Telemetry Metrics */}
            <div className="mobile-metrics-grid">
              {/* Heart Rate */}
              <div className="mobile-metric-card">
                <div className="metric-icon-row">
                  <Heart size={16} className="text-danger pulse-anim" />
                  <span className="metric-name">Heart Rate</span>
                </div>
                <div className="metric-num font-mono">
                  {heartRate} <span className="metric-unit">BPM</span>
                </div>
              </div>

              {/* Battery */}
              <div className="mobile-metric-card">
                <div className="metric-icon-row">
                  <Battery size={16} className="text-success" />
                  <span className="metric-name">Battery</span>
                </div>
                <div className="metric-num font-mono">
                  {batteryLevel}%
                </div>
              </div>
            </div>

            {/* Emergency Detection Simulators */}
            <div className="motion-control-card" style={{ marginTop: '1rem' }}>
              <div className="section-label text-warning">
                <AlertTriangle size={14} />
                <span>Simulate Emergency Detections</span>
              </div>
              <div className="motion-btn-group">
                <button type="button" className="btn-motion btn-fall" onClick={() => triggerEvent('FALL')}>
                  Trigger Fall
                </button>
                <button type="button" className="btn-motion" onClick={() => triggerEvent('ABNORMAL_MOVEMENT')}>
                  Abnormal Move
                </button>
                <button type="button" className="btn-motion" onClick={() => triggerEvent('NO_MOTION')}>
                  No Motion
                </button>
              </div>
            </div>

            {/* Hazard Simulation Panel */}
            <div className="motion-control-card" style={{ marginTop: '1rem', borderColor: 'rgba(249,115,22,0.3)' }}>
              <div className="section-label" style={{ color: '#f97316' }}>
                <AlertTriangle size={14} />
                <span>Simulate Hazard Detection</span>
              </div>
              <div className="motion-btn-group" style={{ flexWrap: 'wrap', gap: '6px' }}>
                <button type="button" className="btn-motion" style={{ background: 'rgba(249,115,22,0.12)', borderColor: 'rgba(249,115,22,0.3)', color: '#f97316' }} onClick={() => triggerHazard('METHANE')}>Methane</button>
                <button type="button" className="btn-motion" style={{ background: 'rgba(249,115,22,0.12)', borderColor: 'rgba(249,115,22,0.3)', color: '#f97316' }} onClick={() => triggerHazard('CO')}>CO</button>
                <button type="button" className="btn-motion btn-fall" onClick={() => triggerHazard('FIRE')}>Fire</button>
                <button type="button" className="btn-motion" style={{ background: 'rgba(249,115,22,0.12)', borderColor: 'rgba(249,115,22,0.3)', color: '#f97316' }} onClick={() => triggerHazard('SMOKE')}>Smoke</button>
                <button type="button" className="btn-motion" onClick={() => triggerHazard('HIGH_TEMPERATURE')}>High Temp</button>
                <button type="button" className="btn-motion" onClick={() => triggerHazard('STRUCTURAL_OBSTRUCTION')}>Obstruction</button>
                <button type="button" className="btn-motion btn-fall" onClick={() => triggerHazard('ROCKFALL')}>Rockfall</button>
                <button type="button" className="btn-motion" style={{ background: 'rgba(56,189,248,0.1)', borderColor: 'rgba(56,189,248,0.3)', color: '#38bdf8' }} onClick={() => triggerHazard('FLOODING')}>Flooding</button>
              </div>
              <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px' }}>
                Dispatches real hazard events to the dashboard event bus.
              </p>
            </div>

            {/* Environment Simulation Panel */}
            <div className="motion-control-card" style={{ marginTop: '1rem', borderColor: 'rgba(59,130,246,0.3)' }}>
              <div className="section-label" style={{ color: '#3b82f6' }}>
                <Wind size={14} />
                <span>Simulate Environment Telemetry</span>
              </div>
              <div className="motion-btn-group" style={{ flexWrap: 'wrap', gap: '6px' }}>
                <button type="button" className="btn-motion" style={{ background: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)', color: '#22c55e' }} onClick={() => triggerEnvironmentUpdate('NORMAL')}>Set Normal</button>
                <button type="button" className="btn-motion" style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)', color: '#ef4444' }} onClick={() => triggerEnvironmentUpdate('HIGH_CO')}>High CO</button>
                <button type="button" className="btn-motion" style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)', color: '#ef4444' }} onClick={() => triggerEnvironmentUpdate('LOW_O2')}>Low O₂</button>
                <button type="button" className="btn-motion" style={{ background: 'rgba(249,115,22,0.1)', borderColor: 'rgba(249,115,22,0.3)', color: '#f97316' }} onClick={() => triggerEnvironmentUpdate('HIGH_TEMP')}>High Temp</button>
              </div>
            </div>

            {/* Spatial Location Simulator */}
            <div className="location-control-card">
              <div className="section-label">
                <MapPin size={14} className="text-cyan" />
                <span>Simulated Mine Positioning</span>
              </div>

              <div className="location-display font-mono">
                <span>{selectedZone}</span>
                <span className="coords-tag">
                  X: {posX.toFixed(1)}m | Y: {posY.toFixed(1)}m
                </span>
              </div>

              <div className="position-nudge-pad">
                <div className="pad-row pad-center">
                  <button
                    type="button"
                    className="btn-pad"
                    onClick={() => handleNudgeLocation(0, -5)}
                    title="Nudge North (-Y)"
                  >
                    ▲ -5m
                  </button>
                </div>
                <div className="pad-row pad-split">
                  <button
                    type="button"
                    className="btn-pad"
                    onClick={() => handleNudgeLocation(-5, 0)}
                    title="Nudge West (-X)"
                  >
                    ◀ -5m
                  </button>
                  <Navigation size={18} className="pad-icon text-muted" />
                  <button
                    type="button"
                    className="btn-pad"
                    onClick={() => handleNudgeLocation(5, 0)}
                    title="Nudge East (+X)"
                  >
                    +5m ▶
                  </button>
                </div>
                <div className="pad-row pad-center">
                  <button
                    type="button"
                    className="btn-pad"
                    onClick={() => handleNudgeLocation(0, 5)}
                    title="Nudge South (+Y)"
                  >
                    ▼ +5m
                  </button>
                </div>
              </div>
              <span className="nudge-hint">
                Click arrows to simulate movement and watch marker move live on the Mine Map.
              </span>
            </div>

            {/* Disconnect Action */}
            <div className="disconnect-section">
              <button
                type="button"
                className="btn-disconnect-mobile"
                onClick={handleDisconnect}
              >
                <LogOut size={16} />
                <span>Disconnect Wearable Device</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
