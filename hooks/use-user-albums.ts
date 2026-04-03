import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Album {
  id: number;
  title: string;
}

export const useUserAlbums = (userId: number) => {
  return useQuery<Album[]>({
    queryKey: ["albums", userId],
    queryFn: async () => {
      const res = await api.get(`/users/${userId}/albums`);
      return res.data;
    },
    enabled: !!userId,
  });
};