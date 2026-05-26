import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface MyReview {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  toUser: {
    id: string;
    name: string;
    avatar: string | null;
  };
  request: {
    id: string;
    title: string;
  };
}

export const useMyReviews = (page: number = 1) => {
  return useQuery({
    queryKey: ["my-reviews", page],
    queryFn: async () => {
      const res = await fetch(`/api/reviews/my?page=${page}&limit=10`);
      if (!res.ok) throw new Error("Ошибка загрузки");
      return res.json();
    },
  });
};

export const useUpdateMyReview = () => {
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });
};

export const useDeleteMyReview = () => {
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
      queryClient.invalidateQueries({ queryKey: ["my-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });
};