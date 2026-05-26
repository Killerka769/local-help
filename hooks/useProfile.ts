import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface User {
  id: string;
  name: string;
  phone: string;
  avatar: string | null;
  description: string | null;
  cityId: string;
  role: "USER" | "ADMIN" | "SUPER_ADMIN";
  isBlocked: boolean;
  rating: number;
  createdAt: string;
}

export const useProfile = () => {
  const queryClient = useQueryClient();

  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await fetch("/api/profile");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Ошибка загрузки профиля");
      }
      const data = await res.json();
      return data.user as User;
    },
    retry: 1,
  });

  const updateProfile = useMutation({
    mutationFn: async (data: Partial<User>) => {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.error || "Ошибка обновления");
      }
      
      return result.user as User;
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["profile"], updatedUser);
      queryClient.setQueryData(["auth"], updatedUser);
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  return { user, isLoading, error, updateProfile, refetch };
};