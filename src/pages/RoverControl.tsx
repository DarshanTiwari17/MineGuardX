import { Bot } from 'lucide-react';
import PlaceholderPage from './PlaceholderPage';
export default function RoverControl() {
  return <PlaceholderPage icon={<Bot size={56} />} title="Rover Control" description="Manual rover control interface with directional controls, camera gimbal, speed settings, and autonomous mode toggle. Requires an active rover connection to enable controls." phase="Requires rover backend connection" />;
}
