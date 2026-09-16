// ============================================================
// StatusCard — generic card wrapper with title and optional badge
// ============================================================

import type { ReactNode } from 'react';

interface StatusCardProps {
  title: string;
  icon?: ReactNode;
  badge?: ReactNode;
  children: ReactNode;
  className?: string;
  /** data-testid for automated testing */
  testId?: string;
}

export default function StatusCard({
  title,
  icon,
  badge,
  children,
  className = '',
  testId,
}: StatusCardProps) {
  return (
    <div className={`card ${className}`} data-testid={testId}>
      <div className="card-header">
        <span className="card-title">
          {icon && <span aria-hidden="true">{icon}</span>}
          {title}
        </span>
        {badge && <span>{badge}</span>}
      </div>
      {children}
    </div>
  );
}
