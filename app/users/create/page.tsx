"use client";

import { useRouter } from "next/navigation";
import {
  Container,
  Paper,
  Title,
  Button,
  Group,
} from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";

import UserForm from "@/components/user-form";
import { UserFormValues } from "@/lib/validators";
import { useCreateUser } from "@/hooks/use-create-user";

export default function CreateUserPage() {
  const router = useRouter();
  const createUser = useCreateUser();

  const handleSubmit = (data: UserFormValues) => {
    createUser.mutate(
      {
        ...data,
        id: Date.now(),
      },
      {
        onSuccess: () => {
          router.push("/users");
        },
      }
    );
  };

  return (
    <Container size="sm" py="xl">
      {/* BACK BUTTON */}
      <Button
        variant="subtle"
        leftSection={<IconArrowLeft size={16} />}
        mb="md"
        onClick={() => router.push("/users")}
      >
        Quay lại
      </Button>

      {/* CARD */}
      <Paper shadow="md" radius="lg" p="xl" withBorder>
        <Group justify="space-between" mb="md">
          <Title order={3}>Tạo User</Title>
        </Group>

        <UserForm
          onSubmit={handleSubmit}
          isLoading={createUser.isPending}
        />
      </Paper>
    </Container>
  );
}