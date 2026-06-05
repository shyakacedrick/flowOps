import Navbar from '@/features/marketing/components/Navbar.jsx';
import Hero from '@/features/marketing/components/Hero.jsx';
import LiveStats from '@/features/marketing/components/LiveStats.jsx';
import BeforeAfter from '@/features/marketing/components/BeforeAfter.jsx';
import Features from '@/features/marketing/components/Features.jsx';
import ProductPreview from '@/features/marketing/components/ProductPreview.jsx';
import InsightsEngine from '@/features/smart-insights/components/InsightsEngine.jsx';
import SmartInsightsDemo from '@/features/smart-insights/components/SmartInsightsDemo.jsx';
import LiveDashboard from '@/features/marketing/components/LiveDashboard.jsx';
import HowItWorks from '@/features/marketing/components/HowItWorks.jsx';
import Industries from '@/features/marketing/components/Industries.jsx';
import FutureVision from '@/features/marketing/components/FutureVision.jsx';
import Trust from '@/features/marketing/components/Trust.jsx';
import Testimonial from '@/features/marketing/components/Testimonial.jsx';
import Pricing from '@/features/marketing/components/Pricing.jsx';
import FAQ from '@/features/marketing/components/FAQ.jsx';
import ClosingCTA from '@/features/marketing/components/ClosingCTA.jsx';
import Footer from '@/features/marketing/components/Footer.jsx';
import { LogoDivider, LogoMarquee } from '@/features/marketing/components/LogoMotif.jsx';
import ScrollRail from '@/features/marketing/components/ScrollRail.jsx';

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
