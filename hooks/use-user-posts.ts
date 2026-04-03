import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Post {
  id: number;
  title: string;
  body: string;
}

export const useUserPosts = (userId: number) => {
  return useQuery<Post[]>({
    queryKey: ["posts", userId],
    queryFn: async () => {
      const res = await api.get(`/users/${userId}/posts`);
      return res.data;
    },
    enabled: !!userId,
  });
};