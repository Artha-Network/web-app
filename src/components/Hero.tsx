import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Shield, Zap, Brain } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroBg} 
          alt="Decentralized network visualization"
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/85 to-background/95" />
      </div>
      
      {/* Animated grid overlay */}
      <div className="absolute inset-0 opacity-10">
        <div className="h-full w-full bg-[linear-gradient(to_right,hsl(var(--primary))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--primary))_1px,transparent_1px)] bg-[size:4rem_4rem] animate-pulse" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-bounce">
            <Brain className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">AI-Powered • Decentralized • Secure</span>
          </div>

          {/* Main heading */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Artha Network
          </h1>
          
          <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-foreground">
            Decentralized AI-Powered Escrow
          </h2>

          <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
            The future of peer-to-peer transactions. Secure escrow services powered by Solana blockchain 
            and intelligent AI arbitration. Make any transaction safe, from $10 purchases to major deals.
          </p>

          {/* Feature highlights */}
          <div className="flex flex-wrap justify-center gap-6 mb-12">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card/50 backdrop-blur-sm border border-border/50">
              <Shield className="w-5 h-5 text-success" />
              <span className="text-sm font-medium">Fraud Prevention</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card/50 backdrop-blur-sm border border-border/50">
              <Zap className="w-5 h-5 text-accent" />
              <span className="text-sm font-medium">Instant Settlement</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card/50 backdrop-blur-sm border border-border/50">
              <Brain className="w-5 h-5 text-secondary" />
              <span className="text-sm font-medium">AI Arbitration</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/get-started">
              <Button size="lg" className="bg-gradient-primary hover:shadow-glow transition-all duration-300 group">
                Get Started
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/documentation">
              <Button variant="outline" size="lg" className="border-primary/30 hover:bg-primary/5 transition-all duration-300">
                View Documentation
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">$10+</div>
              <div className="text-sm text-muted-foreground">Minimum Escrow</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-secondary mb-2">&lt;1%</div>
              <div className="text-sm text-muted-foreground">Platform Fee</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent mb-2">24/7</div>
              <div className="text-sm text-muted-foreground">AI Arbitration</div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-primary/20 rounded-full blur-xl animate-pulse" />
      <div className="absolute bottom-32 right-16 w-32 h-32 bg-secondary/20 rounded-full blur-xl animate-pulse delay-1000" />
      <div className="absolute top-1/2 right-8 w-16 h-16 bg-accent/20 rounded-full blur-xl animate-pulse delay-2000" />
    </section>
  );
};

export default Hero;