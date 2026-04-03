"use client";

import { useParams, useRouter } from "next/navigation";
import { useUserDetail } from "@/hooks/use-user-detail";
import { useUserPosts } from "@/hooks/use-user-posts";
import { useUserAlbums } from "@/hooks/use-user-albums";

export default function UserDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const userId = Number(id);

  const { data: user, isLoading } = useUserDetail(userId);
  const { data: posts } = useUserPosts(userId);
  const { data: albums } = useUserAlbums(userId);

  if (isLoading) return <p className="p-6">Loading...</p>;
  if (!user) return <p className="p-6">User not found</p>;

  return (
    <div className="p-6 space-y-6">
      {/* 🔙 BACK */}
      <button
        onClick={() => router.back()}
        className="text-blue-500"
      >
        ← Quay lại
      </button>

      {/* 👤 USER INFO */}
      <div className="border p-4 rounded">
        <h1 className="text-2xl font-bold mb-2">{user.name}</h1>

        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Phone:</strong> {user.phone}</p>
        <p><strong>Website:</strong> {user.website}</p>
        <p><strong>Company:</strong> {user.company?.name}</p>
      </div>

      {/* 📝 POSTS */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Posts</h2>

        {!posts?.length ? (
          <p>Không có bài viết</p>
        ) : (
          <ul className="space-y-2">
            {posts.slice(0, 5).map((post) => (
              <li key={post.id} className="border p-3 rounded">
                <p className="font-medium">{post.title}</p>
                <p className="text-sm text-gray-600">
                  {post.body.slice(0, 80)}...
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 📸 ALBUMS */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Albums</h2>

        {!albums?.length ? (
          <p>Không có album</p>
        ) : (
          <ul className="space-y-2">
            {albums.slice(0, 5).map((album) => (
              <li key={album.id} className="border p-3 rounded">
                {album.title}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}