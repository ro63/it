import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { THEMES, type ThemeType } from '../types';
import { Lock, User } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<ThemeType>('default');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(username, password)) {
      navigate('/dashboard');
    } else {
      setError('نام کاربری یا رمز عبور اشتباه است');
    }
  };

  const theme = THEMES[selectedTheme];

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: theme.backgroundColor }}>
      <div className="w-full max-w-md">
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2" style={{ color: theme.textColor }}>انتخاب طرح:</label>
          <div className="flex gap-2 flex-wrap">
            {Object.values(THEMES).map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTheme(t.id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedTheme === t.id ? 'ring-2 ring-offset-2' : ''
                }`}
                style={{ 
                  backgroundColor: t.primaryColor, 
                  color: '#fff',
                }}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2" style={{ color: theme.primaryColor }}>NIPCO</h1>
            <p className="text-gray-600">سیستم کنترل روزانه تجهیزات</p>
            <p className="text-gray-500 text-sm mt-1">شرکت قطعه‌سازی خودرو نیپکو</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">نام کاربری</label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none transition-all"
                  style={{ '--tw-ring-color': theme.primaryColor } as React.CSSProperties}
                  placeholder="نام کاربری خود را وارد کنید"
                  dir="rtl"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">رمز عبور</label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none transition-all"
                  style={{ '--tw-ring-color': theme.primaryColor } as React.CSSProperties}
                  placeholder="رمز عبور خود را وارد کنید"
                  dir="rtl"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-lg font-medium text-white transition-colors hover:opacity-90"
              style={{ backgroundColor: theme.primaryColor }}
            >
              ورود به سیستم
            </button>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 text-center">
              <strong>کاربران نمونه:</strong><br />
              مدیر: takhti / 123456<br />
              سرپرست: esfandiari / 123456<br />
              تکنسین: azmian / 123456
            </p>
          </div>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          طراحی و تحلیل سیستم: محمد روشندل
        </p>
      </div>
    </div>
  );
}
