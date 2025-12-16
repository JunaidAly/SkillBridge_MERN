import Header from '../components/LandingPage/Header';
import Footer from '../components/LandingPage/Footer';
import Hero from '../components/LandingPage/Hero';
import Features from '../components/LandingPage/Features';
import HowItWorks from '../components/LandingPage/HowItWorks';
import CTA from '../components/LandingPage/CTA';

function LandingPage() {
  return (
    <div className="min-h-screen bg-light-bg flex flex-col">
      <Header />
      <main className="grow">
        <Hero />
        <Features />
        <HowItWorks />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

export default LandingPage;
