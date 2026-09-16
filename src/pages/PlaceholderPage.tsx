// ============================================================
// Placeholder page component — used for all pages not yet built
// ============================================================

import type { ReactNode } from 'react';

interface PlaceholderPageProps {
  icon: ReactNode;
  title: string;
  description: string;
  phase?: string;
}

export default function PlaceholderPage({ icon, title, description, phase }: PlaceholderPageProps) {
  return (
    <div className="placeholder-page" role="main" aria-label={`${title} — coming soon`}>
      <div className="placeholder-page-icon" aria-hidden="true">
        {icon}
      </div>
      <h1 className="placeholder-page-title">{title}</h1>
      <p className="placeholder-page-sub">{description}</p>
      {phase && (
        <span className="placeholder-page-badge">
          {phase}
        </span>
      )}
    </div>
  );
}
