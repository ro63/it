import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { THEMES } from '../types';
import { ScanLine } from 'lucide-react';
import { useState } from 'react';

export default function QRScannerPage() {
  const navigate = useNavigate();
  const { findEquipmentByCode, currentTheme } = useData();
  const theme = THEMES[currentTheme];
  const [qrCode, setQrCode] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleScan = async () => {
    if (!qrCode.trim()) return;
    setIsSearching(true);
    const equip = await findEquipmentByCode(qrCode);
    setIsSearching(false);

    if (equip) {
      navigate(`/inspection/${equip.id}`);
    } else {
      alert('تجهیز با این کد یافت نشد');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: theme.textColor }}>اسکن QR Code</h1>
      
      <div className="bg-white rounded-xl shadow-sm p-6 text-center">
        <div className="w-64 h-64 mx-auto bg-gray-100 rounded-lg flex items-center justify-center mb-6">
          <ScanLine className="w-32 h-32 text-gray-400" />
        </div>
        
        <p className="text-gray-600 mb-4">کد QR تجهیز را اسکن کنید یا کد را وارد نمایید</p>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={qrCode}
            onChange={(e) => setQrCode(e.target.value)}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': theme.primaryColor } as React.CSSProperties}
            placeholder="کد تجهیز را وارد کنید"
            dir="ltr"
          />
          <button
            onClick={handleScan}
            disabled={isSearching}
            className="px-6 py-3 rounded-lg text-white font-medium hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: theme.primaryColor }}
          >
            {isSearching ? '...' : 'جستجو'}
          </button>
        </div>
        
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            برای تست می‌توانید یکی از کدهای زیر را وارد کنید:<br />
            PRS-1000, ABB-01, CMP-01, FLK-01
          </p>
        </div>
      </div>
    </div>
  );
}
