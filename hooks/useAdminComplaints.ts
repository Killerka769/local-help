// hooks/useAdminComplaints.ts
import { useQuery } from "@tanstack/react-query";

interface AdminComplaint {
  id: string;
  reason: string;
  description: string;
  status: string;
  createdAt: string;
  user: { id: string; name: string; phone: string };
  targetType: string;
  targetId: string;
  target: any;
}

interface AdminComplaintsResponse {
  complaints: AdminComplaint[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const useAdminComplaints = (page: number = 1, status: string = "") => {
  return useQuery({
    queryKey: ["admin-complaints", page, status],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(status && { status }),
      });
      const res = await fetch(`/api/admin/complaints?${params}`);
      if (!res.ok) throw new Error("Ошибка загрузки");
      return res.json() as Promise<AdminComplaintsResponse>;
    },
  });
};