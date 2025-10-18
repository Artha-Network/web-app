import React from "react";
import { Navigate } from "react-router-dom";
import { useWallet } from "@/hooks/useWallet";

export interface ProtectedRouteProps {
  children: React.ReactElement;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { connected } = useWallet();
  if (!connected) return <Navigate to="/" replace />;
  return children;
};

export default ProtectedRoute;
