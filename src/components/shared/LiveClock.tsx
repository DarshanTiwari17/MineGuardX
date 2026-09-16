// ============================================================
// LiveClock — real-time clock, updates every second
// ============================================================

import { useState, useEffect } from 'react';

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Asia/Kolkata',
  });
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    timeZone: 'Asia/Kolkata',
  });
}

interface LiveClockProps {
  showDate?: boolean;
}

export default function LiveClock({ showDate = false }: LiveClockProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span>
      {showDate && (
        <span style={{ marginRight: '8px', color: 'var(--text-muted)', fontSize: '11px' }}>
          {formatDate(now)}
        </span>
      )}
      {formatTime(now)}
    </span>
  );
}
