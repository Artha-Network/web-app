import { ArrowRight, Send, Lock, CheckCircle } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      icon: Send,
      title: "Create Escrow",
      description: "Initiate a transaction by creating an escrow contract. Define terms, amount, and participants.",
      step: "01"
    },
    {
      icon: Lock,
      title: "Funds Secured",
      description: "Funds are locked in Solana smart contracts. Both parties receive transaction details and tracking.",
      step: "02"
    },
    {
      icon: CheckCircle,
      title: "Complete or Dispute",
      description: "Upon delivery, funds are released. If disputes arise, AI arbitration provides fair resolution.",
      step: "03"
    }
  ];

  return (
    <section className="py-24 px-6 bg-background">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Simple, secure, and automated. Complete your transactions with confidence in just three steps.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connection lines */}
            <div className="hidden md:block absolute top-24 left-1/3 right-1/3 h-0.5 bg-gradient-to-r from-primary to-secondary" />
            
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="text-center">
                  {/* Step number */}
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-primary text-white font-bold text-lg mb-6 relative z-10">
                    {step.step}
                  </div>
                  
                  {/* Icon */}
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-card shadow-card flex items-center justify-center">
                    <step.icon className="w-10 h-10 text-primary" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-semibold mb-4 text-foreground">
                    {step.title}
                  </h3>
                  
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Arrow for mobile */}
                {index < steps.length - 1 && (
                  <div className="md:hidden flex justify-center mt-8 mb-8">
                    <ArrowRight className="w-6 h-6 text-primary" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Use cases */}
        <div className="mt-20 text-center">
          <h3 className="text-2xl font-semibold mb-8 text-foreground">Perfect For</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {[
              "Used Car Sales",
              "Electronics Trading",
              "Freelance Payments",
              "Rental Deposits",
              "NFT Exchanges",
              "Service Contracts",
              "Gig Economy",
              "Cross-border Trade"
            ].map((useCase, index) => (
              <div 
                key={index}
                className="px-4 py-3 rounded-lg bg-gradient-card border border-border/30 text-sm font-medium text-foreground hover:shadow-card transition-all duration-300"
              >
                {useCase}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;