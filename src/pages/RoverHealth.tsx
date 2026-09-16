import { Activity } from 'lucide-react';
import PlaceholderPage from './PlaceholderPage';

export default function RoverHealth() {
  return (
    <PlaceholderPage
      icon={<Activity size={56} />}
      title="Rover System Health"
      description="Hardware diagnostics, motor currents, battery cell voltages, internal temperatures, and compute node status."
      phase="Requires rover CAN-bus telemetry link"
    />
  );
}
