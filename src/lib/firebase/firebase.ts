// firebase.ts

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

// REMOVE the getEnvVar function. It's interfering with Next.js's client-side env var handling.
// const getEnvVar = (key: string): string | undefined => {
//   if (typeof process !== 'undefined' && process.env) {
//     return process.env[key];
//   }
//   return undefined;
// };

const firebaseConfig = {
  // Directly access process.env.NEXT_PUBLIC_VAR_NAME
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Debug logging (runs on both server and client)
console.log("Firebase Config being used:", firebaseConfig);
console.log("Environment check:", {
  // Use direct access here too for consistency and to confirm behavior
  hasApiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  hasProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  nodeEnv: typeof process !== 'undefined' ? process.env.NODE_ENV : 'unknown',
  isClient: typeof window !== 'undefined',
  isServer: typeof window === 'undefined',
  usingFallback: !process.env.NEXT_PUBLIC_FIREBASE_API_KEY, // This check will now accurately reflect if the value is present
});

// --- CRITICAL CLIENT-SIDE DEBUGGING FOR REPLIT ---
if (typeof window !== 'undefined') {
  console.log("CLIENT-SIDE REPLIT CHECK: process.env.NEXT_PUBLIC_FIREBASE_API_KEY:", process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
  console.log("CLIENT-SIDE REPLIT CHECK: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID:", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
  console.log("CLIENT-SIDE REPLIT CHECK: firebaseConfig.apiKey (derived):", firebaseConfig.apiKey); // This should now be correct
  console.log("CLIENT-SIDE REPLIT CHECK: firebaseConfig.projectId (derived):", firebaseConfig.projectId); // This should now be correct
  console.log("CLIENT-SIDE REPLIT CHECK: Entire process.env on client:", process.env);
}
// --- END CLIENT-SIDE DEBUGGING ---


let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

try {
  // Check if we have at least the essential config
  if (firebaseConfig.apiKey && firebaseConfig.projectId) { // This condition will now correctly evaluate to true on client
    console.log("Attempting to initialize Firebase...");
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    console.log("Firebase app initialized:", !!app);
    
    auth = getAuth(app);
    console.log("Firebase auth initialized:", !!auth);
    
    db = getFirestore(app);
    console.log("Firestore initialized:", !!db);
    
    storage = getStorage(app);
    console.log("Firebase storage initialized:", !!storage);
    
    console.log("Firebase initialized successfully");
  } else {
    console.warn("Firebase not initialized - missing environment variables");
    console.warn("Please check your Replit Secrets or .env file");
    console.warn("Required secrets: NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_PROJECT_ID");
  }
} catch (error) {
  console.error("Error initializing Firebase:", error);
  console.error("Error details:", {
    message: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
  });
}

export { app, auth, db, storage };