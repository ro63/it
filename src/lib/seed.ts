import type { Checklist, DB, Equipment, EquipmentGroup, InspectionRecord, RecordItem, User } from "./types";
import { hashPass, jKey } from "./utils";

let s = 1403;
const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
const pick = <T,>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)];

const U = (id: string, fullName: string, personnelCode: string, username: string, mobile: string, role: User["role"], extra?: Partial<User>): User => ({
  id, fullName, personnelCode, username, passwordHash: hashPass("1234"), mobile, role, active: true,
  allowedChecklistIds: [], allowedSectionIds: [], ...extra,
});

const G = (id: string, name: string, icon: string, color: string): EquipmentGroup => ({ id, name, icon, color, active: true });

let eqSeq = 0;
const E = (code: string, name: string, groupId: string, location: string, commissionDate: string, status: Equipment["status"] = "active"): Equipment =>
  ({ id: `eq-${++eqSeq}`, code, name, groupId, location, status, commissionDate });

export const GROUPS: EquipmentGroup[] = [
  G("g-press", "پرس‌های هیدرولیک", "press", "#e06f10"),
  G("g-robot", "ربات‌های ABB", "robot", "#2f6f8f"),
  G("g-comp", "کمپرسورهای اسکرو", "compressor", "#0e7c7b"),
  G("g-fork", "لیفتراک‌های سپاهان", "forklift", "#b98a1e"),
  G("g-boiler", "موتورخانه", "flame", "#8f4a5e"),
];

export const EQUIPMENT: Equipment[] = [
  E("PRS-1000", "پرس هیدرولیک ۱۰۰۰ تن", "g-press", "سالن پرسکاری — دهانه ۱", "۱۳۹۸/۰۴/۱۲"),
  E("PRS-1200", "پرس هیدرولیک ۱۲۰۰ تن", "g-press", "سالن پرسکاری — دهانه ۲", "۱۳۹۸/۰۴/۱۲"),
  E("PRS-1500", "پرس هیدرولیک ۱۵۰۰ تن", "g-press", "سالن پرسکاری — دهانه ۳", "۱۳۹۹/۰۲/۲۰"),
  E("PRS-2000", "پرس هیدرولیک ۲۰۰۰ تن", "g-press", "سالن پرسکاری — دهانه ۴", "۱۴۰۰/۰۷/۰۵"),
  E("PRS-1200B", "پرس هیدرولیک ۱۲۰۰ تن عابدی", "g-press", "سالن پرسکاری — دهانه ۵", "۱۳۹۶/۱۱/۳۰"),
  E("PRS-006", "پرس شماره ۶", "g-press", "سالن پرسکاری — دهانه ۶", "۱۳۹۵/۰۶/۱۵"),
  E("ABB-01", "ربات ABB مدل IRB-01", "g-robot", "سالن رباتیک — خط ۱", "۱۴۰۰/۰۳/۱۰"),
  E("ABB-02", "ربات ABB مدل IRB-02", "g-robot", "سالن رباتیک — خط ۱", "۱۴۰۰/۰۳/۱۰"),
  E("ABB-03", "ربات ABB مدل IRB-03", "g-robot", "سالن رباتیک — خط ۲", "۱۴۰۰/۰۸/۲۲"),
  E("ABB-04", "ربات ABB مدل IRB-04", "g-robot", "سالن رباتیک — خط ۲", "۱۴۰۰/۰۸/۲۲"),
  E("ABB-05", "ربات ABB مدل IRB-05", "g-robot", "سالن رباتیک — خط ۳", "۱۴۰۱/۰۵/۱۴"),
  E("ABB-06", "ربات ABB مدل IRB-06", "g-robot", "سالن رباتیک — خط ۳", "۱۴۰۱/۰۵/۱۴"),
  E("ABB-07", "ربات ABB مدل IRB-07", "g-robot", "سالن رباتیک — خط ۴", "۱۴۰۲/۰۲/۰۱"),
  E("CMP-01", "کمپرسور اسکرو شماره ۱", "g-comp", "ایستگاه هوای فشرده", "۱۳۹۹/۱۰/۰۸"),
  E("CMP-02", "کمپرسور اسکرو شماره ۲", "g-comp", "ایستگاه هوای فشرده", "۱۳۹۹/۱۰/۰۸"),
  E("CMP-03", "کمپرسور اسکرو شماره ۳", "g-comp", "ایستگاه هوای فشرده", "۱۴۰۰/۱۲/۱۷", "repair"),
  E("CMP-04", "کمپرسور اسکرو شماره ۴", "g-comp", "ایستگاه هوای فشرده", "۱۴۰۲/۰۶/۳۰"),
  E("FLT-01", "لیفتراک سپاهان شماره ۱", "g-fork", "انبار و لجستیک", "۱۳۹۷/۰۵/۲۵"),
  E("FLT-02", "لیفتراک سپاهان شماره ۲", "g-fork", "انبار و لجستیک", "۱۳۹۷/۰۵/۲۵"),
  E("FLT-03", "لیفتراک سپاهان شماره ۳", "g-fork", "انبار و لجستیک", "۱۳۹۹/۰۹/۱۱"),
  E("FLT-04", "لیفتراک سپاهان شماره ۴", "g-fork", "انبار مواد اولیه", "۱۴۰۱/۰۳/۱۹"),
  E("FLT-05", "لیفتراک سپاهان شماره ۵", "g-fork", "انبار محصول", "۱۴۰۱/۰۳/۱۹", "out"),
  E("BLR-01", "دیگ‌های بخار موتورخانه", "g-boiler", "موتورخانه مرکزی", "۱۳۹۴/۰۸/۰۱"),
  E("PMP-01", "پمپ‌های سیرکولاتور", "g-boiler", "موتورخانه مرکزی", "۱۳۹۸/۰۱/۲۰"),
  E("PNL-01", "تابلو برق اصلی", "g-boiler", "موتورخانه — اتاق برق", "۱۳۹۴/۰۸/۰۱"),
  E("AIR-01", "سیستم هوای فشرده موتورخانه", "g-boiler", "موتورخانه مرکزی", "۱۳۹۹/۱۰/۰۸"),
  E("AUX-01", "تجهیزات جانبی موتورخانه", "g-boiler", "موتورخانه مرکزی", "۱۳۹۴/۰۸/۰۱"),
];

const I = (id: string, title: string, type: "status" | "number" | "both", unit?: string, min?: number, max?: number) =>
  ({ id, title, type, unit, min: min ?? null, max: max ?? null, active: true });

export const CHECKLISTS: Checklist[] = [
  {
    id: "cl-press", name: "کنترل روزانه پرس‌های هیدرولیک", groupIds: ["g-press"], active: true,
    sections: [
      {
        id: "sec-press-mech", title: "هیدرولیک و مکانیک", active: true, allowedUserIds: [], allowedRoles: [],
        items: [
          I("i-p1", "بررسی سطح روغن مخزن", "number", "لیتر", 80, 160),
          I("i-p2", "بررسی نشتی روغن", "status"),
          I("i-p3", "فشار سیستم هیدرولیک", "number", "بار", 180, 250),
          I("i-p4", "دمای روغن", "number", "°C", 20, 65),
          I("i-p5", "صدای غیرعادی", "status"),
          I("i-p6", "وضعیت ایمنی و حفاظ‌ها", "status"),
        ],
      },
      {
        id: "sec-press-elec", title: "برق و سنسورها (گروه برق)", active: true, allowedUserIds: ["u-reza"], allowedRoles: ["admin", "supervisor"],
        items: [
          I("i-p7", "بررسی سنسورها", "status"),
          I("i-p8", "تابلو برق و کنتاکتورها", "status"),
          I("i-p9", "تست Emergency Stop", "status"),
        ],
      },
    ],
  },
  {
    id: "cl-robot", name: "کنترل روزانه ربات‌های ABB", groupIds: ["g-robot"], active: true,
    sections: [
      {
        id: "sec-robot-main", title: "کنترل عمومی ربات", active: true, allowedUserIds: [], allowedRoles: [],
        items: [
          I("i-r1", "بررسی آلارم‌ها", "status"),
          I("i-r2", "کابل‌ها و شیلنگ‌ها", "status"),
          I("i-r3", "وضعیت گریس‌کاری", "status"),
          I("i-r4", "وضعیت سروو موتورها", "status"),
          I("i-r5", "تست Emergency Stop", "status"),
          I("i-r6", "ولتاژ درایو", "number", "ولت", 380, 420),
        ],
      },
    ],
  },
  {
    id: "cl-comp", name: "کنترل روزانه کمپرسورهای اسکرو", groupIds: ["g-comp"], active: true,
    sections: [
      {
        id: "sec-comp-main", title: "کنترل کمپرسور", active: true, allowedUserIds: [], allowedRoles: [],
        items: [
          I("i-c1", "سطح روغن", "number", "لیتر", 40, 100),
          I("i-c2", "فشار خروجی", "number", "بار", 7, 9.5),
          I("i-c3", "دمای کاری", "number", "°C", 60, 95),
          I("i-c4", "نشتی هوا", "status"),
          I("i-c5", "وضعیت فیلترها", "status"),
          I("i-c6", "ساعت کارکرد", "number", "ساعت"),
        ],
      },
    ],
  },
  {
    id: "cl-fork", name: "کنترل روزانه لیفتراک‌های سپاهان", groupIds: ["g-fork"], active: true,
    sections: [
      {
        id: "sec-fork-main", title: "کنترل لیفتراک", active: true, allowedUserIds: [], allowedRoles: [],
        items: [
          I("i-f1", "آب رادیاتور", "status"),
          I("i-f2", "روغن موتور", "status"),
          I("i-f3", "روغن هیدرولیک", "status"),
          I("i-f4", "وضعیت لاستیک‌ها", "status"),
          I("i-f5", "چراغ‌ها", "status"),
          I("i-f6", "بوق", "status"),
          I("i-f7", "فشار باد لاستیک جلو", "number", "PSI", 90, 120),
        ],
      },
    ],
  },
  {
    id: "cl-boiler", name: "کنترل روزانه موتورخانه", groupIds: ["g-boiler"], active: true,
    sections: [
      {
        id: "sec-boiler-mech", title: "مکانیک و سیالات", active: true, allowedUserIds: [], allowedRoles: [],
        items: [
          I("i-b1", "فشار سیستم", "number", "بار", 3, 6),
          I("i-b2", "دمای سیستم", "number", "°C", 60, 90),
          I("i-b3", "بررسی نشتی", "status"),
          I("i-b4", "وضعیت پمپ‌ها", "status"),
        ],
      },
      {
        id: "sec-boiler-elec", title: "برق و کنترل (گروه برق)", active: true, allowedUserIds: ["u-reza"], allowedRoles: ["admin", "supervisor"],
        items: [
          I("i-b5", "وضعیت برق و تابلو", "status"),
          I("i-b6", "کنترل مشعل و ترموستات", "status"),
        ],
      },
    ],
  },
];

export const USERS: User[] = [
  U("u-takhti", "جعفر تختی", "1001", "j.takhti", "0913-100-1001", "admin"),
  U("u-esfand", "اسفندیاری", "1002", "m.esfandiari", "0913-100-1002", "supervisor"),
  U("u-fardin", "فردین عظمیان", "1003", "f.azamian", "0913-100-1003", "technician"),
  U("u-reza", "رضا کرمی", "1004", "r.karami", "0913-100-1004", "technician"),
  U("u-mehdi", "مهدی توکلی", "1005", "m.tavakkoli", "0913-100-1005", "technician"),
  U("u-nima", "نیما شاهد", "1006", "n.shahed", "0913-100-1006", "viewer"),
];

const NOK_NOTES = [
  "نشتی روغن از شیلنگ فشار قوی — نیاز به تعویض شیلنگ",
  "صدای غیرعادی از پمپ اصلی شنیده می‌شود",
  "فیلتر به شدت کثیف — نیاز به تعویض فوری",
  "سنسور intermittently عمل می‌کند، نیاز به بررسی برق",
  "لرزش غیرعادی در هنگام کار",
  "کمبود باد در مدار — احتمال نشتی از اتصالات",
  "روغن زیر دستگاه مشاهده شد",
  "آمپر موتور بالاتر از حد معمول",
];

function buildRecords(): InspectionRecord[] {
  const recs: InspectionRecord[] = [];
  const techs = [USERS[2], USERS[4], USERS[1]];
  const elecTech = USERS[3];
  const now = new Date();
  const today0 = new Date(now); today0.setHours(0, 0, 0, 0);
  const curH = now.getHours() + now.getMinutes() / 60;
  const shiftDone = (sid: number) => (sid === 1 ? curH >= 14 : sid === 2 ? curH >= 22 : curH >= 6);

  for (let off = 6; off >= 0; off--) {
    for (const shift of [1, 2, 3]) {
      if (off === 0 && !shiftDone(shift)) continue;
      for (const eq of EQUIPMENT) {
        if (eq.status !== "active" || rnd() > 0.72) continue;
        const cl = CHECKLISTS.find((c) => c.groupIds.includes(eq.groupId))!;
        const hasElec = cl.sections.some((sc) => sc.allowedUserIds.length > 0);
        const tech = hasElec && rnd() < 0.75 ? elecTech : pick(techs);
        const h = shift === 1 ? 6.6 + rnd() * 6 : shift === 2 ? 14.6 + rnd() * 6 : 22.4 + rnd() * 1.5;
        const ts = today0.getTime() - off * 86400000 + Math.round(h * 3600000);
        const items: RecordItem[] = [];
        for (const sec of cl.sections) {
          if (!sec.active) continue;
          for (const it of sec.items) {
            if (!it.active) continue;
            const nok = rnd() < 0.085;
            let value: number | null = null;
            if (it.type !== "status" && it.min != null && it.max != null) {
              const mid = (it.min + it.max) / 2;
              const span = it.max - it.min;
              value = Math.round((mid + (rnd() - 0.5) * span * (nok ? 0.9 : 0.45)) * 10) / 10;
            } else if (it.type !== "status") {
              value = Math.round(1000 + rnd() * 8000);
            }
            items.push({
              itemId: it.id, sectionId: sec.id, sectionTitle: sec.title, itemTitle: it.title,
              type: it.type, unit: it.unit, min: it.min, max: it.max,
              statusId: nok ? "nok" : "ok", value,
              note: nok && rnd() < 0.8 ? pick(NOK_NOTES) : "",
              photos: [], files: [],
            });
          }
        }
        const g = GROUPS.find((x) => x.id === eq.groupId)!;
        recs.push({
          id: `rec-${off}-${shift}-${eq.id}`, ts, dateKey: jKey(ts), shift,
          technicianId: tech.id, technicianName: tech.fullName,
          equipmentId: eq.id, equipmentName: eq.name, equipmentCode: eq.code,
          groupId: g.id, groupName: g.name, checklistId: cl.id, checklistName: cl.name,
          location: eq.location, items,
        });
      }
    }
  }
  return recs.sort((a, b) => b.ts - a.ts);
}

export function buildSeed(): DB {
  const now = Date.now();
  return {
    version: 1,
    users: USERS,
    groups: GROUPS,
    equipment: EQUIPMENT,
    checklists: CHECKLISTS,
    records: buildRecords(),
    logs: [
      { id: "lg-1", ts: now - 3600000 * 5, userId: "u-takhti", userName: "جعفر تختی", action: "ورود به سیستم", detail: "احراز هویت موفق" },
      { id: "lg-2", ts: now - 3600000 * 4.6, userId: "u-takhti", userName: "جعفر تختی", action: "ویرایش چک‌لیست", detail: "کنترل روزانه پرس‌های هیدرولیک" },
      { id: "lg-3", ts: now - 3600000 * 3, userId: "u-fardin", userName: "فردین عظمیان", action: "ثبت بازدید", detail: "پرس هیدرولیک ۱۵۰۰ تن" },
      { id: "lg-4", ts: now - 3600000 * 1.2, userId: "u-esfand", userName: "اسفندیاری", action: "ورود به سیستم", detail: "احراز هویت موفق" },
    ],
    notifs: [
      {
        id: "nt-1", ts: now - 3600000 * 2, title: "خرابی ثبت شد", body: "کمپرسور اسکرو شماره ۳ — فشار خروجی خارج از محدوده مجاز گزارش شده است.",
        read: false, severity: "danger", channels: ["app", "sms"], dedupeKey: "seed-1",
      },
      {
        id: "nt-2", ts: now - 3600000 * 20, title: "پشتیبان‌گیری خودکار", body: "نسخه پشتیبان خودکار پایگاه داده با موفقیت ذخیره شد.",
        read: true, severity: "info", channels: ["app"], dedupeKey: "seed-2",
      },
    ],
    settings: {
      shifts: [
        { id: 1, name: "شیفت ۱", start: 6, end: 14 },
        { id: 2, name: "شیفت ۲", start: 14, end: 22 },
        { id: 3, name: "شیفت ۳", start: 22, end: 6 },
      ],
      statusOptions: [
        { id: "ok", label: "سالم", short: "OK", kind: "ok" },
        { id: "nok", label: "معیوب", short: "NOK", kind: "nok" },
      ],
      channels: { app: true, sms: true, email: false },
      recipients: { admin: "0913-100-1001", supervisor: "0913-100-1002" },
      autoBackup: true,
      lastBackup: now - 3600000 * 6,
    },
    session: null,
    missedKeys: [],
  };
}

export const DEMO_ACCOUNTS = [
  { username: "j.takhti", label: "جعفر تختی", role: "مدیر سیستم" },
  { username: "m.esfandiari", label: "اسفندیاری", role: "سرپرست نت" },
  { username: "f.azamian", label: "فردین عظمیان", role: "تکنسین نت" },
  { username: "r.karami", label: "رضا کرمی", role: "تکنسین برق" },
  { username: "n.shahed", label: "نیما شاهد", role: "مشاهده‌کننده" },
];
