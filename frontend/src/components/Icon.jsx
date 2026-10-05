// Линейные иконки 24×24, stroke = currentColor. Нарисованы для проекта.
const PATHS = {
  steps: <path d="M4 19h5v-5h5V9h6M17 6l3 3-3 3" />,
  contacts: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 7M18.5 14.8c1.6.8 2.6 2.6 3 5.2" />
    </>
  ),
  doc: <path d="M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6" />,
  chat: <path d="M4 5h16v11H9l-5 4zM8 9.5h8M8 12.5h5" />,
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.6 2.8 3.8 5.8 3.8 9s-1.2 6.2-3.8 9c-2.6-2.8-3.8-5.8-3.8-9S9.4 5.8 12 3z" />
    </>
  ),
  live: (
    <>
      <rect x="3" y="6" width="13" height="12" rx="2" />
      <path d="m16 10.5 5-3v9l-5-3" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" />
    </>
  ),
  lock: (
    <>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3M12 14.5v2.5" />
    </>
  ),
  flame: <path d="M12 21c-3.9 0-6.5-2.6-6.5-6.2 0-3.3 2.2-5.4 3.7-7.3.5 1.7 1.3 2.8 2.4 3.3C11.8 7.6 13 5 15.4 3c-.2 3.2 3.1 5.6 3.1 10.7C18.5 18.1 15.9 21 12 21z" />,
  calc: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M8 7h8M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01M8.5 15h.01M12 15h.01M15.5 15v2.5M8.5 18h.01M12 18h.01" />
    </>
  ),
  shield: <path d="M12 3 4.5 6v5.5c0 4.6 3.1 8.2 7.5 9.5 4.4-1.3 7.5-4.9 7.5-9.5V6zM8.5 12l2.5 2.5 4.5-5" />,
  mentor: (
    <>
      <circle cx="12" cy="7.5" r="3.5" />
      <path d="M5 20.5c.7-3.9 3.4-6 7-6s6.3 2.1 7 6M9.5 14.8 12 18l2.5-3.2" />
    </>
  ),
  trophy: <path d="M7.5 4h9v4.5a4.5 4.5 0 0 1-9 0zM7.5 6H4.5c0 3 1.3 4.5 3.3 4.7M16.5 6h3c0 3-1.3 4.5-3.3 4.7M12 13v4M8.5 20.5h7M9.5 20.5l.5-3.5h4l.5 3.5" />,
  truck: (
    <>
      <path d="M2.5 6.5h11v10h-11zM13.5 10h4l3 3.5v3h-7" />
      <circle cx="6.5" cy="17.5" r="1.8" />
      <circle cx="16.5" cy="17.5" r="1.8" />
    </>
  ),
  handshake: <path d="M2.5 8.5 6 6.5l3.5 1 2.5-1.5 4 .5 5.5 2.5M2.5 8.5v6l2.5.5 5 4c.9.7 2 .5 2.5-.3M21.5 9v6.5l-2.5.5M9.5 7.5 7 11c-.5.9.4 1.9 1.4 1.5l3.1-1.5 6 5c.8.7.1 2-1 1.8M12.5 19.2c.8.5 1.9.2 2.3-.6M15 18.5c.8.4 1.8.1 2.1-.7" />,
  monitor: (
    <>
      <rect x="3" y="4.5" width="18" height="12" rx="1.5" />
      <path d="M8.5 20h7M12 16.5V20M6.5 8h5M6.5 11h8" />
    </>
  ),
  gift: <path d="M4 10h16v10.5H4zM3 7h18v3H3zM12 7v13.5M12 7c-1.5-3.5-5.5-3.8-5.5-1.3C6.5 7 9 7 12 7zM12 7c1.5-3.5 5.5-3.8 5.5-1.3C17.5 7 15 7 12 7z" />,
  coins: (
    <>
      <ellipse cx="9" cy="7" rx="5.5" ry="2.5" />
      <path d="M3.5 7v4c0 1.4 2.5 2.5 5.5 2.5M3.5 11v4c0 1.4 2.5 2.5 5.5 2.5" />
      <ellipse cx="15" cy="14" rx="5.5" ry="2.5" />
      <path d="M9.5 14v3.5c0 1.4 2.5 2.5 5.5 2.5s5.5-1.1 5.5-2.5V14" />
    </>
  ),
  briefcase: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8.5 7V4.5h7V7M3 12.5h18M10.5 12.5v2h3v-2" />
    </>
  ),
  play: <path d="M8 5.5v13l10.5-6.5z" />,
  'chevron-left': <path d="m14.5 5.5-6.5 6.5 6.5 6.5" />,
  'chevron-right': <path d="m9.5 5.5 6.5 6.5-6.5 6.5" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  down: <path d="M12 5v14M6 13l6 6 6-6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  zoom: <path d="M10.5 4.5a6 6 0 1 0 0 12 6 6 0 0 0 0-12zM15 15l4.5 4.5M10.5 8v5M8 10.5h5" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  telegram: <path d="m21 4.5-3 15.2c-.2 1-.8 1.3-1.7.8l-4.6-3.4-2.2 2.1c-.3.3-.5.5-1 .5l.3-4.7 8.6-7.8c.4-.3-.1-.5-.6-.2L6.2 13.7l-4.6-1.4c-1-.3-1-1 .2-1.5l17.9-6.9c.8-.3 1.6.2 1.3 1.6z" />,
}

export default function Icon({ name, size = 24, className = '', strokeWidth = 1.6 }) {
  const filled = name === 'telegram' || name === 'play'
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  )
}
