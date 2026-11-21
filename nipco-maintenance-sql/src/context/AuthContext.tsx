import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { api, setToken, getToken } from '../api/client';
import type { ApiLoginResponse, ApiUser } from '../api/types';

interface AuthContextType {
  currentUser: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isInitializing: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_CACHE_KEY = 'nipco_current_user';

/** Maps an API user onto the UI `User` shape so pages stay unchanged. */
export function toUiUser(apiUser: ApiUser): User {
  return {
    id: apiUser.id,
    fullName: apiUser.fullName,
    personnelCode: apiUser.personnelCode,
    username: apiUser.username,
    password: '',
    mobile: apiUser.mobile ?? '',
    role: apiUser.role,
    isActive: apiUser.isActive,
    createdAt: new Date(apiUser.createdAt),
    sectionAccess: apiUser.sectionAccess ?? [],
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(USER_CACHE_KEY);
    return saved ? JSON.parse(saved) : null;
  });
  const [isInitializing, setIsInitializing] = useState<boolean>(!!getToken());
  const [error, setError] = useState<string | null>(null);

  // Validate the cached session against the API on startup.
  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      if (!getToken()) {
        setIsInitializing(false);
        return;
      }

      try {
        const me = await api.get<ApiUser>('/api/auth/me');
        if (!cancelled) setCurrentUser(toUiUser(me));
      } catch {
        if (!cancelled) {
          setToken(null);
          setCurrentUser(null);
        }
      } finally {
        if (!cancelled) setIsInitializing(false);
      }
    }

    restoreSession();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(USER_CACHE_KEY);
    }
  }, [currentUser]);

  const login = async (username: string, password: string): Promise<boolean> => {
    setError(null);
    try {
      const res = await api.post<ApiLoginResponse>('/api/auth/login', {
        username: username.trim(),
        password,
      });
      setToken(res.token);
      setCurrentUser(toUiUser(res.user));
      return true;
    } catch (e: any) {
      if (e?.status === 0) {
        setError('ارتباط با سرور برقرار نشد');
      } else {
        setError(e?.message || 'نام کاربری یا رمز عبور اشتباه است');
      }
      return false;
    }
  };

  const logout = () => {
    setToken(null);
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      login,
      logout,
      isAuthenticated: !!currentUser,
      isInitializing,
      error,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
