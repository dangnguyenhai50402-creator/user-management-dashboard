import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { User } from "@/types/user";

export const useUsers = () => {
  return useQuery<User[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await api.get("/users");
      return res.data;
    },
  });
};