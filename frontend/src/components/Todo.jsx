import { isTodo } from '../content/copy.js'

/** Выводит текст, а на месте todo('…') — заглушку в dev и ничего в продакшене. */
export default function Todo({ value, as: Tag = 'span', className = '' }) {
  if (!isTodo(value)) return value ? <Tag className={className}>{value}</Tag> : null
  if (!import.meta.env.DEV && import.meta.env.VITE_SHOW_TODO !== '1') return null
  return <Tag className={`todo ${className}`}>[НУЖЕН КОНТЕНТ: {value.todo}]</Tag>
}

export const hasValue = (v) => v && (!isTodo(v) || import.meta.env.DEV || import.meta.env.VITE_SHOW_TODO === '1')
