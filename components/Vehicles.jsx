// Stylised side-view vehicles facing LEFT (they drive right -> left).

function Wheel({ cx, cy, r }) {
  return (
    <g className="wheel">
      <circle cx={cx} cy={cy} r={r} fill="#07090b" stroke="#cbd5e1" strokeOpacity="0.85" strokeWidth="4" />
      <circle cx={cx} cy={cy} r={r - 6} fill="none" stroke="#334155" strokeWidth="1.5" />
      {[0, 60, 120].map((a) => (
        <line
          key={a}
          x1={cx - (r - 6) * Math.cos((a * Math.PI) / 180)}
          y1={cy - (r - 6) * Math.sin((a * Math.PI) / 180)}
          x2={cx + (r - 6) * Math.cos((a * Math.PI) / 180)}
          y2={cy + (r - 6) * Math.sin((a * Math.PI) / 180)}
          stroke="#475569"
          strokeWidth="1.5"
        />
      ))}
      <circle cx={cx} cy={cy} r="3.5" fill="#fbbf24" />
    </g>
  );
}

export function Bike({ className = "", width = 190 }) {
  return (
    <svg viewBox="-70 -6 240 110" width={width} className={className} aria-label="Motorcycle with rider">
      <defs>
        <linearGradient id="bikeBeam" x1="1" x2="0" y1="0" y2="0">
          <stop offset="0" stopColor="#fcd34d" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fcd34d" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="tank" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#fde68a" />
          <stop offset="1" stopColor="#d97706" />
        </linearGradient>
        <filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      {/* headlight beam */}
      <path d="M50 44 L-68 26 L-68 70 L50 54 Z" fill="url(#bikeBeam)" />
      {/* ground shadow */}
      <ellipse cx="92" cy="97" rx="70" ry="5" fill="#fbbf24" opacity="0.18" filter="url(#soft)" />
      <g className="bob">
        {/* exhaust */}
        <path d="M112 68 L158 62" stroke="#64748b" strokeWidth="5" strokeLinecap="round" />
        {/* frame + fork */}
        <path d="M42 80 L60 38" stroke="#94a3b8" strokeWidth="5" strokeLinecap="round" />
        <path d="M140 80 L118 56 L86 60" stroke="#64748b" strokeWidth="5" fill="none" strokeLinecap="round" />
        {/* engine */}
        <rect x="80" y="56" width="32" height="16" rx="4" fill="#1e293b" stroke="#475569" />
        {/* tank */}
        <path d="M66 52 Q82 36 108 40 L118 52 L76 58 Z" fill="url(#tank)" />
        {/* seat */}
        <path d="M108 44 L142 46 Q148 49 145 53 L116 53 Z" fill="#111827" stroke="#334155" />
        {/* tail light */}
        <rect x="144" y="47" width="6" height="4" rx="1.5" fill="#f43f5e" />
        {/* handlebar + headlight */}
        <path d="M56 36 L70 33" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
        <ellipse cx="53" cy="48" rx="5" ry="4.5" fill="#fef3c7" />
        <circle cx="53" cy="48" r="9" fill="#fbbf24" opacity="0.35" filter="url(#soft)" />
        {/* rider */}
        <path d="M118 46 L100 18" stroke="#94a3b8" strokeWidth="9" strokeLinecap="round" />
        <path d="M104 22 L70 34" stroke="#94a3b8" strokeWidth="6" strokeLinecap="round" />
        <path d="M116 46 L96 58 L102 72" stroke="#64748b" strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="96" cy="9" r="10" fill="#0f172a" stroke="#cbd5e1" strokeWidth="2" />
        <path d="M86.5 6 Q87 14 94 15" stroke="#fbbf24" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      </g>
      <Wheel cx={42} cy={80} r={18} />
      <Wheel cx={140} cy={80} r={18} />
    </svg>
  );
}

export function Car({ className = "", width = 270 }) {
  return (
    <svg viewBox="-90 0 360 100" width={width} className={className} aria-label="Car">
      <defs>
        <linearGradient id="carBody" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#334155" />
          <stop offset="1" stopColor="#0b1220" />
        </linearGradient>
        <linearGradient id="carGlass" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#fde68a" stopOpacity="0.55" />
          <stop offset="1" stopColor="#b45309" stopOpacity="0.25" />
        </linearGradient>
        <linearGradient id="carBeam" x1="1" x2="0" y1="0" y2="0">
          <stop offset="0" stopColor="#fcd34d" stopOpacity="0.5" />
          <stop offset="1" stopColor="#fcd34d" stopOpacity="0" />
        </linearGradient>
        <filter id="soft2" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      <path d="M20 52 L-88 36 L-88 80 L20 62 Z" fill="url(#carBeam)" />
      <ellipse cx="132" cy="92" rx="120" ry="6" fill="#fbbf24" opacity="0.16" filter="url(#soft2)" />
      <g className="bob">
        <path
          d="M18 68 Q15 53 34 49 L72 44 Q94 22 122 20 L178 20 Q200 22 216 44 L242 48 Q252 52 250 66 L248 74 L20 74 Z"
          fill="url(#carBody)"
          stroke="#ffffff"
          strokeOpacity="0.14"
        />
        <path d="M86 44 Q101 28 122 27 L146 27 L146 44 Z" fill="url(#carGlass)" />
        <path d="M152 27 L176 27 Q192 29 206 44 L152 44 Z" fill="url(#carGlass)" />
        <path d="M30 54 L244 54" stroke="#fbbf24" strokeOpacity="0.55" strokeWidth="1.5" />
        <path d="M148 46 L148 72" stroke="#ffffff" strokeOpacity="0.1" />
        <rect x="120" y="50" width="12" height="2.5" rx="1" fill="#94a3b8" />
        <ellipse cx="24" cy="57" rx="6" ry="4" fill="#fef3c7" />
        <circle cx="24" cy="57" r="11" fill="#fbbf24" opacity="0.35" filter="url(#soft2)" />
        <rect x="244" y="54" width="6" height="7" rx="2" fill="#f43f5e" />
      </g>
      <Wheel cx={64} cy={74} r={16} />
      <Wheel cx={206} cy={74} r={16} />
    </svg>
  );
}
