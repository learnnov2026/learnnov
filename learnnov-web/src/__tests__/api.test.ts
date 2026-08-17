import { describe, it, expect, beforeEach, vi } from 'vitest';
import { api } from '@/services/api';

describe('API Service (api.ts)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('makes a GET request with correct headers', async () => {
    const mockResponse = { data: 'test' };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    } as Response);

    const result = await api.get('/api/programs/');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/programs/'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    );
    expect(result).toEqual(mockResponse);
  });

  it('includes Authorization header when JWT token exists in localStorage', async () => {
    localStorage.setItem('accessToken', 'mock-jwt-token-123');
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: 'ok' }),
    } as Response);

    await api.get('/api/auth/profile/');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer mock-jwt-token-123',
        }),
      })
    );
  });

  it('sends POST request with JSON body', async () => {
    const postBody = { username: 'testuser', password: 'password123' };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ access: 'token', refresh: 'refresh' }),
    } as Response);

    await api.post('/api/auth/token/', postBody);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/token/'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(postBody),
      })
    );
  });

  it('throws an error when response status is not ok', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Unauthorized credentials' }),
    } as Response);

    await expect(api.get('/api/protected/')).rejects.toThrow('Unauthorized credentials');
  });

  it('handles 204 No Content response properly', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
    } as Response);

    const result = await api.delete('/api/items/1/');
    expect(result).toEqual({});
  });
});
