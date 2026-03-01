
import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";

export interface ProtectedRouteProps {
  children: React.ReactElement;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { connected, connecting } = useWallet();
  const location = useLocation();
  const [waitingForWallet, setWaitingForWallet] = useState(true);

  // Grace period for wallet auto-connect
  useEffect(() => {
    if (isAuthenticated && !connected && !connecting) {
      // Give wallet 2 seconds to auto-connect
      const timer = setTimeout(() => {
        setWaitingForWallet(false);
      }, 2000);
      return () => clearTimeout(timer);
    } else if (connected) {
      // Wallet is connected, no need to wait
      setWaitingForWallet(false);
    }
  }, [isAuthenticated, connected, connecting]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Check authentication and wallet connection
  // Allow a grace period for wallet auto-connect to complete
  if (!isAuthenticated || (!connected && !waitingForWallet && !connecting)) {
    // Store the attempted location so we can redirect back after login
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Still waiting for wallet to auto-connect - show loading
  if (isAuthenticated && !connected && (waitingForWallet || connecting)) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Check if user is new (doesn't exist in database yet)
  // Only new users should be forced to complete profile setup
  // Existing users (wallet found in DB) should be allowed to access dashboard
  const isNewUser = user?.isNewUser ?? false;
  const isProfilePage = location.pathname === '/profile';

  if (isNewUser && !isProfilePage) {
    // New user (wallet not in database) - redirect to profile to set up account
    return <Navigate to="/profile" state={{ from: location, requireSetup: true }} replace />;
  }

  // If authenticated, allow access regardless of wallet connection status
  // Wallet connection is manual - user must explicitly click "Connect Wallet" and choose a wallet
  // Components that need wallet will handle the disconnected state gracefully
  return children;
};

export default ProtectedRoute;
