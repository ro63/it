import type { ShiftDef } from "./types";

const FA = "۰۱۲۳۴۵۶۷۸۹";
export function faDigits(v: string | number): string {
  return String(v).replace(/[0-9]/g, (d) => FA[+d]).replace(/,/g, "،");
}

export function toJalali(gy: number, gm: number, gd: number): [number, number, number] {
  const gdm = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    355666 + 365 * gy + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) + gd + gdm[gm - 1];
  let jy = -1595 + 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) { jy += Math.floor((days - 1) / 365); days = (days - 1) % 365; }
  let jm: number, jd: number;
  if (days < 186) { jm = 1 + Math.floor(days / 31); jd = 1 + (days % 31); }
  else { jm = 7 + Math.floor((days - 186) / 30); jd = 1 + ((days - 186) % 30); }
  return [jy, jm, jd];
}

const pad = (n: number) => String(n).padStart(2, "0");

export function jKey(ts: number): string {
  const d = new Date(ts);
  const [jy, jm, jd] = toJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  return `${jy}/${pad(jm)}/${pad(jd)}`;
}

export function jDate(ts: number): string {
  return faDigits(jKey(ts));
}

export const J_MONTHS = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
const J_DAYS = ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه"];

export function jLong(ts: number): string {
  const d = new Date(ts);
  const [jy, jm, jd] = toJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  return `${J_DAYS[d.getDay()]} ${faDigits(jd)} ${J_MONTHS[jm - 1]} ${faDigits(jy)}`;
}

export function jShort(ts: number): string {
  const d = new Date(ts);
  const [, jm, jd] = toJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  return `${faDigits(jd)} ${J_MONTHS[jm - 1]}`;
}

export function timeStr(ts: number): string {
  const d = new Date(ts);
  return faDigits(`${pad(d.getHours())}:${pad(d.getMinutes())}`);
}

export function uid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID().slice(0, 13);
  return Math.random().toString(36).slice(2, 12) + Date.now().toString(36).slice(-4);
}

/** رمزنگاری نمادین رمز عبور (در نسخه سرور با BCrypt/Argon2 جایگزین می‌شود) */
export function hashPass(pw: string): string {
  let h1 = 5381, h2 = 52711;
  for (let i = 0; i < pw.length; i++) {
    const c = pw.charCodeAt(i);
    h1 = (h1 * 33) ^ c;
    h2 = (h2 * 31) ^ c;
  }
  return `h$${(h1 >>> 0).toString(16)}${(h2 >>> 0).toString(16)}`;
}

export function detectShift(shifts: ShiftDef[], d: Date = new Date()): number {
  const h = d.getHours() + d.getMinutes() / 60;
  for (const s of shifts) {
    if (s.start < s.end) { if (h >= s.start && h < s.end) return s.id; }
    else { if (h >= s.start || h < s.end) return s.id; }
  }
  return shifts[shifts.length - 1]?.id ?? 3;
}

/** آیا شیفت شروع شده است؟ (برای محاسبه بازدید معوق) */
export function shiftStarted(s: ShiftDef, now: Date): boolean {
  const h = now.getHours() + now.getMinutes() / 60;
  if (s.start < s.end) return h >= s.start;
  return h >= s.start || h < s.end;
}

export function downloadFile(name: string, content: string | Blob, mime = "text/plain;charset=utf-8") {
  const blob = typeof content === "string" ? new Blob([content], { type: mime }) : content;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 800);
}

export function toCSV(rows: (string | number)[][]): string {
  const esc = (c: string | number) => {
    const s = String(c ?? "");
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return "\uFEFF" + rows.map((r) => r.map(esc).join(",")).join("\n");
}

export function compressImage(file: File, maxSide = 900, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = String(reader.result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${faDigits(bytes)} بایت`;
  if (bytes < 1024 * 1024) return `${faDigits(Math.round(bytes / 1024))} کیلوبایت`;
  return `${faDigits((bytes / 1024 / 1024).toFixed(1))} مگابایت`;
}

export const ROLE_LABELS: Record<string, string> = {
  admin: "مدیر سیستم",
  supervisor: "سرپرست نت",
  technician: "تکنسین نت",
  viewer: "مشاهده‌کننده",
};

export const EQ_STATUS_LABELS: Record<string, string> = {
  active: "فعال",
  inactive: "غیرفعال",
  repair: "در تعمیر",
  out: "خارج از سرویس",
};
