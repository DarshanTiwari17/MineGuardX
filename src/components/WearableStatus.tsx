// ============================================================
// WearableStatus — shows count of real connected wearables
//
// Initial state: 0 connected. No sample/mock miners.
// When real wearables connect via the mobile web interface,
// dispatch SET_WEARABLE_STATE from the WebSocket handler.
// ============================================================

import { Link } from 'react-router-dom';
import { Watch, UserCheck, ExternalLink } from 'lucide-react';
import type { WearableState, Wearable } from '../types';
import StatusCard from './shared/StatusCard';
import StatusBadge from './shared/StatusBadge';
import EmptyState from './shared/EmptyState';
import { AlertTriangle } from 'lucide-react';

interface WearableStatusProps {
  wearables: WearableState;
}

function WearableRow({ w }: { w: Wearable }) {
  const statusVariant =
    w.status === 'connected'    ? 'connected'    :
    w.status === 'sos'          ? 'critical'     :
    w.status === 'emergency'    ? 'critical'     :
    w.status === 'low_battery'  ? 'warning'      : 'disconnected';

  return (
    <div
      className="data-row"
      style={{ padding: '10px 0' }}
      role="row"
      aria-label={`Wearable ${w.id}, status: ${w.status}`}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span className={`status-dot ${statusVariant}`} aria-hidden="true" />
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {w.minerName ?? 'Unknown Miner'}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            ID: {w.id} {w.minerId ? `· ${w.minerId}` : ''}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {w.batteryLevel !== null && (
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {w.batteryLevel}%
          </span>
        )}
        <StatusBadge variant={statusVariant} label={w.status === 'sos' ? 'SOS!' : w.status.replace('_', ' ')} />
      </div>
    </div>
  );
}

export default function WearableStatus({ wearables }: WearableStatusProps) {
  const { connectedCount, wearables: list, emergencies = [] } = wearables;
  const activeEmergencies = emergencies.filter(e => e.status === 'ACTIVE');

  return (
    <StatusCard
      title="Connected Wearables"
      icon={<Watch size={13} />}
      badge={
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              background: connectedCount > 0 ? 'var(--color-connected-bg)' : 'var(--color-offline-bg)',
              color: connectedCount > 0 ? 'var(--color-connected)' : 'var(--color-offline)',
              border: `1px solid ${connectedCount > 0 ? 'rgba(34,197,94,0.25)' : 'rgba(107,114,128,0.25)'}`,
              borderRadius: '100px',
              padding: '2px 10px',
              fontSize: '13px',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
            }}
            aria-label={`${connectedCount} connected`}
          >
            {connectedCount}
          </span>
          <StatusBadge
            variant={activeEmergencies.length > 0 ? 'critical' : (connectedCount > 0 ? 'connected' : 'unavailable')}
            label={activeEmergencies.length > 0 ? 'EMERGENCY' : (connectedCount > 0 ? 'Online' : 'None connected')}
            showDot={false}
          />
        </span>
      }
      testId="wearable-status-card"
    >
      {activeEmergencies.length > 0 && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '4px',
          padding: '10px',
          marginBottom: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          {activeEmergencies.map(e => {
             const wearable = list.find(w => w.id === e.wearableId);
             const name = wearable?.minerName ? `${wearable.minerName} (${e.wearableId})` : e.wearableId;
             return (
               <div key={e.eventId} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                 <AlertTriangle size={14} className="text-danger" style={{ marginTop: '2px' }} />
                 <div style={{ flex: 1 }}>
                   <div style={{ color: 'var(--color-critical)', fontSize: '12px', fontWeight: 700 }}>
                     {e.type.replace(/_/g, ' ')}
                   </div>
                   <div style={{ color: 'var(--text-primary)', fontSize: '11px', marginTop: '2px' }}>
                     {name}
                   </div>
                   <div style={{ color: 'var(--text-muted)', fontSize: '10px', marginTop: '1px', fontFamily: 'var(--font-mono)' }}>
                     {e.location ? `Loc: X:${e.location.x} Y:${e.location.y}` : 'Loc: Unknown'} • {new Date(e.timestamp).toLocaleTimeString()}
                   </div>
                 </div>
               </div>
             );
          })}
        </div>
      )}

      {list.length === 0 ? (
        <EmptyState
          icon={<UserCheck size={32} />}
          title="No wearables connected"
          subtitle="Connected Wearables: 0. When a miner's wearable device connects via the mobile interface, it will appear here automatically."
        />
      ) : (
        <div role="table" aria-label="Connected wearable devices">
          {list.map(w => <WearableRow key={w.id} w={w} />)}
        </div>
      )}

      <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
        <Link
          to="/wearables"
          className="btn-link-action"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            color: 'var(--text-primary)',
            textDecoration: 'none',
            fontWeight: 500,
          }}
        >
          <span>Open Wearables Console & Pairing Hub</span>
          <ExternalLink size={12} />
        </Link>
      </div>
    </StatusCard>
  );
}
