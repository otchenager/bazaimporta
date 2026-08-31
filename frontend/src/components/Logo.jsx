export default function Logo({ className = '', showTagline = true }) {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
        <defs>
          <linearGradient id="chromeGrad" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="35%" stopColor="#c9cdd3" />
            <stop offset="65%" stopColor="#8a8e96" />
            <stop offset="100%" stopColor="#e7e9ec" />
          </linearGradient>
          <linearGradient id="stripeGrad" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ff8a3d" />
            <stop offset="100%" stopColor="#a83d00" />
          </linearGradient>
          <clipPath id="badgeClip">
            <rect x="1" y="1" width="42" height="42" rx="9" />
          </clipPath>
        </defs>
        <rect x="1" y="1" width="42" height="42" rx="9" fill="#0a0a0a" stroke="url(#chromeGrad)" strokeWidth="1.5" />
        <path d="M0 30 L30 0 L38 0 L8 44 L0 44 Z" fill="url(#stripeGrad)" clipPath="url(#badgeClip)" />
        <text x="22" y="30" textAnchor="middle" fontFamily="Oswald, sans-serif" fontWeight="700" fontSize="20" fill="url(#chromeGrad)">BI</text>
      </svg>
      <div className="flex flex-col items-start leading-none">
        <span className="font-display text-xl tracking-wide text-gradient-chrome font-semibold">BAZA Import</span>
        {showTagline && (
          <span className="text-[10px] tracking-[0.25em] text-text-muted uppercase font-sans mt-0.5">Korea · China · Japan</span>
        )}
      </div>
    </div>
  )
}
