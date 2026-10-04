import { track } from '../lib/analytics.js'
import Icon from './Icon.jsx'

/** Внешняя CTA-ссылка в Telegram. Работает и без JS: это обычный <a>. */
export default function CtaButton({ href, goal, children, variant = 'primary', icon = 'telegram', className = '', ...rest }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      onClick={() => track(goal)}
      data-goal={goal}
      className={`btn ${variant === 'primary' ? 'btn-primary' : 'btn-ghost'} ${className}`}
      {...rest}
    >
      {icon && <Icon name={icon} size={20} />}
      <span>{children}</span>
    </a>
  )
}
