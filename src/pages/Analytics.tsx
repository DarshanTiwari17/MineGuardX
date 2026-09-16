import { BarChart2 } from 'lucide-react';
import PlaceholderPage from './PlaceholderPage';

export default function Analytics() {
  return (
    <PlaceholderPage
      icon={<BarChart2 size={56} />}
      title="Safety Analytics"
      description="Historical environmental trends, gas level averages, wearable telemetry aggregations, and mission duration metrics."
      phase="Requires historical data warehouse connection"
    />
  );
}
