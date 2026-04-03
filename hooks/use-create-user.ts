import { useMutation, useQueryClient } from "@tanstack/react-query";
import { User } from "@/types/user";
import toast from "react-hot-toast";

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation<User, Error, User>({
    mutationFn: async (data: User) => {
      await new Promise((res) => setTimeout(res, 500)); // mock
      return {
        ...data,
        id: Math.random(), // fake id
      };
    },

    onSuccess: (newUser) => {
      // ✅ update UI ngay
      queryClient.setQueryData<User[]>(["users"], (old) =>
        old ? [newUser, ...old] : [newUser]
      );

      queryClient.invalidateQueries({ queryKey: ["users"] });

      toast.success("Tạo user thành công 🎉");
    },

    onError: () => {
      toast.error("Tạo user thất bại ❌");
    },
  });
};