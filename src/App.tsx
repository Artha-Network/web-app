import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Home from "./pages/home/Home";
import Documentation from "./pages/Documentation";
import NotFound from "./pages/NotFound";
import Step1 from "./pages/escrow/Step1";
import Step2 from "./pages/escrow/Step2";
import Step3 from "./pages/escrow/Step3";
import Step4 from "./pages/escrow/Step4";
import Dashboard from "./pages/Dashboard";
import WalletConnectDashboard from "./pages/wallet-connect/WalletConnect";
import Deals from "./pages/Deals";
import DealOverview from "./pages/DealOverview";
import EvidencePage from "./pages/EvidencePage";
import ResolutionPage from "./pages/ResolutionPage";
import EvidenceUpload from "./pages/EvidenceUpload";
import Dispute from "./pages/Dispute";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import { ModalProvider, useModalContext } from "@/context/ModalContext";
import { AuthProvider } from "@/context/AuthContext";
import WalletConnectModal from "@/components/modals/WalletConnectModal";
import ProtectedRoute from "@/components/ProtectedRoute";
import SolanaWalletProvider from "@/providers/SolanaWalletProvider";
import ErrorBoundary from "@/components/ErrorBoundary";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <SolanaWalletProvider>
          <ModalProvider>
            <AuthProvider>
              <BrowserRouter future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true
              }}>
                <ErrorBoundary>
                  <AppWithModal />
                </ErrorBoundary>
              </BrowserRouter>
            </AuthProvider>
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
        <Route path="/" element={<Home />} />
        <Route path="/docs" element={<Documentation />} />

        {/* Wallet connection */}
        <Route path="/wallet-connect" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

        {/* Deal management */}
        <Route path="/deals" element={<ProtectedRoute><Deals /></ProtectedRoute>} />
        <Route path="/deal/:id" element={<ProtectedRoute><DealOverview /></ProtectedRoute>} />

        {/* Escrow flow */}
        <Route path="/escrow/new" element={<ProtectedRoute><Step1 /></ProtectedRoute>} />
        <Route path="/escrow/step2" element={<ProtectedRoute><Step2 /></ProtectedRoute>} />
        <Route path="/escrow/step3" element={<ProtectedRoute><Step3 /></ProtectedRoute>} />
        <Route path="/escrow/step4" element={<ProtectedRoute><Step4 /></ProtectedRoute>} />
        <Route path="/escrow/fund/:id" element={<ProtectedRoute><Step3 /></ProtectedRoute>} />
        <Route path="/resolution/:id" element={<ProtectedRoute><ResolutionPage /></ProtectedRoute>} />

        {/* Disputes & Evidence */}
        <Route path="/dispute/:id" element={<ProtectedRoute><Dispute /></ProtectedRoute>} />
        <Route path="/evidence/:id" element={<ProtectedRoute><EvidencePage /></ProtectedRoute>} />

        {/* Account & Profile */}
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />

        {/* Legacy routes for backward compatibility */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/upload" element={<ProtectedRoute><EvidenceUpload /></ProtectedRoute>} />
        <Route path="/escrow/step1" element={<ProtectedRoute><Step1 /></ProtectedRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

export default App;
