import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import StickyCta from '../components/StickyCta.jsx'
import Hero from '../sections/Hero.jsx'
import TrackPicker from '../sections/TrackPicker.jsx'
import TrackDetail from '../sections/TrackDetail.jsx'
import Trust from '../sections/Trust.jsx'
import HowItWorks from '../sections/HowItWorks.jsx'
import Pricing from '../sections/Pricing.jsx'
import FAQ from '../sections/FAQ.jsx'
import FinalCta from '../sections/FinalCta.jsx'
import { trackBySlug } from '../content/tracks.js'
import { metaFor } from '../lib/seo.js'

/** Главная и три страницы треков — одна раскладка, разный hero и блок трека. */
export default function Landing() {
  const { pathname, state, key } = useLocation()
  const track = trackBySlug(pathname)
  const first = useRef(true)

  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    document.title = metaFor(track ? track.slug : '/').title
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const target = state?.scrollTo && document.getElementById(state.scrollTo)
    if (target) target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
    else window.scrollTo(0, 0)
  }, [key, state, track])

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-ink">
        К содержанию
      </a>
      <Header track={track} />
      <main id="main">
        <Hero track={track} />
        {/* на странице трека сначала его содержание (H1 → лид → пункты), потом остальные треки */}
        {track && <TrackDetail key={track.id} track={track} />}
        <TrackPicker activeId={track?.id} />
        <Trust />
        <HowItWorks />
        <Pricing track={track} />
        <FAQ />
        <FinalCta track={track} />
      </main>
      <Footer />
      <StickyCta key={track?.id ?? 'home'} track={track} />
    </>
  )
}
