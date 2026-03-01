import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Banknote,
  Gavel,
  CheckCircle2,
  Info,
  Loader,
  ArrowRight,
} from "lucide-react";
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from "@/hooks/useNotifications";

function getIcon(type: string) {
  switch (type) {
    case "deal":
      return <Banknote className="w-5 h-5 text-green-600" />;
    case "dispute":
      return <Gavel className="w-5 h-5 text-red-600" />;
    case "resolution":
      return <CheckCircle2 className="w-5 h-5 text-blue-600" />;
    default:
      return <Info className="w-5 h-5 text-muted-foreground" />;
  }
}

const Notifications: React.FC = () => {
  const { data, isLoading } = useNotifications();
  const { mutate: markAsRead } = useMarkAsRead();
  const { mutate: markAllAsRead, isPending: isMarkingAll } = useMarkAllAsRead();

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unread_count ?? 0;

  return (
    <div className="container mx-auto px-4 py-8 space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          {unreadCount > 0 && (
            <Badge variant="destructive">{unreadCount} unread</Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllAsRead()}
            disabled={isMarkingAll}
          >
            {isMarkingAll ? (
              <Loader className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            Mark all as read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <Loader className="w-8 h-8 mx-auto text-muted-foreground animate-spin mb-3" />
          <p className="text-muted-foreground">Loading notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <h2 className="text-lg font-semibold mb-1">No notifications yet</h2>
          <p className="text-muted-foreground">
            You'll be notified when deals are funded, disputes are opened, and resolutions are
            ready.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <Card
              key={n.id}
              className={`transition-opacity ${n.is_read ? "opacity-60" : ""}`}
              onClick={() => !n.is_read && markAsRead(n.id)}
              style={{ cursor: n.is_read ? "default" : "pointer" }}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getIcon(n.type)}</div>
                    <div>
                      <CardTitle className="text-sm font-semibold">{n.title}</CardTitle>
                      {n.body && (
                        <p className="text-sm text-muted-foreground mt-0.5">{n.body}</p>
                      )}
                    </div>
                  </div>
                  {!n.is_read && (
                    <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {new Date(n.created_at).toLocaleString()}
                  </span>
                  {n.deal_id && (
                    <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                      <Link to={`/deal/${n.deal_id}`} onClick={(e) => e.stopPropagation()}>
                        View Deal <ArrowRight className="w-3 h-3 ml-1" />
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
