import React from "react";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import Team from "@/components/Team";
import Footer from "@/components/Footer";

export const Home: React.FC = () => (
  <div className="min-h-screen">
    <Hero />
    <Features />
    <HowItWorks />
    <Team />
    <Footer />
  </div>
);

export default Home;

