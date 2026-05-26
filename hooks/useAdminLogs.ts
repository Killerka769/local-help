import { useQuery } from "@tanstack/react-query";

interface AdminLog {
  id: string;
  adminId: string;
  adminName: string;
  adminRole: string;
  action: string;
  targetType: string;
  targetId: string;
  targetName: string | null;
  details: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

interface AdminLogsResponse {
  logs: AdminLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const useAdminLogs = (page: number = 1, action: string = "") => {
  return useQuery({
    queryKey: ["admin-logs", page, action],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(action && { action }),
      });
      const res = await fetch(`/api/admin/logs?${params}`);
      if (!res.ok) throw new Error("Ошибка загрузки");
      return res.json() as Promise<AdminLogsResponse>;
    },
    enabled: true,
  });
};