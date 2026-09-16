// ============================================================
// HazardCenter — Comprehensive Hazard Detection & Management Console
// Feature 7: Real hazard data only. No fake hazards.
// ============================================================

import { useState } from 'react';
import {
  AlertTriangle,
  ShieldCheck,
  Clock,
  MapPin,
  Cpu,
  Filter,
  Activity,
  Wifi,
  WifiOff,
  Thermometer,
  Wind,
  Droplets,
  Flame,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import type { Hazard, HazardSeverity, HazardStatus, HazardType, SensorSourceStatus } from '../types';
import { acknowledgeHazardEvent, resolveHazardEvent } from '../services/hazardBus';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const HAZARD_CATEGORY: Record<HazardType, 'gas' | 'environmental' | 'fire' | 'structural' | 'flooding'> = {
  METHANE: 'gas', CO: 'gas', CO2: 'gas', H2S: 'gas', LOW_OXYGEN: 'gas',
  HIGH_TEMPERATURE: 'environmental', HIGH_HUMIDITY: 'environmental',
  SMOKE: 'fire', DUST: 'environmental', POOR_VISIBILITY: 'environmental',
  FIRE: 'fire', THERMAL_ANOMALY: 'fire',
  STRUCTURAL_OBSTRUCTION: 'structural', TUNNEL_COLLAPSE: 'structural',
  ROCKFALL: 'structural',
  FLOODING: 'flooding',
};

const HAZARD_LABEL: Record<HazardType, string> = {
  METHANE: 'Methane (CH₄)', CO: 'Carbon Monoxide (CO)', CO2: 'Carbon Dioxide (CO₂)',
  H2S: 'Hydrogen Sulfide (H₂S)', LOW_OXYGEN: 'Low Oxygen (O₂)',
  HIGH_TEMPERATURE: 'High Temperature', HIGH_HUMIDITY: 'High Humidity',
  FIRE: 'Fire', SMOKE: 'Smoke', DUST: 'Dust',
  POOR_VISIBILITY: 'Poor Visibility', THERMAL_ANOMALY: 'Thermal Anomaly',
  STRUCTURAL_OBSTRUCTION: 'Structural Obstruction', TUNNEL_COLLAPSE: 'Tunnel Collapse',
  ROCKFALL: 'Rockfall', FLOODING: 'Flooding',
};

function getCategoryIcon(category: string, size = 16) {
  switch (category) {
    case 'gas': return <Wind size={size} />;
    case 'fire': return <Flame size={size} />;
    case 'flooding': return <Droplets size={size} />;
    case 'environmental': return <Thermometer size={size} />;
    default: return <AlertTriangle size={size} />;
  }
}

function getCategoryColor(category: string): string {
  switch (category) {
    case 'gas': return 'var(--color-warning)';
    case 'fire': return 'var(--color-critical)';
    case 'flooding': return '#38bdf8';
    case 'structural': return '#f97316';
    case 'environmental': return '#a855f7';
    default: return 'var(--color-warning)';
  }
}

function getSeverityStyle(severity: HazardSeverity) {
  switch (severity) {
    case 'critical': return { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.35)', text: '#ef4444' };
    case 'high': return { bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.35)', text: '#f97316' };
    case 'warning': return { bg: 'rgba(234,179,8,0.12)', border: 'rgba(234,179,8,0.35)', text: '#eab308' };
    default: return { bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.3)', text: 'var(--text-muted)' };
  }
}

function getStatusStyle(status: HazardStatus) {
  switch (status) {
    case 'ACTIVE': return { text: '#ef4444', label: 'ACTIVE' };
    case 'ACKNOWLEDGED': return { text: '#eab308', label: 'ACKNOWLEDGED' };
    case 'RESOLVED': return { text: '#22c55e', label: 'RESOLVED' };
    default: return { text: 'var(--text-muted)', label: 'UNKNOWN' };
  }
}

function SensorStatusRow({ label, status }: { label: string; status: SensorSourceStatus[keyof SensorSourceStatus] }) {
  const isConnected = status === 'Connected';
  const isError = status === 'Error';
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid var(--border-subtle)' }}>
      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{
        display: 'flex', alignItems: 'center', gap: '5px',
        fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 600,
        color: isConnected ? 'var(--color-connected)' : isError ? 'var(--color-critical)' : 'var(--text-muted)',
      }}>
        {isConnected ? <Wifi size={11} /> : <WifiOff size={11} />}
        {status.toUpperCase()}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// HazardCard
// ---------------------------------------------------------------------------

function HazardCard({ hazard, showActions }: { hazard: Hazard; showActions: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const category = HAZARD_CATEGORY[hazard.type];
  const catColor = getCategoryColor(category);
  const sevStyle = getSeverityStyle(hazard.severity);
  const statusStyle = getStatusStyle(hazard.status);

  return (
    <div style={{
      background: sevStyle.bg,
      border: `1px solid ${sevStyle.border}`,
      borderRadius: '8px',
      padding: '14px 16px',
      marginBottom: '8px',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
          <span style={{ color: catColor, flexShrink: 0 }}>{getCategoryIcon(category, 18)}</span>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {HAZARD_LABEL[hazard.type]}
              </span>
              <span style={{
                fontSize: '10px', fontWeight: 700, fontFamily: 'var(--font-mono)',
                color: sevStyle.text, background: sevStyle.bg,
                border: `1px solid ${sevStyle.border}`, borderRadius: '4px', padding: '1px 6px',
              }}>
                {hazard.severity.toUpperCase()}
              </span>
              <span style={{ fontSize: '10px', fontWeight: 600, color: statusStyle.text, fontFamily: 'var(--font-mono)' }}>
                {statusStyle.label}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {hazard.location ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <MapPin size={10} />
                  Zone {hazard.location.zone} · X:{hazard.location.x} Y:{hazard.location.y}
                </span>
              ) : <span>Location unavailable</span>}
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Clock size={10} />
                {new Date(hazard.detectedAt).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
          {showActions && hazard.status === 'ACTIVE' && (
            <button
              className="btn btn-outline"
              style={{ fontSize: '11px', padding: '4px 10px', color: '#eab308', borderColor: 'rgba(234,179,8,0.4)' }}
              onClick={() => acknowledgeHazardEvent(hazard.id)}
            >
              Acknowledge
            </button>
          )}
          {showActions && hazard.status !== 'RESOLVED' && (
            <button
              className="btn btn-outline"
              style={{ fontSize: '11px', padding: '4px 10px', color: '#22c55e', borderColor: 'rgba(34,197,94,0.4)' }}
              onClick={() => resolveHazardEvent(hazard.id)}
            >
              Resolve
            </button>
          )}
          <button
            className="btn btn-ghost"
            style={{ padding: '4px', color: 'var(--text-muted)' }}
            onClick={() => setExpanded(v => !v)}
            title={expanded ? 'Collapse' : 'Expand details'}
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div style={{
          marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '8px',
        }}>
          {hazard.description && (
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Description</div>
              <div style={{ fontSize: '12px', color: 'var(--text-primary)', marginTop: '2px' }}>{hazard.description}</div>
            </div>
          )}
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Source</div>
            <div style={{ fontSize: '12px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>{hazard.source.replace(/_/g, ' ')}</div>
          </div>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Hazard ID</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>{hazard.id}</div>
          </div>
          {hazard.sensorId && (
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sensor ID</div>
              <div style={{ fontSize: '12px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>{hazard.sensorId}</div>
            </div>
          )}
          {hazard.confidence !== undefined && (
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Confidence</div>
              <div style={{ fontSize: '12px', color: 'var(--text-primary)', marginTop: '2px' }}>{Math.round(hazard.confidence * 100)}%</div>
            </div>
          )}
          {hazard.value !== undefined && (
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Value</div>
              <div style={{ fontSize: '12px', color: 'var(--text-primary)', marginTop: '2px' }}>{hazard.value}{hazard.unit ? ` ${hazard.unit}` : ''}</div>
            </div>
          )}
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Last Updated</div>
            <div style={{ fontSize: '12px', color: 'var(--text-primary)', marginTop: '2px' }}>{new Date(hazard.updatedAt).toLocaleTimeString()}</div>
          </div>
          {hazard.acknowledgedAt && (
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Acknowledged At</div>
              <div style={{ fontSize: '12px', color: 'var(--text-primary)', marginTop: '2px' }}>{new Date(hazard.acknowledgedAt).toLocaleTimeString()}</div>
            </div>
          )}
          {hazard.resolvedAt && (
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Resolved At</div>
              <div style={{ fontSize: '12px', color: '#22c55e', marginTop: '2px' }}>{new Date(hazard.resolvedAt).toLocaleTimeString()}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

type FilterStatus = 'all' | 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
type FilterSeverity = 'all' | HazardSeverity;

export default function HazardCenter() {
  const { state } = useAppContext();
  const { activeHazards, historicalHazards, sensorStatus } = state.hazards;

  const [tab, setTab] = useState<'active' | 'history'>('active');
  const [filterSeverity, setFilterSeverity] = useState<FilterSeverity>('all');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  const criticalCount = activeHazards.filter(h => h.severity === 'critical').length;
  const acknowledgedCount = activeHazards.filter(h => h.status === 'ACKNOWLEDGED').length;

  const filteredActive = activeHazards.filter(h => {
    if (filterSeverity !== 'all' && h.severity !== filterSeverity) return false;
    if (filterStatus !== 'all' && h.status !== filterStatus) return false;
    return true;
  });

  const filteredHistory = historicalHazards.filter(h => {
    if (filterSeverity !== 'all' && h.severity !== filterSeverity) return false;
    return true;
  });

  return (
    <div className="page-container fade-in" style={{ maxWidth: '1100px' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div className="page-header-left">
          <div className="page-title-row">
            <AlertTriangle className="page-icon" style={{ color: '#f97316' }} size={28} />
            <div>
              <h1 className="page-title">Hazard Center</h1>
              <p className="page-subtitle">Underground Mine Hazard Detection, Tracking & Response</p>
            </div>
          </div>
        </div>

        {/* Summary chips */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <div className="metric-chip">
            <span className="metric-chip-label">Active Hazards</span>
            <span className={`metric-chip-value font-mono ${activeHazards.length > 0 ? 'text-danger' : 'text-muted'}`}>
              {activeHazards.length}
            </span>
          </div>
          <div className="metric-chip">
            <span className="metric-chip-label">Critical</span>
            <span className={`metric-chip-value font-mono ${criticalCount > 0 ? 'text-danger' : 'text-muted'}`}>
              {criticalCount}
            </span>
          </div>
          <div className="metric-chip">
            <span className="metric-chip-label">Acknowledged</span>
            <span className="metric-chip-value font-mono text-warning">{acknowledgedCount}</span>
          </div>
          <div className="metric-chip">
            <span className="metric-chip-label">Historical</span>
            <span className="metric-chip-value font-mono">{historicalHazards.length}</span>
          </div>
        </div>
      </div>

      {/* Critical banner */}
      {criticalCount > 0 && (
        <div style={{
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.35)',
          borderRadius: '8px', padding: '12px 16px', marginBottom: '20px',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <AlertTriangle size={18} style={{ color: '#ef4444' }} className="pulse-anim" />
          <span style={{ color: '#ef4444', fontWeight: 700, fontSize: '13px' }}>
            {criticalCount} CRITICAL HAZARD{criticalCount > 1 ? 'S' : ''} ACTIVE — Immediate action required
          </span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: '20px', alignItems: 'start' }}>
        {/* Main panel */}
        <div>
          {/* Tab bar + Filters */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                className={`btn ${tab === 'active' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: '13px', padding: '6px 16px' }}
                onClick={() => setTab('active')}
              >
                <Activity size={13} /> Active ({activeHazards.length})
              </button>
              <button
                className={`btn ${tab === 'history' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: '13px', padding: '6px 16px' }}
                onClick={() => setTab('history')}
              >
                <Clock size={13} /> History ({historicalHazards.length})
              </button>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Filter size={13} style={{ color: 'var(--text-muted)' }} />
              <select
                value={filterSeverity}
                onChange={e => setFilterSeverity(e.target.value as FilterSeverity)}
                style={{
                  background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                  borderRadius: '6px', padding: '4px 8px', fontSize: '12px',
                  color: 'var(--text-primary)', cursor: 'pointer',
                }}
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
              </select>
              {tab === 'active' && (
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value as FilterStatus)}
                  style={{
                    background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                    borderRadius: '6px', padding: '4px 8px', fontSize: '12px',
                    color: 'var(--text-primary)', cursor: 'pointer',
                  }}
                >
                  <option value="all">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="ACKNOWLEDGED">Acknowledged</option>
                </select>
              )}
            </div>
          </div>

          {/* Hazard list */}
          {tab === 'active' ? (
            filteredActive.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '48px 24px',
                border: '1px dashed var(--border)', borderRadius: '10px',
              }}>
                <ShieldCheck size={40} style={{ color: 'var(--color-connected)', margin: '0 auto 12px' }} />
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  No Active Hazards
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  The system will display real-time hazard events detected by gas sensors, cameras, AI models, or the rover.
                </div>
              </div>
            ) : (
              <div>
                {filteredActive.map(h => <HazardCard key={h.id} hazard={h} showActions />)}
              </div>
            )
          ) : (
            filteredHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 24px', border: '1px dashed var(--border)', borderRadius: '10px' }}>
                <Clock size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
                <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>No hazard history yet</div>
              </div>
            ) : (
              <div>
                {filteredHistory.map(h => <HazardCard key={h.id} hazard={h} showActions={false} />)}
              </div>
            )
          )}
        </div>

        {/* Sidebar: Sensor Status + Mine Map Link */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Sensor Source Status */}
          <div className="card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Cpu size={14} style={{ color: 'var(--accent-cyan)' }} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Detection Sources</span>
            </div>
            <SensorStatusRow label="Gas Sensors" status={sensorStatus.gasSensors} />
            <SensorStatusRow label="Environment Sensors" status={sensorStatus.environmentSensors} />
            <SensorStatusRow label="RGB Camera" status={sensorStatus.rgbCamera} />
            <SensorStatusRow label="Night Camera" status={sensorStatus.nightCamera} />
            <SensorStatusRow label="Thermal Camera" status={sensorStatus.thermalCamera} />
            <SensorStatusRow label="AI Detection" status={sensorStatus.aiDetection} />
            <SensorStatusRow label="Rover" status={sensorStatus.rover} />
          </div>

          {/* Quick links */}
          <div className="card" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
              Quick Navigation
            </div>
            <Link to="/hazard-center" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-cyan)', textDecoration: 'none', fontSize: '12px', marginBottom: '6px' }}>
              <MapPin size={12} /> View Hazard Markers on Mine Map <ExternalLink size={11} />
            </Link>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '12px' }}>
              <Activity size={12} /> Command Center Overview <ExternalLink size={11} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
