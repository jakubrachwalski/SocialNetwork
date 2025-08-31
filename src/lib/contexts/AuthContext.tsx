"use client";

import React, { createContext, useEffect, useState } from "react";
import { signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut, Auth } from "firebase/auth";
import { User } from "firebase/auth";
import { auth } from "../firebase/firebase";
import { createUserProfile, getUserProfile } from "../firebase/firebaseUtils";
import { User as UserProfile } from "../types";

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  refreshUserProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if Firebase auth is available
    if (!auth) {
      console.warn("Firebase auth not available - skipping auth state listener");
      setLoading(false);
      return;
    }

    const unsubscribe = auth.onAuthStateChanged(async (user: User | null) => {
      setUser(user);
      
      if (user) {
        try {
          // Check if user profile exists, if not create one
          let profile = await getUserProfile(user.uid);
          if (!profile) {
            profile = await createUserProfile(user);
          }
          setUserProfile(profile);
        } catch (error) {
          console.error("Error handling user profile:", error);
          // Don't set userProfile to null on error, just log it
          // This prevents the error from breaking the auth flow
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    if (!auth) {
      console.error("Firebase auth not available");
      return;
    }

    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google", error);
    }
  };

  const signOutUser = async () => {
    if (!auth) {
      console.error("Firebase auth not available");
      return;
    }

    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  const refreshUserProfile = async () => {
    if (!user) return;

    try {
      const updatedProfile = await getUserProfile(user.uid);
      if (updatedProfile) {
        setUserProfile(updatedProfile);
      }
    } catch (error) {
      console.error("Error refreshing user profile:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, signInWithGoogle, signOut: signOutUser, refreshUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };
