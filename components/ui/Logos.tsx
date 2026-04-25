/**
 * Inline logo components — no external file dependency.
 * These render always, even if PNG files aren't in /public yet.
 * Once you add logo.png and palace.png to /public, switch to <img> tags.
 */

interface LogoProps {
  size?: number
  className?: string
}

// EduFortune logo — shield shape with graduation cap, brand blue + orange
export function EduFortuneLogo({ size = 32, className = '' }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Shield */}
      <path
        d="M32 4L8 14v18c0 14 10.5 26.5 24 30 13.5-3.5 24-16 24-30V14L32 4z"
        fill="#1565e0"
      />
      <path
        d="M32 4L8 14v18c0 14 10.5 26.5 24 30V4z"
        fill="#0e4299"
      />
      {/* Graduation cap */}
      <rect x="20" y="28" width="24" height="3" rx="1" fill="white" opacity="0.9"/>
      <polygon points="32,20 20,27 32,31 44,27" fill="white"/>
      <rect x="40" y="27" width="2" height="6" rx="1" fill="#f57c00"/>
      <circle cx="41" cy="34" r="2" fill="#f57c00"/>
      {/* EF letters */}
      <text x="32" y="48" textAnchor="middle" fontSize="10" fontWeight="bold" fill="white" opacity="0.85">EF</text>
    </svg>
  )
}

// The Palace logo — building with signal tower, navy + gold
export function PalaceLogo({ size = 32, className = '' }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Circle background */}
      <circle cx="32" cy="32" r="30" fill="#0d1f4e" stroke="#c9a227" strokeWidth="2"/>
      {/* Building */}
      <rect x="14" y="34" width="36" height="18" rx="1" fill="none" stroke="#c9a227" strokeWidth="1.5"/>
      <rect x="18" y="38" width="5" height="5" rx="0.5" fill="#c9a227" opacity="0.7"/>
      <rect x="30" y="38" width="5" height="5" rx="0.5" fill="#c9a227" opacity="0.7"/>
      <rect x="42" y="38" width="5" height="5" rx="0.5" fill="#c9a227" opacity="0.7"/>
      <rect x="26" y="44" width="12" height="8" rx="0.5" fill="#c9a227" opacity="0.5"/>
      {/* Dome */}
      <path d="M26 34 Q32 26 38 34" stroke="#c9a227" strokeWidth="1.5" fill="none"/>
      {/* Tower */}
      <line x1="32" y1="26" x2="32" y2="16" stroke="#c9a227" strokeWidth="1.5"/>
      {/* Signal waves */}
      <path d="M27 20 Q32 15 37 20" stroke="#c9a227" strokeWidth="1.2" fill="none" opacity="0.8"/>
      <path d="M24 17 Q32 10 40 17" stroke="#c9a227" strokeWidth="1" fill="none" opacity="0.5"/>
    </svg>
  )
}
