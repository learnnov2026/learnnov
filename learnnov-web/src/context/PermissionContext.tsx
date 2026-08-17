"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

type Permission = {
  action: string;
  resource: string;
};

interface PermissionContextType {
  permissions: Permission[];
  hasPermission: (action: string, resource: string) => boolean;
  loading: boolean;
}

export const PermissionContext = createContext<PermissionContextType>({
  permissions: [],
  hasPermission: () => false,
  loading: true,
});

export const PermissionProvider = ({ children }: { children: ReactNode }) => {
  const { userRole, isLoggedIn } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoggedIn && userRole) {
      // For now, map legacy roles directly to avoid breaking until the backend fully seeds granular permissions
      // In a full implementation, you would fetch these from the backend, e.g. /api/users/me/permissions
      let initialPermissions: Permission[] = [];
      if (userRole === 'admin') {
        initialPermissions = [{ action: 'manage', resource: '*' }];
      } else if (userRole === 'instructor') {
        initialPermissions = [
          { action: 'manage', resource: 'courses' },
          { action: 'read', resource: 'analytics' }
        ];
      } else if (userRole === 'support') {
        initialPermissions = [
          { action: 'manage', resource: 'discussions' },
          { action: 'read', resource: 'users' }
        ];
      }
      setPermissions(initialPermissions);
      setLoading(false);
    } else {
      setPermissions([]);
      setLoading(false);
    }
  }, [isLoggedIn, userRole]);

  const hasPermission = (action: string, resource: string) => {
    return permissions.some(
      p => (p.action === action || p.action === 'manage' || p.action === '*') &&
           (p.resource === resource || p.resource === '*')
    );
  };

  return (
    <PermissionContext.Provider value={{ permissions, hasPermission, loading }}>
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermissions = () => useContext(PermissionContext);
