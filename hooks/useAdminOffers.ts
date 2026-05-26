import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface AdminOffer {
  id: string;
  comment: string;
  status: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    phone: string;
    avatar: string | null;
  };
  request: {
    id: string;
    title: string;
    author: {
      id: string;
      name: string;
      phone: string;
    };
  };
}

interface AdminOffersResponse {
  offers: AdminOffer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const useAdminOffers = (page: number = 1, search: string = "", status: string = "") => {
  return useQuery({
    queryKey: ["admin-offers", page, search, status],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(search && { search }),
        ...(status && { status }),
      });
      const res = await fetch(`/api/admin/offers?${params}`);
      if (!res.ok) throw new Error("Ошибка загрузки");
      return res.json() as Promise<AdminOffersResponse>;
    },
  });
};

export const useDeleteAdminOffer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (offerId: string) => {
      const res = await fetch(`/api/admin/offers/${offerId}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-offers"] });
    },
  });
};