import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface FavoriteRequest {
  id: string;
  title: string;
  description: string;
  address: string;
  budget: number | null;
  deadline: number;
  status: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

interface Favorite {
  id: string;
  requestId: string;
  createdAt: string;
  request: FavoriteRequest;
}

export const useFavorites = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["favorites"],
    queryFn: async () => {
      const res = await fetch("/api/favorites/my");
      if (!res.ok) throw new Error("Ошибка загрузки");
      const json = await res.json();
      return json.favorites as Favorite[];
    },
  });

  const addFavorite = useMutation({
    mutationFn: async (requestId: string) => {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });

  const removeFavorite = useMutation({
    mutationFn: async (requestId: string) => {
      const res = await fetch(`/api/favorites?requestId=${requestId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });

  const isFavorite = (requestId: string) => {
    return data?.some((f) => f.requestId === requestId) || false;
  };

  return {
    favorites: data || [],
    isLoading,
    error,
    addFavorite,
    removeFavorite,
    isFavorite,
  };
};