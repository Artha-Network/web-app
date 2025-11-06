import React, { useEffect } from "react";
import { useEvent } from "@/hooks/useEvent";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import Team from "@/components/Team";
import Footer from "@/components/Footer";

export const Home: React.FC = () => {
  const { trackEvent } = useEvent();

  // Track page view on mount
  useEffect(() => {
    trackEvent('view_home');
  }, [trackEvent]);

  return (
    <div className="min-h-screen">
      <Hero />
      <Features />
      <HowItWorks />
      <Team />
      <Footer />
    </div>
  );
};

export default Home;

