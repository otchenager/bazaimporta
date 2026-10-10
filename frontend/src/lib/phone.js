// Телефон в лид-форме: код страны выбирается отдельно, в поле — только национальная часть с маской.
// Сервер (public/api/lead.php) проверяет номер ещё раз и нормализует в E.164.
export const COUNTRIES = [
  { id: 'ru', label: 'РФ', code: '7', mask: '(___) ___-__-__', first: /[3-9]/ },
  { id: 'kz', label: 'КЗ', code: '7', mask: '(___) ___-__-__', first: /7/ },
  { id: 'by', label: 'BY', code: '375', mask: '(__) ___-__-__', first: /[1-4]/ },
  { id: 'am', label: 'AM', code: '374', mask: '(__) __-__-__', first: /[1-9]/ },
]

export const countryById = (id) => COUNTRIES.find((c) => c.id === id) ?? COUNTRIES[0]
const lengthOf = (c) => c.mask.split('_').length - 1

/** Цифры национальной части из того, что ввели или вставили: «+7 912…», «8 912…», «912…». */
export function phoneDigits(raw, c) {
  let d = String(raw).replace(/\D/g, '')
  const len = lengthOf(c)
  if (d.length > len && d.startsWith(c.code)) d = d.slice(c.code.length)
  if (c.code === '7' && d.length === len + 1 && d[0] === '8') d = d.slice(1)
  return d.slice(0, len)
}

/** Маска «лениво»: разделитель появляется только перед следующей цифрой — Backspace стирает цифры, а не скобки. */
export function formatPhone(d, c) {
  let out = ''
  let i = 0
  for (const ch of c.mask) {
    if (i >= d.length) break
    out += ch === '_' ? d[i++] : ch
  }
  return out
}

export const phoneComplete = (d, c) => d.length === lengthOf(c) && c.first.test(d[0])
export const phoneE164 = (d, c) => `+${c.code}${d}`
