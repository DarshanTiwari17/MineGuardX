// ============================================================
// StatusBadge — reusable status pill component
// ============================================================

interface StatusBadgeProps {
  variant: 'connected' | 'disconnected' | 'warning' | 'critical' | 'unavailable' | 'info';
  label: string;
  showDot?: boolean;
}

export default function StatusBadge({ variant, label, showDot = true }: StatusBadgeProps) {
  return (
    <span className={`badge ${variant}`} role="status" aria-label={label}>
      {showDot && (
        <span
          className={`status-dot ${variant}`}
          aria-hidden="true"
        />
      )}
      {label}
    </span>
  );
}
