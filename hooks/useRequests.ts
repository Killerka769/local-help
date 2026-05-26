import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Request {
  id: string;
  title: string;
  description: string;
  address: string;
  budget: number | null;
  deadline: number;
  status: string;
  authorId: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

interface CreateRequestData {
  title: string;
  description: string;
  address: string;
  budget?: number;
  deadline: number;
}

export const useRequests = (page: number = 1, limit: number = 10) => {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["requests", page, limit],
    queryFn: async () => {
      const res = await fetch(`/api/requests?page=${page}&limit=${limit}`);
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Ошибка загрузки заявок");
      }
      
      const json = await res.json();
      
      // Проверяем структуру ответа
      if (!json.requests) {
        throw new Error("Неверный формат ответа от сервера");
      }
      
      return json;
    },
  });

  const createRequest = useMutation({
    mutationFn: async (data: CreateRequestData) => {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Ошибка создания заявки");
      }
      return result.request;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      queryClient.invalidateQueries({ queryKey: ["my-requests"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  return {
    requests: data?.requests || [],
    pagination: data?.pagination || { page: 1, limit: 10, total: 0, pages: 0 },
    isLoading,
    error,
    createRequest,
  };
};