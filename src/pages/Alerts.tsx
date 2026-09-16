import { Bell } from 'lucide-react';
import PlaceholderPage from './PlaceholderPage';

export default function Alerts() {
  return (
    <PlaceholderPage
      icon={<Bell size={56} />}
      title="Alert Management"
      description="Active emergency alarms, acknowledge history, alert escalation paths, and dispatch notification logs."
      phase="Active when hazard detection or wearable SOS events trigger"
    />
  );
}
