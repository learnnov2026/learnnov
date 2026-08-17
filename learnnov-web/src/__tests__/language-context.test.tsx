import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { LanguageProvider, useLanguage } from '@/context/LanguageContext';

describe('LanguageContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('defaults to Arabic language and RTL mode', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <LanguageProvider>{children}</LanguageProvider>
    );

    const { result } = renderHook(() => useLanguage(), { wrapper });

    expect(result.current.language).toBe('ar');
    expect(result.current.isRtl).toBe(true);
  });

  it('switches language and updates state and localStorage', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <LanguageProvider>{children}</LanguageProvider>
    );

    const { result } = renderHook(() => useLanguage(), { wrapper });

    act(() => {
      result.current.setLanguage('en');
    });

    expect(result.current.language).toBe('en');
    expect(result.current.isRtl).toBe(false);
    expect(localStorage.setItem).toHaveBeenCalledWith('language', 'en');
  });

  it('translates keys correctly and interpolates variables', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <LanguageProvider>{children}</LanguageProvider>
    );

    const { result } = renderHook(() => useLanguage(), { wrapper });

    // Test translation lookup
    const platformTitle = result.current.t('platformTitle');
    expect(platformTitle).toBeDefined();
    expect(typeof platformTitle).toBe('string');

    // Test variable interpolation on fallback key
    const textWithVar = result.current.t('Welcome {{name}}', { name: 'Ali' });
    expect(textWithVar).toBe('Welcome Ali');
  });
});
