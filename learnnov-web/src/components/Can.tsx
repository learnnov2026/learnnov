"use client";

import React, { ReactNode } from 'react';
import { usePermissions } from '../context/PermissionContext';

interface CanProps {
  action: string;
  resource: string;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * A wrapper component that only renders its children if the current user
 * has the specified permission action for the specified resource.
 */
export const Can = ({ action, resource, children, fallback = null }: CanProps) => {
  const { hasPermission, loading } = usePermissions();

  if (loading) {
    return null; // Or a loading spinner if preferred
  }

  if (hasPermission(action, resource)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};
