"use client";

import {
  Table,
  Group,
  Text,
  Badge,
  Avatar,
  ActionIcon,
  Anchor,
  TextInput,
  Select,
  Button,
} from "@mantine/core";

import { IconPencil, IconTrash, IconSearch, IconEye } from "@tabler/icons-react";

import { useUsers } from "@/hooks/use-users";
import { useDeleteUser } from "@/hooks/use-delete-user";
import { useDebounce } from "@/hooks/use-debounce";
import Link from "next/link";
import { useMemo, useState } from "react";

type SortType = "name-asc" | "name-desc" | "company";

const jobColors: Record<string, string> = {
  engineer: "blue",
  manager: "cyan",
  designer: "pink",
};

export default function UserTable() {
  const { data, isLoading, isError } = useUsers();
  const deleteUser = useDeleteUser();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [sort, setSort] = useState<SortType>("name-asc");

  const finalUsers = useMemo(() => {
    if (!data) return [];

    const keyword = debouncedSearch.toLowerCase();

    let result = data.filter(
      (user) =>
        user.name.toLowerCase().includes(keyword) ||
        user.email.toLowerCase().includes(keyword)
    );

    result = [...result].sort((a, b) => {
      switch (sort) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "company":
          return (a.company?.name || "").localeCompare(
            b.company?.name || ""
          );
        default:
          return 0;
      }
    });

    return result;
  }, [data, debouncedSearch, sort]);

  const handleDelete = (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa user?")) return;
    deleteUser.mutate(id);
  };

  if (isLoading) return <p className="p-6">Loading...</p>;
  if (isError) return <p className="p-6">Error...</p>;

  const rows = finalUsers.map((user) => {
    const company = user.company?.name || "Employee";

    return (
      <Table.Tr key={user.id}>
        {/* NAME */}
        <Table.Td>
          <Group gap="sm">
            <Avatar radius="xl">
              {user.name.charAt(0)}
            </Avatar>
            <Text fw={500}>{user.name}</Text>
          </Group>
        </Table.Td>

        {/* Company */}
        <Table.Td>
          <Badge
            color={jobColors[company.toLowerCase()] || "gray"}
            variant="light"
          >
            {company}
          </Badge>
        </Table.Td>

        {/* EMAIL */}
        <Table.Td>
          <Anchor
            size="sm"
            href={`mailto:${user.email}`}
          >
            {user.email}
          </Anchor>
        </Table.Td>

        {/* WEBSITE */}
        <Table.Td>
          {user.website ? (
            <Anchor href={user.website} target="_blank">
              {user.website}
            </Anchor>
          ) : (
            "-"
          )}
        </Table.Td>

        {/* ACTION */}
        <Table.Td>
          <Group gap={0} justify="flex-end">
            <Link href={`/users/edit/${user.id}`}>
              <ActionIcon variant="subtle" color="blue">
                <IconPencil size={16} />
              </ActionIcon>
            </Link>

            <ActionIcon
              variant="subtle"
              color="red"
              onClick={() => handleDelete(user.id)}
            >
              <IconTrash size={16} />
            </ActionIcon>

            <Link href={`/users/${user.id}`}>
              <ActionIcon variant="subtle" color="cyan">
                <IconSearch size={16} />
              </ActionIcon>
            </Link>
          </Group>
        </Table.Td>
      </Table.Tr>
    );
  });

  return (
    <div className="p-6">
      {/* HEADER */}
      <Group justify="space-between" mb="md">
        <Text fw={600} size="lg">
          User Management
        </Text>

        <Group>
          <TextInput
            placeholder="Search..."
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <Select
            value={sort}
            onChange={(value) => setSort(value as SortType)}
            data={[
              { value: "name-asc", label: "Tên A-Z" },
              { value: "name-desc", label: "Tên Z-A" },
              { value: "company", label: "Công ty" },
            ]}
          />

          <Button variant="default" onClick={() => setSearch("")}>
            Clear
          </Button>

          <Link href="/users/create">
            <Button color="green">+ Tạo</Button>
          </Link>
        </Group>
      </Group>

      {/* TABLE */}
      <Table.ScrollContainer minWidth={800}>
        <Table highlightOnHover verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Employee</Table.Th>
              <Table.Th>Company</Table.Th>
              <Table.Th>Email</Table.Th>
              <Table.Th>Website</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>

          <Table.Tbody>
            {rows.length > 0 ? (
              rows
            ) : (
              <Table.Tr>
                <Table.Td colSpan={5} align="center">
                  Không có dữ liệu
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </div>
  );
}