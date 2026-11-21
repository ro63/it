import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { THEMES } from '../types';
import { 
  Wrench, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp,
  Activity,
  Clock
} from 'lucide-react';

export default function DashboardPage() {
  const { equipment, inspections, equipmentGroups, currentTheme } = useData();
  const { currentUser } = useAuth();
  const theme = THEMES[currentTheme];

  const activeEquipment = equipment.filter(e => e.isActive).length;
  const totalInspections = inspections.length;
  const today = new Date().toISOString().split('T')[0];
  const todayInspections = inspections.filter(i => i.date === today);

  // Calculate stats
  const okCount = inspections.flatMap(i => i.results).filter(r => r.status === 'ok').length;
  const nokCount = inspections.flatMap(i => i.results).filter(r => r.status === 'nok').length;
  const reviewCount = inspections.flatMap(i => i.results).filter(r => r.status === 'needs_review').length;

  const stats = [
    {
      name: 'تجهیزات فعال',
      value: activeEquipment.toString(),
      icon: Wrench,
      color: theme.primaryColor,
    },
    {
      name: 'بازدیدهای امروز',
      value: todayInspections.length.toString(),
      icon: CheckCircle,
      color: '#16a34a',
    },
    {
      name: 'خرابی‌ها',
      value: nokCount.toString(),
      icon: AlertTriangle,
      color: '#dc2626',
    },
    {
      name: 'نیاز به بررسی',
      value: reviewCount.toString(),
      icon: Activity,
      color: '#ea580c',
    },
  ];

  // Recent inspections
  const recentInspections = [...inspections]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2" style={{ color: theme.textColor }}>داشبورد مدیریتی</h1>
        <p className="text-gray-600">خوش آمدید، {currentUser?.fullName}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">{stat.name}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: stat.color + '20' }}>
                  <Icon className="w-6 h-6" style={{ color: stat.color }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Equipment Groups Overview */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold mb-4" style={{ color: theme.textColor }}>گروه‌های تجهیزات</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {equipmentGroups.map((group) => {
            const groupEquipment = equipment.filter(e => e.groupId === group.id && e.isActive).length;
            return (
              <div 
                key={group.id} 
                className="p-4 rounded-lg text-center hover:opacity-80 transition-opacity cursor-pointer"
                style={{ backgroundColor: group.color + '20', border: `2px solid ${group.color}` }}
              >
                <p className="font-bold" style={{ color: group.color }}>{group.name}</p>
                <p className="text-2xl font-bold mt-2" style={{ color: group.color }}>{groupEquipment}</p>
                <p className="text-xs mt-1" style={{ color: group.color }}>تجهیز</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Inspections */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold mb-4" style={{ color: theme.textColor }}>آخرین بازدیدها</h2>
        {recentInspections.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">تجهیز</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">تکنسین</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">تاریخ</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">وضعیت</th>
                </tr>
              </thead>
              <tbody>
                {recentInspections.map((inspection) => {
                  const equip = equipment.find(e => e.id === inspection.equipmentId);
                  return (
                    <tr key={inspection.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm">{equip?.name || '-'}</td>
                      <td className="py-3 px-4 text-sm">{inspection.technicianId}</td>
                      <td className="py-3 px-4 text-sm" dir="ltr">{inspection.date}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          inspection.status === 'completed' ? 'bg-green-100 text-green-700' :
                          inspection.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {inspection.status === 'completed' ? 'انجام شده' :
                           inspection.status === 'pending' ? 'در انتظار' : 'معوق'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">هنوز بازدیدی ثبت نشده است</p>
        )}
      </div>
    </div>
  );
}
