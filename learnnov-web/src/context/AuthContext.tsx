'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  isLoggedIn: boolean;
  accessToken: string | null;
  userRole: string | null;
  userName: string | null;
  userAvatar: string | null;
  isLoading: boolean;
  login: (accessToken: string, refreshToken: string, role: string, name: string, avatar: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initial load from localStorage on client-side mount
    const token = localStorage.getItem('accessToken');
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const role = localStorage.getItem('userRole');
    const name = localStorage.getItem('userName');
    const avatar = localStorage.getItem('userAvatar');

    if (token && loggedIn) {
      setTimeout(() => {
        setAccessToken(token);
        setIsLoggedIn(true);
        setUserRole(role);
        setUserName(name);
        setUserAvatar(avatar);
        setIsLoading(false);
      }, 0);
    } else {
      setTimeout(() => {
        setIsLoading(false);
      }, 0);
    }
  }, []);

  const login = (
    token: string,
    refreshToken: string,
    role: string,
    name: string,
    avatar: string
  ) => {
    localStorage.setItem('accessToken', token);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('userRole', role);
    localStorage.setItem('userName', name);
    localStorage.setItem('userAvatar', avatar);
    localStorage.setItem('isLoggedIn', 'true');

    setAccessToken(token);
    setUserRole(role);
    setUserName(name);
    setUserAvatar(avatar);
    setIsLoggedIn(true);
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userAvatar');
    localStorage.removeItem('isLoggedIn');

    setAccessToken(null);
    setUserRole(null);
    setUserName(null);
    setUserAvatar(null);
    setIsLoggedIn(false);

    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        accessToken,
        userRole,
        userName,
        userAvatar,
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
