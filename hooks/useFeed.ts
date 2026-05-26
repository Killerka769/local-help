import { useQuery } from "@tanstack/react-query";

interface Author {
  id: string;
  name: string;
  avatar: string | null;
}

interface City {
  id: string;
  name: string;
}

interface FeedRequest {
  id: string;
  title: string;
  description: string;
  address: string;
  budget: number | null;
  deadline: number;
  status: string;
  createdAt: string;
  author: Author;
  city: City;
}

interface FeedResponse {
  requests: FeedRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  currentCityId: string | null;
}

interface Filters {
  deadline: "all" | "3" | "7" | "30";
  budgetMin: string;
  budgetMax: string;
  sortBy: "date" | "budget_asc" | "budget_desc";
  search: string;
  city: string;
}

export const useFeed = (page: number = 1, limit: number = 12, filters: Filters) => {
  const { data, isLoading, error, refetch } = useQuery<FeedResponse>({
    queryKey: ["feed", page, limit, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        deadline: filters.deadline,
        sortBy: filters.sortBy,
        search: filters.search,
        city: filters.city,
      });

      if (filters.budgetMin) params.append("budgetMin", filters.budgetMin);
      if (filters.budgetMax) params.append("budgetMax", filters.budgetMax);

      const res = await fetch(`/api/feed?${params}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Ошибка загрузки");
      }
      return res.json();
    },
    staleTime: 5000,
  });

  return {
    requests: data?.requests || [],
    pagination: data?.pagination || { page: 1, limit: 12, total: 0, pages: 0 },
    currentCityId: data?.currentCityId,
    isLoading,
    error,
    refetch,
  };
};