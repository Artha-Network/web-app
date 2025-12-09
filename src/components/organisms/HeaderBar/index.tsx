import { FC } from "react";
import { Link } from "react-router-dom";
import { Bell, Diamond } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export interface HeaderBarProps {
  readonly userName: string;
  readonly avatarUrl?: string;
  readonly onNotificationsClick?: () => void;
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
}) => {
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

        <Avatar className="size-10 shadow-sm border-2 border-blue-200">
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

