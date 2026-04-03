"use client";

import { useParams, useRouter } from "next/navigation";
import {
  Container,
  Paper,
  Title,
  Button,
  Group,
  Text,
  Loader,
} from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";

import UserForm from "@/components/user-form";
import { useUserDetail } from "@/hooks/use-user-detail";
import { UserFormValues } from "@/lib/validators";

export default function EditUserPage() {
  const { id } = useParams();
  const router = useRouter();

  const { data, isLoading } = useUserDetail(Number(id));

  // normalize website
  const normalizeWebsite = (url: string) => {
    if (!url) return "";
    return url.startsWith("http") ? url : "https://" + url;
  };

  const handleSubmit = async (formData: UserFormValues) => {
    console.log("UPDATE:", formData);

    await new Promise((res) => setTimeout(res, 1000));

    alert("Cập nhật thành công!");
    router.push("/users");
  };

  // 🔄 LOADING STATE
  if (isLoading) {
    return (
      <Container size="sm" py="xl">
        <Group justify="center">
          <Loader />
        </Group>
      </Container>
    );
  }

  // ❌ NOT FOUND
  if (!data) {
    return (
      <Container size="sm" py="xl">
        <Text c="red" ta="center">
          User not found
        </Text>
      </Container>
    );
  }

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
          <div>
            <Title order={3}>Chỉnh sửa User</Title>
            <Text size="sm" c="dimmed">
              Cập nhật thông tin người dùng
            </Text>
          </div>
        </Group>

        <UserForm
          defaultValues={{
            name: data.name,
            email: data.email,
            phone: data.phone || "",
            website: normalizeWebsite(data.website || ""),
            company: { name: data.company?.name || "" },
          }}
          onSubmit={handleSubmit}
        />
      </Paper>
    </Container>
  );
}