import { useMemo, useState } from "react";
import { GroupGlyph, Icon, type IconName } from "../components/icons";
import { Badge, Empty, Seg, useToast } from "../components/ui";
import { itemFailed, itemWarn, useStore } from "../lib/store";
import { downloadFile, faDigits, jKey, jLong, jShort, timeStr, toCSV } from "../lib/utils";

type Tab = "daily" | "weekly" | "monthly" | "fails" | "pm" | "critical";

const TABS: { id: Tab; label: string; icon: IconName }[] = [
  { id: "daily", label: "روزانه", icon: "calendar" },
  { id: "weekly", label: "هفتگی", icon: "history" },
  { id: "monthly", label: "ماهانه", icon: "chart" },
  { id: "fails", label: "خرابی‌ها", icon: "alert" },
  { id: "pm", label: "PM پیشگیرانه", icon: "wrench" },
  { id: "critical", label: "تجهیزات بحرانی", icon: "shield" },
];

function PrintHead({ title }: { title: string }) {
  const { db } = useStore();
  return (
    <div className="hidden print:block mb-4 border-b-2 border-ink-900 pb-2">
      <p className="font-black text-sm">شرکت صنایع قطعه‌سازی خودرو NIPCO — واحد نگهداری و تعمیرات</p>
      <p className="text-xs font-bold mt-0.5">{title} · تاریخ تولید گزارش: {jLong(Date.now())} · تحلیل و طراحی سیستم: محمد روشندل</p>
    </div>
  );
}

export function ReportsPage() {
  const { db } = useStore();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("daily");
  const [groupBy, setGroupBy] = useState<"eq" | "tech">("eq");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [gFilter, setGFilter] = useState("all");
  const [tFilter, setTFilter] = useState("all");
  const [range, setRange] = useState<"7" | "30" | "all">("30");

  const selKey = jKey(new Date(date + "T12:00:00").getTime());

  const R = useMemo(() => {
    const inRange = (ts: number) => {
      if (range === "all") return true;
      return Date.now() - ts < Number(range) * 86400000;
    };
    const recs = db.records.filter((r) => inRange(r.ts) && (gFilter === "all" || r.groupId === gFilter) && (tFilter === "all" || r.technicianId === tFilter));
    return recs;
  }, [db.records, gFilter, tFilter, range]);

  const daily = useMemo(() => {
    const recs = db.records.filter((r) => r.dateKey === selKey && (gFilter === "all" || r.groupId === gFilter));
    const map = new Map<string, { label: string; sub: string; visits: number; ok: number; nok: number; warn: number }>();
    for (const r of recs) {
      const key = groupBy === "eq" ? r.equipmentId : r.technicianId;
      const label = groupBy === "eq" ? r.equipmentName : r.technicianName;
      const sub = groupBy === "eq" ? r.equipmentCode : r.groupName;
      const row = map.get(key) ?? { label, sub, visits: 0, ok: 0, nok: 0, warn: 0 };
      row.visits++;
      for (const it of r.items) {
        if (itemFailed(db, it)) row.nok++;
        else if (itemWarn(db, it)) row.warn++;
        else row.ok++;
      }
      map.set(key, row);
    }
    return [...map.values()].sort((a, b) => b.nok - a.nok || b.visits - a.visits);
  }, [db, selKey, gFilter, groupBy]);

  const weekly = useMemo(() => {
    const out: { label: string; key: string; visits: number; ok: number; nok: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const ts = Date.now() - i * 86400000;
      const key = jKey(ts);
      const recs = R.filter((r) => r.dateKey === key);
      let ok = 0, nok = 0;
      for (const r of recs) for (const it of r.items) (itemFailed(db, it) ? nok++ : ok++);
      out.push({ label: jShort(ts), key, visits: recs.length, ok, nok });
    }
    return out;
  }, [R, db]);

  const monthly = useMemo(() => {
    const month = selKey.slice(0, 7); // yyyy/mm
    const recs = db.records.filter((r) => r.dateKey.startsWith(month) && (gFilter === "all" || r.groupId === gFilter));
    const map = new Map<string, { label: string; sub: string; visits: number; ok: number; nok: number; warn: number }>();
    for (const r of recs) {
      const row = map.get(r.equipmentId) ?? { label: r.equipmentName, sub: r.equipmentCode, visits: 0, ok: 0, nok: 0, warn: 0 };
      row.visits++;
      for (const it of r.items) {
        if (itemFailed(db, it)) row.nok++;
        else if (itemWarn(db, it)) row.warn++;
        else row.ok++;
      }
      map.set(r.equipmentId, row);
    }
    return [...map.values()].sort((a, b) => b.nok - a.nok || b.visits - a.visits);
  }, [db, selKey, gFilter]);

  const fails = useMemo(() => {
    const out: { r: (typeof db.records)[number]; it: (typeof db.records)[number]["items"][number] }[] = [];
    for (const r of R) for (const it of r.items) {
      const o = db.settings.statusOptions.find((x) => x.id === it.statusId);
      if (o?.kind === "nok" || (it.value != null && ((it.min != null && it.value < it.min) || (it.max != null && it.value > it.max)))) out.push({ r, it });
    }
    return out.slice(0, 120);
  }, [R, db]);

  const pm = useMemo(() => {
    const now = Date.now();
    return db.equipment.filter((e) => e.status === "active").map((e) => {
      const recs = db.records.filter((r) => r.equipmentId === e.id);
      const last = recs[0]?.ts ?? null;
      const days = last ? Math.floor((now - last) / 86400000) : null;
      const m30 = recs.filter((r) => now - r.ts < 30 * 86400000);
      let ok = 0, tot = 0;
      for (const r of m30) for (const it of r.items) { tot++; if (!itemFailed(db, it)) ok++; }
      const health = tot ? Math.round((ok / tot) * 100) : 100;
      const st = days == null ? "none" : days <= 1 ? "ok" : days <= 3 ? "warn" : "nok";
      return { e, last, days, health, st };
    }).sort((a, b) => (b.days ?? 99) - (a.days ?? 99));
  }, [db]);

  const critical = useMemo(() => {
    const now = Date.now();
    const map = new Map<string, { name: string; code: string; groupId: string; nok: number; warn: number; lastFail: number }>();
    for (const r of db.records) {
      if (now - r.ts > 30 * 86400000) continue;
      for (const it of r.items) {
        const row = map.get(r.equipmentId) ?? { name: r.equipmentName, code: r.equipmentCode, groupId: r.groupId, nok: 0, warn: 0, lastFail: 0 };
        if (itemFailed(db, it)) { row.nok++; row.lastFail = Math.max(row.lastFail, r.ts); }
        else if (itemWarn(db, it)) row.warn++;
        map.set(r.equipmentId, row);
      }
    }
    return [...map.entries()].map(([id, v]) => ({ id, ...v })).filter((x) => x.nok > 0 || x.warn > 0).sort((a, b) => b.nok - a.nok).slice(0, 12);
  }, [db]);

  const maxCrit = Math.max(1, ...critical.map((c) => c.nok));
  const techs = useMemo(() => {
    const s = new Map<string, string>();
    db.records.forEach((r) => s.set(r.technicianId, r.technicianName));
    return [...s.entries()];
  }, [db.records]);

  const exportCSV = () => {
    let rows: (string | number)[][] = [];
    if (tab === "daily") rows = [["گزارش روزانه NIPCO", selKey], ["عنوان", groupBy === "eq" ? "کد" : "گروه", "بازدید", "سالم", "هشدار", "معیوب"], ...daily.map((d) => [d.label, d.sub, d.visits, d.ok, d.warn, d.nok])];
    else if (tab === "weekly") rows = [["گزارش هفتگی NIPCO"], ["روز", "بازدید", "سالم", "معیوب"], ...weekly.map((w) => [w.label, w.visits, w.ok, w.nok])];
    else if (tab === "monthly") rows = [["گزارش ماهانه NIPCO", selKey.slice(0, 7)], ["تجهیز", "کد", "بازدید", "سالم", "هشدار", "معیوب"], ...monthly.map((d) => [d.label, d.sub, d.visits, d.ok, d.warn, d.nok])];
    else if (tab === "fails") rows = [["گزارش خرابی‌های NIPCO"], ["تاریخ", "ساعت", "شیفت", "تجهیز", "آیتم", "مقدار", "تکنسین", "توضیحات"], ...fails.map(({ r, it }) => [r.dateKey, timeStr(r.ts), r.shift, r.equipmentName, it.itemTitle, it.value ?? "", r.technicianName, it.note ?? ""])];
    else if (tab === "pm") rows = [["گزارش PM پیشگیرانه NIPCO"], ["تجهیز", "کد", "آخرین بازدید", "روز گذشته", "سلامت ٪"], ...pm.map((p) => [p.e.name, p.e.code, p.last ? jShort(p.last) : "—", p.days ?? "—", p.health])];
    else rows = [["تجهیزات بحرانی NIPCO — ۳۰ روز اخیر"], ["تجهیز", "کد", "خرابی", "هشدار"], ...critical.map((c) => [c.name, c.code, c.nok, c.warn])];
    downloadFile(`nipco-${tab}-${Date.now()}.csv`, toCSV(rows), "text/csv;charset=utf-8");
    toast("فایل Excel (CSV) دانلود شد", "ok");
  };

  const tabTitle = TABS.find((t) => t.id === tab)?.label ?? "";

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between anim-fade-up no-print">
        <div className="flex gap-1.5 flex-wrap">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 h-10 text-xs font-black transition-all cursor-pointer border ${tab === t.id ? "bg-ink-900 text-white border-ink-900 shadow-sm" : "bg-white text-ink-500 border-ink-200 hover:border-ink-400"}`}>
              <Icon name={t.icon} size={15} />
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost" onClick={exportCSV}><Icon name="sheet" size={16} />خروجی Excel</button>
          <button className="btn btn-dark" onClick={() => window.print()}><Icon name="printer" size={16} />خروجی PDF / چاپ</button>
        </div>
      </div>

      {/* فیلترها */}
      <div className="card p-3.5 flex flex-wrap items-center gap-3 anim-fade-up no-print" style={{ animationDelay: "0.05s" }}>
        {(tab === "daily" || tab === "monthly") && (
          <label className="flex items-center gap-2 text-[11.5px] font-black text-ink-500">
            <Icon name="calendar" size={15} />
            تاریخ (مبنا):
            <input type="date" className="input h-9 w-40" dir="ltr" value={date} onChange={(e) => setDate(e.target.value)} />
            <span className="text-ember-600">{faDigits(selKey)}</span>
          </label>
        )}
        {tab === "daily" && (
          <Seg options={[{ id: "eq" as const, label: "به تفکیک دستگاه" }, { id: "tech" as const, label: "به تفکیک تکنسین" }]} value={groupBy} onChange={setGroupBy} />
        )}
        {["daily", "monthly", "fails", "weekly"].includes(tab) && (
          <select className="input h-9 w-44 text-[11.5px] font-bold" value={gFilter} onChange={(e) => setGFilter(e.target.value)}>
            <option value="all">همه گروه‌ها</option>
            {db.groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        )}
        {tab === "fails" && (
          <>
            <select className="input h-9 w-40 text-[11.5px] font-bold" value={tFilter} onChange={(e) => setTFilter(e.target.value)}>
              <option value="all">همه تکنسین‌ها</option>
              {techs.map(([id, n]) => <option key={id} value={id}>{n}</option>)}
            </select>
            <Seg options={[{ id: "7" as const, label: "۷ روز" }, { id: "30" as const, label: "۳۰ روز" }, { id: "all" as const, label: "همه" }]} value={range} onChange={setRange} />
          </>
        )}
      </div>

      {/* محتوای گزارش */}
      <div className="card p-4 lg:p-5 anim-fade-up print-area" style={{ animationDelay: "0.08s" }}>
        <PrintHead title={`گزارش ${tabTitle}`} />
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-xl text-ink-900">
            {tab === "daily" && `گزارش روزانه — ${faDigits(selKey)} (${groupBy === "eq" ? "به تفکیک دستگاه" : "به تفکیک تکنسین"})`}
            {tab === "weekly" && "گزارش هفتگی — ۷ روز اخیر"}
            {tab === "monthly" && `گزارش ماهانه — ${faDigits(selKey.slice(0, 7))}`}
            {tab === "fails" && "گزارش خرابی‌ها (NOK و خارج از محدوده)"}
            {tab === "pm" && "گزارش PM پیشگیرانه — فاصله از آخرین بازدید"}
            {tab === "critical" && "تجهیزات بحرانی — ۳۰ روز اخیر"}
          </h3>
        </div>

        <div className="overflow-x-auto rounded-lg border border-ink-100">
          <table className="w-full border-collapse min-w-[560px]">
            {tab === "daily" && (
              <>
                <thead><tr><th className="th">{groupBy === "eq" ? "دستگاه" : "تکنسین"}</th><th className="th">{groupBy === "eq" ? "کد" : "آخرین گروه"}</th><th className="th">بازدید</th><th className="th">سالم</th><th className="th">هشدار</th><th className="th">معیوب</th></tr></thead>
                <tbody>
                  {daily.map((d, i) => (
                    <tr key={i} className="hover:bg-ink-50/60 transition-colors">
                      <td className="td font-black text-ink-800">{d.label}</td><td className="td text-ink-500 font-mono" dir="ltr">{d.sub}</td>
                      <td className="td font-bold">{faDigits(d.visits)}</td>
                      <td className="td"><Badge kind="ok">{faDigits(d.ok)}</Badge></td>
                      <td className="td"><Badge kind="warn">{faDigits(d.warn)}</Badge></td>
                      <td className="td"><Badge kind={d.nok ? "nok" : "neutral"}>{faDigits(d.nok)}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}
            {tab === "weekly" && (
              <>
                <thead><tr><th className="th">روز</th><th className="th">بازدید</th><th className="th">سالم</th><th className="th">معیوب</th><th className="th w-1/3">نمودار</th></tr></thead>
                <tbody>
                  {weekly.map((w) => {
                    const max = Math.max(1, ...weekly.map((x) => x.visits));
                    return (
                      <tr key={w.key} className="hover:bg-ink-50/60">
                        <td className="td font-black text-ink-800">{w.label}</td>
                        <td className="td font-bold">{faDigits(w.visits)}</td>
                        <td className="td"><Badge kind="ok">{faDigits(w.ok)}</Badge></td>
                        <td className="td"><Badge kind={w.nok ? "nok" : "neutral"}>{faDigits(w.nok)}</Badge></td>
                        <td className="td"><div className="h-2 rounded-full bg-ink-100 overflow-hidden"><div className="h-full bg-ember-500 rounded-full" style={{ width: `${(w.visits / max) * 100}%` }} /></div></td>
                      </tr>
                    );
                  })}
                </tbody>
              </>
            )}
            {tab === "monthly" && (
              <>
                <thead><tr><th className="th">تجهیز</th><th className="th">کد</th><th className="th">بازدید</th><th className="th">سالم</th><th className="th">هشدار</th><th className="th">معیوب</th></tr></thead>
                <tbody>
                  {monthly.map((d, i) => (
                    <tr key={i} className="hover:bg-ink-50/60">
                      <td className="td font-black text-ink-800">{d.label}</td><td className="td font-mono text-ink-500" dir="ltr">{d.sub}</td>
                      <td className="td font-bold">{faDigits(d.visits)}</td>
                      <td className="td"><Badge kind="ok">{faDigits(d.ok)}</Badge></td>
                      <td className="td"><Badge kind="warn">{faDigits(d.warn)}</Badge></td>
                      <td className="td"><Badge kind={d.nok ? "nok" : "neutral"}>{faDigits(d.nok)}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}
            {tab === "fails" && (
              <>
                <thead><tr><th className="th">تاریخ</th><th className="th">ساعت</th><th className="th">شیفت</th><th className="th">تجهیز</th><th className="th">آیتم معیوب</th><th className="th">تکنسین</th><th className="th">توضیحات</th></tr></thead>
                <tbody>
                  {fails.map(({ r, it }, i) => (
                    <tr key={i} className="hover:bg-red-50/40">
                      <td className="td font-bold whitespace-nowrap">{faDigits(r.dateKey)}</td>
                      <td className="td whitespace-nowrap">{timeStr(r.ts)}</td>
                      <td className="td"><Badge kind="neutral">شیفت {faDigits(r.shift)}</Badge></td>
                      <td className="td font-black text-ink-800">{r.equipmentName}</td>
                      <td className="td text-red-700 font-bold">{it.itemTitle}{it.value != null && it.unit ? ` (${faDigits(it.value)} ${it.unit})` : ""}</td>
                      <td className="td">{r.technicianName}</td>
                      <td className="td text-ink-500 max-w-52 truncate">{it.note || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}
            {tab === "pm" && (
              <>
                <thead><tr><th className="th">تجهیز</th><th className="th">کد</th><th className="th">آخرین بازدید</th><th className="th">فاصله (روز)</th><th className="th">سلامت ۳۰ روزه</th><th className="th">وضعیت PM</th></tr></thead>
                <tbody>
                  {pm.map((p) => (
                    <tr key={p.e.id} className="hover:bg-ink-50/60">
                      <td className="td font-black text-ink-800">{p.e.name}</td>
                      <td className="td font-mono text-ink-500" dir="ltr">{p.e.code}</td>
                      <td className="td">{p.last ? `${jShort(p.last)} · ${timeStr(p.last)}` : "بدون سابقه"}</td>
                      <td className="td font-bold">{p.days == null ? "—" : faDigits(p.days)}</td>
                      <td className="td">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 rounded-full bg-ink-100 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${p.health}%`, background: p.health > 90 ? "#10b981" : p.health > 75 ? "#f59e0b" : "#ef4444" }} /></div>
                          <span className="text-[11px] font-black text-ink-500">{faDigits(p.health)}٪</span>
                        </div>
                      </td>
                      <td className="td"><Badge kind={p.st === "ok" ? "ok" : p.st === "warn" ? "warn" : p.st === "nok" ? "nok" : "neutral"} dot>{p.st === "ok" ? "به‌روز" : p.st === "warn" ? "نزدیک به موعد" : p.st === "nok" ? "عقب‌افتاده" : "بدون سابقه"}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}
            {tab === "critical" && (
              <>
                <thead><tr><th className="th">رتبه</th><th className="th">تجهیز</th><th className="th">گروه</th><th className="th">خرابی (۳۰ روز)</th><th className="th">شدت</th><th className="th">آخرین خرابی</th></tr></thead>
                <tbody>
                  {critical.map((c, i) => {
                    const g = db.groups.find((x) => x.id === c.groupId);
                    return (
                      <tr key={c.id} className="hover:bg-ink-50/60">
                        <td className="td"><span className={`w-7 h-7 rounded-lg font-display text-sm flex items-center justify-center ${i < 3 ? "bg-red-500 text-white" : "bg-ink-100 text-ink-500"}`}>{faDigits(i + 1)}</span></td>
                        <td className="td font-black text-ink-800">{c.name}<span className="block text-[10px] font-mono text-ink-400" dir="ltr">{c.code}</span></td>
                        <td className="td">{g && <span className="chip cursor-default"><GroupGlyph icon={g.icon} color={g.color} size={18} />{g.name}</span>}</td>
                        <td className="td"><Badge kind="nok">{faDigits(c.nok)} مورد</Badge> {c.warn > 0 && <Badge kind="warn">{faDigits(c.warn)} هشدار</Badge>}</td>
                        <td className="td w-36"><div className="h-2.5 rounded-full bg-ink-100 overflow-hidden"><div className="h-full bg-red-500 rounded-full" style={{ width: `${(c.nok / maxCrit) * 100}%` }} /></div></td>
                        <td className="td text-ink-500 whitespace-nowrap">{c.lastFail ? `${jShort(c.lastFail)} · ${timeStr(c.lastFail)}` : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </>
            )}
          </table>
          {((tab === "daily" && daily.length === 0) || (tab === "monthly" && monthly.length === 0) || (tab === "fails" && fails.length === 0) || (tab === "critical" && critical.length === 0)) && (
            <Empty icon="chart" title="داده‌ای برای نمایش نیست" desc="بازه یا فیلترها را تغییر دهید؛ داده‌های نمونه در روزهای اخیر موجود است." />
          )}
        </div>
      </div>
    </div>
  );
}
