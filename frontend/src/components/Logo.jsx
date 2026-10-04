// Знак BAZA Import (вариант A из /brand): тёмный шильдик, буква B, оранжевая полоса-трасса.
export function LogoMark({ size = 36, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden="true" focusable="false">
      <rect width="64" height="64" rx="14" fill="#141416" />
      <path d="M-4 58 50-4h14L10 62H-4z" fill="#ff6a00" />
      <path
        fillRule="evenodd"
        fill="#ececef"
        d="M18 13h20.5c7.4 0 11.5 3.6 11.5 9.3 0 3.6-1.9 6.2-5 7.4 4 1.1 6.6 4 6.6 8.4 0 6.4-4.6 10.9-12.8 10.9H18zm10 7.8v7.4h8.4c2.6 0 4-1.4 4-3.7s-1.4-3.7-4-3.7zm0 14.6v7.8h9.4c2.9 0 4.4-1.5 4.4-3.9s-1.5-3.9-4.4-3.9z"
      />
    </svg>
  )
}

export default function Logo({ compact = false }) {
  return (
    <span className="flex items-center gap-2.5 select-none">
      <LogoMark size={compact ? 32 : 36} />
      <span className="font-display uppercase leading-none">
        <span className="block text-[1.35rem] font-bold tracking-[0.02em]">BAZA</span>
        <span className="mt-0.5 block text-[0.62rem] font-bold tracking-[0.42em] text-muted">Import</span>
      </span>
    </span>
  )
}
