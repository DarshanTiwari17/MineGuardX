import { Brain } from 'lucide-react';
import PlaceholderPage from './PlaceholderPage';
export default function AIDetection() {
  return <PlaceholderPage icon={<Brain size={56} />} title="AI Detection" description="AI-powered hazard detection panel. Displays real-time person detection, fall detection, hazard classification, and confidence scores from the rover's computer vision system. No AI model connected." phase="Requires AI model & rover camera integration" />;
}
