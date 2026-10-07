import { Link } from 'react-router-dom'
import Logo from '../components/Logo.jsx'
import CtaButton from '../components/CtaButton.jsx'
import Icon from '../components/Icon.jsx'
import { COPY, LINKS } from '../content/copy.js'

export default function ThankYou() {
  const t = COPY.thankYou
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-start justify-center gap-8 px-4 sm:px-8">
      <Logo />
      <span className="grid h-14 w-14 place-items-center rounded-full border border-accent text-accent">
        <Icon name="check" size={28} />
      </span>
      <h1 className="h-section">{t.title}</h1>
      <p className="text-lg text-muted">{t.text}</p>
      <div className="flex w-full flex-col gap-3 sm:flex-row">
        <CtaButton href={LINKS.support} goal="cta_thanks">{t.cta}</CtaButton>
        <Link to="/" className="btn btn-ghost">{t.home}</Link>
      </div>
    </main>
  )
}
