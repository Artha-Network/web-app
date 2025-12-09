
import React, { useEffect } from "react";
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

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If user has valid session, allow access even if wallet isn't connected yet
  // (they may have refreshed the page and wallet is auto-connecting)
  // Only redirect if they have no session at all
  if (!isAuthenticated) {
    // Store the attempted location so we can redirect back after login
    return <Navigate to="/" state={{ from: location }} replace />;
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
  // The wallet adapter will auto-connect if there's a valid session (handled in SolanaWalletProvider)
  // Components that need wallet will handle the disconnected state gracefully
  return children;
};

export default ProtectedRoute;
