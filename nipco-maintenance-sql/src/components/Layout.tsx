import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { THEMES } from '../types';
import { 
  LayoutDashboard, 
  Wrench, 
  ScanLine, 
  Users, 
  FileText, 
  Settings, 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { currentUser, logout } = useAuth();
  const { currentTheme } = useData();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const theme = THEMES[currentTheme];

  const navigation = [
    { name: 'داشبورد', href: '/dashboard', icon: LayoutDashboard },
    { name: 'تجهیزات', href: '/equipment', icon: Wrench },
    { name: 'اسکن QR', href: '/scan', icon: ScanLine },
    { name: 'کاربران', href: '/users', icon: Users },
    { name: 'گزارشات', href: '/reports', icon: FileText },
    { name: 'تنظیمات', href: '/settings', icon: Settings },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.backgroundColor }}>
      {/* Sidebar for desktop */}
      <aside className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col" style={{ backgroundColor: theme.primaryColor }}>
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex items-center h-16 px-6" style={{ backgroundColor: theme.secondaryColor }}>
            <h1 className="text-white text-xl font-bold">NIPCO - کنترل تجهیزات</h1>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive(item.href)
                      ? 'bg-white text-gray-900'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-5 h-5 ml-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t" style={{ borderColor: theme.secondaryColor }}>
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">
                {currentUser?.fullName.charAt(0)}
              </div>
              <div className="mr-3">
                <p className="text-white text-sm font-medium">{currentUser?.fullName}</p>
                <p className="text-white/70 text-xs">{currentUser?.role === 'admin' ? 'مدیر سیستم' : currentUser?.role === 'supervisor' ? 'سرپرست نت' : 'تکنسین'}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <LogOut className="w-4 h-4 ml-2" />
              خروج
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 z-50" style={{ backgroundColor: theme.primaryColor }}>
        <div className="flex items-center justify-between h-full px-4">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="text-white p-2"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-white text-lg font-bold">NIPCO</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 right-0 w-64" style={{ backgroundColor: theme.primaryColor }}>
            <div className="flex items-center justify-between h-16 px-4" style={{ backgroundColor: theme.secondaryColor }}>
              <h2 className="text-white font-bold">منو</h2>
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <nav className="p-4 space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      isActive(item.href)
                        ? 'bg-white text-gray-900'
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-5 h-5 ml-3" />
                    {item.name}
                  </Link>
                );
              })}
              <button
                onClick={() => {
                  logout();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center px-4 py-3 text-sm font-medium text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <LogOut className="w-5 h-5 ml-3" />
                خروج
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="md:pr-64 pt-16 md:pt-0 min-h-screen">
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
