import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/context/AuthContext';

describe('AuthContext', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/api/auth/me') {
        return Promise.resolve({
          ok: false,
          status: 401,
          json: async () => ({ error: 'Unauthorized' }),
        });
      }
      if (url === '/api/auth/logout') {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ success: true }),
        });
      }
      return Promise.reject(new Error('Unknown url'));
    }) as any;
  });

  it('throws an error when useAuth is used outside AuthProvider', () => {
    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuth must be used within an AuthProvider'
    );
  });

  it('initializes with logged-out state when no session exists', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isLoggedIn).toBe(false);
    expect(result.current.userRole).toBeNull();
    expect(result.current.userName).toBeNull();
  });

  it('stores user info on login', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.login(
        'student',
        'طالب اختبار',
        'avatar.png',
        'test@learnnov.com'
      );
    });

    expect(result.current.isLoggedIn).toBe(true);
    expect(result.current.userRole).toBe('student');
    expect(result.current.userName).toBe('طالب اختبار');
    expect(result.current.userEmail).toBe('test@learnnov.com');
  });

  it('clears session and state on logout', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.login('student', 'User', 'avatar.png', 'user@learnnov.com');
    });
    expect(result.current.isLoggedIn).toBe(true);

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.isLoggedIn).toBe(false);
    expect(result.current.userRole).toBeNull();
    expect(result.current.userName).toBeNull();
  });
});
