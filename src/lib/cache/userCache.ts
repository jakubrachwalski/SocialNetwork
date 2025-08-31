import { User } from '../types';
import { getUserProfile, updateDocument } from '../firebase/firebaseUtils';
import { collection, query, where, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '../firebase/firebase';

// In-memory cache for user profiles
class UserProfileCache {
  private cache = new Map<string, { user: User; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 1000;

  // Get user profile with caching
  async getUser(uid: string): Promise<User | null> {
    // Check cache first
    const cached = this.cache.get(uid);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.user;
    }

    // Fetch from database
    const user = await getUserProfile(uid);
    if (user) {
      this.setUser(uid, user);
    }
    return user;
  }

  // Set user in cache
  setUser(uid: string, user: User): void {
    // Clean up old entries if cache is getting too large
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.cleanupCache();
    }

    this.cache.set(uid, {
      user,
      timestamp: Date.now()
    });
  }

  // Remove user from cache (for cache invalidation)
  invalidateUser(uid: string): void {
    this.cache.delete(uid);
  }

  // Clean up expired entries
  private cleanupCache(): void {
    const now = Date.now();
    for (const [uid, cached] of this.cache.entries()) {
      if (now - cached.timestamp >= this.CACHE_TTL) {
        this.cache.delete(uid);
      }
    }
  }

  // Get multiple users efficiently
  async getUsers(uids: string[]): Promise<Map<string, User>> {
    const result = new Map<string, User>();
    const uncachedUids: string[] = [];

    // Check cache for each user
    for (const uid of uids) {
      const cached = this.cache.get(uid);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        result.set(uid, cached.user);
      } else {
        uncachedUids.push(uid);
      }
    }

    // Fetch uncached users from database (batch operation)
    if (uncachedUids.length > 0) {
      const users = await this.batchGetUsers(uncachedUids);
      for (const [uid, user] of users.entries()) {
        result.set(uid, user);
        this.setUser(uid, user);
      }
    }

    return result;
  }

  // Batch fetch users from database
  private async batchGetUsers(uids: string[]): Promise<Map<string, User>> {
    const result = new Map<string, User>();
    
    // Firebase 'in' queries are limited to 10 items, so we batch them
    const batches = [];
    for (let i = 0; i < uids.length; i += 10) {
      batches.push(uids.slice(i, i + 10));
    }

    if (!db) {
      throw new Error("Firestore is not initialized");
    }

    for (const batch of batches) {
      const q = query(
        collection(db, "users"),
        where("uid", "in", batch)
      );
      
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach(doc => {
        const data = doc.data();
        const userData: User = {
          ...data,
          createdAt: data.createdAt?.toDate?.() || data.createdAt || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || data.updatedAt || new Date(),
        } as User;
        result.set(userData.uid, userData);
      });
    }

    return result;
  }

  // Update posts and comments when user profile changes
  async updateUserContentReferences(
    uid: string, 
    newDisplayName: string, 
    newPhotoURL: string
  ): Promise<void> {
    if (!db) {
      throw new Error("Firestore is not initialized");
    }

    const batch = writeBatch(db);
    let batchOperations = 0;
    const MAX_BATCH_SIZE = 500; // Firestore batch limit

    // Update posts
    const postsQuery = query(
      collection(db, "posts"),
      where("authorId", "==", uid)
    );
    
    const postsSnapshot = await getDocs(postsQuery);
    
    for (const postDoc of postsSnapshot.docs) {
      const postData = postDoc.data();
      
      // Update post author info
      batch.update(doc(db, "posts", postDoc.id), {
        authorName: newDisplayName,
        authorPhotoURL: newPhotoURL,
        updatedAt: new Date()
      });
      
      batchOperations++;

      // Update comments within this post
      if (postData.comments && Array.isArray(postData.comments)) {
        const updatedComments = postData.comments.map((comment: any) => {
          if (comment.authorId === uid) {
            return {
              ...comment,
              authorName: newDisplayName,
              authorPhotoURL: newPhotoURL
            };
          }
          return comment;
        });

        batch.update(doc(db, "posts", postDoc.id), {
          comments: updatedComments
        });
      }

      // If we're approaching batch limit, commit and start new batch
      if (batchOperations >= MAX_BATCH_SIZE) {
        await batch.commit();
        batchOperations = 0;
      }
    }

    // Commit remaining operations
    if (batchOperations > 0) {
      await batch.commit();
    }

    // Invalidate cache for this user
    this.invalidateUser(uid);
  }

  // Clear entire cache (useful for logout or major updates)
  clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const userCache = new UserProfileCache();

// Helper function to get user with cache
export const getCachedUser = (uid: string): Promise<User | null> => {
  return userCache.getUser(uid);
};

// Helper function to get multiple users with cache
export const getCachedUsers = (uids: string[]): Promise<Map<string, User>> => {
  return userCache.getUsers(uids);
};

// Helper function to invalidate user cache
export const invalidateUserCache = (uid: string): void => {
  userCache.invalidateUser(uid);
};
