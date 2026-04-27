import Navbar from './components/Navbar'
import HeroSection from './components/HeroSection'
import TrustBar from './components/TrustBar'
import HowItWorksSection from './components/HowItWorksSection'
import FeaturesGrid from './components/FeaturesGrid'
import MissionStatement from './components/MissionStatement'
import Footer from './components/Footer'

export default function App() {
  return (
    <div className="bg-cream-100 min-h-screen">
      <Navbar />
      <HeroSection />
      <TrustBar />
      <HowItWorksSection />
      <FeaturesGrid />
      <MissionStatement />
      <Footer />
    </div>
  )
}
