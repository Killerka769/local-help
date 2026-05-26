// hooks/useAdminUsers.ts
import { useQuery } from "@tanstack/react-query";

export interface AdminUser {
  id: string;
  name: string;
  phone: string;
  role: "USER" | "ADMIN" | "SUPER_ADMIN";
  isBlocked: boolean;
  blockedReason?: string;
  blockedUntil?: string;
  createdAt: string;
  _count: {
    requests: number;
    offers: number;
  };
}

interface AdminUsersResponse {
  users: AdminUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const useAdminUsers = (page: number = 1, search: string = "") => {
  return useQuery({
    queryKey: ["admin-users", page, search],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users?page=${page}&limit=20&search=${search}`);
      if (!res.ok) throw new Error("Ошибка загрузки");
      return res.json() as Promise<AdminUsersResponse>;
    },
  });
};