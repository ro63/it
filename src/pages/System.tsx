import { useRef, useState } from "react";
import { Icon, type IconName } from "../components/icons";
import { Badge, Confirm, Empty, Field, Seg, Toggle, useToast } from "../components/ui";
import { useStore } from "../lib/store";
import type { StatusOption } from "../lib/types";
import { downloadFile, faDigits, jLong, timeStr, uid } from "../lib/utils";

type Tab = "notifs" | "logs" | "shifts" | "statuses" | "channels" | "backup";

const SEV: Record<string, { i: IconName; c: string }> = {
  danger: { i: "alert", c: "text-red-500" },
  warn: { i: "alert", c: "text-amber-500" },
  info: { i: "info", c: "text-sky-500" },
};
const KIND_LABEL: Record<string, string> = { ok: "سالم (سبز)", warn: "هشدار (کهربایی)", nok: "معیوب (قرمز)" };

export function SystemPage() {
  const { db, markNotifRead, markAllRead, clearNotifs, updateSettings, exportDB, importDB, resetAll, me } = useStore();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("notifs");
  const [confirmReset, setConfirmReset] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const TABS: { id: Tab; label: string; icon: IconName }[] = [
    { id: "notifs", label: "اعلان‌ها", icon: "bell" },
    { id: "logs", label: "لاگ فعالیت", icon: "shield" },
    { id: "shifts", label: "شیفت‌های کاری", icon: "clock" },
    { id: "statuses", label: "گزینه‌های وضعیت", icon: "check" },
    { id: "channels", label: "کانال‌های اعلان", icon: "send" },
    { id: "backup", label: "پشتیبان‌گیری", icon: "download" },
  ];

  const addStatus = () => {
    const o: StatusOption = { id: uid(), label: "نیاز به بررسی", short: "CHECK", kind: "warn" };
    updateSettings({ statusOptions: [...db.settings.statusOptions, o] });
    toast("گزینه وضعیت جدید اضافه شد — برچسب آن را ویرایش کنید", "ok");
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 flex-wrap anim-fade-up">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 h-10 text-xs font-black transition-all cursor-pointer border ${tab === t.id ? "bg-ink-900 text-white border-ink-900" : "bg-white text-ink-500 border-ink-200 hover:border-ink-400"}`}>
            <Icon name={t.icon} size={15} />{t.label}
            {t.id === "notifs" && db.notifs.filter((n) => !n.read).length > 0 && (
              <span className="w-4.5 h-4.5 min-w-[18px] px-1 rounded-full bg-ember-500 text-white text-[10px] flex items-center justify-center">{faDigits(db.notifs.filter((n) => !n.read).length)}</span>
            )}
          </button>
        ))}
      </div>

      {tab === "notifs" && (
        <div className="card p-4 anim-fade-up">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-display text-lg text-ink-900">اعلان‌های سیستم</h3>
              <p className="text-[11px] text-ink-400 font-semibold">خرابی‌ها و بازدیدهای انجام‌نشده — برای مدیر و سرپرست نت</p>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-sm btn-ghost" onClick={() => { markAllRead(); toast("همه اعلان‌ها خوانده شد", "info"); }}><Icon name="check" size={13} />خواندن همه</button>
              <button className="btn btn-sm btn-danger" onClick={() => { clearNotifs(); toast("اعلان‌ها پاک شد", "info"); }}><Icon name="trash" size={13} />پاک کردن</button>
            </div>
          </div>
          {db.notifs.length === 0 ? <Empty icon="bell" title="اعلانی وجود ندارد" desc="اعلان‌های خرابی و بازدید معوق اینجا ثبت می‌شوند." /> : (
            <div className="divide-y divide-ink-50">
              {db.notifs.map((n) => (
                <div key={n.id} className={`flex items-start gap-3 py-3 ${n.read ? "opacity-55" : ""}`}>
                  <span className={`mt-0.5 ${SEV[n.severity].c}`}><Icon name={SEV[n.severity].i} size={17} sw={2.1} /></span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-black text-ink-900 flex items-center gap-2 flex-wrap">
                      {n.title}
                      {n.channels.map((c) => (
                        <span key={c} className="chip cursor-default py-0">
                          <Icon name={c === "app" ? "bell" : c === "sms" ? "msg" : "mail"} size={10} />
                          {c === "app" ? "داخل برنامه" : c === "sms" ? "پیامک" : "ایمیل"}
                        </span>
                      ))}
                    </p>
                    <p className="text-[12px] text-ink-500 leading-6 mt-0.5">{n.body}</p>
                    <p className="text-[10.5px] font-bold text-ink-300 mt-1">{jLong(n.ts)} · {timeStr(n.ts)}</p>
                  </div>
                  {!n.read && <button className="btn btn-sm btn-ghost shrink-0" onClick={() => markNotifRead(n.id)}>خواندم</button>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "logs" && (
        <div className="card p-4 anim-fade-up">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-display text-lg text-ink-900">لاگ کامل فعالیت کاربران</h3>
              <p className="text-[11px] text-ink-400 font-semibold">ورود/خروج، ثبت بازدید، تغییرات کاربران، تجهیزات و چک‌لیست‌ها</p>
            </div>
            <Badge kind="dark">{faDigits(db.logs.length)} رویداد</Badge>
          </div>
          <div className="overflow-x-auto rounded-lg border border-ink-100">
            <table className="w-full border-collapse min-w-[620px]">
              <thead><tr><th className="th">زمان</th><th className="th">کاربر</th><th className="th">عملیات</th><th className="th">جزئیات</th></tr></thead>
              <tbody>
                {db.logs.slice(0, 60).map((l) => (
                  <tr key={l.id} className="hover:bg-ink-50/60">
                    <td className="td whitespace-nowrap font-bold text-ink-500">{jLong(l.ts)} · {timeStr(l.ts)}</td>
                    <td className="td font-black text-ink-800">{l.userName}</td>
                    <td className="td"><Badge kind={l.action.includes("ناموفق") ? "nok" : l.action.includes("ورود") ? "info" : "neutral"}>{l.action}</Badge></td>
                    <td className="td text-ink-500">{l.detail ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "shifts" && (
        <div className="card p-5 max-w-2xl anim-fade-up">
          <h3 className="font-display text-lg text-ink-900">شیفت‌های کاری</h3>
          <p className="text-[11px] text-ink-400 font-semibold mb-4">بازه هر شیفت بر اساس ساعت — شیفت فعلی به‌صورت خودکار در فرم بازدید ثبت می‌شود</p>
          <div className="space-y-3">
            {db.settings.shifts.map((s, i) => (
              <div key={s.id} className="flex items-center gap-3 rounded-xl border border-ink-100 bg-white p-3.5 flex-wrap">
                <span className="w-10 h-10 rounded-lg bg-ink-900 text-ember-400 font-display text-lg flex items-center justify-center shrink-0">{faDigits(i + 1)}</span>
                <input className="input h-9 w-28 font-black" value={s.name}
                  onChange={(e) => updateSettings({ shifts: db.settings.shifts.map((x) => x.id === s.id ? { ...x, name: e.target.value } : x) })} />
                <div className="flex items-center gap-2 text-[12px] font-black text-ink-500">
                  از ساعت
                  <input className="input h-9 w-16 text-center font-black" dir="ltr" type="number" min={0} max={23} value={s.start}
                    onChange={(e) => updateSettings({ shifts: db.settings.shifts.map((x) => x.id === s.id ? { ...x, start: Number(e.target.value) } : x) })} />
                  تا
                  <input className="input h-9 w-16 text-center font-black" dir="ltr" type="number" min={0} max={23} value={s.end}
                    onChange={(e) => updateSettings({ shifts: db.settings.shifts.map((x) => x.id === s.id ? { ...x, end: Number(e.target.value) } : x) })} />
                </div>
                {s.start > s.end && <Badge kind="info">عبور از نیمه‌شب</Badge>}
              </div>
            ))}
          </div>
          <p className="text-[11px] font-bold text-ink-400 mt-4 flex items-center gap-1.5"><Icon name="info" size={13} className="text-sky-500" />تنظیم پیش‌فرض کارخانه: ۶ تا ۱۴ · ۱۴ تا ۲۲ · ۲۲ تا ۶</p>
        </div>
      )}

      {tab === "statuses" && (
        <div className="card p-5 max-w-2xl anim-fade-up">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display text-lg text-ink-900">گزینه‌های وضعیت آیتم‌ها</h3>
              <p className="text-[11px] text-ink-400 font-semibold">پیش‌فرض دو گزینه‌ای OK / NOK — در صورت نیاز گزینه‌هایی مثل «نیاز به بررسی» اضافه کنید</p>
            </div>
            <button className="btn btn-sm btn-primary" onClick={addStatus}><Icon name="plus" size={13} />گزینه جدید</button>
          </div>
          <div className="space-y-2.5">
            {db.settings.statusOptions.map((o) => (
              <div key={o.id} className="flex items-center gap-2.5 rounded-xl border border-ink-100 bg-white p-3 flex-wrap">
                <input className="input h-9 w-36 font-black" value={o.label}
                  onChange={(e) => updateSettings({ statusOptions: db.settings.statusOptions.map((x) => x.id === o.id ? { ...x, label: e.target.value } : x) })} />
                <input className="input h-9 w-24 font-mono text-center font-black" dir="ltr" value={o.short}
                  onChange={(e) => updateSettings({ statusOptions: db.settings.statusOptions.map((x) => x.id === o.id ? { ...x, short: e.target.value.toUpperCase() } : x) })} />
                <select className="input h-9 w-40 text-[11.5px] font-bold" value={o.kind}
                  onChange={(e) => updateSettings({ statusOptions: db.settings.statusOptions.map((x) => x.id === o.id ? { ...x, kind: e.target.value as StatusOption["kind"] } : x) })}>
                  {(Object.keys(KIND_LABEL) as StatusOption["kind"][]).map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
                </select>
                <span className={`w-3 h-3 rounded-full ${o.kind === "ok" ? "bg-emerald-500" : o.kind === "warn" ? "bg-amber-500" : "bg-red-500"}`} />
                <button className="w-8 h-8 rounded-md border border-red-200 text-red-500 flex items-center justify-center hover:bg-red-50 cursor-pointer ms-auto"
                  disabled={db.settings.statusOptions.length <= 2}
                  onClick={() => { updateSettings({ statusOptions: db.settings.statusOptions.filter((x) => x.id !== o.id) }); toast("گزینه حذف شد", "info"); }}>
                  <Icon name="trash" size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "channels" && (
        <div className="card p-5 max-w-2xl anim-fade-up">
          <h3 className="font-display text-lg text-ink-900">کانال‌های ارسال اعلان</h3>
          <p className="text-[11px] text-ink-400 font-semibold mb-4">در صورت انجام نشدن بازدید یا ثبت خرابی، اعلان برای مدیر و سرپرست نت ارسال می‌شود</p>
          <div className="space-y-3">
            {([
              { k: "app" as const, icon: "bell" as IconName, t: "اعلان داخل برنامه", d: "نمایش در زنگ اعلان و صفحه اعلان‌ها" },
              { k: "sms" as const, icon: "msg" as IconName, t: "پیامک", d: "ارسال SMS به شماره موبایل مدیر و سرپرست (در نسخه سرور)" },
              { k: "email" as const, icon: "mail" as IconName, t: "ایمیل", d: "ارسال ایمیل سازمانی با جزئیات خرابی (در نسخه سرور)" },
            ]).map((c) => (
              <div key={c.k} className="flex items-center gap-3 rounded-xl border border-ink-100 bg-white p-3.5">
                <span className="w-10 h-10 rounded-lg bg-ink-50 border border-ink-100 text-ink-500 flex items-center justify-center shrink-0"><Icon name={c.icon} size={18} /></span>
                <div className="flex-1">
                  <p className="text-[13px] font-black text-ink-800">{c.t}</p>
                  <p className="text-[10.5px] text-ink-400 font-semibold">{c.d}</p>
                </div>
                <Toggle on={db.settings.channels[c.k]} onChange={(v) => { updateSettings({ channels: { ...db.settings.channels, [c.k]: v } }); toast(`کانال ${c.t} ${v ? "فعال" : "غیرفعال"} شد`, "info"); }} />
              </div>
            ))}
          </div>
          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            <Field label="شماره موبایل مدیر (دریافت SMS)"><input className="input font-mono" dir="ltr" value={db.settings.recipients.admin} onChange={(e) => updateSettings({ recipients: { ...db.settings.recipients, admin: e.target.value } })} /></Field>
            <Field label="شماره موبایل سرپرست نت"><input className="input font-mono" dir="ltr" value={db.settings.recipients.supervisor} onChange={(e) => updateSettings({ recipients: { ...db.settings.recipients, supervisor: e.target.value } })} /></Field>
          </div>
        </div>
      )}

      {tab === "backup" && (
        <div className="card p-5 max-w-2xl anim-fade-up">
          <h3 className="font-display text-lg text-ink-900">پشتیبان‌گیری و امنیت داده‌ها</h3>
          <p className="text-[11px] text-ink-400 font-semibold mb-4">رمز عبورها رمزنگاری‌شده ذخیره می‌شوند و لاگ کامل فعالیت کاربران ثبت می‌گردد</p>
          <div className="flex items-center justify-between rounded-xl border border-ink-100 bg-white p-3.5 mb-3">
            <div>
              <p className="text-[13px] font-black text-ink-800">پشتیبان‌گیری خودکار</p>
              <p className="text-[10.5px] text-ink-400 font-semibold">
                آخرین پشتیبان: {db.settings.lastBackup ? `${jLong(db.settings.lastBackup)} · ${timeStr(db.settings.lastBackup)}` : "—"}
              </p>
            </div>
            <Toggle on={db.settings.autoBackup} onChange={(v) => { updateSettings({ autoBackup: v }); toast(v ? "پشتیبان‌گیری خودکار فعال شد" : "غیرفعال شد", "info"); }} />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button className="btn btn-primary" onClick={() => { downloadFile(`nipco-backup-${Date.now()}.json`, exportDB(), "application/json"); toast("فایل پشتیبان JSON دانلود شد", "ok"); }}>
              <Icon name="download" size={16} />دریافت فایل پشتیبان
            </button>
            <button className="btn btn-ghost" onClick={() => fileRef.current?.click()}>
              <Icon name="upload" size={16} />بازیابی از فایل
            </button>
            <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const rd = new FileReader();
              rd.onload = () => {
                const res = importDB(String(rd.result));
                toast(res.msg, res.ok ? "ok" : "error");
              };
              rd.readAsText(f);
              e.target.value = "";
            }} />
            {(me?.role === "admin") && (
              <button className="btn btn-danger" onClick={() => setConfirmReset(true)}>
                <Icon name="refresh" size={16} />بازنشانی داده‌های نمونه
              </button>
            )}
          </div>
        </div>
      )}

      <Confirm open={confirmReset} onClose={() => setConfirmReset(false)} title="بازنشانی سامانه"
        body="همه داده‌ها به حالت اولیه (کاربران، تجهیزات و نمونه بازدیدها) برمی‌گردد. این عمل قابل بازگشت نیست."
        yesLabel="بله، بازنشانی کن"
        onYes={() => { resetAll(); toast("سامانه به داده‌های نمونه بازنشانی شد", "warn"); }} />
    </div>
  );
}
