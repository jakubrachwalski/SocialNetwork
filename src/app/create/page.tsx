"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/hooks/useAuth";
import Navigation from "../../components/Navigation";
import CreatePost from "../../components/CreatePost";
import LoadingSpinner from "../../components/LoadingSpinner";

export default function CreatePostPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  const handlePostCreated = () => {
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <LoadingSpinner size={32} className="min-h-[calc(100vh-4rem)]" />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to home
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Create a New Post</h1>
          <p className="text-gray-600 mt-2">
            Share your thoughts, photos, and experiences with the community.
          </p>
        </div>

        <CreatePost onPostCreated={handlePostCreated} />
      </main>
    </div>
  );
}
