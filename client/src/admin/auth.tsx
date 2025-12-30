import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from './api';

type Role = 'admin' | 'editor';

type AuthUser = {
  id: string;
  email: string;
  role: Role;
};

type AuthState = {
  loading: boolean;
  user: AuthUser | null;
  token: string;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

function getStoredToken() {
  return localStorage.getItem('authToken') || '';
}

function setStoredToken(token: string) {
  if (token) localStorage.setItem('authToken', token);
  else localStorage.removeItem('authToken');
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState(getStoredToken());

  async function refresh() {
    const t = getStoredToken();
    setToken(t);
    if (!t) {
      setUser(null);
      return;
    }

    try {
      const res = await api.get<{ user: AuthUser }>('/api/auth/me');
      setUser(res.user);
    } catch {
      setStoredToken('');
      setToken('');
      setUser(null);
    }
  }

  async function login(email: string, password: string) {
    const res = await api.post<{ token: string; user: AuthUser }>('/api/auth/login', {
      email,
      password
    });
    setStoredToken(res.token);
    setToken(res.token);
    setUser(res.user);
  }

  async function logout() {
    try {
      await api.post<void>('/api/auth/logout');
    } finally {
      setStoredToken('');
      setToken('');
      setUser(null);
    }
  }

  useEffect(() => {
    (async () => {
      setLoading(true);
      await refresh();
      setLoading(false);
    })();
  }, []);

  const value = useMemo<AuthState>(
    () => ({ loading, user, token, login, logout, refresh }),
    [loading, user, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('AuthProvider missing');
  return ctx;
}
