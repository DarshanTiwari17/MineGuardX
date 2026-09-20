// ============================================================
// HazardPanel — Command Center compact hazard widget
// Shows real active hazards; empty = no hazards detected.
// Feature 7 integration.
// ============================================================

import { Link } from 'react-router-dom';
import { AlertTriangle, ShieldCheck, ExternalLink, Flame, Wind, Droplets, Thermometer } from 'lucide-react';
import type { HazardState, Hazard, HazardSeverity, HazardType } from '../types';
import StatusCard from './shared/StatusCard';
import StatusBadge from './shared/StatusBadge';
import EmptyState from './shared/EmptyState';

interface HazardPanelProps {
  hazards: HazardState;
}

const HAZARD_LABEL: Record<HazardType, string> = {
  METHANE: 'Methane (CH₄)', CO: 'Carbon Monoxide', CO2: 'Carbon Dioxide',
  H2S: 'Hydrogen Sulfide', LOW_OXYGEN: 'Low Oxygen',
  HIGH_TEMPERATURE: 'High Temperature', HIGH_HUMIDITY: 'High Humidity',
  FIRE: 'Fire', SMOKE: 'Smoke', DUST: 'Dust',
  POOR_VISIBILITY: 'Poor Visibility', THERMAL_ANOMALY: 'Thermal Anomaly',
  STRUCTURAL_OBSTRUCTION: 'Structural Obstruction', TUNNEL_COLLAPSE: 'Tunnel Collapse',
  ROCKFALL: 'Rockfall', FLOODING: 'Flooding',
};

function hazardCategoryIcon(type: HazardType) {
  if (['METHANE', 'CO', 'CO2', 'H2S', 'LOW_OXYGEN'].includes(type)) return <Wind size={12} />;
  if (['FIRE', 'SMOKE', 'THERMAL_ANOMALY'].includes(type)) return <Flame size={12} />;
  if (type === 'FLOODING') return <Droplets size={12} />;
  if (['HIGH_TEMPERATURE', 'HIGH_HUMIDITY'].includes(type)) return <Thermometer size={12} />;
  return <AlertTriangle size={12} />;
}

function severityVariant(s: HazardSeverity): 'connected' | 'warning' | 'critical' | 'disconnected' {
  return s === 'critical' ? 'critical' : s === 'high' ? 'critical' : s === 'warning' ? 'warning' : 'disconnected';
}

function HazardRow({ hazard }: { hazard: Hazard }) {
  const variant = severityVariant(hazard.severity);
  const since = new Date(hazard.detectedAt).toLocaleTimeString();

  return (
    <div
      className="data-row"
      style={{
        padding: '9px 10px',
        borderRadius: '6px',
        background: hazard.severity === 'critical'
          ? 'rgba(239,68,68,0.07)'
          : hazard.severity === 'high'
          ? 'rgba(249,115,22,0.06)'
          : 'var(--bg-secondary)',
        borderColor: hazard.severity === 'critical' ? 'rgba(239,68,68,0.25)' : hazard.severity === 'high' ? 'rgba(249,115,22,0.2)' : 'var(--border-subtle)',
        borderStyle: 'solid',
        borderWidth: '1px',
        marginBottom: '4px',
        alignItems: 'flex-start',
        gap: '8px',
      }}
      role="alert"
      aria-label={`${hazard.severity} hazard: ${HAZARD_LABEL[hazard.type]}`}
    >
      <span style={{ color: hazard.severity === 'critical' ? 'var(--color-critical)' : hazard.severity === 'high' ? '#f97316' : 'var(--color-warning)', marginTop: '2px' }}>
        {hazardCategoryIcon(hazard.type)}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {HAZARD_LABEL[hazard.type]}
        </div>
        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
          {hazard.location ? `Zone ${hazard.location.zone}` : 'Location unknown'} · {since}
          {hazard.status === 'ACKNOWLEDGED' && ' · ACK\'D'}
        </div>
      </div>
      <StatusBadge variant={variant} label={hazard.severity} />
    </div>
  );
}

export default function HazardPanel({ hazards }: HazardPanelProps) {
  const { activeHazards } = hazards;
  const hasCritical = activeHazards.some(h => h.severity === 'critical' || h.severity === 'high');
  // Show at most 4 in Command Center compact view
  const displayed = activeHazards.slice(0, 4);

  return (
    <StatusCard
      title="Active Hazards"
      icon={<AlertTriangle size={13} />}
      badge={
        activeHazards.length > 0 ? (
          <StatusBadge
            variant={hasCritical ? 'critical' : 'warning'}
            label={`${activeHazards.length} active`}
          />
        ) : (
          <StatusBadge variant="connected" label="All clear" />
        )
      }
      testId="hazard-panel-card"
    >
      {activeHazards.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck size={32} />}
          title="No active hazards"
          subtitle="Real-time hazard events from gas sensors, AI vision, or the rover will appear here automatically."
        />
      ) : (
        <div role="list" aria-label="Active hazards" aria-live="polite">
          {displayed.map(h => <HazardRow key={h.id} hazard={h} />)}
          {activeHazards.length > 4 && (
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', padding: '4px 0' }}>
              +{activeHazards.length - 4} more hazard{activeHazards.length - 4 > 1 ? 's' : ''} — see Hazard Center
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
        <Link
          to="/hazard-center"
          className="btn-link-action"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            fontSize: '12px', color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500,
          }}
        >
          <span>Open Hazard Center</span>
          <ExternalLink size={12} />
        </Link>
      </div>
    </StatusCard>
  );
}
