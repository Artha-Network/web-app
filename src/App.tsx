import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Documentation from "./pages/Documentation";
import NotFound from "./pages/NotFound";
import Step1 from "./pages/escrow/Step1";
import Step2 from "./pages/escrow/Step2";
import Step3 from "./pages/escrow/Step3";
// Removed dedicated connect-wallet page in favor of modal
import Dashboard from "./pages/Dashboard";
import Deals from "./pages/Deals";
import DealOverview from "./pages/DealOverview";
import EvidenceUpload from "./pages/EvidenceUpload";
import Dispute from "./pages/Dispute";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import { ModalProvider, useModalContext } from "@/context/ModalContext";
import WalletConnectModal from "@/components/modals/WalletConnectModal";
import ProtectedRoute from "@/components/ProtectedRoute";
import SolanaWalletProvider from "@/providers/SolanaWalletProvider";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <SolanaWalletProvider>
          <ModalProvider>
            <BrowserRouter>
              <AppWithModal />
            </BrowserRouter>
          </ModalProvider>
        </SolanaWalletProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

const AppWithModal = () => {
  const { walletModalOpen, setWalletModalOpen } = useModalContext();
  return (
    <>
      <WalletConnectModal open={walletModalOpen} onOpenChange={setWalletModalOpen} />
      <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/documentation" element={<Documentation />} />
              {/* Protected routes */}
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/deals" element={<ProtectedRoute><Deals /></ProtectedRoute>} />
              <Route path="/deal/:id" element={<ProtectedRoute><DealOverview /></ProtectedRoute>} />
              <Route path="/upload" element={<ProtectedRoute><EvidenceUpload /></ProtectedRoute>} />
              <Route path="/dispute/:id" element={<ProtectedRoute><Dispute /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />

              {/* Escrow multi-step flow */}
              <Route path="/escrow/step1" element={<ProtectedRoute><Step1 /></ProtectedRoute>} />
              <Route path="/escrow/step2" element={<ProtectedRoute><Step2 /></ProtectedRoute>} />
              <Route path="/escrow/step3" element={<ProtectedRoute><Step3 /></ProtectedRoute>} />

              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

export default App;
