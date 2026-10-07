import { track } from '../lib/analytics.js'
import { LEGAL } from '../content/copy.js'

/** Номер-ссылка tel: — на телефоне тап сразу звонит. Клик — цель Метрики phone_click. */
export default function PhoneLink({ className = '', children, ...rest }) {
  return (
    <a href={LEGAL.phoneHref} onClick={() => track('phone_click')} data-goal="phone_click" className={className} {...rest}>
      {children ?? LEGAL.phone}
    </a>
  )
}
