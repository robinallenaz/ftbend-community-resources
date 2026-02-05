import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from './api';
import { safeGetItem, safeSetItem, safeRemoveItem } from '../utils/storageUtils';

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

async function getStoredToken() {
  return await safeGetItem('authToken', '');
}

async function setStoredToken(token: string) {
  if (token) await safeSetItem('authToken', token);
  else await safeRemoveItem('authToken');
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState('');

  // Initialize token from storage - consolidated initialization
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        const storedToken = await getStoredToken();
        setToken(storedToken);
        
        if (storedToken) {
          try {
            const res = await api.get<{ user: AuthUser }>('/api/auth/me');
            setUser(res.user);
          } catch {
            await setStoredToken('');
            setToken('');
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    initializeAuth();
  }, []); // Single initialization effect

  async function refresh() {
    const t = await getStoredToken();
    setToken(t);
    if (!t) {
      setUser(null);
      return;
    }

    try {
      const res = await api.get<{ user: AuthUser }>('/api/auth/me');
      setUser(res.user);
    } catch {
      await setStoredToken('');
      setToken('');
      setUser(null);
    }
  }

  async function login(email: string, password: string) {
    const res = await api.post<{ token: string; user: AuthUser }>('/api/auth/login', {
      email,
      password
    });
    await setStoredToken(res.token);
    setToken(res.token);
    setUser(res.user);
  }

  async function logout() {
    try {
      await api.post<void>('/api/auth/logout');
    } finally {
      await setStoredToken('');
      setToken('');
      setUser(null);
    }
  }

  // Remove duplicate initialization effect - consolidated above

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
