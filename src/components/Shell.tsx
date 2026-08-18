import { useEffect, useState, type ReactNode } from "react";
import { pagesFor, useStore, type PageId } from "../lib/store";
import { detectShift, faDigits, jLong, ROLE_LABELS, timeStr } from "../lib/utils";
import { Icon, NipcoLogo, type IconName } from "./icons";
import { Badge } from "./ui";

const NAV: { id: PageId; label: string; icon: IconName }[] = [
  { id: "dashboard", label: "داشبورد مدیریتی", icon: "dashboard" },
  { id: "inspection", label: "ثبت بازدید روزانه", icon: "clipboard" },
  { id: "equipment", label: "تجهیزات و گروه‌ها", icon: "wrench" },
  { id: "checklists", label: "چک‌لیست‌های داینامیک", icon: "layers" },
  { id: "reports", label: "گزارشات", icon: "chart" },
  { id: "users", label: "مدیریت کاربران", icon: "users" },
  { id: "system", label: "سیستم و اعلان‌ها", icon: "gear" },
];

const TITLES: Record<PageId, { t: string; s: string }> = {
  dashboard: { t: "داشبورد مدیریتی", s: "نمایش لحظه‌ای وضعیت تجهیزات و بازدیدها" },
  inspection: { t: "ثبت بازدید روزانه", s: "اسکن QR، تکمیل چک‌لیست و ثبت نتایج" },
  equipment: { t: "تجهیزات و گروه‌ها", s: "مدیریت گروه‌های تجهیز، دستگاه‌ها و QR Code" },
  checklists: { t: "چک‌لیست‌های داینامیک", s: "طراحی فرم‌ها، بخش‌ها و سطح دسترسی هر بخش" },
  reports: { t: "گزارشات", s: "روزانه، هفتگی، ماهانه، خرابی‌ها، PM و تجهیزات بحرانی" },
  users: { t: "مدیریت کاربران", s: "افزودن، ویرایش، غیرفعال‌سازی و تعیین سطح دسترسی" },
  system: { t: "سیستم و اعلان‌ها", s: "اعلان‌ها، لاگ فعالیت، شیفت‌ها، گزینه‌های وضعیت و پشتیبان‌گیری" },
};

function NotifBell({ onGotoSystem }: { onGotoSystem: () => void }) {
  const { db, markNotifRead, markAllRead } = useStore();
  const [open, setOpen] = useState(false);
  const unread = db.notifs.filter((n) => !n.read).length;
  const sevIcon: Record<string, { i: IconName; c: string }> = {
    danger: { i: "alert", c: "text-red-500" },
    warn: { i: "alert", c: "text-amber-500" },
    info: { i: "info", c: "text-sky-500" },
  };
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative w-10 h-10 rounded-lg border border-ink-200 bg-white flex items-center justify-center text-ink-600 hover:border-ink-400 transition-colors cursor-pointer">
        <Icon name="bell" size={19} />
        {unread > 0 && (
          <span className="absolute -top-1.5 -end-1.5 min-w-5 h-5 px-1 rounded-full bg-ember-500 text-white text-[10px] font-black flex items-center justify-center" style={{ animation: "pulseDot 1.8s infinite" }}>
            {faDigits(unread)}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 top-12 end-0 w-[340px] max-w-[92vw] card anim-pop overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-ink-100">
              <p className="font-display text-base text-ink-900">اعلان‌ها</p>
              <div className="flex gap-2">
                <button className="text-[11px] font-bold text-ember-600 hover:text-ember-700 cursor-pointer" onClick={markAllRead}>خواندن همه</button>
                <button className="text-[11px] font-bold text-ink-400 hover:text-ink-700 cursor-pointer" onClick={() => { setOpen(false); onGotoSystem(); }}>مدیریت</button>
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {db.notifs.length === 0 && <p className="text-center text-xs text-ink-400 py-8">اعلانی ثبت نشده است</p>}
              {db.notifs.slice(0, 8).map((n) => (
                <button key={n.id} onClick={() => markNotifRead(n.id)} className={`w-full text-start px-4 py-3 border-b border-ink-50 hover:bg-ink-50 transition-colors cursor-pointer ${n.read ? "opacity-55" : ""}`}>
                  <div className="flex items-center gap-2">
                    <span className={sevIcon[n.severity].c}><Icon name={sevIcon[n.severity].i} size={14} sw={2.2} /></span>
                    <p className="text-xs font-black text-ink-900 flex-1 truncate">{n.title}</p>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-ember-500 shrink-0" />}
                  </div>
                  <p className="text-[11px] text-ink-500 leading-5 mt-1 line-clamp-2">{n.body}</p>
                  <p className="text-[10px] text-ink-300 font-bold mt-1">{faDigits(timeStr(n.ts))} · {n.channels.map((c) => (c === "app" ? "برنامه" : c === "sms" ? "پیامک" : "ایمیل")).join(" + ")}</p>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function Shell({ page, onNav, children }: { page: PageId; onNav: (p: PageId) => void; children: ReactNode }) {
  const { db, me, logout } = useStore();
  const [drawer, setDrawer] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  if (!me) return null;
  const allowed = pagesFor(me);
  const items = NAV.filter((n) => allowed.includes(n.id));
  const shiftId = detectShift(db.settings.shifts, now);
  const shift = db.settings.shifts.find((s) => s.id === shiftId);

  const SidebarInner = (
    <>
      <div className="flex items-center gap-3 px-5 h-[68px] border-b border-white/8 shrink-0">
        <NipcoLogo size={38} />
        <div>
          <p className="font-black text-[15px] tracking-[0.22em] text-white leading-5" dir="ltr">NIPCO</p>
          <p className="text-[10px] font-bold text-ink-400">کنترل روزانه تجهیزات</p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {items.map((n) => (
          <button key={n.id} onClick={() => { onNav(n.id); setDrawer(false); }}
            className={`relative w-full flex items-center gap-3 rounded-lg px-3 h-11 text-[13px] font-bold transition-all cursor-pointer ${page === n.id ? "bg-ink-800 text-white" : "text-ink-300 hover:bg-ink-850 hover:text-ink-100"}`}>
            {page === n.id && <span className="absolute start-0 top-2 bottom-2 w-1 rounded-e-full bg-ember-500" />}
            <span className={page === n.id ? "text-ember-400" : ""}><Icon name={n.icon} size={19} /></span>
            {n.label}
          </button>
        ))}
      </nav>
      <div className="p-3 border-t border-white/8 shrink-0">
        <div className="flex items-center gap-2.5 rounded-lg bg-ink-850 p-2.5">
          <span className="w-9 h-9 rounded-lg bg-ember-500 text-white font-display text-lg flex items-center justify-center shrink-0">
            {me.fullName.replace(" ", "").slice(0, 2)}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[12.5px] font-black text-white truncate">{me.fullName}</p>
            <p className="text-[10px] font-bold text-ember-400">{ROLE_LABELS[me.role]}</p>
          </div>
          <button onClick={logout} title="خروج از سیستم" className="w-8 h-8 rounded-md flex items-center justify-center text-ink-400 hover:text-red-400 hover:bg-ink-800 transition-colors cursor-pointer">
            <Icon name="logout" size={16} />
          </button>
        </div>
        <p className="text-center text-[10px] text-ink-500 font-semibold mt-2.5">نسخه {faDigits("1.0")} · تحلیل و طراحی: محمد روشندل</p>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex">
      {/* سایدبار دسکتاپ */}
      <aside className="hidden lg:flex w-[248px] shrink-0 flex-col bg-ink-900 sticky top-0 h-screen">
        {SidebarInner}
      </aside>

      {/* دراور موبایل */}
      {drawer && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-ink-950/60 anim-fade" onClick={() => setDrawer(false)} />
          <aside className="absolute inset-y-0 start-0 w-[260px] bg-ink-900 flex flex-col anim-drawer">
            {SidebarInner}
          </aside>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 h-[68px] bg-panel/85 backdrop-blur-md border-b border-ink-100 flex items-center gap-3 px-4 lg:px-7">
          <button className="lg:hidden w-10 h-10 rounded-lg border border-ink-200 bg-white flex items-center justify-center text-ink-700 cursor-pointer" onClick={() => setDrawer(true)}>
            <Icon name="menu" size={19} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-xl lg:text-[22px] text-ink-900 leading-6 truncate">{TITLES[page].t}</h1>
            <p className="text-[11px] text-ink-400 font-semibold truncate hidden sm:block">{TITLES[page].s}</p>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <div className="text-end">
              <p className="font-display text-[22px] leading-6 text-ink-900 tabular-nums">{timeStr(now.getTime())}</p>
              <p className="text-[10px] font-bold text-ink-400">{jLong(now.getTime())}</p>
            </div>
            {shift && (
              <Badge kind="ember">
                <span className="w-1.5 h-1.5 rounded-full bg-ember-500 animate-pulse" />
                {shift.name} · {faDigits(shift.start)} تا {faDigits(shift.end)}
              </Badge>
            )}
          </div>
          <NotifBell onGotoSystem={() => allowed.includes("system") && onNav("system")} />
          <span className="hidden sm:flex w-10 h-10 rounded-lg bg-ink-900 text-ember-400 font-display text-lg items-center justify-center">
            {me.fullName.replace(" ", "").slice(0, 2)}
          </span>
        </header>

        <main className="flex-1 p-4 lg:p-7 w-full max-w-[1440px] mx-auto">{children}</main>

        <footer className="px-4 lg:px-7 py-4 border-t border-ink-100 flex flex-wrap items-center gap-2 justify-between text-[11px] font-semibold text-ink-400">
          <span>شرکت صنایع قطعه‌سازی خودرو {faDigits("NIPCO")} — واحد نگهداری و تعمیرات</span>
          <span>تحلیل و طراحی سیستم: <b className="text-ink-600">محمد روشندل</b></span>
        </footer>
      </div>
    </div>
  );
}
