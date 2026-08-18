export type Role = "admin" | "supervisor" | "technician" | "viewer";

export interface User {
  id: string;
  fullName: string;
  personnelCode: string;
  username: string;
  passwordHash: string;
  mobile: string;
  role: Role;
  active: boolean;
  /** دسترسی به فرم‌ها (چک‌لیست‌ها) — برای admin/supervisor نادیده گرفته می‌شود */
  allowedChecklistIds: string[];
  /** دسترسی به بخش‌های خاص فرم — خالی یعنی همه بخش‌ها */
  allowedSectionIds: string[];
}

export interface EquipmentGroup {
  id: string;
  name: string;
  icon: string;
  color: string;
  active: boolean;
}

export type EqStatus = "active" | "inactive" | "repair" | "out";

export interface Equipment {
  id: string;
  code: string;
  name: string;
  groupId: string;
  location: string;
  status: EqStatus;
  image?: string;
  commissionDate: string; // jalali string e.g. 1401/03/15
}

export type ItemType = "status" | "number" | "both";

export interface ChecklistItem {
  id: string;
  title: string;
  type: ItemType;
  unit?: string;
  min?: number | null;
  max?: number | null;
  active: boolean;
}

export interface ChecklistSection {
  id: string;
  title: string;
  active: boolean;
  /** خالی = همه کاربرانِ مجاز به فرم */
  allowedUserIds: string[];
  allowedRoles: Role[];
  items: ChecklistItem[];
}

export interface Checklist {
  id: string;
  name: string;
  groupIds: string[];
  active: boolean;
  sections: ChecklistSection[];
}

export interface StatusOption {
  id: string;
  label: string;
  short: string; // OK / NOK
  kind: "ok" | "warn" | "nok";
}

export interface AttachmentMeta {
  name: string;
  size: number;
  mime: string;
  kind: "video" | "audio" | "file";
}

export interface RecordItem {
  itemId: string;
  sectionId: string;
  sectionTitle: string;
  itemTitle: string;
  type: ItemType;
  unit?: string;
  min?: number | null;
  max?: number | null;
  statusId?: string;
  value?: number | null;
  note?: string;
  photos: string[];
  files: AttachmentMeta[];
}

export interface InspectionRecord {
  id: string;
  ts: number;
  dateKey: string; // jalali yyyy/mm/dd
  shift: number;
  technicianId: string;
  technicianName: string;
  equipmentId: string;
  equipmentName: string;
  equipmentCode: string;
  groupId: string;
  groupName: string;
  checklistId: string;
  checklistName: string;
  location: string;
  items: RecordItem[];
  generalNote?: string;
}

export interface ActivityLog {
  id: string;
  ts: number;
  userId?: string;
  userName: string;
  action: string;
  detail?: string;
}

export interface Notif {
  id: string;
  ts: number;
  title: string;
  body: string;
  read: boolean;
  severity: "info" | "warn" | "danger";
  channels: string[]; // app / sms / email
  dedupeKey?: string;
}

export interface ShiftDef {
  id: number;
  name: string;
  start: number; // hour
  end: number;
}

export interface Settings {
  shifts: ShiftDef[];
  statusOptions: StatusOption[];
  channels: { app: boolean; sms: boolean; email: boolean };
  recipients: { admin: string; supervisor: string };
  autoBackup: boolean;
  lastBackup?: number;
}

export interface DB {
  version: number;
  users: User[];
  groups: EquipmentGroup[];
  equipment: Equipment[];
  checklists: Checklist[];
  records: InspectionRecord[];
  logs: ActivityLog[];
  notifs: Notif[];
  settings: Settings;
  session: { userId: string; loginTs: number } | null;
  missedKeys: string[];
}
