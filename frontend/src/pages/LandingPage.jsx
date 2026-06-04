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
import { LogoDivider, LogoMarquee } from '../components/LogoMotif.jsx';
import ScrollRail from '../components/ScrollRail.jsx';

const RAIL_SECTIONS = [
  { id: 'hero', label: 'Intro' },
  { id: 'rail-features', label: 'Features' },
  { id: 'rail-insights', label: 'Insights' },
  { id: 'rail-dashboard', label: 'Dashboard' },
  { id: 'solutions', label: 'Industries' },
  { id: 'rail-pricing', label: 'Pricing' },
  { id: 'cta', label: 'Get Started' },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-bg text-slate-200">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[600px] w-[1100px] -translate-x-1/2 rounded-full bg-primary/10 blur-[140px]" />
        <div className="absolute top-[40%] -left-40 h-[500px] w-[500px] rounded-full bg-secondary/10 blur-[140px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <ScrollRail sections={RAIL_SECTIONS} />

      <Navbar />
      <main>
        <Hero />
        <LiveStats />
        <BeforeAfter />
        <LogoDivider />
        <div id="rail-features">
          <Features />
        </div>
        <ProductPreview />
        <div id="rail-insights">
          <InsightsEngine />
          <SmartInsightsDemo />
        </div>
        <LogoMarquee />
        <div id="rail-dashboard">
          <LiveDashboard />
        </div>
        <HowItWorks />
        <Industries />
        <FutureVision />
        <LogoDivider />
        <Trust />
        <Testimonial />
        <div id="rail-pricing">
          <Pricing />
        </div>
        <FAQ />
        <ClosingCTA />
      </main>
      <Footer />
    </div>
  );
}
