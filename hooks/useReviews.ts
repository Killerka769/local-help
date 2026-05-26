// hooks/useReviews.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  fromUser: {
    id: string;
    name: string;
    avatar: string | null;
  };
  request: {
    id: string;
    title: string;
  };
}

export const useUserReviews = (userId: string, page: number = 1) => {
  return useQuery({
    queryKey: ["reviews", userId, page],
    queryFn: async () => {
      const res = await fetch(`/api/reviews/user/${userId}?page=${page}&limit=10`);
      if (!res.ok) throw new Error("Ошибка загрузки");
      return res.json();
    },
    enabled: !!userId,
  });
};

export const useCreateReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { toUserId: string; requestId: string; rating: number; comment?: string }) => {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["reviews", variables.toUserId] });
      queryClient.invalidateQueries({ queryKey: ["user", variables.toUserId] });
      queryClient.invalidateQueries({ queryKey: ["auth"] });
    },
  });
};

export const useUpdateReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reviewId, rating, comment }: { reviewId: string; rating: number; comment?: string }) => {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["auth"] });
    },
  });
};

export const useDeleteReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reviewId: string) => {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["auth"] });
    },
  });
};