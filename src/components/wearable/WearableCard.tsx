// ============================================================
// WearableCard — Real-time telemetry card for a connected miner wearable
// ============================================================

import { Link } from 'react-router-dom';
import {
  User,
  Heart,
  Activity,
  Battery,
  BatteryCharging,
  BatteryWarning,
  MapPin,
  AlertTriangle,
  Clock,
  Navigation,
  CheckCircle,
} from 'lucide-react';
import type { Wearable } from '../../types/wearable';
import { emitWearableResolveSos } from '../../services/wearableBus';

interface WearableCardProps {
  wearable: Wearable;
}

export function WearableCard({ wearable }: WearableCardProps) {
  const isOnline = wearable.status === 'connected';
  const isSos = wearable.status === 'sos' || wearable.sosTriggered;
  const isOffline = wearable.status === 'disconnected';

  const getStatusBadge = () => {
    if (isSos) {
      return (
        <span className="status-badge status-sos pulse-anim">
          <AlertTriangle size={12} />
          EMERGENCY SOS
        </span>
      );
    }
    if (isOnline) {
      return (
        <span className="status-badge status-online">
          <span className="dot-online" />
          ONLINE
        </span>
      );
    }
    return (
      <span className="status-badge status-offline">
        <span className="dot-offline" />
        OFFLINE
      </span>
    );
  };

  const getBatteryIcon = () => {
    const level = wearable.batteryLevel ?? 0;
    if (level < 20) return <BatteryWarning size={16} className="text-danger" />;
    if (level > 80) return <BatteryCharging size={16} className="text-success" />;
    return <Battery size={16} className="text-warning" />;
  };

  const handleResolveSos = () => {
    emitWearableResolveSos(wearable.id);
  };

  const formatTime = (iso?: string | null) => {
    if (!iso) return 'No timestamp';
    try {
      return new Date(iso).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div
      className={`wearable-card card ${
        isSos ? 'wearable-card-sos' : isOffline ? 'wearable-card-offline' : ''
      }`}
    >
      <div className="wearable-card-header">
        <div className="wearable-title-block">
          <div className="wearable-avatar">
            <User size={18} />
          </div>
          <div>
            <h4 className="miner-name">
              {wearable.minerName || 'Unassigned Miner'}
            </h4>
            <div className="miner-sub-meta">
              <span className="font-mono text-muted">{wearable.id}</span>
              {wearable.minerId && (
                <span className="miner-badge-id">ID: {wearable.minerId}</span>
              )}
            </div>
          </div>
        </div>

        <div className="wearable-status-block">{getStatusBadge()}</div>
      </div>

      {isSos && (
        <div className="wearable-sos-banner">
          <AlertTriangle size={16} />
          <span>MINER TRIGGERED DISTRESS SIGNAL</span>
          <button
            className="btn btn-sm btn-outline-sos"
            onClick={handleResolveSos}
            title="Acknowledge and clear emergency state"
          >
            <CheckCircle size={13} />
            Resolve SOS
          </button>
        </div>
      )}

      <div className="wearable-card-metrics">
        {/* Battery */}
        <div className="metric-box">
          <span className="metric-label">
            {getBatteryIcon()}
            Battery
          </span>
          <span className="metric-value font-mono">
            {wearable.batteryLevel !== null ? `${wearable.batteryLevel}%` : 'N/A'}
          </span>
        </div>

        {/* Motion */}
        <div className="metric-box">
          <span className="metric-label">
            <Activity size={15} />
            Motion
          </span>
          <span
            className={`metric-value capitalize ${
              wearable.motion === 'fall_detected' ? 'text-danger font-bold' : ''
            }`}
          >
            {wearable.motion ? wearable.motion.replace('_', ' ') : 'Stationary'}
          </span>
        </div>

        {/* Heart Rate */}
        <div className="metric-box">
          <span className="metric-label">
            <Heart size={15} className="text-danger" />
            Vitals (HR)
          </span>
          <span className="metric-value font-mono">
            {wearable.vitals?.heartRate
              ? `${wearable.vitals.heartRate} bpm`
              : 'Unavailable'}
          </span>
        </div>
      </div>

      {/* Spatial Location */}
      <div className="wearable-location-block">
        <div className="loc-info">
          <MapPin size={15} />
          <div className="loc-text">
            <span className="loc-zone">
              {wearable.location?.zone || 'Unsurveyed Zone'}
            </span>
            <span className="loc-coords font-mono text-muted">
              {wearable.location
                ? `X: ${wearable.location.x.toFixed(1)}m, Y: ${wearable.location.y.toFixed(1)}m`
                : 'Coordinates unavailable'}
            </span>
          </div>
        </div>

        <Link
          to="/map"
          className="btn-link-map"
          title="Locate Miner on Mine Map"
        >
          <Navigation size={13} />
          View on Map
        </Link>
      </div>

      <div className="wearable-card-footer">
        <span className="timestamp-info">
          <Clock size={12} />
          {isOffline ? 'Last contact: ' : 'Heartbeat: '}
          {formatTime(wearable.lastHeartbeat)}
        </span>
        {wearable.deviceInfo && (
          <span className="device-info-pill text-muted">
            {wearable.deviceInfo}
          </span>
        )}
      </div>
    </div>
  );
}
