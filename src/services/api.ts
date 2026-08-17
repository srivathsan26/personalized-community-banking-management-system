import { User } from '@/types';

export const AUTH_STORAGE_KEY = 'graminbank_auth';
const DIRECT_API_BASE = 'http://127.0.0.1:8001/api';
const isDesktopRuntime =
  typeof window !== 'undefined' &&
  (window.location.protocol === 'file:' || Boolean((window as Window & { desktopApp?: unknown }).desktopApp));
export const API_BASE = import.meta.env.VITE_API_BASE || (isDesktopRuntime ? DIRECT_API_BASE : '/api');

function getStoredToken() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as { token?: string | null };
    return parsed.token || null;
  } catch {
    return null;
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  tokenOverride?: string | null
): Promise<T> {
  async function execute(baseUrl: string) {
    const token = tokenOverride === undefined ? getStoredToken() : tokenOverride;
    const headers = new Headers(options.headers || {});
    if (!headers.has('Content-Type') && options.body) {
      headers.set('Content-Type', 'application/json');
    }
    if (token) {
      headers.set('Authorization', `Token ${token}`);
    }

    const response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `Request failed with status ${response.status}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  }

  try {
    return await execute(API_BASE);
  } catch (error) {
    const usingRelativeBase = API_BASE.startsWith('/');
    if (!usingRelativeBase) {
      throw error;
    }

    return execute(DIRECT_API_BASE);
  }
}

export async function loginRequest(username: string, password: string): Promise<{ token: string; user: User }> {
  return apiRequest<{ token: string; user: User }>(
    '/auth/login/',
    {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    },
    null
  );
}

export async function fetchCurrentUser(token: string): Promise<User> {
  const response = await apiRequest<{ user: User }>('/auth/me/', {}, token);
  return response.user;
}

export async function logoutRequest(token: string | null): Promise<void> {
  await apiRequest('/auth/logout/', { method: 'POST' }, token);
}

export async function bootstrapBackend(): Promise<void> {
  await apiRequest('/bootstrap/', { method: 'POST' }, null);
}

export function isOnline(): boolean {
  return navigator.onLine;
}

export async function syncAllPending(): Promise<{ synced: number; failed: number; total: number }> {
  return { synced: 0, failed: 0, total: 0 };
}

export function setupConnectivityListeners(onOnline: () => void, onOffline: () => void): () => void {
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);

  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
}
