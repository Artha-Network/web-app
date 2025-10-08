import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import GetStarted from "./pages/GetStarted";
import Documentation from "./pages/Documentation";
import NotFound from "./pages/NotFound";
import ConnectWalletPage from "./pages/connect-wallet";
import CreateEscrowPage from "./pages/CreateEscrow";
import Deals from "./pages/Deals";
import DealOverview from "./pages/DealOverview";
import EvidenceUpload from "./pages/EvidenceUpload";
import Dispute from "./pages/Dispute";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/get-started" element={<GetStarted />} />
            <Route path="/documentation" element={<Documentation />} />
            <Route path="/connect-wallet" element={<ConnectWalletPage />} />
            <Route path="/create-escrow" element={<CreateEscrowPage />} />
            <Route path="/deals" element={<Deals />} />
            <Route path="/deal/:id" element={<DealOverview />} />
            <Route path="/upload" element={<EvidenceUpload />} />
            <Route path="/dispute/:id" element={<Dispute />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/notifications" element={<Notifications />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
