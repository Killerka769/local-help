// hooks/useAdminRequests.ts
import { useQuery } from "@tanstack/react-query";

interface AdminRequest {
  id: string;
  title: string;
  budget: number | null;
  status: string;
  createdAt: string;
  author: { name: string; phone: string };
  city: { name: string } | null;
  _count: { offers: number };
}

interface AdminRequestsResponse {
  requests: AdminRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const useAdminRequests = (page: number = 1, search: string = "", status: string = "") => {
  return useQuery({
    queryKey: ["admin-requests", page, search, status],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(search && { search }),
        ...(status && { status }),
      });
      const res = await fetch(`/api/admin/requests?${params}`);
      if (!res.ok) throw new Error("Ошибка загрузки");
      return res.json() as Promise<AdminRequestsResponse>;
    },
  });
};