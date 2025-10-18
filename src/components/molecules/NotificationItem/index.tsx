import { FC, ReactNode } from "react";
import { Card } from "@/components/ui/card";

export interface NotificationItemProps {
  readonly icon: ReactNode;
  readonly title: string;
  readonly date: string;
}

/**
 * NotificationItem
 * Single notification row with icon, title, and date.
 */
export const NotificationItem: FC<NotificationItemProps> = ({ icon, title, date }) => {
  return (
    <Card className="flex items-center gap-4 bg-white rounded-xl px-4 min-h-[72px] py-2 shadow-sm border border-gray-200 transition-transform duration-300 hover:scale-[1.02] hover:shadow-md hover:border-blue-300">
      <div className="text-3xl" aria-hidden>
        {icon}
      </div>
      <div className="flex flex-col justify-center">
        <p className="text-gray-900 text-base font-medium leading-normal line-clamp-1">{title}</p>
        <p className="text-gray-600 text-sm font-normal leading-normal line-clamp-2">{date}</p>
      </div>
    </Card>
  );
};

export default NotificationItem;

