
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

export interface ProtectedRouteProps {
  children: React.ReactElement;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // New users must complete profile setup first
  const isNewUser = user?.isNewUser ?? false;
  const isProfilePage = location.pathname === '/profile';

  if (isNewUser && !isProfilePage) {
    return <Navigate to="/profile" state={{ from: location, requireSetup: true }} replace />;
  }

  // Authenticated — allow access. Wallet connection is handled by individual pages.
  return children;
};

export default ProtectedRoute;
