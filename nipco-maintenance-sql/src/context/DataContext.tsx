import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { EquipmentGroup, Equipment, CheckItem, DailyInspection, ThemeType } from '../types';
import { api } from '../api/client';
import { useAuth } from './AuthContext';
import type {
  ApiCheckItem, ApiEquipment, ApiEquipmentGroup, ApiInspection, ApiInspectionResult, PagedResult,
} from '../api/types';

interface DataContextType {
  equipmentGroups: EquipmentGroup[];
  equipment: Equipment[];
  checkItems: CheckItem[];
  inspections: DailyInspection[];
  currentTheme: ThemeType;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addEquipmentGroup: (group: Omit<EquipmentGroup, 'id' | 'createdAt'>) => Promise<void>;
  updateEquipmentGroup: (id: string, updates: Partial<EquipmentGroup>) => Promise<void>;
  addEquipment: (equipment: Omit<Equipment, 'id' | 'createdAt'>) => Promise<void>;
  updateEquipment: (id: string, updates: Partial<Equipment>) => Promise<void>;
  addCheckItem: (item: Omit<CheckItem, 'id'>) => Promise<void>;
  updateCheckItem: (id: string, updates: Partial<CheckItem>) => Promise<void>;
  addInspection: (inspection: Omit<DailyInspection, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  findEquipmentByCode: (code: string) => Promise<Equipment | null>;
  setTheme: (theme: ThemeType) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const THEME_KEY = 'nipco_theme';

// ---------------------------------------------------------------- mappers
function toUiGroup(g: ApiEquipmentGroup): EquipmentGroup {
  return {
    id: g.id,
    name: g.name,
    description: g.description ?? undefined,
    color: g.color,
    theme: (g.theme as ThemeType) ?? 'default',
    isActive: g.isActive,
    createdAt: new Date(g.createdAt),
  };
}

function toUiEquipment(e: ApiEquipment): Equipment {
  return {
    id: e.id,
    code: e.code,
    name: e.name,
    type: (e.type as Equipment['type']) ?? 'custom',
    groupId: e.groupId,
    location: e.location,
    isActive: e.isActive,
    qrCode: e.qrCode,
    imageUrl: e.imageUrl ?? undefined,
    commissioningDate: e.commissioningDate ? new Date(e.commissioningDate) : new Date(),
    createdAt: new Date(e.createdAt),
  };
}

function toUiCheckItem(i: ApiCheckItem): CheckItem {
  return {
    id: i.id,
    title: i.title,
    type: i.type,
    unit: i.unit ?? undefined,
    min_value: i.minValue ?? undefined,
    max_value: i.maxValue ?? undefined,
    isRequired: i.isRequired,
    isActive: i.isActive,
    equipmentGroupIds: i.equipmentGroupIds,
    sectionType: i.sectionType ?? undefined,
    order: i.order,
  };
}

function toUiInspection(i: ApiInspection): DailyInspection {
  return {
    id: i.id,
    equipmentId: i.equipmentId,
    technicianId: i.technicianName || i.technicianId,
    shiftId: i.shiftId as DailyInspection['shiftId'],
    date: i.date,
    status: i.status,
    createdAt: new Date(i.createdAt),
    updatedAt: new Date(i.updatedAt),
    results: i.results.map((r: ApiInspectionResult) => ({
      id: r.id,
      checkItemId: r.checkItemId,
      status: r.status,
      value: r.value ?? undefined,
      textValue: r.textValue ?? undefined,
      comment: r.comment ?? undefined,
      photos: [],
      videos: [],
      audioFiles: [],
      technicianId: r.technicianId,
      timestamp: new Date(r.timestamp),
    })),
  };
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isInitializing } = useAuth();
  const [equipmentGroups, setEquipmentGroups] = useState<EquipmentGroup[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [checkItems, setCheckItems] = useState<CheckItem[]>([]);
  const [inspections, setInspections] = useState<DailyInspection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentTheme, setCurrentTheme] = useState<ThemeType>(() => {
    const saved = localStorage.getItem(THEME_KEY);
    return (saved as ThemeType) || 'default';
  });

  useEffect(() => {
    localStorage.setItem(THEME_KEY, currentTheme);
  }, [currentTheme]);

  // ------------------------------------------------------------ data load
  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [groups, items, checklist, page] = await Promise.all([
        api.get<ApiEquipmentGroup[]>('/api/equipment-groups'),
        api.get<ApiEquipment[]>('/api/equipment'),
        api.get<ApiCheckItem[]>('/api/check-items'),
        api.get<PagedResult<ApiInspection>>('/api/inspections?pageSize=200'),
      ]);

      setEquipmentGroups(groups.map(toUiGroup));
      setEquipment(items.map(toUiEquipment));
      setCheckItems(checklist.map(toUiCheckItem));
      setInspections(page.items.map(toUiInspection));
    } catch (e: any) {
      setError(e?.message || 'دریافت اطلاعات از سرور انجام نشد');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load once the session is known: the API rejects anonymous requests.
  useEffect(() => {
    if (isInitializing) return;

    if (isAuthenticated) {
      refresh();
    } else {
      setEquipmentGroups([]);
      setEquipment([]);
      setCheckItems([]);
      setInspections([]);
      setIsLoading(false);
      setError(null);
    }
  }, [isAuthenticated, isInitializing, refresh]);

  // ----------------------------------------------------------- group CRUD
  const addEquipmentGroup = async (group: Omit<EquipmentGroup, 'id' | 'createdAt'>) => {
    const created = await api.post<ApiEquipmentGroup>('/api/equipment-groups', {
      name: group.name,
      description: group.description ?? null,
      color: group.color,
      theme: group.theme,
      isActive: group.isActive,
    });
    setEquipmentGroups(prev => [...prev, toUiGroup(created)]);
  };

  const updateEquipmentGroup = async (id: string, updates: Partial<EquipmentGroup>) => {
    const current = equipmentGroups.find(g => g.id === id);
    if (!current) return;

    const merged = { ...current, ...updates };
    const updated = await api.put<ApiEquipmentGroup>(`/api/equipment-groups/${id}`, {
      name: merged.name,
      description: merged.description ?? null,
      color: merged.color,
      theme: merged.theme,
      isActive: merged.isActive,
    });
    setEquipmentGroups(prev => prev.map(g => (g.id === id ? toUiGroup(updated) : g)));
  };

  // ------------------------------------------------------- equipment CRUD
  const addEquipment = async (equip: Omit<Equipment, 'id' | 'createdAt'>) => {
    const created = await api.post<ApiEquipment>('/api/equipment', {
      code: equip.code,
      name: equip.name,
      type: equip.type,
      groupId: equip.groupId,
      location: equip.location,
      isActive: equip.isActive,
      qrCode: equip.qrCode,
      imageUrl: equip.imageUrl ?? null,
      commissioningDate: equip.commissioningDate
        ? new Date(equip.commissioningDate).toISOString().slice(0, 10)
        : null,
    });
    setEquipment(prev => [...prev, toUiEquipment(created)]);
  };

  const updateEquipment = async (id: string, updates: Partial<Equipment>) => {
    const current = equipment.find(e => e.id === id);
    if (!current) return;

    const merged = { ...current, ...updates };
    const updated = await api.put<ApiEquipment>(`/api/equipment/${id}`, {
      code: merged.code,
      name: merged.name,
      type: merged.type,
      groupId: merged.groupId,
      location: merged.location,
      isActive: merged.isActive,
      qrCode: merged.qrCode,
      imageUrl: merged.imageUrl ?? null,
      commissioningDate: merged.commissioningDate
        ? new Date(merged.commissioningDate).toISOString().slice(0, 10)
        : null,
    });
    setEquipment(prev => prev.map(e => (e.id === id ? toUiEquipment(updated) : e)));
  };

  const findEquipmentByCode = async (code: string): Promise<Equipment | null> => {
    try {
      const found = await api.get<ApiEquipment>(`/api/equipment/by-code/${encodeURIComponent(code.trim())}`);
      return toUiEquipment(found);
    } catch {
      return null;
    }
  };

  // ------------------------------------------------------ check item CRUD
  const addCheckItem = async (item: Omit<CheckItem, 'id'>) => {
    const created = await api.post<ApiCheckItem>('/api/check-items', {
      title: item.title,
      type: item.type,
      unit: item.unit ?? null,
      minValue: item.min_value ?? null,
      maxValue: item.max_value ?? null,
      isRequired: item.isRequired,
      isActive: item.isActive,
      sectionType: item.sectionType ?? null,
      order: item.order,
      equipmentGroupIds: item.equipmentGroupIds,
    });
    setCheckItems(prev => [...prev, toUiCheckItem(created)]);
  };

  const updateCheckItem = async (id: string, updates: Partial<CheckItem>) => {
    const current = checkItems.find(i => i.id === id);
    if (!current) return;

    const merged = { ...current, ...updates };
    const updated = await api.put<ApiCheckItem>(`/api/check-items/${id}`, {
      title: merged.title,
      type: merged.type,
      unit: merged.unit ?? null,
      minValue: merged.min_value ?? null,
      maxValue: merged.max_value ?? null,
      isRequired: merged.isRequired,
      isActive: merged.isActive,
      sectionType: merged.sectionType ?? null,
      order: merged.order,
      equipmentGroupIds: merged.equipmentGroupIds,
    });
    setCheckItems(prev => prev.map(i => (i.id === id ? toUiCheckItem(updated) : i)));
  };

  // -------------------------------------------------------- inspections
  const addInspection = async (inspection: Omit<DailyInspection, 'id' | 'createdAt' | 'updatedAt'>) => {
    const created = await api.post<ApiInspection>('/api/inspections', {
      equipmentId: inspection.equipmentId,
      shiftId: inspection.shiftId,
      date: inspection.date,
      status: inspection.status,
      results: inspection.results.map(r => ({
        checkItemId: r.checkItemId,
        status: r.status,
        value: r.value ?? null,
        textValue: r.textValue ?? null,
        comment: r.comment ?? null,
      })),
    });
    setInspections(prev => [...prev, toUiInspection(created)]);
  };

  const setTheme = (theme: ThemeType) => setCurrentTheme(theme);

  return (
    <DataContext.Provider value={{
      equipmentGroups,
      equipment,
      checkItems,
      inspections,
      currentTheme,
      isLoading,
      error,
      refresh,
      addEquipmentGroup,
      updateEquipmentGroup,
      addEquipment,
      updateEquipment,
      addCheckItem,
      updateCheckItem,
      addInspection,
      findEquipmentByCode,
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
