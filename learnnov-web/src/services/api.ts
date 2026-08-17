const API_BASE_URL = '';

// Helper to parse cookies on client side
function getCookie(name: string) {
  if (typeof document !== 'undefined') {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
  }
  return null;
}

async function getHeaders(customHeaders: Record<string, string> = {}): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };

  const token = getCookie('learnnov_session') || getCookie('django_access_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.detail || errorData.message || errorMessage;
    } catch {
      // JSON parsing failed
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) return {} as T;
  return response.json() as Promise<T>;
}

export const api = {
  get: async <T>(endpoint: string, customHeaders: Record<string, string> = {}): Promise<T> => {
    const headers = await getHeaders(customHeaders);
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, { method: 'GET', headers, credentials: 'same-origin' });
    return handleResponse<T>(response);
  },

  post: async <T>(endpoint: string, body: any, customHeaders: Record<string, string> = {}): Promise<T> => {
    const headers = await getHeaders(customHeaders);
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      credentials: 'same-origin',
    });
    return handleResponse<T>(response);
  },

  put: async <T>(endpoint: string, body: any, customHeaders: Record<string, string> = {}): Promise<T> => {
    const headers = await getHeaders(customHeaders);
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
      credentials: 'same-origin',
    });
    return handleResponse<T>(response);
  },

  patch: async <T>(endpoint: string, body: any, customHeaders: Record<string, string> = {}): Promise<T> => {
    const headers = await getHeaders(customHeaders);
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
      credentials: 'same-origin',
    });
    return handleResponse<T>(response);
  },

  delete: async <T>(endpoint: string, customHeaders: Record<string, string> = {}): Promise<T> => {
    const headers = await getHeaders(customHeaders);
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers,
      credentials: 'same-origin',
    });
    return handleResponse<T>(response);
  },
};

