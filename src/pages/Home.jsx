import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

import Header from '../components/Header'
import Hero from '../components/Hero'
import Story from '../components/Story'
import Blends from '../components/Blends'
import RecipeTeaser from '../components/RecipeTeaser'
import Testimonials from '../components/Testimonials'
import Contact from '../components/Contact'
import Footer from '../components/Footer'

const useScrollToHash = () => {
  const location = useLocation()

  useEffect(() => {
    const targetId = (location.hash || '').replace('#', '') || location.state?.scrollTo
    if (!targetId) {
      // No hash — scroll to top (e.g. user clicked "Home" from another page)
      window.scrollTo({ top: 0, behavior: 'instant' })
      return
    }
    const scrollToTarget = () => {
      const element = document.getElementById(targetId)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        // Trigger a scroll event so the header detects the new scroll position
        setTimeout(() => window.dispatchEvent(new Event('scroll')), 100)
      }
    }
    // Delay to allow sections to mount before scrolling
    const timeout = setTimeout(scrollToTarget, 150)
    return () => clearTimeout(timeout)
  }, [location.hash, location.state])
}

const Home = () => {
  useScrollToHash()

  return (
    <div className="bg-gradient-to-b from-sand/30 via-white to-sand/30 text-charcoal">
      <Header />
      <main className="flex flex-col gap-0">
        <Hero />
        <Story />
        <Blends />
        <RecipeTeaser />
        <Testimonials />
        <Contact />
      </main>
      <Footer />
    </div>
  )
}

export default Home
