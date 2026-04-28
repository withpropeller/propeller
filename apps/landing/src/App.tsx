import TopBanner from './components/TopBanner'
import Navbar from './components/Navbar'
import HeroSection from './components/HeroSection'
import TrustBar from './components/TrustBar'
import SolutionsSection from './components/SolutionsSection'
import DevelopersSection from './components/DevelopersSection'
import TestimonialsSection from './components/TestimonialsSection'
import CTASection from './components/CTASection'
import Footer from './components/Footer'

export default function App() {
  return (
    <div className="bg-cream-100 min-h-screen">
      <TopBanner />
      <Navbar />
      <HeroSection />
      <TrustBar />
      <SolutionsSection />
      <DevelopersSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </div>
  )
}
