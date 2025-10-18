import { FC } from "react";
import NotificationItem, {
  NotificationItemProps,
} from "@/components/molecules/NotificationItem";

export interface NotificationsListProps {
  readonly items: ReadonlyArray<NotificationItemProps & { id: string }>;
}

/**
 * NotificationsList
 * Renders a vertical list of NotificationItem components.
 */
export const NotificationsList: FC<NotificationsListProps> = ({ items }) => {
  return (
    <div className="flex flex-col gap-3">
      {items.map((n) => (
        <NotificationItem key={n.id} icon={n.icon} title={n.title} date={n.date} />
      ))}
    </div>
  );
};

export default NotificationsList;

