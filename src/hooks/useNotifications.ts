import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";

const ACTIONS_BASE_URL = import.meta.env.VITE_ACTIONS_SERVER_URL || "http://localhost:4000";

export interface NotificationItem {
  id: string;
  title: string;
  body: string | null;
  type: string;
  deal_id: string | null;
  is_read: boolean;
  created_at: string;
}

interface NotificationsResponse {
  notifications: NotificationItem[];
  total: number;
  unread_count: number;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${ACTIONS_BASE_URL}${path}`, {
    credentials: "include",
    ...init,
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error((payload as { error?: string }).error ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export function useNotifications(opts?: { unreadOnly?: boolean }) {
  const { publicKey } = useWallet();
  const walletAddress = publicKey?.toBase58();

  return useQuery<NotificationsResponse>({
    queryKey: ["notifications", walletAddress, opts?.unreadOnly],
    queryFn: () =>
      apiFetch<NotificationsResponse>(
        `/api/notifications?wallet_address=${walletAddress}&limit=50${opts?.unreadOnly ? "&unread_only=true" : ""}`
      ),
    enabled: Boolean(walletAddress),
    staleTime: 30_000,
    refetchInterval: 60_000, // poll every minute
  });
}

export function useUnreadCount() {
  const { data } = useNotifications({ unreadOnly: false });
  return data?.unread_count ?? 0;
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  const { publicKey } = useWallet();
  const walletAddress = publicKey?.toBase58();

  return useMutation({
    mutationFn: (notificationId: string) =>
      apiFetch(`/api/notifications/${notificationId}/read`, { method: "PATCH" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", walletAddress] });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  const { publicKey } = useWallet();
  const walletAddress = publicKey?.toBase58();

  return useMutation({
    mutationFn: () =>
      apiFetch(`/api/notifications/mark-all-read?wallet_address=${walletAddress}`, {
        method: "PATCH",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", walletAddress] });
    },
  });
}
