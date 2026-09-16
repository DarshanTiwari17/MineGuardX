import { FileText } from 'lucide-react';
import PlaceholderPage from './PlaceholderPage';

export default function Reports() {
  return (
    <PlaceholderPage
      icon={<FileText size={56} />}
      title="Incident & Mission Reports"
      description="Automated post-incident compliance reports, shift summaries, safety audits, and exportable PDF/CSV archives."
      phase="Requires report generation backend"
    />
  );
}
