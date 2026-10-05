import Icon from './Icon.jsx'

/** Круглая стрелка карусели ← →. Одна на кейс и на блок 444. */
export default function ArrowButton({ dir, label, onClick, disabled, className = '' }) {
  return (
    <button type="button" className={`carousel-arrow ${className}`} aria-label={label} onClick={onClick} disabled={disabled}>
      <Icon name={dir === 'prev' ? 'chevron-left' : 'chevron-right'} size={20} strokeWidth={2} />
    </button>
  )
}
