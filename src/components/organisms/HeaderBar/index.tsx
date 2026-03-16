import { FC, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Diamond, Sun, Moon, BarChart3, History } from "lucide-react";
import { useTheme } from "next-themes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export interface HeaderBarProps {
  readonly userName: string;
  readonly avatarUrl?: string;
  readonly onNotificationsClick?: () => void;
}

/**
 * HeaderBar
 * Logo, navigation links, dark mode toggle, notifications bell, and user avatar.
 */
export const HeaderBar: FC<HeaderBarProps> = ({
  userName,
  avatarUrl,
  onNotificationsClick,
}) => {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <header
      className={cn(
        "flex items-center justify-between whitespace-nowrap border-b border-solid border-gray-200 dark:border-gray-700 px-10 py-3 bg-white dark:bg-gray-900"
      )}
      aria-label="Top navigation bar"
    >
      <Link to="/" className="flex items-center gap-4 text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
        <div className="size-4 text-gray-900 dark:text-gray-100" aria-hidden>
          <Diamond className="w-full h-full" />
        </div>
        <h1 className="text-gray-900 dark:text-gray-100 text-lg font-bold leading-tight tracking-[-0.015em]">
          Artha Network
        </h1>
      </Link>

      <div className="flex flex-1 justify-end gap-8">
        <nav className="flex items-center gap-9" aria-label="Primary">
          <Link
            to="/dashboard"
            className="text-gray-600 dark:text-gray-300 text-sm font-medium leading-normal hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            Dashboard
          </Link>
          <Link
            to="/deals"
            className="text-gray-600 dark:text-gray-300 text-sm font-medium leading-normal hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            Deals
          </Link>
          <Link
            to="/analytics"
            className="text-gray-600 dark:text-gray-300 text-sm font-medium leading-normal hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Analytics
          </Link>
          <Link
            to="/transactions"
            className="text-gray-600 dark:text-gray-300 text-sm font-medium leading-normal hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1"
          >
            <History className="w-3.5 h-3.5" />
            History
          </Link>
          <Link
            to="/profile"
            className="text-gray-600 dark:text-gray-300 text-sm font-medium leading-normal hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            Profile
          </Link>
        </nav>

        <button
          type="button"
          aria-label="Toggle dark mode"
          onClick={toggleTheme}
          className="relative flex cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 w-10 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 shadow-sm transform transition-transform duration-300 hover:scale-105"
        >
          {mounted && (resolvedTheme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />)}
        </button>

        <button
          type="button"
          aria-label="Open notifications"
          onClick={onNotificationsClick}
          className="relative flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 w-10 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm transform transition-transform duration-300 hover:scale-105"
        >
          <Bell className="w-5 h-5" />
        </button>

        <Avatar className="size-10 shadow-sm border-2 border-blue-200 dark:border-blue-700">
          <AvatarImage
            src={avatarUrl}
            alt={`${userName} avatar`}
            className="object-cover"
          />
          <AvatarFallback>{userName?.[0] ?? "U"}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
};

export default HeaderBar;

