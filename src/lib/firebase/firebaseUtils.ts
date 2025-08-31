import { auth, db, storage } from "./firebase";
import {
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  Auth,
} from "firebase/auth";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  getDoc,
  setDoc,
  serverTimestamp,
  onSnapshot,
  Firestore,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, FirebaseStorage } from "firebase/storage";
import { User, Post, Comment, CreatePostData, CreateCommentData } from "../types";
import { userCache, getCachedUser, getCachedUsers, invalidateUserCache } from "../cache/userCache";

// Helper function to check if Firebase is initialized
const checkFirebaseAuth = (): Auth => {
  if (!auth) {
    throw new Error("Firebase Auth is not initialized. Please check your environment variables.");
  }
  return auth;
};

const checkFirestore = (): Firestore => {
  if (!db) {
    console.error("Firestore is null. Firebase config:", {
      hasAuth: !!auth,
      hasDb: !!db,
      hasStorage: !!storage,
      isClient: typeof window !== 'undefined',
      isServer: typeof window === 'undefined'
    });
    throw new Error("Firestore is not initialized. Please check your environment variables.");
  }
  return db;
};

const checkStorage = (): FirebaseStorage => {
  if (!storage) {
    throw new Error("Firebase Storage is not initialized. Please check your environment variables.");
  }
  return storage;
};

// Helper function to convert comment dates
const convertCommentDates = (comments: any[]): any[] => {
  return comments.map(comment => ({
    ...comment,
    createdAt: comment.createdAt?.toDate?.() || comment.createdAt || new Date(),
  }));
};

// Auth functions
export const logoutUser = () => {
  const authInstance = checkFirebaseAuth();
  // Clear user cache on logout
  userCache.clearCache();
  return signOut(authInstance);
};

export const signInWithGoogle = async () => {
  const authInstance = checkFirebaseAuth();
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(authInstance, provider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

// User functions
export const createUserProfile = async (user: any) => {
  const dbInstance = checkFirestore();
  const userData: User = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    bio: "",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await setDoc(doc(dbInstance, "users", user.uid), userData);
  return userData;
};

export const getUserProfile = async (uid: string): Promise<User | null> => {
  const dbInstance = checkFirestore();
  const docRef = doc(dbInstance, "users", uid);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      ...data,
      createdAt: data.createdAt?.toDate?.() || data.createdAt || new Date(),
      updatedAt: data.updatedAt?.toDate?.() || data.updatedAt || new Date(),
    } as User;
  }
  return null;
};

export const updateUserProfile = async (uid: string, data: Partial<User>) => {
  const dbInstance = checkFirestore();
  const userRef = doc(dbInstance, "users", uid);
  
  // Update the user profile
  await updateDoc(userRef, {
    ...data,
    updatedAt: new Date(),
  });

  // If display name or photo URL changed, update all posts and comments
  if (data.displayName || data.photoURL) {
    // Get the current user data to get the updated values
    const updatedUser = await getUserProfile(uid);
    if (updatedUser) {
      // Update all posts and comments with new user info in the background
      userCache.updateUserContentReferences(
        uid,
        updatedUser.displayName,
        updatedUser.photoURL
      ).catch(error => {
        console.error('Error updating user content references:', error);
      });
    }
  }

  // Invalidate the user cache
  invalidateUserCache(uid);
};

// Post functions
export const createPost = async (postData: CreatePostData, user: User): Promise<Post> => {
  const dbInstance = checkFirestore();
  let imageURL: string | undefined = undefined;
  
  if (postData.imageFile) {
    const storageInstance = checkStorage();
    const imagePath = `posts/${Date.now()}_${postData.imageFile.name}`;
    imageURL = await uploadFile(postData.imageFile, imagePath);
  }

  const post: Omit<Post, 'id'> = {
    authorId: user.uid,
    authorName: user.displayName,
    authorPhotoURL: user.photoURL,
    content: postData.content,
    ...(imageURL && { imageURL }), // Only include imageURL if it exists
    likes: [],
    comments: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const docRef = await addDoc(collection(dbInstance, "posts"), post);
  return { id: docRef.id, ...post };
};

export const getPosts = async (): Promise<Post[]> => {
  const dbInstance = checkFirestore();
  const q = query(collection(dbInstance, "posts"), orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  
  const posts = querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      comments: convertCommentDates(data.comments || []),
    };
  }) as Post[];

  // Enrich posts with fresh user data from cache
  return await enrichPostsWithUserData(posts);
};

// Helper function to enrich posts with cached user data
const enrichPostsWithUserData = async (posts: Post[]): Promise<Post[]> => {
  // Get unique author IDs from posts and comments
  const authorIds = new Set<string>();
  
  posts.forEach(post => {
    authorIds.add(post.authorId);
    post.comments?.forEach(comment => {
      authorIds.add(comment.authorId);
    });
  });

  // Get cached user data for all authors
  const users = await getCachedUsers(Array.from(authorIds));

  // Update post author info with cached data
  return posts.map(post => {
    const postAuthor = users.get(post.authorId);
    const enrichedPost = { ...post };
    
    if (postAuthor) {
      enrichedPost.authorName = postAuthor.displayName;
      enrichedPost.authorPhotoURL = postAuthor.photoURL;
    }

    // Update comment author info with cached data
    if (enrichedPost.comments) {
      enrichedPost.comments = enrichedPost.comments.map(comment => {
        const commentAuthor = users.get(comment.authorId);
        if (commentAuthor) {
          return {
            ...comment,
            authorName: commentAuthor.displayName,
            authorPhotoURL: commentAuthor.photoURL
          };
        }
        return comment;
      });
    }

    return enrichedPost;
  });
};

export const getUserPosts = async (userId: string): Promise<Post[]> => {
  const dbInstance = checkFirestore();
  
  // Option 1: Use simple where query and sort in memory to avoid index requirement
  const q = query(
    collection(dbInstance, "posts"),
    where("authorId", "==", userId)
  );
  const querySnapshot = await getDocs(q);
  
  const posts = querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      comments: convertCommentDates(data.comments || []),
    };
  }) as Post[];

  // Sort by createdAt in memory (descending - newest first)
  const sortedPosts = posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  // Enrich posts with fresh user data from cache
  return await enrichPostsWithUserData(sortedPosts);
};

export const deletePost = async (postId: string) => {
  await deleteDocument("posts", postId);
};

// Like functions
export const toggleLike = async (postId: string, userId: string) => {
  const dbInstance = checkFirestore();
  const postRef = doc(dbInstance, "posts", postId);
  const postSnap = await getDoc(postRef);
  
  if (postSnap.exists()) {
    const post = postSnap.data() as Post;
    const likes = post.likes || [];
    
    if (likes.includes(userId)) {
      // Unlike
      await updateDoc(postRef, {
        likes: likes.filter(id => id !== userId)
      });
    } else {
      // Like
      await updateDoc(postRef, {
        likes: [...likes, userId]
      });
    }
  }
};

// Comment functions
export const addComment = async (postId: string, commentData: CreateCommentData, user: User): Promise<Comment> => {
  const dbInstance = checkFirestore();
  const comment: Omit<Comment, 'id'> = {
    postId,
    authorId: user.uid,
    authorName: user.displayName,
    authorPhotoURL: user.photoURL,
    content: commentData.content,
    createdAt: new Date(),
  };

  const docRef = await addDoc(collection(dbInstance, "comments"), comment);
  const newComment = { id: docRef.id, ...comment };

  // Update post with new comment
  const postRef = doc(dbInstance, "posts", postId);
  const postSnap = await getDoc(postRef);
  
  if (postSnap.exists()) {
    const post = postSnap.data() as Post;
    const comments = post.comments || [];
    comments.push(newComment);
    
    await updateDoc(postRef, {
      comments,
      updatedAt: new Date(),
    });
  }

  return newComment;
};

export const deleteComment = async (postId: string, commentId: string) => {
  const dbInstance = checkFirestore();
  // Remove comment from post
  const postRef = doc(dbInstance, "posts", postId);
  const postSnap = await getDoc(postRef);
  
  if (postSnap.exists()) {
    const post = postSnap.data() as Post;
    const comments = post.comments.filter(comment => comment.id !== commentId);
    
    await updateDoc(postRef, {
      comments,
      updatedAt: new Date(),
    });
  }

  // Delete comment document
  await deleteDocument("comments", commentId);
};

// Real-time listeners
export const subscribeToPosts = (callback: (posts: Post[]) => void) => {
  const dbInstance = checkFirestore();
  const q = query(collection(dbInstance, "posts"), orderBy("createdAt", "desc"));
  return onSnapshot(q, async (querySnapshot) => {
    const posts = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        comments: convertCommentDates(data.comments || []),
      };
    }) as Post[];
    
    // Enrich posts with fresh user data from cache and call callback
    const enrichedPosts = await enrichPostsWithUserData(posts);
    callback(enrichedPosts);
  });
};

// Generic Firestore functions
export const addDocument = (collectionName: string, data: any) => {
  const dbInstance = checkFirestore();
  return addDoc(collection(dbInstance, collectionName), data);
};

export const getDocuments = async (collectionName: string) => {
  const dbInstance = checkFirestore();
  const querySnapshot = await getDocs(collection(dbInstance, collectionName));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

export const updateDocument = (collectionName: string, id: string, data: any) => {
  const dbInstance = checkFirestore();
  return updateDoc(doc(dbInstance, collectionName, id), data);
};

export const deleteDocument = (collectionName: string, id: string) => {
  const dbInstance = checkFirestore();
  return deleteDoc(doc(dbInstance, collectionName, id));
};

// Storage functions
export const uploadFile = async (file: File, path: string) => {
  const storageInstance = checkStorage();
  const storageRef = ref(storageInstance, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};
