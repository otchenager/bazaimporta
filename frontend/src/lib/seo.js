import { COPY, LEGAL, LINKS } from '../content/copy.js'
import { TRACKS, trackBySlug } from '../content/tracks.js'

export const SITE_URL = 'https://bazaimporta.ru'

const HOME = {
  title: 'BAZA Import — клуб импортёров авто из Кореи, Китая, Японии',
  description: 'Привози авто из-за границы без переплат: свои поставщики, наставник и 200+ привезённых машин. Вход в канал бесплатный.',
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function jsonLd(obj) {
  // </script> внутри JSON не должен закрыть тег
  return `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`
}

export function metaFor(pathname) {
  const track = trackBySlug(pathname)
  if (pathname === '/thank-you/') return { title: 'Спасибо за оплату — BAZA Import', description: HOME.description, noindex: true, path: pathname }
  if (pathname === '/404') return { title: 'Страница не найдена — BAZA Import', description: HOME.description, noindex: true, path: '/' }
  return { ...(track ? track.seo : HOME), path: pathname }
}

/** HTML для <head> пререндеренной страницы. */
export function headHtml(pathname) {
  const m = metaFor(pathname)
  const url = SITE_URL + m.path
  const tags = [
    `<title>${esc(m.title)}</title>`,
    `<meta name="description" content="${esc(m.description)}">`,
    m.noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${url}">`,
    '<meta property="og:type" content="website">',
    '<meta property="og:site_name" content="BAZA Import">',
    '<meta property="og:locale" content="ru_RU">',
    `<meta property="og:title" content="${esc(m.title)}">`,
    `<meta property="og:description" content="${esc(m.description)}">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:image" content="${SITE_URL}/og.jpg">`,
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    '<meta name="twitter:card" content="summary_large_image">',
  ]
  if (!m.noindex) {
    tags.push(
      jsonLd({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'BAZA Import',
        url: SITE_URL,
        logo: `${SITE_URL}/favicon.svg`,
        sameAs: [LINKS.channel],
        legalName: LEGAL.entityName,
        taxID: LEGAL.inn,
        email: LEGAL.email,
        telephone: LEGAL.phoneE164,
      }),
      jsonLd({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        // ссылки в ответе — тегом <a> (schema.org Answer.text допускает его)
        mainEntity: COPY.faq.items.map((i) => ({
          '@type': 'Question',
          name: i.q,
          acceptedAnswer: { '@type': 'Answer', text: i.link ? i.a.replace(i.link.text, `<a href="${i.link.href}">${i.link.text}</a>`) : i.a },
        })),
      }),
    )
  }
  return tags.join('\n    ')
}

export const PRERENDER_ROUTES = ['/', ...TRACKS.map((t) => t.slug), '/thank-you/']
