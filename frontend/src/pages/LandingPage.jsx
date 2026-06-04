import Navbar from '../components/Navbar.jsx';
import Hero from '../components/Hero.jsx';
import LiveStats from '../components/LiveStats.jsx';
import BeforeAfter from '../components/BeforeAfter.jsx';
import Features from '../components/Features.jsx';
import ProductPreview from '../components/ProductPreview.jsx';
import InsightsEngine from '../components/InsightsEngine.jsx';
import SmartInsightsDemo from '../components/SmartInsightsDemo.jsx';
import LiveDashboard from '../components/LiveDashboard.jsx';
import HowItWorks from '../components/HowItWorks.jsx';
import Industries from '../components/Industries.jsx';
import FutureVision from '../components/FutureVision.jsx';
import Trust from '../components/Trust.jsx';
import Testimonial from '../components/Testimonial.jsx';
import Pricing from '../components/Pricing.jsx';
import FAQ from '../components/FAQ.jsx';
import ClosingCTA from '../components/ClosingCTA.jsx';
import Footer from '../components/Footer.jsx';

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-bg text-slate-200">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[600px] w-[1100px] -translate-x-1/2 rounded-full bg-primary/10 blur-[140px]" />
        <div className="absolute top-[40%] -left-40 h-[500px] w-[500px] rounded-full bg-secondary/10 blur-[140px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <Navbar />
      <main>
        <Hero />
        <LiveStats />
        <BeforeAfter />
        <Features />
        <ProductPreview />
        <InsightsEngine />
        <SmartInsightsDemo />
        <LiveDashboard />
        <HowItWorks />
        <Industries />
        <FutureVision />
        <Trust />
        <Testimonial />
        <Pricing />
        <FAQ />
        <ClosingCTA />
      </main>
      <Footer />
    </div>
  );
}
