'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  isLoggedIn: boolean;
  userRole: string | null;
  userName: string | null;
  userAvatar: string | null;
  userEmail: string | null;
  isLoading: boolean;
  login: (role: string, name: string, avatar: string, email: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchSession() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (mounted) {
            setIsLoggedIn(true);
            setUserRole(data.user.role);
            setUserName(data.user.name);
            setUserAvatar(data.user.avatar);
            setUserEmail(data.user.email);
          }
        } else {
          if (mounted) {
            setIsLoggedIn(false);
          }
        }
      } catch (err) {
        if (mounted) setIsLoggedIn(false);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    fetchSession();

    return () => { mounted = false; };
  }, [pathname]); // Re-check session occasionally, e.g. on navigation

  const login = (role: string, name: string, avatar: string, email: string) => {
    setIsLoggedIn(true);
    setUserRole(role);
    setUserName(name);
    setUserAvatar(avatar);
    setUserEmail(email);
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setIsLoggedIn(false);
    setUserRole(null);
    setUserName(null);
    setUserAvatar(null);
    setUserEmail(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        userRole,
        userName,
        userAvatar,
        userEmail,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
