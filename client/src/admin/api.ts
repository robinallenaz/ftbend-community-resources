type ApiError = Error & { status?: number };

import { safeGetItem } from '../utils/storageUtils';

async function getToken() {
  return await safeGetItem('authToken', '');
}

async function request<T>(path: string, init?: RequestInit & { signal?: AbortSignal }): Promise<T> {
  const token = await getToken();
  const headers = new Headers(init?.headers || undefined);
  if (!headers.has('Content-Type') && init?.body) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(path, {
    ...init,
    headers,
    credentials: 'include'
  });

  if (!res.ok) {
    const err: ApiError = new Error('Request failed');
    err.status = res.status;
    
    // Try to parse error response for more detailed message
    try {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const errorData = await res.json();
        if (errorData.error) {
          err.message = errorData.error;
        } else if (errorData.message) {
          err.message = errorData.message;
        }
      } else {
        // Fallback to text response
        const textError = await res.text();
        if (textError) {
          err.message = textError;
        }
      }
    } catch {
      // If parsing fails, keep the default error message
    }
    
    throw err;
  }

  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return (await res.json()) as T;
  return undefined as T;
}

export const api = {
  get: <T>(path: string, options?: { signal?: AbortSignal }) => request<T>(path, options),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body)
    }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PUT',
      body: body === undefined ? undefined : JSON.stringify(body)
    }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PATCH',
      body: body === undefined ? undefined : JSON.stringify(body)
    }),
  delete: <T>(path: string) =>
    request<T>(path, {
      method: 'DELETE'
    })
};
