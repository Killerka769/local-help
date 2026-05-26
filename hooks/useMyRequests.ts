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

export const useMyRequests = (page: number = 1, limit: number = 10, status: string = "active") => {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["my-requests", page, limit, status],
    queryFn: async () => {
      const res = await fetch(`/api/my-requests?page=${page}&limit=${limit}&status=${status}`);
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Ошибка загрузки");
      }
      
      const json = await res.json();
      
      if (!json.requests) {
        throw new Error("Неверный формат ответа");
      }
      
      return json;
    },
  });

  const deleteRequest = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/requests/${id}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-requests"] });
    },
  });

  return {
    requests: data?.requests || [],
    pagination: data?.pagination || { page: 1, limit: 10, total: 0, pages: 0 },
    isLoading,
    error,
    refetch,
    deleteRequest,
  };
};