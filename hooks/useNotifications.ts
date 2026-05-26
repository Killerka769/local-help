import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const useNotifications = (page: number = 1) => {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["notifications", page],
    queryFn: async () => {
      const res = await fetch(`/api/notifications?page=${page}&limit=20`);
      if (!res.ok) throw new Error("Ошибка загрузки");
      return res.json() as Promise<NotificationsResponse>;
    },
  });

  const markAsRead = useMutation({
    mutationFn: async (id: string | "all") => {
      const res = await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Ошибка");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const unreadCount = data?.notifications?.filter((n) => !n.isRead).length || 0;

  return {
    notifications: data?.notifications || [],
    pagination: data?.pagination || { page: 1, limit: 20, total: 0, pages: 0 },
    unreadCount,
    isLoading,
    error,
    markAsRead,
  };
};