import { useQuery } from "@tanstack/react-query";

interface City {
  id: string;
  name: string;
  region: string | null;
}

export const useCities = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["cities"],
    queryFn: async () => {
      const res = await fetch("/api/cities");
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Ошибка загрузки городов");
      }
      const json = await res.json();
      return json.cities as City[];
    },
    staleTime: 1000 * 60 * 10, // 10 минут
  });

  return { cities: data || [], isLoading, error };
};