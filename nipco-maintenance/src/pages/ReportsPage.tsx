import { useData } from '../context/DataContext';
import { THEMES } from '../types';

export default function ReportsPage() {
  const { currentTheme } = useData();
  const theme = THEMES[currentTheme];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: theme.textColor }}>گزارشات</h1>
      <p className="text-gray-600">این صفحه در حال توسعه است...</p>
    </div>
  );
}
