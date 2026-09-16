import { Settings as SettingsIcon } from 'lucide-react';
import PlaceholderPage from './PlaceholderPage';

export default function Settings() {
  return (
    <PlaceholderPage
      icon={<SettingsIcon size={56} />}
      title="System Settings"
      description="Sensor threshold configuration, communication frequencies, rover telemetry calibration, and API server connection URLs."
      phase="Configurable in next update"
    />
  );
}
