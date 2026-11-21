import { useParams } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { THEMES, SHIFTS } from '../types';
import { CheckCircle, XCircle, AlertCircle, Camera, Mic, Video } from 'lucide-react';
import { useState } from 'react';

export default function InspectionPage() {
  const { equipmentId } = useParams();
  const { equipment, equipmentGroups, checkItems, currentTheme, addInspection } = useData();
  const { currentUser } = useAuth();
  const theme = THEMES[currentTheme];
  
  const equip = equipment.find(e => e.id === equipmentId);
  const group = equip ? equipmentGroups.find(g => g.id === equip.groupId) : null;
  const items = checkItems.filter(item => 
    item.isActive && 
    item.equipmentGroupIds.includes(equip?.groupId || '')
  ).sort((a, b) => a.order - b.order);

  const [selectedShift, setSelectedShift] = useState(SHIFTS[0].id);
  const [results, setResults] = useState<Record<string, any>>({});

  if (!equip || !group) {
    return <div className="text-center py-8">تجهیز مورد نظر یافت نشد</div>;
  }

  const handleSubmit = async () => {
    const inspectionResults = Object.entries(results).map(([checkItemId, result]: [string, any]) => ({
      id: Date.now().toString() + Math.random(),
      checkItemId,
      status: result.status,
      value: result.value,
      comment: result.comment,
      photos: [],
      videos: [],
      audioFiles: [],
      technicianId: currentUser?.id || '',
      timestamp: new Date(),
    }));

    try {
      await addInspection({
        equipmentId: equip.id,
        technicianId: currentUser?.id || '',
        shiftId: selectedShift,
        date: new Date().toISOString().split('T')[0],
        results: inspectionResults as any,
        status: 'completed',
      });

      alert('بازدید با موفقیت ثبت شد');
      setResults({});
    } catch (e: any) {
      alert(e?.message || 'ثبت بازدید انجام نشد');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold mb-2" style={{ color: theme.textColor }}>{equip.name}</h1>
        <p className="text-gray-600">فرم کنترل روزانه - {group.name}</p>
        
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">انتخاب شیفت</label>
          <div className="flex gap-2 flex-wrap">
            {SHIFTS.map((shift) => (
              <button
                key={shift.id}
                onClick={() => setSelectedShift(shift.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedShift === shift.id ? 'text-white' : 'bg-gray-100 hover:bg-gray-200'
                }`}
                style={selectedShift === shift.id ? { backgroundColor: theme.primaryColor } : {}}
              >
                {shift.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">{item.title}</h3>
              {item.type === 'numeric' && item.unit && (
                <span className="text-sm text-gray-500">واحد: {item.unit}</span>
              )}
            </div>

            {item.type === 'boolean' ? (
              <div className="flex gap-2">
                <button
                  onClick={() => setResults(prev => ({ ...prev, [item.id]: { status: 'ok', comment: prev[item.id]?.comment } }))}
                  className={`flex-1 flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-colors ${
                    results[item.id]?.status === 'ok' ? 'text-white' : 'bg-green-50 text-green-700 hover:bg-green-100'
                  }`}
                  style={results[item.id]?.status === 'ok' ? { backgroundColor: '#16a34a' } : {}}
                >
                  <CheckCircle className="w-5 h-5 ml-2" />
                  OK (سالم)
                </button>
                <button
                  onClick={() => setResults(prev => ({ ...prev, [item.id]: { status: 'nok', comment: prev[item.id]?.comment } }))}
                  className={`flex-1 flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-colors ${
                    results[item.id]?.status === 'nok' ? 'text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'
                  }`}
                  style={results[item.id]?.status === 'nok' ? { backgroundColor: '#dc2626' } : {}}
                >
                  <XCircle className="w-5 h-5 ml-2" />
                  NOK (معیوب)
                </button>
                <button
                  onClick={() => setResults(prev => ({ ...prev, [item.id]: { status: 'needs_review', comment: prev[item.id]?.comment } }))}
                  className={`flex-1 flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-colors ${
                    results[item.id]?.status === 'needs_review' ? 'text-white' : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                  }`}
                  style={results[item.id]?.status === 'needs_review' ? { backgroundColor: '#ea580c' } : {}}
                >
                  <AlertCircle className="w-5 h-5 ml-2" />
                  نیاز به بررسی
                </button>
              </div>
            ) : item.type === 'numeric' ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  min={item.min_value}
                  max={item.max_value}
                  onChange={(e) => setResults(prev => ({ 
                    ...prev, 
                    [item.id]: { 
                      status: e.target.value ? 'ok' : 'needs_review',
                      value: parseFloat(e.target.value),
                      comment: prev[item.id]?.comment 
                    } 
                  }))}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': theme.primaryColor } as React.CSSProperties}
                  placeholder="مقدار را وارد کنید"
                  dir="ltr"
                />
                {item.unit && (
                  <span className="text-gray-500 w-16">{item.unit}</span>
                )}
              </div>
            ) : null}

            <textarea
              onChange={(e) => setResults(prev => ({ 
                ...prev, 
                [item.id]: { 
                  status: prev[item.id]?.status || 'needs_review',
                  value: prev[item.id]?.value,
                  comment: e.target.value 
                } 
              }))}
              className="w-full mt-4 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 resize-none"
              style={{ '--tw-ring-color': theme.primaryColor } as React.CSSProperties}
              placeholder="توضیحات (اختیاری)"
              rows={2}
              dir="rtl"
            />

            <div className="flex gap-2 mt-4">
              <button className="flex items-center px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
                <Camera className="w-4 h-4 ml-1" />
                عکس
              </button>
              <button className="flex items-center px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
                <Video className="w-4 h-4 ml-1" />
                ویدئو
              </button>
              <button className="flex items-center px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
                <Mic className="w-4 h-4 ml-1" />
                صوت
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        className="w-full py-4 rounded-xl text-white font-bold text-lg hover:opacity-90 transition-opacity shadow-lg"
        style={{ backgroundColor: theme.primaryColor }}
      >
        ثبت بازدید
      </button>
    </div>
  );
}
