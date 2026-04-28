import { FC, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Diamond, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export interface HeaderBarProps {
  readonly userName: string;
  readonly avatarUrl?: string;
  readonly onNotificationsClick?: () => void;
  readonly onLogout?: () => void;
}

/**
 * HeaderBar
 * Logo, navigation links, notifications bell, and user avatar.
 * Uses Tailwind classes to match provided HTML layout exactly.
 */
export const HeaderBar: FC<HeaderBarProps> = ({
  userName,
  avatarUrl,
  onNotificationsClick,
  onLogout,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [menuOpen]);

  return (
    <header
      className={cn(
        "flex items-center justify-between whitespace-nowrap border-b border-solid border-gray-200 px-10 py-3 bg-white"
      )}
      aria-label="Top navigation bar"
    >
      <Link to="/" className="flex items-center gap-4 text-gray-900 hover:text-blue-600 transition-colors">
        <div className="size-4 text-gray-900" aria-hidden>
          <Diamond className="w-full h-full" />
        </div>
        <h1 className="text-gray-900 text-lg font-bold leading-tight tracking-[-0.015em]">
          Artha Network
        </h1>
      </Link>

      <div className="flex flex-1 justify-end gap-8">
        <nav className="flex items-center gap-9" aria-label="Primary">
          <Link
            to="/dashboard"
            className="text-gray-600 text-sm font-medium leading-normal hover:text-blue-600 transition-colors"
          >
            Dashboard
          </Link>
          <Link
            to="/deals"
            className="text-gray-600 text-sm font-medium leading-normal hover:text-blue-600 transition-colors"
          >
            Deals
          </Link>
          <Link
            to="/profile"
            className="text-gray-600 text-sm font-medium leading-normal hover:text-blue-600 transition-colors"
          >
            Profile
          </Link>
        </nav>

        <button
          type="button"
          aria-label="Open notifications"
          onClick={onNotificationsClick}
          className="relative flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 w-10 bg-blue-50 text-blue-600 shadow-sm transform transition-transform duration-300 hover:scale-105"
        >
          <Bell className="w-5 h-5" />
        </button>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            aria-label="Open account menu"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            <Avatar className="size-10 shadow-sm border-2 border-blue-200">
              <AvatarImage
                src={avatarUrl}
                alt={`${userName} avatar`}
                className="object-cover"
              />
              <AvatarFallback>{userName?.[0] ?? "U"}</AvatarFallback>
            </Avatar>
          </button>
          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-56 rounded-lg border border-gray-200 bg-white shadow-lg z-50 overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="text-xs uppercase tracking-wider text-gray-500">Signed in as</div>
                <div className="text-sm font-semibold text-gray-900 truncate">{userName}</div>
              </div>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onLogout?.();
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default HeaderBar;

