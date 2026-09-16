import { ScrollText } from 'lucide-react';
import PlaceholderPage from './PlaceholderPage';

export default function MissionLogs() {
  return (
    <PlaceholderPage
      icon={<ScrollText size={56} />}
      title="Mission Logs"
      description="Immutable chronological logs of all rover telemetry, AI detections, operator actions, and communication events."
      phase="Requires backend mission persistence store"
    />
  );
}
