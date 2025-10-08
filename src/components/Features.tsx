import { Shield, Brain, Zap, Globe, DollarSign, Users } from "lucide-react";
import { Card } from "@/components/ui/card";

const Features = () => {
  const features = [
    {
      icon: Shield,
      title: "Blockchain Security",
      description: "Your funds are secured on Solana blockchain with program-owned vaults. No single point of failure.",
      color: "text-success"
    },
    {
      icon: Brain,
      title: "AI Arbitration",
      description: "Advanced AI agents provide transparent dispute resolution with clear rationale for every decision.",
      color: "text-secondary"
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Complete transactions in seconds with automated smart contract execution and instant notifications.",
      color: "text-accent"
    },
    {
      icon: DollarSign,
      title: "Micro-Escrow Ready",
      description: "Affordable escrow for transactions as low as $10. Perfect for everyday P2P commerce.",
      color: "text-primary"
    },
    {
      icon: Globe,
      title: "Global Access",
      description: "Cross-border transactions with stablecoin support. No geographical restrictions or currency barriers.",
      color: "text-secondary"
    },
    {
      icon: Users,
      title: "Reputation System",
      description: "Build portable reputation across marketplaces. Your trust score follows you everywhere.",
      color: "text-accent"
    }
  ];

  return (
    <section className="py-24 px-6 bg-gradient-card">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Revolutionary Features
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Experience the next generation of escrow services with cutting-edge blockchain technology and AI automation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="p-8 bg-card/80 backdrop-blur-sm border-border/50 hover:shadow-card transition-all duration-300 hover:-translate-y-2 group"
            >
              <div className={`w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className={`w-6 h-6 text-white`} />
              </div>
              
              <h3 className="text-xl font-semibold mb-4 text-foreground">
                {feature.title}
              </h3>
              
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;