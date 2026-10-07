import { Link } from 'react-router-dom'
import Logo from '../components/Logo.jsx'
import CtaButton from '../components/CtaButton.jsx'
import CarPoster from '../visual/CarPoster.jsx'
import { COPY, LINKS } from '../content/copy.js'

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col items-start justify-center gap-8 px-4 sm:px-8">
      <Link to="/" aria-label="BAZA Import — на главную" className="rounded">
        <Logo />
      </Link>
      <CarPoster className="w-full max-w-xl opacity-60" />
      <h1 className="h-section">{COPY.notFound.title}</h1>
      <div className="flex w-full flex-col gap-3 sm:flex-row">
        <Link to="/" className="btn btn-ghost">{COPY.notFound.cta}</Link>
        <CtaButton href={LINKS.boris} goal="cta_404">{COPY.header.cta}</CtaButton>
      </div>
    </main>
  )
}
