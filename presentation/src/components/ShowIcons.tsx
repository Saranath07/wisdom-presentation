// 3D-style SVG icons for each show - no external dependencies
interface IconProps { size?: number }

export function ReplyPhoneIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <radialGradient id="rp-body" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#ffe082" />
          <stop offset="100%" stopColor="#b8860b" />
        </radialGradient>
        <radialGradient id="rp-shadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#000" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <filter id="rp-drop">
          <feDropShadow dx="2" dy="3" stdDeviation="2" floodColor="#000" floodOpacity="0.5" />
        </filter>
      </defs>
      {/* Shadow */}
      <ellipse cx="24" cy="44" rx="14" ry="3" fill="rgba(0,0,0,0.3)" />
      {/* Phone body - rotary style */}
      <g filter="url(#rp-drop)" transform="rotate(-20 24 24)">
        {/* Handset */}
        <path d="M10 32 Q8 24 12 18 Q16 12 22 12 L26 14 Q24 18 20 20 L18 24 Q22 28 26 30 L28 28 Q32 24 34 26 L36 30 Q36 36 30 40 Q24 44 18 42 Z"
          fill="url(#rp-body)" />
        {/* Highlight on handset */}
        <path d="M14 20 Q12 26 14 30" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
        {/* Earpiece */}
        <ellipse cx="22" cy="14" rx="4" ry="3" fill="#7a5c00" />
        {/* Mouthpiece */}
        <ellipse cx="28" cy="36" rx="4" ry="3" fill="#7a5c00" />
        {/* Dial circle */}
        <circle cx="24" cy="24" r="6" fill="#c8a000" stroke="#7a5c00" strokeWidth="1" />
        <circle cx="24" cy="24" r="2" fill="#7a5c00" />
      </g>
    </svg>
  );
}

export function TitanIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="t-wing" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#90caf9" />
          <stop offset="100%" stopColor="#1565c0" />
        </linearGradient>
        <filter id="t-glow">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <ellipse cx="24" cy="45" rx="12" ry="2.5" fill="rgba(0,0,0,0.3)" />
      {/* Survey Corps Wings of Freedom - stylized */}
      <g filter="url(#t-glow)">
        {/* Left wing */}
        <path d="M24 28 Q14 22 10 14 Q12 12 14 14 Q18 20 22 24 Z" fill="url(#t-wing)" />
        <path d="M24 28 Q12 26 8 20 Q10 17 13 19 Q18 24 22 26 Z" fill="url(#t-wing)" opacity="0.8" />
        <path d="M24 28 Q13 32 9 28 Q10 24 13 25 Q19 28 22 28 Z" fill="url(#t-wing)" opacity="0.7" />
        {/* Right wing */}
        <path d="M24 28 Q34 22 38 14 Q36 12 34 14 Q30 20 26 24 Z" fill="url(#t-wing)" />
        <path d="M24 28 Q36 26 40 20 Q38 17 35 19 Q30 24 26 26 Z" fill="url(#t-wing)" opacity="0.8" />
        <path d="M24 28 Q35 32 39 28 Q38 24 35 25 Q29 28 26 28 Z" fill="url(#t-wing)" opacity="0.7" />
        {/* Center body */}
        <path d="M21 20 Q24 16 27 20 L26 36 Q24 38 22 36 Z" fill="#1565c0" />
        {/* Head silhouette */}
        <circle cx="24" cy="17" r="5" fill="#1565c0" />
        <path d="M20 17 Q24 12 28 17" fill="#263238" />
        {/* Highlight */}
        <path d="M22 16 Q24 13 26 16" stroke="#90caf9" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
      </g>
    </svg>
  );
}

export function DeathNoteIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="dn-cover" x1="0%" y1="0%" x2="60%" y2="100%">
          <stop offset="0%" stopColor="#3a3a3a" />
          <stop offset="100%" stopColor="#0a0a0a" />
        </linearGradient>
        <linearGradient id="dn-spine" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1a1a1a" />
          <stop offset="100%" stopColor="#2d2d2d" />
        </linearGradient>
        <filter id="dn-drop">
          <feDropShadow dx="3" dy="4" stdDeviation="3" floodColor="#000" floodOpacity="0.7" />
        </filter>
      </defs>
      <ellipse cx="26" cy="44" rx="13" ry="2.5" fill="rgba(0,0,0,0.4)" />
      <g filter="url(#dn-drop)">
        {/* Book spine - narrower left strip for 3D depth illusion */}
        <rect x="7" y="8" width="5" height="34" rx="2" fill="url(#dn-spine)" />
        {/* Book cover - slightly skewed via polygon for 3D feel */}
        <polygon points="11,8 38,10 38,42 11,42" fill="url(#dn-cover)" />
        {/* Cover highlight strip */}
        <rect x="12" y="9" width="3" height="32" rx="1" fill="var(--glass-04)" />
        {/* Death Note text */}
        <text x="25" y="22" textAnchor="middle" fontSize="5" fontWeight="bold"
          fill="#ce93d8" fontFamily="serif" letterSpacing="0.5">DEATH</text>
        <text x="25" y="30" textAnchor="middle" fontSize="5" fontWeight="bold"
          fill="#ce93d8" fontFamily="serif" letterSpacing="0.5">NOTE</text>
        {/* Shinigami eye symbol */}
        <ellipse cx="25" cy="19" rx="6" ry="4" fill="none" stroke="#ce93d8" strokeWidth="0.8" opacity="0.6" />
        <circle cx="25" cy="19" r="2" fill="#ce93d8" opacity="0.8" />
        {/* Pages edge (right side) */}
        <rect x="37" y="10" width="2" height="31" rx="1" fill="#e0e0e0" opacity="0.15" />
      </g>
    </svg>
  );
}

export function OfficeIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="mug-body" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#b0bec5" />
          <stop offset="100%" stopColor="#546e7a" />
        </linearGradient>
        <linearGradient id="coffee" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#6d4c41" />
          <stop offset="100%" stopColor="#3e2723" />
        </linearGradient>
        <filter id="mug-drop">
          <feDropShadow dx="2" dy="3" stdDeviation="2" floodColor="#000" floodOpacity="0.5" />
        </filter>
      </defs>
      <ellipse cx="22" cy="44" rx="12" ry="2.5" fill="rgba(0,0,0,0.3)" />
      <g filter="url(#mug-drop)">
        {/* Mug body */}
        <path d="M10 20 L12 40 Q12 42 14 42 L32 42 Q34 42 34 40 L36 20 Z"
          fill="url(#mug-body)" />
        {/* Top ellipse */}
        <ellipse cx="23" cy="20" rx="13" ry="3.5" fill="#78909c" />
        {/* Coffee surface */}
        <ellipse cx="23" cy="21" rx="11" ry="2.5" fill="url(#coffee)" />
        {/* Handle */}
        <path d="M36 26 Q44 26 44 31 Q44 36 36 36"
          fill="none" stroke="url(#mug-body)" strokeWidth="4" strokeLinecap="round" />
        <path d="M36 27 Q42 27 42 31 Q42 35 36 35"
          fill="none" stroke="#78909c" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
        {/* "DM" text on mug */}
        <text x="23" y="34" textAnchor="middle" fontSize="7" fontWeight="bold"
          fill="#37474f" fontFamily="'Space Grotesk', sans-serif">DM</text>
        {/* Highlight */}
        <path d="M13 22 L14 36" stroke="var(--glass-30)" strokeWidth="2" strokeLinecap="round" />
        {/* Steam */}
        <path d="M18 16 Q19 12 18 8" stroke="#90a4ae" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
        <path d="M23 15 Q24 11 23 7" stroke="#90a4ae" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
        <path d="M28 16 Q29 12 28 8" stroke="#90a4ae" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      </g>
    </svg>
  );
}

export function AtomIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <radialGradient id="atom-nucleus" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stopColor="#80cbc4" />
          <stop offset="100%" stopColor="#00695c" />
        </radialGradient>
        <filter id="atom-glow">
          <feGaussianBlur stdDeviation="1" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <g filter="url(#atom-glow)">
        {/* Orbit 1 - horizontal */}
        <ellipse cx="24" cy="24" rx="18" ry="6" fill="none" stroke="#80cbc4" strokeWidth="1.2" opacity="0.7" />
        {/* Orbit 2 - tilted 60° */}
        <ellipse cx="24" cy="24" rx="18" ry="6" fill="none" stroke="#80cbc4" strokeWidth="1.2" opacity="0.7"
          transform="rotate(60 24 24)" />
        {/* Orbit 3 - tilted 120° */}
        <ellipse cx="24" cy="24" rx="18" ry="6" fill="none" stroke="#80cbc4" strokeWidth="1.2" opacity="0.7"
          transform="rotate(120 24 24)" />
        {/* Nucleus */}
        <circle cx="24" cy="24" r="5" fill="url(#atom-nucleus)" />
        <circle cx="22" cy="22" r="1.5" fill="var(--glass-40)" />
        {/* Electrons */}
        <circle cx="42" cy="24" r="2.5" fill="#80cbc4" />
        <circle cx="15" cy="11" r="2.5" fill="#80cbc4" transform="rotate(60 24 24)" />
        <circle cx="15" cy="37" r="2.5" fill="#80cbc4" transform="rotate(120 24 24)" />
      </g>
    </svg>
  );
}

export function CherriesIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <radialGradient id="cherry-l" cx="35%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#ef9a9a" />
          <stop offset="100%" stopColor="#b71c1c" />
        </radialGradient>
        <radialGradient id="cherry-r" cx="35%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#ef9a9a" />
          <stop offset="100%" stopColor="#c62828" />
        </radialGradient>
        <filter id="cherry-drop">
          <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.4" />
        </filter>
      </defs>
      <g filter="url(#cherry-drop)">
        {/* Stems */}
        <path d="M24 14 Q20 8 15 10" stroke="#388e3c" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M24 14 Q28 6 33 10" stroke="#388e3c" strokeWidth="2" strokeLinecap="round" fill="none" />
        {/* Leaf */}
        <path d="M24 12 Q28 8 30 12 Q28 14 24 12 Z" fill="#43a047" />
        {/* Left cherry */}
        <circle cx="14" cy="30" r="10" fill="url(#cherry-l)" />
        <circle cx="11" cy="26" r="3" fill="var(--glass-25)" />
        <circle cx="18" cy="34" r="2" fill="rgba(0,0,0,0.2)" />
        {/* Right cherry */}
        <circle cx="34" cy="30" r="10" fill="url(#cherry-r)" />
        <circle cx="31" cy="26" r="3" fill="var(--glass-25)" />
        <circle cx="38" cy="34" r="2" fill="rgba(0,0,0,0.2)" />
      </g>
    </svg>
  );
}

export function HouseIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="house-wall" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fff3e0" />
          <stop offset="100%" stopColor="#ffe0b2" />
        </linearGradient>
        <linearGradient id="house-roof" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#78909c" />
          <stop offset="100%" stopColor="#455a64" />
        </linearGradient>
        <linearGradient id="house-side" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#bcaaa4" />
          <stop offset="100%" stopColor="#8d6e63" />
        </linearGradient>
        <filter id="house-drop">
          <feDropShadow dx="2" dy="3" stdDeviation="2" floodColor="#000" floodOpacity="0.4" />
        </filter>
      </defs>
      <ellipse cx="24" cy="45" rx="14" ry="2.5" fill="rgba(0,0,0,0.3)" />
      <g filter="url(#house-drop)">
        {/* Right side face (3D) */}
        <path d="M36 28 L42 24 L42 40 L36 44 Z" fill="url(#house-side)" />
        {/* Main front face */}
        <rect x="10" y="28" width="26" height="16" fill="url(#house-wall)" />
        {/* Front door */}
        <rect x="19" y="34" width="8" height="10" rx="1" fill="#a1887f" />
        <circle cx="26" cy="39" r="1" fill="#5d4037" />
        {/* Front windows */}
        <rect x="12" y="30" width="6" height="6" rx="1" fill="#bbdefb" stroke="#90a4ae" strokeWidth="0.5" />
        <rect x="28" y="30" width="6" height="6" rx="1" fill="#bbdefb" stroke="#90a4ae" strokeWidth="0.5" />
        {/* Window cross */}
        <line x1="15" y1="30" x2="15" y2="36" stroke="#90a4ae" strokeWidth="0.5" />
        <line x1="12" y1="33" x2="18" y2="33" stroke="#90a4ae" strokeWidth="0.5" />
        <line x1="31" y1="30" x2="31" y2="36" stroke="#90a4ae" strokeWidth="0.5" />
        <line x1="28" y1="33" x2="34" y2="33" stroke="#90a4ae" strokeWidth="0.5" />
        {/* Roof front */}
        <path d="M7 28 L23 12 L36 28 Z" fill="url(#house-roof)" />
        {/* Roof right side */}
        <path d="M36 28 L42 24 L30 8 L23 12 Z" fill="#546e7a" />
        {/* Roof ridge highlight */}
        <path d="M23 12 L30 8" stroke="#90a4ae" strokeWidth="1" opacity="0.5" />
        {/* Chimney */}
        <rect x="28" y="10" width="5" height="10" fill="#546e7a" />
        <rect x="27" y="9" width="7" height="2" rx="1" fill="#455a64" />
      </g>
    </svg>
  );
}
