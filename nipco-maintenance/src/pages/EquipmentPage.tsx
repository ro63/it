import { useData } from '../context/DataContext';
import { THEMES } from '../types';
import { Wrench, Plus, Edit2, QrCode } from 'lucide-react';
import { useState } from 'react';

export default function EquipmentPage() {
  const { equipment, equipmentGroups, currentTheme, addEquipment } = useData();
  const theme = THEMES[currentTheme];
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string>('all');

  const filteredEquipment = selectedGroup === 'all' 
    ? equipment 
    : equipment.filter(e => e.groupId === selectedGroup);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: theme.textColor }}>مدیریت تجهیزات</h1>
          <p className="text-gray-600">لیست تمام تجهیزات و دستگاه‌ها</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
          style={{ backgroundColor: theme.primaryColor }}
        >
          <Plus className="w-5 h-5 ml-2" />
          افزودن تجهیز
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedGroup('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedGroup === 'all' ? 'text-white' : 'bg-white hover:bg-gray-50'
          }`}
          style={selectedGroup === 'all' ? { backgroundColor: theme.primaryColor } : {}}
        >
          همه
        </button>
        {equipmentGroups.map((group) => (
          <button
            key={group.id}
            onClick={() => setSelectedGroup(group.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedGroup === group.id ? 'text-white' : 'bg-white hover:bg-gray-50'
            }`}
            style={selectedGroup === group.id ? { backgroundColor: group.color } : {}}
          >
            {group.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEquipment.map((equip) => {
          const group = equipmentGroups.find(g => g.id === equip.groupId);
          return (
            <div key={equip.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: group?.color + '20' }}>
                    <Wrench className="w-6 h-6" style={{ color: group?.color }} />
                  </div>
                  <div className="mr-3">
                    <h3 className="font-bold">{equip.name}</h3>
                    <p className="text-sm text-gray-500" dir="ltr">{equip.code}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  equip.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {equip.isActive ? 'فعال' : 'غیرفعال'}
                </span>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>محل استقرار:</span>
                  <span>{equip.location}</span>
                </div>
                <div className="flex justify-between">
                  <span>گروه:</span>
                  <span>{group?.name}</span>
                </div>
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t">
                <button className="flex-1 flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 transition-colors">
                  <QrCode className="w-4 h-4 ml-1" />
                  QR Code
                </button>
                <button className="flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <h2 className="text-lg font-bold mb-4">افزودن تجهیز جدید</h2>
            <form className="space-y-4" onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              addEquipment({
                code: formData.get('code') as string,
                name: formData.get('name') as string,
                type: formData.get('type') as any,
                groupId: formData.get('groupId') as string,
                location: formData.get('location') as string,
                isActive: true,
                qrCode: formData.get('code') as string,
                commissioningDate: new Date(formData.get('commissioningDate') as string),
              });
              setShowAddModal(false);
            }}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">کد تجهیز</label>
                <input name="code" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2" style={{ '--tw-ring-color': theme.primaryColor } as React.CSSProperties} dir="rtl" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نام تجهیز</label>
                <input name="name" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2" style={{ '--tw-ring-color': theme.primaryColor } as React.CSSProperties} dir="rtl" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">گروه</label>
                <select name="groupId" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2" style={{ '--tw-ring-color': theme.primaryColor } as React.CSSProperties} dir="rtl">
                  {equipmentGroups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نوع</label>
                <select name="type" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2" style={{ '--tw-ring-color': theme.primaryColor } as React.CSSProperties} dir="rtl">
                  <option value="press">پرس</option>
                  <option value="robot">ربات</option>
                  <option value="compressor">کمپرسور</option>
                  <option value="forklift">لیفتراک</option>
                  <option value="boiler_room">موتورخانه</option>
                  <option value="custom">سفارشی</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">محل استقرار</label>
                <input name="location" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2" style={{ '--tw-ring-color': theme.primaryColor } as React.CSSProperties} dir="rtl" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">تاریخ بهره‌برداری</label>
                <input name="commissioningDate" type="date" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2" style={{ '--tw-ring-color': theme.primaryColor } as React.CSSProperties} dir="rtl" />
              </div>
              <div className="flex gap-2 pt-4">
                <button type="submit" className="flex-1 py-2 rounded-lg text-white font-medium hover:opacity-90" style={{ backgroundColor: theme.primaryColor }}>ثبت</button>
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2 rounded-lg bg-gray-100 hover:bg-gray-200">انصراف</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
