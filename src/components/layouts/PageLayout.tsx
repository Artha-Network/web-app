import { FC, PropsWithChildren } from "react";
import { useAuth } from "@/context/AuthContext";
import { useWallet } from "@solana/wallet-adapter-react";
import HeaderBar from "@/components/organisms/HeaderBar";
import { useNavigate } from "react-router-dom";

export interface PageLayoutProps extends PropsWithChildren {
  showHeader?: boolean;
}

/**
 * PageLayout
 * Wraps pages with a consistent header and layout.
 * Used for all protected pages that need navigation.
 */
export const PageLayout: FC<PageLayoutProps> = ({ 
  children, 
  showHeader = true 
}) => {
  const { user } = useAuth();
  const { publicKey } = useWallet();
  const navigate = useNavigate();

  // Get user name from auth context or wallet address
  const userName = user?.name || user?.displayName || 
    (publicKey ? `${publicKey.toBase58().slice(0, 6)}…${publicKey.toBase58().slice(-4)}` : "User");

  const handleNotificationsClick = () => {
    navigate("/notifications");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {showHeader && (
        <HeaderBar 
          userName={userName} 
          onNotificationsClick={handleNotificationsClick}
        />
      )}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};

export default PageLayout;

