import TopBanner from './components/TopBanner'
import Navbar from './components/Navbar'
import HeroSection from './components/HeroSection'
import TrustBar from './components/TrustBar'
import WhatItIsSection from './components/WhatItIsSection'
import CheckoutSection from './components/CheckoutSection'
import SolutionsSection from './components/SolutionsSection'
import BoldCloserSection from './components/BoldCloserSection'
import HowItWorksSection from './components/HowItWorksSection'
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
      <WhatItIsSection />
      <CheckoutSection />
      <SolutionsSection />
      <BoldCloserSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </div>
  )
}
