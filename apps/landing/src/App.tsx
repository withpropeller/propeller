import Navbar from './components/Navbar'
import HeroSection from './components/HeroSection'
import TrustBar from './components/TrustBar'
import PayInToPayoutSection from './components/PayInToPayoutSection'
import AcceptPaymentsSection from './components/AcceptPaymentsSection'
import FeatureRow from './components/FeatureRow'
import UserVerificationSection from './components/UserVerificationSection'
import ComplianceFeatures from './components/ComplianceFeatures'
import SolutionsSection from './components/SolutionsSection'
import DevelopersSection from './components/DevelopersSection'
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
      <PayInToPayoutSection />
      <AcceptPaymentsSection />
      <FeatureRow />
      <UserVerificationSection />
      <ComplianceFeatures />
      <SolutionsSection />
      <DevelopersSection />
      <HowItWorksSection />
      <FeaturesGrid />
      <MissionStatement />
      <Footer />
    </div>
  )
}
