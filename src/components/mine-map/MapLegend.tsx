// ============================================================
// MapLegend — Symbol and status color reference
// Uses standard emergency and industrial color conventions
// ============================================================

export default function MapLegend() {
  const ITEMS = [
    {
      label: 'Rover',
      color: 'var(--color-info)',
      symbol: '◆',
      desc: 'Position & heading',
    },
    {
      label: 'Connected Miner',
      color: 'var(--color-connected)',
      symbol: '●',
      desc: 'Active wearable telemetry',
    },
    {
      label: 'Miner Emergency',
      color: 'var(--color-critical)',
      symbol: '●',
      pulse: true,
      desc: 'SOS alarm triggered',
    },
    {
      label: 'Offline / Stale Miner',
      color: 'var(--color-offline)',
      symbol: '○',
      desc: 'Last known location',
    },
    {
      label: 'Hazard Zone',
      color: 'var(--color-warning)',
      symbol: '▲',
      desc: 'Gas or environmental risk',
    },
    {
      label: 'Blocked Area',
      color: 'var(--color-critical)',
      symbol: '■',
      hatch: true,
      desc: 'Impassable tunnel obstruction',
    },
    {
      label: 'Comms Node',
      color: '#a855f7',
      symbol: '◎',
      desc: 'Mesh radio relay station',
    },
    {
      label: 'Rescue Route',
      color: 'var(--color-connected)',
      symbol: '┄┄',
      desc: 'Active escape vector',
    },
    {
      label: 'Explored',
      color: 'rgba(59, 130, 246, 0.25)',
      symbol: '░',
      desc: 'Surveyed by rover SLAM',
    },
    {
      label: 'Unexplored',
      color: 'rgba(255, 255, 255, 0.08)',
      symbol: '▓',
      desc: 'Unmapped mine sector',
    },
  ];

  return (
    <div className="map-legend-box" aria-label="Map legend">
      <div className="map-legend-header">Map Legend</div>
      <div className="map-legend-grid">
        {ITEMS.map((item) => (
          <div key={item.label} className="legend-item">
            <span
              className={`legend-symbol ${item.pulse ? 'pulse-anim' : ''}`}
              style={{ color: item.color }}
              aria-hidden="true"
            >
              {item.symbol}
            </span>
            <div className="legend-text">
              <span className="legend-label">{item.label}</span>
              <span className="legend-desc">{item.desc}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
