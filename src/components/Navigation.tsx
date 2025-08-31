"use client";

import { useAuth } from "../lib/hooks/useAuth";
import { useRouter, usePathname } from "next/navigation";
import { Home, User, Plus, LogOut, LogIn } from "lucide-react";

export default function Navigation() {
  const { user, userProfile, signInWithGoogle, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { name: "Home", path: "/", icon: Home },
    { name: "Profile", path: "/profile", icon: User },
    { name: "Create Post", path: "/create", icon: Plus },
  ];

  const handleNavigation = (path: string) => {
    if (!user && path !== "/") {
      // If not authenticated and trying to access protected routes, redirect to home
      router.push("/");
      return;
    }
    router.push(path);
  };

  const handleAuth = async () => {
    if (user) {
      await signOut();
      router.push("/");
    } else {
      await signInWithGoogle();
    }
  };

  return (
    <nav className="bg-white shadow-lg border-b">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-blue-600">SocialApp</h1>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              const isDisabled = !user && item.path !== "/";
              
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  disabled={isDisabled}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? "bg-blue-100 text-blue-700"
                      : isDisabled
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Icon size={20} />
                  <span className="hidden sm:inline">{item.name}</span>
                </button>
              );
            })}
          </div>

          {/* Auth Section */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* User Avatar */}
                <div className="flex items-center space-x-2">
                  <img
                    src={userProfile?.photoURL || user.photoURL || "/default-avatar.svg"}
                    alt="Profile"
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="hidden sm:inline text-sm font-medium text-gray-700">
                    {userProfile?.displayName || user.displayName}
                  </span>
                </div>
                
                {/* Sign Out Button */}
                <button
                  onClick={handleAuth}
                  className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <LogOut size={20} />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </>
            ) : (
              <button
                onClick={handleAuth}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <LogIn size={20} />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
