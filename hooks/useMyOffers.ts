import { useQuery } from "@tanstack/react-query";

interface Offer {
  id: string;
  comment: string;
  status: string;
  createdAt: string;
  request: {
    id: string;
    title: string;
    address: string;
    budget: number | null;
    author: {
      phone: string | null;
    };
  };
}

interface MyOffersResponse {
  offers: Offer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const useMyOffers = (page: number = 1, status: string = "all") => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["my-offers", page, status],
    queryFn: async () => {
      const res = await fetch(`/api/my-offers?page=${page}&limit=10&status=${status}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Ошибка загрузки");
      }
      return res.json() as Promise<MyOffersResponse>;
    },
  });

  return {
    offers: data?.offers || [],
    pagination: data?.pagination || { page: 1, limit: 10, total: 0, pages: 0 },
    isLoading,
    error,
    refetch,
  };
};