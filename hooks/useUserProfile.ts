import { useQuery } from "@tanstack/react-query";

interface UserProfile {
  id: string;
  name: string;
  avatar: string | null;
  description: string | null;
  cityId: string;
  cityName: string;
  email: string | null; 
  emailVerified: boolean; 
  createdAt: string;
  completedCount: number;
  isBlocked: boolean;
  blockedReason?: string | null;
  blockedUntil?: string | null;
  blockedBy?: string | null;
  blockedByName?: string | null;
  role: string;
  rating: number;
  _count: {
    requests: number;
    offers: number;
  };
}

interface ActiveRequest {
  id: string;
  title: string;
  description: string;
  address: string;
  budget: number | null;
  deadline: number;
  status: string;
  createdAt: string;
  city: { name: string } | null;
  _count: {
    offers: number;
  };
}

interface UserProfileResponse {
  user: UserProfile;
  activeRequests: ActiveRequest[];
}

export const useUserProfile = (userId: string) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["user", userId],
    queryFn: async () => {
      const res = await fetch(`/api/users/${userId}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Ошибка загрузки профиля");
      }
      const json = await res.json();
      return json as UserProfileResponse;
    },
    enabled: !!userId,
  });

  return { 
    user: data?.user, 
    activeRequests: data?.activeRequests || [],
    isLoading, 
    error 
  };
};