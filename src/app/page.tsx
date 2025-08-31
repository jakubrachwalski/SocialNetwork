"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../lib/hooks/useAuth";
import { Post as PostType } from "../lib/types";
import { getPosts, subscribeToPosts } from "../lib/firebase/firebaseUtils";
import Navigation from "../components/Navigation";
import Post from "../components/Post";
import CreatePost from "../components/CreatePost";
import { LogIn } from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";

export default function Home() {
  const { user, loading, signInWithGoogle } = useAuth();
  const [posts, setPosts] = useState<PostType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (loading) return;

    const loadPosts = async () => {
      try {
        const fetchedPosts = await getPosts();
        setPosts(fetchedPosts);
      } catch (error) {
        console.error("Error loading posts:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPosts();

    // Subscribe to real-time updates
    const unsubscribe = subscribeToPosts((updatedPosts) => {
      setPosts(updatedPosts);
    });

    return () => unsubscribe();
  }, [loading]);

  const handlePostUpdate = () => {
    // This will trigger a re-render when posts are updated
    // The real-time subscription will handle the actual updates
  };

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Error signing in:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <LoadingSpinner size={32} className="min-h-[calc(100vh-4rem)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-2xl mx-auto px-4 py-8">
        {user ? (
          <>
            {/* Create Post Section */}
            <div className="mb-8">
              <CreatePost onPostCreated={handlePostUpdate} />
            </div>

            {/* Posts Feed */}
            <div>
              {isLoading ? (
                <LoadingSpinner size={32} className="py-12" />
              ) : posts.length === 0 ? (
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No posts yet
                  </h3>
                  <p className="text-gray-500">
                    Be the first to share something!
                  </p>
                </div>
              ) : (
                posts.map((post) => (
                  <Post
                    key={post.id}
                    post={post}
                    onPostUpdate={handlePostUpdate}
                  />
                ))
              )}
            </div>
          </>
        ) : (
          /* Welcome Screen for Non-Authenticated Users */
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-md border p-8 max-w-md mx-auto">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Welcome to SocialApp
              </h1>
              <p className="text-gray-600 mb-6">
                Connect with friends, share your thoughts, and discover amazing content.
                Sign in to get started!
              </p>
              <button
                onClick={handleSignIn}
                className="flex items-center justify-center space-x-2 w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <LogIn size={20} />
                <span>Sign In with Google</span>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
