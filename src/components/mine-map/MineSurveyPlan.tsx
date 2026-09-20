/** Realistic, uncolored underground survey. Drawn only for the demo map overlay. */
export default function MineSurveyPlan() {
  return (
    <g className="mine-survey-plan" pointerEvents="none">
      <defs>
        {/* Subtle noise for rock texture */}
        <filter id="rock-texture">
          <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="3" result="noise" />
          <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.05 0" />
        </filter>
        {/* Drop shadow for walls to give depth */}
        <filter id="wall-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#000" floodOpacity="0.4" />
        </filter>
        {/* Timber pattern */}
        <pattern id="timber-hatch" width="8" height="8" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="8" stroke="#333" strokeWidth="1" />
          <line x1="0" y1="0" x2="8" y2="0" stroke="#333" strokeWidth="1" />
        </pattern>
      </defs>

      {/* Base Country Rock (White/Very Light Gray) */}
      <rect x="-350" y="-250" width="800" height="600" fill="#fcfcfc" />
      <rect x="-350" y="-250" width="800" height="600" filter="url(#rock-texture)" pointerEvents="none" />

      {/* --- TUNNEL FLOORS (Light Gray) --- */}
      <g filter="url(#wall-shadow)">
        {/* Central cavern / stope */}
        <path
          d="M-80,-20 Q-120,-60 -150,-10 T-160,80 Q-120,160 -40,140 T40,60 Q80,-10 -80,-20 Z"
          fill="#dcdcdc"
          stroke="#111"
          strokeWidth="3"
        />
        
        {/* Main Haulage (West-East) */}
        <path
          d="M-300,-110 L-80,-110 L-20,-70 L150,-70 L280,-130 L280,-80 L150,-20 L-20,-20 L-80,-60 L-300,-60 Z"
          fill="#e0e0e0"
          stroke="#111"
          strokeWidth="2.5"
        />

        {/* South Winze */}
        <path
          d="M-10,100 L40,100 L40,240 L-10,240 Z"
          fill="#dcdcdc"
          stroke="#111"
          strokeWidth="2.5"
        />

        {/* East Raise to Room */}
        <path
          d="M120,-40 L180,-40 L180,100 L120,100 Z"
          fill="#dcdcdc"
          stroke="#111"
          strokeWidth="2.5"
        />
        {/* Room at bottom of East Raise */}
        <path
          d="M100,100 L240,100 L240,220 L100,220 Z"
          fill="#d4d4d4"
          stroke="#111"
          strokeWidth="3"
        />
      </g>

      {/* --- ADDING DETAILS --- */}
      {/* Rocks and Debris in cavern */}
      <path d="M-100,30 Q-90,20 -80,40 T-110,60 Z" fill="#b0b0b0" stroke="#333" strokeWidth="1" />
      <path d="M-130,80 Q-110,70 -120,100 T-150,90 Z" fill="#a0a0a0" stroke="#333" strokeWidth="1" />
      <path d="M-50,110 Q-30,100 -40,130 T-70,120 Z" fill="#b8b8b8" stroke="#333" strokeWidth="1" />
      <path d="M-110,-10 Q-90,-20 -80,0 T-110,20 Z" fill="#a8a8a8" stroke="#333" strokeWidth="1" />

      {/* Debris near East room entrance */}
      <circle cx="150" cy="95" r="4" fill="#a0a0a0" stroke="#222" />
      <circle cx="160" cy="105" r="5" fill="#a0a0a0" stroke="#222" />
      <circle cx="140" cy="102" r="3" fill="#a0a0a0" stroke="#222" />
      <circle cx="155" cy="90" r="3.5" fill="#a0a0a0" stroke="#222" />

      {/* Room interior grid (like floor tiles or structured cuts) */}
      <g stroke="#999" strokeWidth="1" opacity="0.6">
        <line x1="120" y1="120" x2="220" y2="120" />
        <line x1="120" y1="140" x2="220" y2="140" />
        <line x1="120" y1="160" x2="220" y2="160" />
        <line x1="120" y1="180" x2="220" y2="180" />
        <line x1="120" y1="200" x2="220" y2="200" />
        
        <line x1="120" y1="100" x2="120" y2="220" />
        <line x1="140" y1="100" x2="140" y2="220" />
        <line x1="160" y1="100" x2="160" y2="220" />
        <line x1="180" y1="100" x2="180" y2="220" />
        <line x1="200" y1="100" x2="200" y2="220" />
        <line x1="220" y1="100" x2="220" y2="220" />
      </g>
      <rect x="150" y="140" width="40" height="40" fill="#c0c0c0" stroke="#222" strokeWidth="2" />
      <rect x="160" y="150" width="20" height="20" fill="#a0a0a0" stroke="#222" strokeWidth="1.5" />

      {/* --- TIMBER / PLANKS --- */}
      {/* South Winze timbering */}
      {[110, 140, 170, 200, 230].map((y) => (
        <g key={`s-timber-${y}`}>
          <rect x="-14" y={y} width="58" height="6" fill="#888" stroke="#111" strokeWidth="1.5" />
          <rect x="-14" y={y - 10} width="6" height="26" fill="#777" stroke="#111" strokeWidth="1.5" />
          <rect x="38" y={y - 10} width="6" height="26" fill="#777" stroke="#111" strokeWidth="1.5" />
        </g>
      ))}

      {/* East Raise timbering (ladderway style) */}
      {[-30, 0, 30, 60, 90].map((y) => (
        <g key={`e-timber-${y}`}>
          <rect x="124" y={y} width="52" height="5" fill="#888" stroke="#111" strokeWidth="1" />
          <line x1="130" y1={y} x2="130" y2={y + 30} stroke="#444" strokeWidth="2" />
          <line x1="170" y1={y} x2="170" y2={y + 30} stroke="#444" strokeWidth="2" />
        </g>
      ))}

      {/* --- RAILWAY TRACKS --- */}
      {/* Main Haulage tracks */}
      <RailTrack x1={-300} y1={-85} x2={-60} y2={-85} />
      <RailTrack x1={-60} y1={-85} x2={0} y2={-45} />
      <RailTrack x1={0} y1={-45} x2={140} y2={-45} />
      <RailTrack x1={140} y1={-45} x2={270} y2={-105} />

      {/* Station platform at top left */}
      <rect x="-280" y="-108" width="80" height="20" fill="#999" stroke="#111" strokeWidth="1.5" />
      <rect x="-275" y="-104" width="70" height="12" fill="url(#timber-hatch)" />

      {/* Machinery / shaft cage in the cavern */}
      <g transform="translate(-100, 50)">
        <rect x="-20" y="-20" width="40" height="40" fill="#bbb" stroke="#111" strokeWidth="2" />
        <circle cx="0" cy="0" r="10" fill="#999" stroke="#111" strokeWidth="2" />
        <line x1="-20" y1="-20" x2="20" y2="20" stroke="#111" strokeWidth="1.5" />
        <line x1="-20" y1="20" x2="20" y2="-20" stroke="#111" strokeWidth="1.5" />
        <text x="0" y="32" textAnchor="middle" fill="#111" fontSize="10" fontWeight="bold">SHAFT 2</text>
      </g>

      {/* Room labels */}
      <text x="-200" y="-120" fill="#333" fontSize="11" fontWeight="bold" letterSpacing="1">
        MAIN HAULAGE
      </text>
      <text x="170" y="210" textAnchor="middle" fill="#333" fontSize="10" fontWeight="bold" letterSpacing="1">
        PUMP ROOM
      </text>
    </g>
  );
}

function RailTrack({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const px = -uy;
  const py = ux;
  
  const hw = 6; // Half width of track
  const sleeperSpacing = 10;
  
  const r1a = { x: x1 + px * hw, y: y1 + py * hw };
  const r1b = { x: x2 + px * hw, y: y2 + py * hw };
  const r2a = { x: x1 - px * hw, y: y1 - py * hw };
  const r2b = { x: x2 - px * hw, y: y2 - py * hw };

  const sleepers = [];
  for (let d = 4; d < len; d += sleeperSpacing) {
    const cx = x1 + ux * d;
    const cy = y1 + uy * d;
    const sx = px * (hw + 3);
    const sy = py * (hw + 3);
    sleepers.push(
      <line
        key={d}
        x1={cx - sx}
        y1={cy - sy}
        x2={cx + sx}
        y2={cy + sy}
        stroke="#555"
        strokeWidth="2"
      />
    );
  }

  return (
    <g>
      {sleepers}
      {/* Rails */}
      <line x1={r1a.x} y1={r1a.y} x2={r1b.x} y2={r1b.y} stroke="#111" strokeWidth="1.5" />
      <line x1={r2a.x} y1={r2a.y} x2={r2b.x} y2={r2b.y} stroke="#111" strokeWidth="1.5" />
    </g>
  );
}

