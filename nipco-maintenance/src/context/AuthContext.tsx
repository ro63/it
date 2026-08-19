import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, EquipmentGroup, Equipment, CheckItem, DailyInspection, Notification, ThemeType } from '../types';
import { SHIFTS } from '../types';

interface AuthContextType {
  currentUser: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Sample users data
const sampleUsers: User[] = [
  {
    id: '1',
    fullName: 'جعفر تختی',
    personnelCode: '1001',
    username: 'takhti',
    password: '123456',
    mobile: '09121111111',
    role: 'admin',
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: '2',
    fullName: 'اسفندیاری',
    personnelCode: '1002',
    username: 'esfandiari',
    password: '123456',
    mobile: '09122222222',
    role: 'supervisor',
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: '3',
    fullName: 'فردین عظمیان',
    personnelCode: '1003',
    username: 'azmian',
    password: '123456',
    mobile: '09123333333',
    role: 'technician',
    isActive: true,
    createdAt: new Date(),
    sectionAccess: ['mechanical'],
  },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('nipco_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('nipco_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('nipco_current_user');
    }
  }, [currentUser]);

  const login = (username: string, password: string): boolean => {
    const user = sampleUsers.find(u => u.username === username && u.password === password && u.isActive);
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      login,
      logout,
      isAuthenticated: !!currentUser,
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
