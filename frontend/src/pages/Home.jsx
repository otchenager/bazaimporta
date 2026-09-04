import Header from '../components/Header.jsx'
import Hero from '../components/Hero.jsx'
import About from '../components/About.jsx'
import Program from '../components/Program.jsx'
import Audience from '../components/Audience.jsx'
import Gallery from '../components/Gallery.jsx'
import PaidChannel from '../components/PaidChannel.jsx'
import Testimonials from '../components/Testimonials.jsx'
import FAQ from '../components/FAQ.jsx'
import Footer from '../components/Footer.jsx'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <About />
        <Program />
        <Audience />
        <Gallery />
        <PaidChannel />
        <Testimonials />
        <FAQ />
      </main>
      <Footer />
    </div>
  )
}
