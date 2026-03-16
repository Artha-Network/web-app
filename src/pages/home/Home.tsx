import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useEvent } from "@/hooks/useEvent";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import Team from "@/components/Team";
import Footer from "@/components/Footer";

export const Home: React.FC = () => {
  const { trackEvent } = useEvent();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Track page view on mount
  useEffect(() => {
    trackEvent('view_home');
  }, [trackEvent]);

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <div className="min-h-screen relative">
      {/* Floating dark mode toggle */}
      {mounted && (
        <button
          type="button"
          aria-label="Toggle dark mode"
          onClick={toggleTheme}
          className="fixed top-5 right-5 z-50 flex items-center justify-center rounded-full h-10 w-10 bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-lg transform transition-all duration-300 hover:scale-110 hover:bg-white/20"
        >
          {resolvedTheme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      )}
      <Hero />
      <Features />
      <HowItWorks />
      <Team />
      <Footer />
    </div>
  );
};

export default Home;

