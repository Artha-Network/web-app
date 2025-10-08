import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const Team = () => {
  const teamMembers = [
    {
      name: "Birochan Mainali",
      id: "11837296",
      role: "Lead Developer",
      specialties: ["Blockchain", "Smart Contracts", "Solana"]
    },
    {
      name: "Bijay Prasai",
      role: "AI Specialist",
      specialties: ["Machine Learning", "Dispute Resolution", "LLM Integration"]
    },
    {
      name: "Tanchopa Limbu Samba",
      role: "Backend Engineer",
      specialties: ["API Design", "Database", "Security"]
    },
    {
      name: "Sampada Dhungana",
      role: "Frontend Developer",
      specialties: ["UI/UX", "Web3 Integration", "User Experience"]
    }
  ];

  return (
    <section className="py-24 px-6 bg-gradient-card">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <span className="text-sm font-medium text-primary">University of North Texas • Fall 2025</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Team Tylenol Plus
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            CSCE 4901 Capstone Project - Building the future of decentralized escrow services
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {teamMembers.map((member, index) => (
            <Card 
              key={index}
              className="p-6 bg-card/80 backdrop-blur-sm border-border/50 hover:shadow-card transition-all duration-300 hover:-translate-y-2 text-center group"
            >
              {/* Avatar placeholder */}
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-primary flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                <span className="text-2xl font-bold text-white">
                  {member.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>

              <h3 className="text-lg font-semibold mb-2 text-foreground">
                {member.name}
              </h3>

              {member.id && (
                <p className="text-xs text-muted-foreground mb-3 font-mono">
                  ID: {member.id}
                </p>
              )}

              <p className="text-primary font-medium mb-4">
                {member.role}
              </p>

              <div className="flex flex-wrap gap-1 justify-center">
                {member.specialties.map((specialty, idx) => (
                  <Badge 
                    key={idx} 
                    variant="secondary" 
                    className="text-xs bg-secondary/10 text-secondary border-secondary/20"
                  >
                    {specialty}
                  </Badge>
                ))}
              </div>
            </Card>
          ))}
        </div>

        {/* Project info */}
        <div className="mt-16 text-center">
          <Card className="p-8 bg-card/80 backdrop-blur-sm border-border/50 max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold mb-4 text-foreground">
              Capstone Project Overview
            </h3>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Artha Network represents a comprehensive solution to trust and transparency challenges 
              in peer-to-peer transactions, combining cutting-edge blockchain technology with 
              artificial intelligence for automated dispute resolution.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-1">Solana</div>
                <div className="text-sm text-muted-foreground">Blockchain</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary mb-1">AI/ML</div>
                <div className="text-sm text-muted-foreground">Arbitration</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent mb-1">Web3</div>
                <div className="text-sm text-muted-foreground">Integration</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Team;