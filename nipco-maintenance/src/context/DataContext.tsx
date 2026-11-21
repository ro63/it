import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { EquipmentGroup, Equipment, CheckItem, DailyInspection, ThemeType } from '../types';
import { SHIFTS } from '../types';

interface DataContextType {
  equipmentGroups: EquipmentGroup[];
  equipment: Equipment[];
  checkItems: CheckItem[];
  inspections: DailyInspection[];
  currentTheme: ThemeType;
  addEquipmentGroup: (group: Omit<EquipmentGroup, 'id' | 'createdAt'>) => void;
  updateEquipmentGroup: (id: string, updates: Partial<EquipmentGroup>) => void;
  addEquipment: (equipment: Omit<Equipment, 'id' | 'createdAt'>) => void;
  updateEquipment: (id: string, updates: Partial<Equipment>) => void;
  addCheckItem: (item: Omit<CheckItem, 'id'>) => void;
  updateCheckItem: (id: string, updates: Partial<CheckItem>) => void;
  addInspection: (inspection: Omit<DailyInspection, 'id' | 'createdAt' | 'updatedAt'>) => void;
  setTheme: (theme: ThemeType) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Sample equipment groups
const sampleEquipmentGroups: EquipmentGroup[] = [
  {
    id: '1',
    name: 'پرس‌ها',
    description: 'پرس‌های هیدرولیک',
    color: '#3b82f6',
    theme: 'blue',
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: '2',
    name: 'ربات‌ها',
    description: 'ربات‌های ABB',
    color: '#16a34a',
    theme: 'green',
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: '3',
    name: 'کمپرسورها',
    description: 'کمپرسورهای اسکرو',
    color: '#ea580c',
    theme: 'orange',
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: '4',
    name: 'لیفتراک‌ها',
    description: 'لیفتراک‌های سپاهان',
    color: '#9333ea',
    theme: 'purple',
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: '5',
    name: 'موتورخانه',
    description: 'تجهیزات موتورخانه',
    color: '#dc2626',
    theme: 'red',
    isActive: true,
    createdAt: new Date(),
  },
];

// Sample equipment
const sampleEquipment: Equipment[] = [
  // Presses
  { id: 'p1', code: 'PRS-1000', name: 'پرس هیدرولیک 1000 تن', type: 'press', groupId: '1', location: 'سالن تولید 1', isActive: true, qrCode: 'PRS-1000', commissioningDate: new Date('2020-01-01'), createdAt: new Date() },
  { id: 'p2', code: 'PRS-1200', name: 'پرس هیدرولیک 1200 تن', type: 'press', groupId: '1', location: 'سالن تولید 1', isActive: true, qrCode: 'PRS-1200', commissioningDate: new Date('2020-01-01'), createdAt: new Date() },
  { id: 'p3', code: 'PRS-1500', name: 'پرس هیدرولیک 1500 تن', type: 'press', groupId: '1', location: 'سالن تولید 2', isActive: true, qrCode: 'PRS-1500', commissioningDate: new Date('2020-01-01'), createdAt: new Date() },
  { id: 'p4', code: 'PRS-2000', name: 'پرس هیدرولیک 2000 تن', type: 'press', groupId: '1', location: 'سالن تولید 2', isActive: true, qrCode: 'PRS-2000', commissioningDate: new Date('2020-01-01'), createdAt: new Date() },
  { id: 'p5', code: 'PRS-1200-A', name: 'پرس هیدرولیک 1200 تن عابدی', type: 'press', groupId: '1', location: 'سالن تولید 3', isActive: true, qrCode: 'PRS-1200-A', commissioningDate: new Date('2020-01-01'), createdAt: new Date() },
  { id: 'p6', code: 'PRS-006', name: 'پرس شماره 6', type: 'press', groupId: '1', location: 'سالن تولید 3', isActive: true, qrCode: 'PRS-006', commissioningDate: new Date('2020-01-01'), createdAt: new Date() },
  
  // Robots
  ...Array.from({ length: 7 }, (_, i) => ({
    id: `r${i + 1}`,
    code: `ABB-${String(i + 1).padStart(2, '0')}`,
    name: `ربات ABB-${String(i + 1).padStart(2, '0')}`,
    type: 'robot' as const,
    groupId: '2',
    location: 'خط مونتاژ',
    isActive: true,
    qrCode: `ABB-${String(i + 1).padStart(2, '0')}`,
    commissioningDate: new Date('2021-01-01'),
    createdAt: new Date(),
  })),
  
  // Compressors
  ...Array.from({ length: 4 }, (_, i) => ({
    id: `c${i + 1}`,
    code: `CMP-${String(i + 1).padStart(2, '0')}`,
    name: `کمپرسور ${String(i + 1).padStart(2, '0')}`,
    type: 'compressor' as const,
    groupId: '3',
    location: 'اتاق کمپرسور',
    isActive: true,
    qrCode: `CMP-${String(i + 1).padStart(2, '0')}`,
    commissioningDate: new Date('2019-01-01'),
    createdAt: new Date(),
  })),
  
  // Forklifts
  ...Array.from({ length: 5 }, (_, i) => ({
    id: `f${i + 1}`,
    code: `FLK-${String(i + 1).padStart(2, '0')}`,
    name: `لیفتراک ${String(i + 1).padStart(2, '0')}`,
    type: 'forklift' as const,
    groupId: '4',
    location: 'انبار',
    isActive: true,
    qrCode: `FLK-${String(i + 1).padStart(2, '0')}`,
    commissioningDate: new Date('2018-01-01'),
    createdAt: new Date(),
  })),
];

// Sample check items
const sampleCheckItems: CheckItem[] = [
  // Press check items
  { id: 'ci1', title: 'بررسی سطح روغن', type: 'boolean', isRequired: true, isActive: true, equipmentGroupIds: ['1'], order: 1, sectionType: 'mechanical' },
  { id: 'ci2', title: 'بررسی نشتی روغن', type: 'boolean', isRequired: true, isActive: true, equipmentGroupIds: ['1'], order: 2, sectionType: 'mechanical' },
  { id: 'ci3', title: 'بررسی فشار سیستم', type: 'numeric', unit: 'bar', min_value: 0, max_value: 300, isRequired: true, isActive: true, equipmentGroupIds: ['1'], order: 3, sectionType: 'mechanical' },
  { id: 'ci4', title: 'بررسی دمای روغن', type: 'numeric', unit: '°C', min_value: 0, max_value: 100, isRequired: true, isActive: true, equipmentGroupIds: ['1'], order: 4, sectionType: 'mechanical' },
  { id: 'ci5', title: 'بررسی صدای غیرعادی', type: 'boolean', isRequired: true, isActive: true, equipmentGroupIds: ['1'], order: 5, sectionType: 'mechanical' },
  { id: 'ci6', title: 'بررسی سنسورها', type: 'boolean', isRequired: true, isActive: true, equipmentGroupIds: ['1'], order: 6, sectionType: 'electrical' },
  { id: 'ci7', title: 'بررسی وضعیت ایمنی', type: 'boolean', isRequired: true, isActive: true, equipmentGroupIds: ['1'], order: 7, sectionType: 'safety' },
  
  // Robot check items
  { id: 'ci8', title: 'بررسی آلارم', type: 'boolean', isRequired: true, isActive: true, equipmentGroupIds: ['2'], order: 1, sectionType: 'electrical' },
  { id: 'ci9', title: 'بررسی کابل‌ها', type: 'boolean', isRequired: true, isActive: true, equipmentGroupIds: ['2'], order: 2, sectionType: 'electrical' },
  { id: 'ci10', title: 'بررسی گریس کاری', type: 'boolean', isRequired: true, isActive: true, equipmentGroupIds: ['2'], order: 3, sectionType: 'mechanical' },
  { id: 'ci11', title: 'بررسی وضعیت سروو', type: 'boolean', isRequired: true, isActive: true, equipmentGroupIds: ['2'], order: 4, sectionType: 'electrical' },
  { id: 'ci12', title: 'بررسی Emergency Stop', type: 'boolean', isRequired: true, isActive: true, equipmentGroupIds: ['2'], order: 5, sectionType: 'safety' },
  
  // Compressor check items
  { id: 'ci13', title: 'سطح روغن', type: 'boolean', isRequired: true, isActive: true, equipmentGroupIds: ['3'], order: 1, sectionType: 'mechanical' },
  { id: 'ci14', title: 'فشار خروجی', type: 'numeric', unit: 'bar', min_value: 0, max_value: 13, isRequired: true, isActive: true, equipmentGroupIds: ['3'], order: 2, sectionType: 'mechanical' },
  { id: 'ci15', title: 'دمای کاری', type: 'numeric', unit: '°C', min_value: 0, max_value: 100, isRequired: true, isActive: true, equipmentGroupIds: ['3'], order: 3, sectionType: 'mechanical' },
  { id: 'ci16', title: 'نشتی هوا', type: 'boolean', isRequired: true, isActive: true, equipmentGroupIds: ['3'], order: 4, sectionType: 'mechanical' },
  { id: 'ci17', title: 'وضعیت فیلترها', type: 'boolean', isRequired: true, isActive: true, equipmentGroupIds: ['3'], order: 5, sectionType: 'mechanical' },
  
  // Forklift check items
  { id: 'ci18', title: 'آب رادیاتور', type: 'boolean', isRequired: true, isActive: true, equipmentGroupIds: ['4'], order: 1, sectionType: 'mechanical' },
  { id: 'ci19', title: 'روغن موتور', type: 'boolean', isRequired: true, isActive: true, equipmentGroupIds: ['4'], order: 2, sectionType: 'mechanical' },
  { id: 'ci20', title: 'روغن هیدرولیک', type: 'boolean', isRequired: true, isActive: true, equipmentGroupIds: ['4'], order: 3, sectionType: 'mechanical' },
  { id: 'ci21', title: 'وضعیت لاستیک', type: 'boolean', isRequired: true, isActive: true, equipmentGroupIds: ['4'], order: 4, sectionType: 'mechanical' },
  { id: 'ci22', title: 'چراغ‌ها', type: 'boolean', isRequired: true, isActive: true, equipmentGroupIds: ['4'], order: 5, sectionType: 'electrical' },
  { id: 'ci23', title: 'بوق', type: 'boolean', isRequired: true, isActive: true, equipmentGroupIds: ['4'], order: 6, sectionType: 'safety' },
  
  // Boiler room check items
  { id: 'ci24', title: 'فشار سیستم', type: 'numeric', unit: 'bar', min_value: 0, max_value: 10, isRequired: true, isActive: true, equipmentGroupIds: ['5'], order: 1, sectionType: 'mechanical' },
  { id: 'ci25', title: 'دمای سیستم', type: 'numeric', unit: '°C', min_value: 0, max_value: 120, isRequired: true, isActive: true, equipmentGroupIds: ['5'], order: 2, sectionType: 'mechanical' },
  { id: 'ci26', title: 'نشتی', type: 'boolean', isRequired: true, isActive: true, equipmentGroupIds: ['5'], order: 3, sectionType: 'mechanical' },
  { id: 'ci27', title: 'وضعیت پمپ‌ها', type: 'boolean', isRequired: true, isActive: true, equipmentGroupIds: ['5'], order: 4, sectionType: 'mechanical' },
  { id: 'ci28', title: 'وضعیت برق', type: 'boolean', isRequired: true, isActive: true, equipmentGroupIds: ['5'], order: 5, sectionType: 'electrical' },
];

export function DataProvider({ children }: { children: ReactNode }) {
  const [equipmentGroups, setEquipmentGroups] = useState<EquipmentGroup[]>(() => {
    const saved = localStorage.getItem('nipco_equipment_groups');
    return saved ? JSON.parse(saved) : sampleEquipmentGroups;
  });

  const [equipment, setEquipment] = useState<Equipment[]>(() => {
    const saved = localStorage.getItem('nipco_equipment');
    return saved ? JSON.parse(saved) : sampleEquipment;
  });

  const [checkItems, setCheckItems] = useState<CheckItem[]>(() => {
    const saved = localStorage.getItem('nipco_check_items');
    return saved ? JSON.parse(saved) : sampleCheckItems;
  });

  const [inspections, setInspections] = useState<DailyInspection[]>(() => {
    const saved = localStorage.getItem('nipco_inspections');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentTheme, setCurrentTheme] = useState<ThemeType>(() => {
    const saved = localStorage.getItem('nipco_theme');
    return (saved as ThemeType) || 'default';
  });

  useEffect(() => {
    localStorage.setItem('nipco_equipment_groups', JSON.stringify(equipmentGroups));
  }, [equipmentGroups]);

  useEffect(() => {
    localStorage.setItem('nipco_equipment', JSON.stringify(equipment));
  }, [equipment]);

  useEffect(() => {
    localStorage.setItem('nipco_check_items', JSON.stringify(checkItems));
  }, [checkItems]);

  useEffect(() => {
    localStorage.setItem('nipco_inspections', JSON.stringify(inspections));
  }, [inspections]);

  useEffect(() => {
    localStorage.setItem('nipco_theme', currentTheme);
  }, [currentTheme]);

  const addEquipmentGroup = (group: Omit<EquipmentGroup, 'id' | 'createdAt'>) => {
    const newGroup: EquipmentGroup = {
      ...group,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    setEquipmentGroups(prev => [...prev, newGroup]);
  };

  const updateEquipmentGroup = (id: string, updates: Partial<EquipmentGroup>) => {
    setEquipmentGroups(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
  };

  const addEquipment = (equip: Omit<Equipment, 'id' | 'createdAt'>) => {
    const newEquipment: Equipment = {
      ...equip,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    setEquipment(prev => [...prev, newEquipment]);
  };

  const updateEquipment = (id: string, updates: Partial<Equipment>) => {
    setEquipment(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const addCheckItem = (item: Omit<CheckItem, 'id'>) => {
    const newItem: CheckItem = {
      ...item,
      id: Date.now().toString(),
    };
    setCheckItems(prev => [...prev, newItem]);
  };

  const updateCheckItem = (id: string, updates: Partial<CheckItem>) => {
    setCheckItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const addInspection = (inspection: Omit<DailyInspection, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newInspection: DailyInspection = {
      ...inspection,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setInspections(prev => [...prev, newInspection]);
  };

  const setTheme = (theme: ThemeType) => {
    setCurrentTheme(theme);
  };

  return (
    <DataContext.Provider value={{
      equipmentGroups,
      equipment,
      checkItems,
      inspections,
      currentTheme,
      addEquipmentGroup,
      updateEquipmentGroup,
      addEquipment,
      updateEquipment,
      addCheckItem,
      updateCheckItem,
      addInspection,
      setTheme,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
