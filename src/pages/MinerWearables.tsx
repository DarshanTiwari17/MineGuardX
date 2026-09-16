// ============================================================
// MinerWearables — Miner Wearable Management & Monitoring Console
//
// Real-time tracking of connected miner wearables. No fake miners:
// begins in disconnected state (0 connected) and updates dynamically
// when mobile devices pair via Station QR / Verification Code.
// ============================================================

import { Watch, AlertTriangle, ShieldCheck, WifiOff } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { StationQRDisplay } from '../components/wearable/StationQRDisplay';
import { WearableCard } from '../components/wearable/WearableCard';

export default function MinerWearables() {
  const { state, dispatch } = useAppContext();
  const { wearables, connectedCount, emergencies = [] } = state.wearables;

  const onlineCount = wearables.filter(
    (w) => w.status === 'connected' || w.status === 'sos'
  ).length;
  const sosCount = wearables.filter(
    (w) => w.status === 'sos' || w.sosTriggered
  ).length;
  const offlineCount = wearables.filter(
    (w) => w.status === 'disconnected'
  ).length;

  const activeEmergenciesCount = emergencies.filter(e => e.status === 'ACTIVE').length;
  
  const handleAcknowledge = (eventId: string) => {
    dispatch({ type: 'ACKNOWLEDGE_WEARABLE_EMERGENCY', payload: { eventId } });
  };
  
  const handleResolve = (eventId: string) => {
    dispatch({ type: 'RESOLVE_WEARABLE_EMERGENCY', payload: { eventId, timestamp: new Date().toISOString() } });
  };

  return (
    <div className="miner-wearables-page page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title-row">
            <Watch className="page-icon text-cyan" size={28} />
            <div>
              <h1 className="page-title">Miner Wearables</h1>
              <p className="page-subtitle">
                Underground Personnel Wearable Telemetry & Life-Safety Network
              </p>
            </div>
          </div>
        </div>

        {/* Global Wearable Metric Chips */}
        <div className="wearable-metrics-strip">
          <div className="metric-chip">
            <span className="metric-chip-label">Active Linked</span>
            <span
              className={`metric-chip-value font-mono ${
                onlineCount > 0 ? 'text-cyan' : 'text-muted'
              }`}
            >
              {onlineCount}
            </span>
          </div>

          <div
            className={`metric-chip ${sosCount > 0 ? 'chip-danger pulse-anim' : ''}`}
          >
            <span className="metric-chip-label">SOS Distress</span>
            <span
              className={`metric-chip-value font-mono ${
                sosCount > 0 ? 'text-danger font-bold' : 'text-muted'
              }`}
            >
              {sosCount}
            </span>
          </div>

          <div className="metric-chip">
            <span className="metric-chip-label">Station Gateway</span>
            <span className="metric-chip-value font-mono text-success">
              ONLINE
            </span>
          </div>
        </div>
      </div>

      {/* Distress Warning Banner if any miner triggered SOS or Emergency */}
      {(sosCount > 0 || activeEmergenciesCount > 0) && (
        <div className="distress-system-alert">
          <AlertTriangle size={20} className="pulse-anim" />
          <div className="alert-content">
            <strong>CRITICAL LIFE-SAFETY ALERT:</strong>
            <span>
              {activeEmergenciesCount > 0 ? `${activeEmergenciesCount} active emergency detection(s) and ` : ''}
              {sosCount} miner wearable unit(s) broadcasting active emergency distress
              signal. Check Mine Map for coordinates.
            </span>
          </div>
        </div>
      )}

      {/* Emergency Detection Status & History */}
      <section className="emergency-history-section mb-6">
        <div className="section-header-bar" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
          <div className="section-title-group">
            <h3>Wearable Emergency Detection</h3>
            <span className={`count-badge ${activeEmergenciesCount > 0 ? 'bg-danger text-black' : ''}`}>
              {activeEmergenciesCount} Active
            </span>
          </div>
        </div>
        
        {emergencies.length === 0 ? (
          <div className="text-muted p-4 text-center border-dashed border border-gray-700 rounded bg-dark/30">
            No active wearable emergencies
          </div>
        ) : (
          <div className="emergency-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {emergencies.map(evt => {
              const wearable = wearables.find(w => w.id === evt.wearableId);
              const minerName = wearable?.minerName ? `${wearable.minerName} (${evt.wearableId})` : evt.wearableId;
              
              return (
                <div key={evt.eventId} className={`card p-4 flex flex-row items-center justify-between ${evt.status === 'ACTIVE' ? 'border border-danger/50' : 'opacity-75'}`}>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${evt.severity === 'critical' ? 'text-danger' : 'text-warning'}`}>
                        {evt.type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs font-mono text-muted">{new Date(evt.timestamp).toLocaleTimeString()}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${evt.status === 'ACTIVE' ? 'bg-danger/20 text-danger' : evt.status === 'ACKNOWLEDGED' ? 'bg-warning/20 text-warning' : 'bg-success/20 text-success'}`}>
                        {evt.status}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-cyan">{minerName}</span>
                      {evt.confidence && <span className="ml-3 text-muted">Confidence: {Math.round(evt.confidence * 100)}%</span>}
                    </div>
                    <div className="text-sm text-muted font-mono mt-1">
                      Location: {evt.location ? `X: ${evt.location.x}m, Y: ${evt.location.y}m (Zone: ${evt.location.zone})` : 'Location unavailable'}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {evt.status === 'ACTIVE' && (
                      <button className="btn btn-outline border-warning text-warning hover:bg-warning/10 text-xs px-3 py-1" onClick={() => handleAcknowledge(evt.eventId)}>
                        Acknowledge
                      </button>
                    )}
                    {evt.status !== 'RESOLVED' && (
                      <button className="btn btn-outline border-success text-success hover:bg-success/10 text-xs px-3 py-1" onClick={() => handleResolve(evt.eventId)}>
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Station Pairing & QR Section */}
      <section className="station-section mb-6">
        <StationQRDisplay connectedCount={connectedCount} />
      </section>

      {/* Connected Wearable Roster Section */}
      <section className="wearables-roster-section">
        <div className="section-header-bar">
          <div className="section-title-group">
            <h3>Connected Personnel Devices</h3>
            <span className="count-badge">
              {connectedCount} Active
              {offlineCount > 0 ? ` (${offlineCount} offline)` : ''}
            </span>
          </div>
          <div className="status-legend">
            <span className="legend-item">
              <span className="dot-legend dot-green" /> Connected
            </span>
            <span className="legend-item">
              <span className="dot-legend dot-red" /> Distress SOS
            </span>
            <span className="legend-item">
              <span className="dot-legend dot-gray" /> Disconnected
            </span>
          </div>
        </div>

        {wearables.length === 0 ? (
          <div className="empty-wearables-panel card">
            <div className="empty-content">
              <div className="empty-icon-circle">
                <WifiOff size={36} className="text-muted" />
              </div>
              <h4>No Wearable Devices Connected</h4>
              <p>
                No active miner wearable telemetry streams are registered on the
                underground base gateway.
              </p>
              <div className="empty-instructions">
                <ShieldCheck size={16} className="text-cyan" />
                <span>
                  Scan the Station QR code above using a miner smartphone or click{' '}
                  <strong>"Launch Mobile Wearable Client"</strong> to link a device.
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="wearables-grid">
            {wearables.map((wearable) => (
              <WearableCard key={wearable.id} wearable={wearable} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
