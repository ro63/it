import { useData } from '../context/DataContext';
import { THEMES } from '../types';

export default function SettingsPage() {
  const { currentTheme, setTheme } = useData();
  const theme = THEMES[currentTheme];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: theme.textColor }}>تنظیمات</h1>
      
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold mb-4">انتخاب طرح رنگی</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.values(THEMES).map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`p-4 rounded-lg border-2 transition-all ${
                currentTheme === t.id ? 'border-gray-900' : 'border-transparent'
              }`}
              style={{ backgroundColor: t.backgroundColor }}
            >
              <div className="w-full h-8 rounded mb-2" style={{ backgroundColor: t.primaryColor }} />
              <p className="font-medium" style={{ color: theme.textColor }}>{t.name}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
