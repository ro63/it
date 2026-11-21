export interface ApiUser {
  id: string;
  username: string;
  fullName: string;
  personnelCode: string;
  mobile?: string | null;
  role: 'admin' | 'supervisor' | 'technician' | 'viewer';
  isActive: boolean;
  createdAt: string;
  sectionAccess: string[];
}

export interface ApiLoginResponse {
  token: string;
  expiresAt: string;
  user: ApiUser;
}

export interface ApiEquipmentGroup {
  id: string;
  name: string;
  description?: string | null;
  color: string;
  theme: string;
  isActive: boolean;
  createdAt: string;
  equipmentCount: number;
}

export interface ApiEquipment {
  id: string;
  code: string;
  name: string;
  type: string;
  groupId: string;
  groupName?: string | null;
  groupColor?: string | null;
  location: string;
  isActive: boolean;
  qrCode: string;
  imageUrl?: string | null;
  commissioningDate?: string | null;
  createdAt: string;
}

export interface ApiCheckItem {
  id: string;
  title: string;
  type: 'boolean' | 'numeric' | 'text';
  unit?: string | null;
  minValue?: number | null;
  maxValue?: number | null;
  isRequired: boolean;
  isActive: boolean;
  sectionType?: string | null;
  order: number;
  equipmentGroupIds: string[];
}

export interface ApiInspectionResult {
  id: string;
  checkItemId: string;
  checkItemTitle?: string | null;
  status: 'ok' | 'nok' | 'needs_review';
  value?: number | null;
  textValue?: string | null;
  comment?: string | null;
  technicianId: string;
  timestamp: string;
}

export interface ApiInspection {
  id: string;
  equipmentId: string;
  equipmentName?: string | null;
  equipmentCode?: string | null;
  technicianId: string;
  technicianName?: string | null;
  shiftId: string;
  date: string;
  status: 'completed' | 'pending' | 'overdue';
  createdAt: string;
  updatedAt: string;
  results: ApiInspectionResult[];
}

export interface PagedResult<T> {
  total: number;
  page: number;
  pageSize: number;
  items: T[];
}

export interface ApiDashboard {
  activeEquipment: number;
  todayInspections: number;
  nokCount: number;
  needsReviewCount: number;
  okCount: number;
  totalInspections: number;
  groups: { id: string; name: string; color: string; equipmentCount: number }[];
  recentInspections: ApiInspection[];
}
