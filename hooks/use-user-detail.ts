import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { User } from "@/types/user";

export const useUserDetail = (id: number) => {
  return useQuery<User>({
    queryKey: ["user", id],
    queryFn: async () => {
      const res = await api.get(`/users/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
};