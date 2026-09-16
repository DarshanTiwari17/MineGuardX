// ============================================================
// CommunicationStatus — network and link status card
// ============================================================

import { Radio } from 'lucide-react';
import type { CommunicationState, LinkStatus } from '../types';
import StatusCard from './shared/StatusCard';
import StatusBadge from './shared/StatusBadge';

interface CommunicationStatusProps {
  communication: CommunicationState;
}

const NA = <span className="data-value unavailable">—</span>;

function DataRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="data-row">
      <span className="data-label">{label}</span>
      {value}
    </div>
  );
}

function linkVariant(s: LinkStatus): 'connected' | 'disconnected' | 'warning' | 'unavailable' {
  return s === 'online'      ? 'connected'     :
         s === 'degraded'    ? 'warning'        :
         s === 'offline'     ? 'disconnected'   : 'unavailable';
}

function linkLabel(s: LinkStatus): string {
  return s === 'online' ? 'Online' : s === 'degraded' ? 'Degraded' : s === 'offline' ? 'Offline' : 'Unavailable';
}

export default function CommunicationStatus({ communication }: CommunicationStatusProps) {
  const overallVariant = linkVariant(communication.networkStatus);

  return (
    <StatusCard
      title="Communication"
      icon={<Radio size={13} />}
      badge={
        <StatusBadge
          variant={overallVariant}
          label={`Network: ${linkLabel(communication.networkStatus)}`}
        />
      }
      testId="communication-status-card"
    >
      <DataRow
        label="Rover Link"
        value={<StatusBadge variant={linkVariant(communication.roverLink)} label={linkLabel(communication.roverLink)} showDot={false} />}
      />
      <DataRow
        label="Rescue Nodes"
        value={
          communication.rescueNodes.length > 0
            ? <span className="data-value">{communication.rescueNodes.length} node(s)</span>
            : <StatusBadge variant="unavailable" label="No nodes" showDot={false} />
        }
      />
      <DataRow
        label="Signal Strength"
        value={communication.signalStrength !== null
          ? <span className="data-value">{communication.signalStrength}%</span>
          : NA}
      />
      <DataRow
        label="Latency"
        value={communication.latencyMs !== null
          ? <span className="data-value">{communication.latencyMs} ms</span>
          : NA}
      />
      <DataRow
        label="Protocol"
        value={communication.protocol
          ? <span className="data-value">{communication.protocol}</span>
          : NA}
      />
      <DataRow
        label="Frequency Band"
        value={communication.frequencyBand
          ? <span className="data-value">{communication.frequencyBand}</span>
          : NA}
      />
    </StatusCard>
  );
}
