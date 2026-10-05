// Правила текста из брифа: заголовок ≤ 8 слов, абзац ≤ 110 знаков (≈ 2 строки на 375px).
import { COPY } from '../src/content/copy.js'
import { TRACKS } from '../src/content/tracks.js'

const MAX_WORDS = 8, MAX_CHARS = 110
const problems = []
const words = (s) => s.split(/\s+/).filter((w) => !/^[—·–-]$/.test(w)).length
const head = (where, s) => words(s) > MAX_WORDS && problems.push(`${where}: заголовок ${words(s)} слов — «${s}»`)
const para = (where, s) => s.length > MAX_CHARS && problems.push(`${where}: абзац ${s.length} знаков — «${s}»`)

head('hero.title', COPY.hero.title.join(' '))
// hero.sub — текст владельца, дословно (116 знаков), лимит не применяем
for (const k of ['picker', 'trust', 'how', 'faq', 'final']) head(`${k}.title`, COPY[k].title)
para('trust.sub', COPY.trust.sub)
para('final.sub', COPY.final.sub)
COPY.faq.items.forEach((i, n) => para(`faq[${n}]`, i.a))
// Тексты треков «С нуля» и «Есть опыт» (h1, sub, lead, points) — дословно от владельца, лимит длины к ним не применяем
for (const t of TRACKS) {
  if (t.title) head(`${t.id}.title`, t.title)
  if (t.promise) para(`${t.id}.promise`, t.promise)
  para(`${t.id}.pain`, t.pain)
}

if (problems.length) {
  console.error('Нарушены правила текста:\n' + problems.map((p) => ' - ' + p).join('\n'))
  process.exit(1)
}
console.log('copy ok')
