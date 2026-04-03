import { useMutation, useQueryClient } from "@tanstack/react-query";
import { User } from "@/types/user";
import toast from "react-hot-toast";

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation<number, Error, number, { previousUsers?: User[] }>({
    mutationFn: async (id: number) => {
      await new Promise((res) => setTimeout(res, 500));
      return id;
    },

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["users"] });

      const previousUsers = queryClient.getQueryData<User[]>(["users"]);

      queryClient.setQueryData<User[]>(["users"], (old) =>
        old ? old.filter((user) => user.id !== id) : []
      );

      return { previousUsers };
    },

    onError: (_err, _id, context) => {
      if (context?.previousUsers) {
        queryClient.setQueryData(["users"], context.previousUsers);
      }
      toast.error("Xóa thất bại ❌");
    },

    onSuccess: () => {
      toast.success("Xóa thành công 🗑️");
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};