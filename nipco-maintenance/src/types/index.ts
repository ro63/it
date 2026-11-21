export type UserRole = 'admin' | 'supervisor' | 'technician' | 'viewer';

export interface User {
  id: string;
  fullName: string;
  personnelCode: string;
  username: string;
  password: string;
  mobile: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  formAccess?: string[]; // Access to specific forms
  sectionAccess?: string[]; // Access to specific sections (e.g., electrical, mechanical)
}

export type EquipmentType = 
  | 'press' 
  | 'robot' 
  | 'compressor' 
  | 'forklift' 
  | 'boiler_room'
  | 'custom';

export interface EquipmentGroup {
  id: string;
  name: string;
  description?: string;
  color: string;
  theme: ThemeType;
  isActive: boolean;
  createdAt: Date;
}

export interface Equipment {
  id: string;
  code: string;
  name: string;
  type: EquipmentType;
  groupId: string;
  location: string;
  isActive: boolean;
  qrCode: string;
  imageUrl?: string;
  commissioningDate: Date;
  createdAt: Date;
}

export type CheckItemType = 'boolean' | 'numeric' | 'text';

export interface CheckItem {
  id: string;
  title: string;
  type: CheckItemType;
  unit?: string; // For numeric values (e.g., bar, °C)
  min_value?: number;
  max_value?: number;
  isRequired: boolean;
  isActive: boolean;
  equipmentGroupIds: string[]; // Which equipment groups this item applies to
  sectionType?: string; // e.g., 'electrical', 'mechanical'
  order: number;
}

export type ShiftType = 'shift1' | 'shift2' | 'shift3';

export interface Shift {
  id: ShiftType;
  name: string;
  startTime: string;
  endTime: string;
}

export type InspectionStatus = 'ok' | 'nok' | 'needs_review';

export interface InspectionResult {
  id: string;
  checkItemId: string;
  status: InspectionStatus;
  value?: number; // For numeric inputs
  textValue?: string; // For text inputs
  comment?: string;
  photos: string[];
  videos: string[];
  audioFiles: string[];
  technicianId: string;
  timestamp: Date;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface DailyInspection {
  id: string;
  equipmentId: string;
  technicianId: string;
  shiftId: ShiftType;
  date: string; // YYYY-MM-DD
  results: InspectionResult[];
  status: 'completed' | 'pending' | 'overdue';
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  isRead: boolean;
  createdAt: Date;
}

export type ThemeType = 'default' | 'blue' | 'green' | 'red' | 'purple' | 'orange';

export interface Theme {
  id: ThemeType;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
}

export const THEMES: Record<ThemeType, Theme> = {
  default: {
    id: 'default',
    name: 'پیش‌فرض',
    primaryColor: '#3b82f6',
    secondaryColor: '#1e40af',
    backgroundColor: '#f5f5f5',
    textColor: '#1f2937',
  },
  blue: {
    id: 'blue',
    name: 'آبی',
    primaryColor: '#2563eb',
    secondaryColor: '#1e40af',
    backgroundColor: '#eff6ff',
    textColor: '#1e3a8a',
  },
  green: {
    id: 'green',
    name: 'سبز',
    primaryColor: '#16a34a',
    secondaryColor: '#15803d',
    backgroundColor: '#f0fdf4',
    textColor: '#14532d',
  },
  red: {
    id: 'red',
    name: 'قرمز',
    primaryColor: '#dc2626',
    secondaryColor: '#b91c1c',
    backgroundColor: '#fef2f2',
    textColor: '#7f1d1d',
  },
  purple: {
    id: 'purple',
    name: 'بنفش',
    primaryColor: '#9333ea',
    secondaryColor: '#7e22ce',
    backgroundColor: '#faf5ff',
    textColor: '#581c87',
  },
  orange: {
    id: 'orange',
    name: 'نارنجی',
    primaryColor: '#ea580c',
    secondaryColor: '#c2410c',
    backgroundColor: '#fff7ed',
    textColor: '#7c2d12',
  },
};

export const SHIFTS: Shift[] = [
  { id: 'shift1', name: 'شیفت ۱ (۶ تا ۲)', startTime: '06:00', endTime: '14:00' },
  { id: 'shift2', name: 'شیفت ۲ (۲ تا ۱۰)', startTime: '14:00', endTime: '22:00' },
  { id: 'shift3', name: 'شیفت ۳ (۱۰ تا ۶)', startTime: '22:00', endTime: '06:00' },
];
