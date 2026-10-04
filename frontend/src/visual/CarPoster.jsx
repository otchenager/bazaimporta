import { CAR_BODY, CAR_INTAKE, CAR_LINES, CAR_SPOKES, CAR_WHEELS, CAR_WINDOW } from './carShape.js'

/** Статичный постер: тот же силуэт пунктиром. Показывается до WebGL, на слабых устройствах и при reduced-motion. */
export default function CarPoster({ className = '', label }) {
  const dots = { fill: 'none', strokeLinecap: 'round', strokeDasharray: '0.1 7' }
  return (
    <svg viewBox="-20 30 1040 280" className={className} role="img" aria-label={label} preserveAspectRatio="xMidYMid meet">
      <g transform="skewX(-4) translate(18 0)">
        <path d={CAR_BODY} {...dots} stroke="#ececef" strokeWidth="3.2" />
        <path d={CAR_WINDOW} {...dots} stroke="#ececef" strokeWidth="2.6" />
        {CAR_LINES.map((d) => (
          <path key={d} d={d} {...dots} stroke="#a3a3ab" strokeWidth="2.4" />
        ))}
        <path d={CAR_INTAKE} {...dots} stroke="#ff6a00" strokeWidth="2.8" />
        {CAR_WHEELS.map(({ cx, cy, r }) => (
          <g key={cx}>
            <circle cx={cx} cy={cy} r={r} {...dots} stroke="#ff6a00" strokeWidth="3.2" />
            <circle cx={cx} cy={cy} r={r * 0.68} {...dots} stroke="#ff6a00" strokeWidth="2.4" />
          </g>
        ))}
        {CAR_SPOKES.map((d) => (
          <path key={d} d={d} {...dots} stroke="#ff6a00" strokeWidth="2.4" />
        ))}
        <path d="M-20 292 L1040 292" {...dots} stroke="#3a3a41" strokeWidth="2" />
      </g>
    </svg>
  )
}
