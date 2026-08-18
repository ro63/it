import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Checklist, DB, EquipmentGroup, Equipment, InspectionRecord, Notif, Role, Settings, User, ChecklistSection } from "./types";
import { buildSeed } from "./seed";
import { detectShift, hashPass, shiftStarted, jKey, jShort, uid } from "./utils";

const KEY = "nipco-db-v1";
const BACKUP_KEY = "nipco-db-backup";

function load(): DB {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const db = JSON.parse(raw) as DB;
      if (db && db.version === 1 && Array.isArray(db.users)) return db;
    }
  } catch { /* corrupted → reseed */ }
  return buildSeed();
}

type ActionResult = { ok: boolean; msg: string };

interface Store {
  db: DB;
  me: User | null;
  login: (username: string, password: string) => ActionResult;
  logout: () => void;
  saveUser: (u: User, isNew: boolean) => void;
  saveGroup: (g: EquipmentGroup, isNew: boolean) => void;
  deleteGroup: (id: string) => ActionResult;
  saveEquipment: (e: Equipment, isNew: boolean) => void;
  deleteEquipment: (id: string) => void;
  saveChecklist: (c: Checklist, isNew: boolean) => void;
  deleteChecklist: (id: string) => void;
  saveRecord: (r: InspectionRecord) => void;
  markNotifRead: (id: string) => void;
  markAllRead: () => void;
  clearNotifs: () => void;
  updateSettings: (p: Partial<Settings>) => void;
  exportDB: () => string;
  importDB: (json: string) => ActionResult;
  resetAll: () => void;
  checkMissed: () => void;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB>(load);

  useEffect(() => {
    try {
      const raw = JSON.stringify(db);
      localStorage.setItem(KEY, raw);
      if (db.settings.autoBackup) localStorage.setItem(BACKUP_KEY, raw);
    } catch { /* quota */ }
  }, [db]);

  const me = db.session ? db.users.find((u) => u.id === db.session!.userId) ?? null : null;

  const pushLog = useCallback((d: DB, userName: string, action: string, detail?: string, userId?: string): DB => ({
    ...d,
    logs: [{ id: uid(), ts: Date.now(), userName, action, detail, userId }, ...d.logs].slice(0, 400),
  }), []);

  const login = useCallback((username: string, password: string): ActionResult => {
    const u = db.users.find((x) => x.username.toLowerCase() === username.trim().toLowerCase());
    if (!u) {
      setDb((d) => pushLog(d, username || "؟", "تلاش ورود ناموفق", "نام کاربری یافت نشد"));
      return { ok: false, msg: "نام کاربری یافت نشد" };
    }
    if (!u.active) return { ok: false, msg: "حساب کاربری غیرفعال است — با مدیر سیستم تماس بگیرید" };
    if (u.passwordHash !== hashPass(password)) {
      setDb((d) => pushLog(d, u.fullName, "تلاش ورود ناموفق", "رمز عبور اشتباه", u.id));
      return { ok: false, msg: "رمز عبور اشتباه است" };
    }
    setDb((d) => pushLog({ ...d, session: { userId: u.id, loginTs: Date.now() } }, u.fullName, "ورود به سیستم", "احراز هویت موفق", u.id));
    return { ok: true, msg: `خوش آمدید، ${u.fullName}` };
  }, [db.users, pushLog]);

  const logout = useCallback(() => {
    setDb((d) => {
      const u = d.session ? d.users.find((x) => x.id === d.session!.userId) : null;
      const next = pushLog(d, u?.fullName ?? "؟", "خروج از سیستم", undefined, u?.id);
      return { ...next, session: null };
    });
  }, [pushLog]);

  const saveUser = useCallback((u: User, isNew: boolean) => {
    setDb((d) => {
      const users = isNew ? [...d.users, u] : d.users.map((x) => (x.id === u.id ? u : x));
      return pushLog({ ...d, users }, me?.fullName ?? "سیستم", isNew ? "افزودن کاربر" : "ویرایش کاربر", u.fullName, me?.id);
    });
  }, [me, pushLog]);

  const saveGroup = useCallback((g: EquipmentGroup, isNew: boolean) => {
    setDb((d) => {
      const groups = isNew ? [...d.groups, g] : d.groups.map((x) => (x.id === g.id ? g : x));
      return pushLog({ ...d, groups }, me?.fullName ?? "سیستم", isNew ? "افزودن گروه تجهیز" : "ویرایش گروه تجهیز", g.name, me?.id);
    });
  }, [me, pushLog]);

  const deleteGroup = useCallback((id: string): ActionResult => {
    if (db.equipment.some((e) => e.groupId === id)) return { ok: false, msg: "این گروه دارای تجهیزات است؛ ابتدا تجهیزات آن را منتقل کنید" };
    setDb((d) => pushLog({ ...d, groups: d.groups.filter((g) => g.id !== id) }, me?.fullName ?? "سیستم", "حذف گروه تجهیز", undefined, me?.id));
    return { ok: true, msg: "گروه حذف شد" };
  }, [db.equipment, me, pushLog]);

  const saveEquipment = useCallback((e: Equipment, isNew: boolean) => {
    setDb((d) => {
      const equipment = isNew ? [...d.equipment, e] : d.equipment.map((x) => (x.id === e.id ? e : x));
      return pushLog({ ...d, equipment }, me?.fullName ?? "سیستم", isNew ? "افزودن تجهیز" : "ویرایش تجهیز", `${e.name} (${e.code})`, me?.id);
    });
  }, [me, pushLog]);

  const deleteEquipment = useCallback((id: string) => {
    setDb((d) => {
      const eq = d.equipment.find((x) => x.id === id);
      return pushLog({ ...d, equipment: d.equipment.filter((x) => x.id !== id) }, me?.fullName ?? "سیستم", "حذف تجهیز", eq ? eq.name : undefined, me?.id);
    });
  }, [me, pushLog]);

  const saveChecklist = useCallback((c: Checklist, isNew: boolean) => {
    setDb((d) => {
      const checklists = isNew ? [...d.checklists, c] : d.checklists.map((x) => (x.id === c.id ? c : x));
      return pushLog({ ...d, checklists }, me?.fullName ?? "سیستم", isNew ? "ایجاد چک‌لیست" : "ویرایش چک‌لیست", c.name, me?.id);
    });
  }, [me, pushLog]);

  const deleteChecklist = useCallback((id: string) => {
    setDb((d) => pushLog({ ...d, checklists: d.checklists.filter((x) => x.id !== id) }, me?.fullName ?? "سیستم", "حذف چک‌لیست", undefined, me?.id));
  }, [me, pushLog]);

  const saveRecord = useCallback((r: InspectionRecord) => {
    setDb((d) => {
      let next: DB = { ...d, records: [r, ...d.records] };
      next = pushLog(next, r.technicianName, "ثبت بازدید", `${r.equipmentName} — ${r.shift === 1 ? "شیفت ۱" : r.shift === 2 ? "شیفت ۲" : "شیفت ۳"}`, r.technicianId);
      const opts = d.settings.statusOptions;
      const bad = r.items.filter((it) => {
        const o = opts.find((x) => x.id === it.statusId);
        const out = it.value != null && ((it.min != null && it.value < it.min) || (it.max != null && it.value > it.max));
        return o?.kind === "nok" || out;
      });
      if (bad.length > 0) {
        const ch: string[] = [];
        if (d.settings.channels.app) ch.push("app");
        if (d.settings.channels.sms) ch.push("sms");
        if (d.settings.channels.email) ch.push("email");
        const n: Notif = {
          id: uid(), ts: Date.now(), severity: "danger",
          title: `خرابی — ${r.equipmentName}`,
          body: `${bad.length} مورد معیوب توسط ${r.technicianName} ثبت شد: ${bad.slice(0, 3).map((b) => b.itemTitle).join("، ")}${bad.length > 3 ? "…" : ""}`,
          read: false, channels: ch, dedupeKey: `nok-${r.id}`,
        };
        next = { ...next, notifs: [n, ...next.notifs].slice(0, 120) };
      }
      return next;
    });
  }, [pushLog]);

  const markNotifRead = useCallback((id: string) => setDb((d) => ({ ...d, notifs: d.notifs.map((n) => (n.id === id ? { ...n, read: true } : n)) })), []);
  const markAllRead = useCallback(() => setDb((d) => ({ ...d, notifs: d.notifs.map((n) => ({ ...n, read: true })) })), []);
  const clearNotifs = useCallback(() => setDb((d) => ({ ...d, notifs: [] })), []);

  const updateSettings = useCallback((p: Partial<Settings>) => {
    setDb((d) => ({ ...d, settings: { ...d.settings, ...p, lastBackup: p.autoBackup ? Date.now() : d.settings.lastBackup } }));
  }, []);

  const exportDB = useCallback(() => JSON.stringify(db, null, 1), [db]);

  const importDB = useCallback((json: string): ActionResult => {
    try {
      const parsed = JSON.parse(json) as DB;
      if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.users)) return { ok: false, msg: "فایل پشتیبان معتبر نیست" };
      setDb((d) => pushLog(parsed, me?.fullName ?? "سیستم", "بازیابی پشتیبان", `${parsed.records.length} رکورد بازدید`, me?.id));
      return { ok: true, msg: "پشتیبان با موفقیت بازیابی شد" };
    } catch {
      return { ok: false, msg: "خطا در خواندن فایل JSON" };
    }
  }, [me, pushLog]);

  const resetAll = useCallback(() => {
    localStorage.removeItem(KEY);
    localStorage.removeItem(BACKUP_KEY);
    setDb(buildSeed());
  }, []);

  const checkMissed = useCallback(() => {
    setDb((d) => {
      const now = new Date();
      const todayKey = jKey(now.getTime());
      const yesterdayKey = jKey(now.getTime() - 86400000);
      const started = d.settings.shifts.filter((sh) => shiftStarted(sh, now));
      const active = d.equipment.filter((e) => e.status === "active");
      let notifs = d.notifs;
      const keys = [...d.missedKeys];
      let changed = false;
      for (const sh of started) {
        const key = `missed-${todayKey}-${sh.id}`;
        if (keys.includes(key)) continue;
        const night = sh.start > sh.end;
        const done = new Set(
          d.records
            .filter((r) => r.shift === sh.id && (r.dateKey === todayKey || (night && r.dateKey === yesterdayKey)))
            .map((r) => r.equipmentId),
        );
        const missing = active.filter((e) => !done.has(e.id));
        if (missing.length > 0) {
          keys.push(key);
          changed = true;
          const ch: string[] = [];
          if (d.settings.channels.app) ch.push("app");
          if (d.settings.channels.sms) ch.push("sms");
          if (d.settings.channels.email) ch.push("email");
          notifs = [{
            id: uid(), ts: Date.now(), severity: "warn" as const, read: false, channels: ch, dedupeKey: key,
            title: `بازدید ${sh.name} انجام نشده`,
            body: `تاکنون بازدید ${sh.name} برای ${missing.length} تجهیز ثبت نشده است: ${missing.slice(0, 4).map((m) => m.name).join("، ")}${missing.length > 4 ? "…" : ""}`,
          }, ...notifs].slice(0, 120);
        }
      }
      return changed ? { ...d, notifs, missedKeys: keys.slice(-60) } : d;
    });
  }, []);

  useEffect(() => {
    const t = setTimeout(checkMissed, 800);
    const iv = setInterval(checkMissed, 60000);
    return () => { clearTimeout(t); clearInterval(iv); };
  }, [checkMissed]);

  const value: Store = {
    db, me, login, logout, saveUser, saveGroup, deleteGroup, saveEquipment, deleteEquipment,
    saveChecklist, deleteChecklist, saveRecord, markNotifRead, markAllRead, clearNotifs,
    updateSettings, exportDB, importDB, resetAll, checkMissed,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const v = useContext(Ctx);
  if (!v) throw new Error("StoreProvider missing");
  return v;
}

/* ---------- دسترسی‌ها ---------- */

export function canAccessChecklist(u: User, c: Checklist): boolean {
  if (u.role === "admin" || u.role === "supervisor") return true;
  if (!c.active) return false;
  return u.allowedChecklistIds.length === 0 || u.allowedChecklistIds.includes(c.id);
}

export function sectionAllowed(u: User, sec: ChecklistSection): boolean {
  if (u.role === "admin" || u.role === "supervisor") return true;
  const hasUserRule = sec.allowedUserIds.length > 0;
  const hasRoleRule = sec.allowedRoles.length > 0;
  if (!hasUserRule && !hasRoleRule) return true;
  return sec.allowedUserIds.includes(u.id) || sec.allowedRoles.includes(u.role);
}

export function visibleSections(u: User, c: Checklist): ChecklistSection[] {
  return c.sections.filter((s) => s.active && sectionAllowed(u, s));
}

const ROLE_RANK: Record<Role, number> = { viewer: 0, technician: 1, supervisor: 2, admin: 3 };
export function roleAtLeast(u: User | null, r: Role): boolean {
  return !!u && ROLE_RANK[u.role] >= ROLE_RANK[r];
}

export type PageId = "dashboard" | "inspection" | "equipment" | "checklists" | "reports" | "users" | "system";

export function pagesFor(u: User | null): PageId[] {
  if (!u) return [];
  switch (u.role) {
    case "admin": return ["dashboard", "inspection", "equipment", "checklists", "reports", "users", "system"];
    case "supervisor": return ["dashboard", "inspection", "equipment", "checklists", "reports", "system"];
    case "technician": return ["dashboard", "inspection", "equipment", "reports"];
    default: return ["dashboard", "equipment", "reports"];
  }
}

/* ---------- محاسبات مشترک ---------- */

export function statusKind(db: DB, statusId?: string): "ok" | "warn" | "nok" | "none" {
  const o = db.settings.statusOptions.find((x) => x.id === statusId);
  return o?.kind ?? "none";
}

export function itemFailed(db: DB, it: { statusId?: string; value?: number | null; min?: number | null; max?: number | null }): boolean {
  if (statusKind(db, it.statusId) === "nok") return true;
  return it.value != null && ((it.min != null && it.value < it.min) || (it.max != null && it.value > it.max));
}

export function itemWarn(db: DB, it: { statusId?: string }): boolean {
  return statusKind(db, it.statusId) === "warn";
}

export function currentShiftName(db: DB, d: Date = new Date()): string {
  const id = detectShift(db.settings.shifts, d);
  return db.settings.shifts.find((s) => s.id === id)?.name ?? "—";
}

export { jShort };
