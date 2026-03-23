import { useEffect } from 'react'
import Hero from './components/Hero'
import Vision from './components/Vision'
import Simulations from './components/Simulations'
import HowItWorks from './components/HowItWorks'
import Classroom from './components/Classroom'
import Faculty from './components/Faculty'
import Footer from './components/Footer'

function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    )

    document.querySelectorAll('.fade-up').forEach((el) => {
      observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])
}

export default function App() {
  useScrollReveal()

  return (
    <div className="min-h-screen">
      <Hero />
      <Vision />
      <Simulations />
      <HowItWorks />
      <Classroom />
      <Faculty />
      <Footer />
    </div>
  )
}
