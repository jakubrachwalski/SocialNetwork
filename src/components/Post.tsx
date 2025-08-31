"use client";

import { useState } from "react";
import { useAuth } from "../lib/hooks/useAuth";
import { Post as PostType, Comment } from "../lib/types";
import { toggleLike, addComment, deleteComment, deletePost } from "../lib/firebase/firebaseUtils";
import { Heart, MessageCircle, Trash2, Send } from "lucide-react";
import { formatTimeAgo } from "../lib/utils";

interface PostProps {
  post: PostType;
  onPostUpdate: () => void;
}

export default function Post({ post, onPostUpdate }: PostProps) {
  const { user, userProfile } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLiked = user ? post.likes.includes(user.uid) : false;
  const canDelete = user && (user.uid === post.authorId || userProfile?.uid === post.authorId);

  const handleLike = async () => {
    if (!user) return;
    
    try {
      await toggleLike(post.id, user.uid);
      onPostUpdate();
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userProfile || !newComment.trim()) return;

    setIsSubmitting(true);
    try {
      await addComment(post.id, { content: newComment.trim() }, userProfile);
      setNewComment("");
      onPostUpdate();
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;

    try {
      await deleteComment(post.id, commentId);
      onPostUpdate();
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  const handleDeletePost = async () => {
    if (!user) return;

    try {
      await deletePost(post.id);
      onPostUpdate();
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  const canDeleteComment = (comment: Comment) => {
    return user && (user.uid === comment.authorId || user.uid === post.authorId);
  };

  return (
    <div className="bg-white rounded-lg shadow-md border p-6 mb-6">
      {/* Post Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <img
            src={post.authorPhotoURL || "/default-avatar.svg"}
            alt={post.authorName}
            className="w-10 h-10 rounded-full"
          />
          <div>
            <h3 className="font-semibold text-gray-900">{post.authorName}</h3>
            <p className="text-sm text-gray-500">
              {formatTimeAgo(post.createdAt)}
            </p>
          </div>
        </div>
        
        {canDelete && (
          <button
            onClick={handleDeletePost}
            className="text-red-500 hover:text-red-700 transition-colors"
            title="Delete post"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* Post Content */}
      <div className="mb-4">
        <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>
        {post.imageURL && (
          <img
            src={post.imageURL}
            alt="Post image"
            className="mt-4 rounded-lg max-w-full h-auto"
          />
        )}
      </div>

      {/* Post Actions */}
      <div className="flex items-center justify-between border-t pt-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleLike}
            disabled={!user}
            className={`flex items-center space-x-1 transition-colors ${
              isLiked
                ? "text-red-500"
                : "text-gray-500 hover:text-red-500"
            } ${!user ? "cursor-not-allowed opacity-50" : ""}`}
          >
            <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
            <span>{post.likes.length}</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition-colors"
          >
            <MessageCircle size={20} />
            <span>{post.comments.length}</span>
          </button>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 border-t pt-4">
          {/* Add Comment */}
          {user && (
            <form onSubmit={handleComment} className="mb-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !newComment.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={16} />
                </button>
              </div>
            </form>
          )}

          {/* Comments List */}
          <div className="space-y-3">
            {post.comments.map((comment) => (
              <div key={comment.id} className="flex items-start space-x-3">
                <img
                  src={comment.authorPhotoURL || "/default-avatar.svg"}
                  alt={comment.authorName}
                  className="w-6 h-6 rounded-full mt-1"
                />
                <div className="flex-1">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-sm text-gray-900">
                          {comment.authorName}
                        </span>
                        <p className="text-sm text-gray-700 mt-1">{comment.content}</p>
                      </div>
                      {canDeleteComment(comment) && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-red-500 hover:text-red-700 text-xs"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatTimeAgo(comment.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
