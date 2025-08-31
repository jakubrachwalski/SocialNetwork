"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/hooks/useAuth";
import { Post as PostType, User } from "../../lib/types";
import { getUserPosts, updateUserProfile } from "../../lib/firebase/firebaseUtils";
import Navigation from "../../components/Navigation";
import Post from "../../components/Post";
import { Edit, Save, X, User as UserIcon } from "lucide-react";
import LoadingSpinner from "../../components/LoadingSpinner";

export default function ProfilePage() {
  const { user, userProfile, loading, refreshUserProfile } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<PostType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: "",
    bio: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (userProfile) {
      setEditForm({
        displayName: userProfile.displayName,
        bio: userProfile.bio || "",
      });
    }
  }, [userProfile]);

  useEffect(() => {
    if (user && !loading) {
      loadUserPosts();
    }
  }, [user, loading]); // loadUserPosts is stable and doesn't need to be in deps

  const loadUserPosts = async () => {
    if (!user) return;
    
    try {
      const userPosts = await getUserPosts(user.uid);
      setPosts(userPosts);
    } catch (error) {
      console.error("Error loading user posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user || !userProfile) return;

    setIsSaving(true);
    try {
      await updateUserProfile(user.uid, {
        displayName: editForm.displayName,
        bio: editForm.bio,
      });
      setIsEditing(false);
      
      // Refresh the user profile in AuthContext to show updated name immediately
      await refreshUserProfile();
      
      // Reload user posts to see updated author information
      // The cache system will automatically update post author info
      loadUserPosts();
      
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditForm({
      displayName: userProfile?.displayName || "",
      bio: userProfile?.bio || "",
    });
    setIsEditing(false);
  };

  const handlePostUpdate = () => {
    loadUserPosts();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <LoadingSpinner size={32} className="min-h-[calc(100vh-4rem)]" />
      </div>
    );
  }

  if (!user || !userProfile) {
    return null; // Will redirect to home
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-md border p-6 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-4">
              <img
                src={userProfile.photoURL || "/default-avatar.svg"}
                alt={userProfile.displayName}
                className="w-20 h-20 rounded-full"
              />
              <div>
                {isEditing ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editForm.displayName}
                      onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                      className="text-xl font-bold text-gray-900 border border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      maxLength={50}
                    />
                    <textarea
                      value={editForm.bio}
                      onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                      placeholder="Tell us about yourself..."
                      className="text-gray-600 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={3}
                      maxLength={200}
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                        className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
                      >
                        <Save size={16} />
                        <span>{isSaving ? "Saving..." : "Save"}</span>
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex items-center space-x-1 px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                      >
                        <X size={16} />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">
                      {userProfile.displayName}
                    </h1>
                    <p className="text-gray-600 mt-1">
                      {userProfile.bio || "No bio yet"}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Member since {new Date(userProfile.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-1 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Edit size={16} />
                <span>Edit Profile</span>
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="flex space-x-8 border-t pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{posts.length}</div>
              <div className="text-sm text-gray-500">Posts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {posts.reduce((total, post) => total + post.likes.length, 0)}
              </div>
              <div className="text-sm text-gray-500">Total Likes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {posts.reduce((total, post) => total + post.comments.length, 0)}
              </div>
              <div className="text-sm text-gray-500">Total Comments</div>
            </div>
          </div>
        </div>

        {/* User's Posts */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Posts</h2>
          
          {isLoading ? (
            <LoadingSpinner size={32} className="py-12" />
          ) : posts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-md border">
              <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No posts yet
              </h3>
              <p className="text-gray-500">
                Start sharing your thoughts and experiences!
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
      </main>
    </div>
  );
}
