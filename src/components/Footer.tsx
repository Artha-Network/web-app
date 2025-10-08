import { Button } from "@/components/ui/button";
import { Github, Twitter, LinkedinIcon, Mail } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground py-16 px-6">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
              Artha Network
            </h3>
            <p className="text-primary-foreground/80 mb-6 max-w-md">
              Revolutionizing peer-to-peer transactions with decentralized AI-powered escrow services. 
              Built on Solana blockchain for maximum security and efficiency.
            </p>
            <div className="flex gap-4">
              <Button variant="ghost" size="sm" className="text-primary-foreground/80 hover:text-white hover:bg-white/10">
                <Github className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-primary-foreground/80 hover:text-white hover:bg-white/10">
                <Twitter className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-primary-foreground/80 hover:text-white hover:bg-white/10">
                <LinkedinIcon className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-primary-foreground/80 hover:text-white hover:bg-white/10">
                <Mail className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Platform</h4>
            <ul className="space-y-2 text-primary-foreground/80">
              <li><a href="#" className="hover:text-white transition-colors">How It Works</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-white transition-colors">API Documentation</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Support</h4>
            <ul className="space-y-2 text-primary-foreground/80">
              <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Developer Docs</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Status Page</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom section */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="text-primary-foreground/60 text-sm mb-4 md:mb-0">
            <p>© 2025 Artha Network. University of North Texas Capstone Project.</p>
            <p className="mt-1">Team Tylenol Plus • CSCE 4901 • Fall 2025</p>
          </div>
          
          <div className="flex gap-6 text-sm text-primary-foreground/60">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;