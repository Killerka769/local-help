// hooks/useAuth.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

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
  email: string | null; 
  emailVerified: boolean; 
  createdAt: string;
  completedCount?: number;
  _count?: {
    requests: number;
    offers: number;
  };
}

export const useAuth = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["auth"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/profile");
        
        if (res.status === 401) {
          return null;
        }
        
        if (!res.ok) {
          throw new Error("Ошибка загрузки");
        }
        
        const data = await res.json();
        return data.user as User;
      } catch (err) {
        return null;
      }
    },
    retry: false,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  const logout = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (!res.ok) {
        throw new Error("Ошибка выхода");
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(["auth"], null);
      queryClient.setQueryData(["profile"], null);
      queryClient.invalidateQueries();
      router.push("/");
    },
  });

  return { user, isLoading, isAuthenticated: !!user, logout, refetch };
};