import Header from '../components/Header.jsx'
import Hero from '../components/Hero.jsx'
import Program from '../components/Program.jsx'
import Audience from '../components/Audience.jsx'
import Gallery from '../components/Gallery.jsx'
import Comparison from '../components/Comparison.jsx'
import About from '../components/About.jsx'
import PaidChannel from '../components/PaidChannel.jsx'
// Отзывы отключены — нет контента
// import Testimonials from '../components/Testimonials.jsx'
import FAQ from '../components/FAQ.jsx'
import Contacts from '../components/Contacts.jsx'
import Footer from '../components/Footer.jsx'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <Program />
        <Audience />
        <Gallery />
        <Comparison />
        <About />
        <PaidChannel />
        {/* Отзывы отключены — нет контента */}
        {/* <Testimonials /> */}
        <FAQ />
        <Contacts />
      </main>
      <Footer />
    </div>
  )
}
