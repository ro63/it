import { useEffect, useMemo, useState } from "react";
import { GroupGlyph, Icon, type IconName } from "../components/icons";
import { Badge, Bar, Empty } from "../components/ui";
import { itemFailed, itemWarn, pagesFor, useStore, type PageId } from "../lib/store";
import { EQ_STATUS_LABELS, faDigits, jKey, jShort, shiftStarted, timeStr } from "../lib/utils";

const EQ_COLORS: Record<string, string> = { active: "#10b981", repair: "#f59e0b", out: "#ef4444", inactive: "#94a3b8" };

function Donut({ data, center, sub }: { data: { label: string; value: number; color: string }[]; center: string; sub: string }) {
  const total = data.reduce((a, b) => a + b.value, 0) || 1;
  const C = 2 * Math.PI * 42;
  let acc = 0;
  return (
    <div className="flex items-center gap-6">
      <svg width="132" height="132" viewBox="0 0 100 100" className="shrink-0 -rotate-90">
        <circle cx="50" cy="50" r="42" fill="none" stroke="var(--color-ink-100)" strokeWidth="11" />
        {data.map((d) => {
          const len = (d.value / total) * C;
          const el = (
            <circle key={d.label} cx="50" cy="50" r="42" fill="none" stroke={d.color} strokeWidth="11" strokeLinecap="butt"
              strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-acc}
              style={{ ["--ring-c" as string]: C, animation: "drawRing 0.9s ease both" }} />
          );
          acc += len;
          return el;
        })}
      </svg>
      <div>
        <p className="font-display text-4xl text-ink-900 leading-none">{center}</p>
        <p className="text-[11px] font-bold text-ink-400 mt-1">{sub}</p>
        <div className="mt-3 space-y-1.5">
          {data.map((d) => (
            <p key={d.label} className="flex items-center gap-2 text-[11.5px] font-bold text-ink-600">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: d.color }} />
              {d.label}
              <b className="text-ink-900">{faDigits(d.value)}</b>
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value, sub, tone = "ink" }: { icon: IconName; label: string; value: string; sub?: string; tone?: string }) {
  const tones: Record<string, string> = {
    ink: "text-ink-900", ember: "text-ember-600", red: "text-red-600", amber: "text-amber-600", green: "text-emerald-600",
  };
  return (
    <div className="card p-4 flex items-start gap-3 hover:shadow-pop transition-shadow duration-300">
      <span className="w-10 h-10 rounded-lg bg-ink-50 border border-ink-100 text-ink-500 flex items-center justify-center shrink-0"><Icon name={icon} size={19} /></span>
      <div className="min-w-0">
        <p className={`font-display text-[30px] leading-8 ${tones[tone]}`}>{value}</p>
        <p className="text-[11.5px] font-bold text-ink-500 mt-0.5">{label}</p>
        {sub && <p className="text-[10.5px] text-ink-400 font-semibold mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export function Dashboard({ go }: { go: (p: PageId, payload?: string) => void }) {
  const { db, me } = useStore();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(iv);
  }, []);

  const m = useMemo(() => {
    const todayKey = jKey(now.getTime());
    const activeEq = db.equipment.filter((e) => e.status === "active");
    const started = db.settings.shifts.filter((s) => shiftStarted(s, now));
    const todayRecs = db.records.filter((r) => r.dateKey === todayKey);
    const doneKeys = new Set(todayRecs.map((r) => `${r.equipmentId}|${r.shift}`));
    const expected = activeEq.length * started.length;
    let noks = 0, warns = 0;
    for (const r of todayRecs) for (const it of r.items) {
      if (itemFailed(db, it)) noks++;
      else if (itemWarn(db, it)) warns++;
    }
    const missing: { eqId: string; name: string; code: string; groupId: string; shift: number }[] = [];
    for (const sh of started) for (const eq of activeEq) {
      if (!doneKeys.has(`${eq.id}|${sh.id}`)) missing.push({ eqId: eq.id, name: eq.name, code: eq.code, groupId: eq.groupId, shift: sh.id });
    }
    const week: { label: string; value: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const ts = now.getTime() - i * 86400000;
      week.push({ label: jShort(ts), value: db.records.filter((r) => r.dateKey === jKey(ts)).length });
    }
    const statusCounts = ["active", "repair", "out", "inactive"].map((st) => ({
      label: EQ_STATUS_LABELS[st], value: db.equipment.filter((e) => e.status === st).length, color: EQ_COLORS[st],
    }));
    const fails: { r: (typeof db.records)[number]; it: (typeof db.records)[number]["items"][number] }[] = [];
    outer: for (const r of db.records) {
      for (const it of r.items) if (itemFailed(db, it)) { fails.push({ r, it }); if (fails.length >= 6) break outer; }
    }
    const groupProgress = db.groups.map((g) => {
      const geqs = activeEq.filter((e) => e.groupId === g.id);
      const exp = geqs.length * started.length;
      const done = todayRecs.filter((r) => r.groupId === g.id).length;
      return { g, exp, done };
    });
    return { todayKey, todayRecs, expected, noks, warns, missing, week, statusCounts, fails, groupProgress, started };
  }, [db, now]);

  const hour = now.getHours();
  const greet = hour < 12 ? "صبح بخیر" : hour < 17 ? "ظهر بخیر" : "عصر بخیر";
  const pct = m.expected ? Math.round((m.todayRecs.length / m.expected) * 100) : 0;
  const maxWeek = Math.max(1, ...m.week.map((w) => w.value));

  return (
    <div className="space-y-5">
      {/* نوار وضعیت روز */}
      <div className="rounded-2xl bg-ink-900 text-white p-5 lg:p-6 relative overflow-hidden anim-fade-up">
        <div className="absolute inset-0 opacity-[0.16]" style={{ backgroundImage: "radial-gradient(circle at 85% 20%, #e06f10 0%, transparent 45%)" }} />
        <div className="absolute -left-8 -bottom-16 opacity-[0.08]"><Icon name="gear" size={220} sw={0.8} /></div>
        <div className="relative flex flex-col lg:flex-row lg:items-center gap-5">
          <div className="flex-1">
            <p className="text-ember-400 text-xs font-black mb-1">امروز در کارخانه</p>
            <h2 className="font-display text-3xl lg:text-4xl leading-tight">{greet}، {me?.fullName}</h2>
            <p className="text-ink-300 text-[12.5px] font-semibold mt-1.5">
              {faDigits(m.todayRecs.length)} بازدید از {faDigits(m.expected)} بازدید برنامه‌ریزی‌شده امروز انجام شده
              {m.missing.length > 0 && <span className="text-amber-400"> · {faDigits(m.missing.length)} مورد باقی‌مانده/معوق</span>}
            </p>
            <div className="mt-3.5 max-w-md">
              <Bar value={pct} color="linear-gradient(90deg,#e06f10,#f0a75e)" h={9} />
              <p className="text-[10.5px] font-bold text-ink-400 mt-1.5">پیشرفت بازدیدهای روزانه — {faDigits(pct)}٪ از {faDigits(m.started.length)} شیفتِ شروع‌شده</p>
            </div>
          </div>
          <div className="flex gap-2.5">
            {pagesFor(me ?? null).includes("inspection") && (
              <button className="btn btn-primary h-11 px-5" onClick={() => go("inspection")}>
                <Icon name="scan" size={17} />
                شروع بازدید جدید
              </button>
            )}
            <button className="btn h-11 px-5 bg-white/10 text-white border border-white/15 hover:bg-white/20" onClick={() => go("reports")}>
              <Icon name="chart" size={17} />
              گزارشات
            </button>
          </div>
        </div>
      </div>

      {/* آمار روزانه */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3.5 stagger">
        <Stat icon="clipboard" label="بازدیدهای امروز" value={faDigits(m.todayRecs.length)} sub={`از ${faDigits(m.expected)} بازدید مورد انتظار`} tone="ember" />
        <Stat icon="alert" label="خرابی‌های امروز (NOK)" value={faDigits(m.noks)} sub="آیتم‌های معیوب یا خارج از محدوده" tone="red" />
        <Stat icon="info" label="هشدارهای امروز" value={faDigits(m.warns)} sub="موارد نیاز به بررسی" tone="amber" />
        <Stat icon="wrench" label="تجهیزات فعال" value={faDigits(db.equipment.filter((e) => e.status === "active").length)} sub={`از مجموع ${faDigits(db.equipment.length)} تجهیز ثبت‌شده`} tone="green" />
      </div>

      <div className="grid lg:grid-cols-5 gap-3.5">
        {/* نمودار هفتگی */}
        <div className="card p-5 lg:col-span-3 anim-fade-up">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display text-lg text-ink-900">روند بازدیدهای ۷ روز اخیر</h3>
              <p className="text-[11px] text-ink-400 font-semibold">تعداد بازدید ثبت‌شده در هر روز</p>
            </div>
            <Badge kind="ember" dot>هفته جاری</Badge>
          </div>
          <div className="flex items-end gap-2.5 h-44">
            {m.week.map((w, i) => (
              <div key={w.label} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group" title={`${w.label}: ${w.value} بازدید`}>
                <span className="text-[11px] font-black text-ink-500 group-hover:text-ember-600 transition-colors">{faDigits(w.value)}</span>
                <div className={`w-full max-w-12 rounded-t-md bar-grow transition-all duration-300 ${i === 6 ? "bg-ember-500 group-hover:bg-ember-600" : "bg-ink-200 group-hover:bg-ink-300"}`}
                  style={{ height: `${(w.value / maxWeek) * 78}%`, minHeight: 4, animationDelay: `${i * 0.06}s` }} />
                <span className="text-[10px] font-bold text-ink-400 whitespace-nowrap">{w.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* وضعیت تجهیزات */}
        <div className="card p-5 lg:col-span-2 anim-fade-up" style={{ animationDelay: "0.08s" }}>
          <h3 className="font-display text-lg text-ink-900 mb-1">وضعیت تجهیزات</h3>
          <p className="text-[11px] text-ink-400 font-semibold mb-4">توزیع وضعیت ناوگان تجهیزاتی</p>
          <Donut data={m.statusCounts} center={faDigits(db.equipment.length)} sub="تجهیز ثبت‌شده" />
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-3.5">
        {/* پیشرفت گروه‌ها */}
        <div className="card p-5 lg:col-span-2 anim-fade-up">
          <h3 className="font-display text-lg text-ink-900 mb-1">پیشرفت امروز به تفکیک گروه</h3>
          <p className="text-[11px] text-ink-400 font-semibold mb-4">بازدیدهای انجام‌شده نسبت به برنامه</p>
          <div className="space-y-4">
            {m.groupProgress.map(({ g, exp, done }) => {
              const gp = exp ? Math.round((done / exp) * 100) : 0;
              return (
                <div key={g.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="flex items-center gap-2 text-[12px] font-black text-ink-700">
                      <GroupGlyph icon={g.icon} color={g.color} size={24} />
                      {g.name}
                    </span>
                    <span className="text-[11px] font-black text-ink-500">{faDigits(done)} از {faDigits(exp)}</span>
                  </div>
                  <Bar value={gp} color={g.color} />
                </div>
              );
            })}
          </div>
        </div>

        {/* معوقات */}
        <div className="card p-5 lg:col-span-3 anim-fade-up" style={{ animationDelay: "0.06s" }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-display text-lg text-ink-900">بازدیدهای انجام‌نشده / معوق</h3>
              <p className="text-[11px] text-ink-400 font-semibold">شیفت‌های شروع‌شده‌ی امروز که هنوز ثبت نشده‌اند</p>
            </div>
            <Badge kind={m.missing.length ? "warn" : "ok"} dot>{m.missing.length ? `${faDigits(m.missing.length)} مورد` : "تکمیل شده"}</Badge>
          </div>
          {m.missing.length === 0 ? (
            <Empty icon="check" title="همه بازدیدهای شیفت‌های گذشته ثبت شده" desc="به‌محض شروع شیفت بعد، موارد جدید در این فهرست قرار می‌گیرند." />
          ) : (
            <div className="divide-y divide-ink-50 max-h-72 overflow-y-auto -mx-2 px-2">
              {m.missing.slice(0, 10).map((x) => {
                const g = db.groups.find((gg) => gg.id === x.groupId);
                return (
                  <div key={`${x.eqId}-${x.shift}`} className="flex items-center gap-3 py-2.5">
                    {g && <GroupGlyph icon={g.icon} color={g.color} size={34} />}
                    <div className="flex-1 min-w-0">
                      <p className="text-[12.5px] font-black text-ink-800 truncate">{x.name}</p>
                      <p className="text-[10.5px] font-bold text-ink-400" dir="ltr">{x.code}</p>
                    </div>
                    <Badge kind="warn">شیفت {faDigits(x.shift)}</Badge>
                    {pagesFor(me ?? null).includes("inspection") && (
                      <button className="btn btn-sm btn-ghost" onClick={() => go("inspection", x.code)}>
                        <Icon name="clipboard" size={13} />
                        ثبت
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* خرابی‌های اخیر */}
      <div className="card p-5 anim-fade-up">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-display text-lg text-ink-900">آخرین خرابی‌های گزارش‌شده (NOK)</h3>
            <p className="text-[11px] text-ink-400 font-semibold">جدیدترین آیتم‌های معیوب یا خارج از محدوده ثبت‌شده</p>
          </div>
          <button className="btn btn-sm btn-ghost" onClick={() => go("reports")}>گزارش کامل خرابی‌ها <Icon name="chevL" size={13} /></button>
        </div>
        {m.fails.length === 0 ? (
          <Empty icon="shield" title="خرابی ثبت‌شده‌ای یافت نشد" />
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
            {m.fails.map(({ r, it }) => (
              <div key={r.id + it.itemId} className="rounded-xl border border-red-100 bg-red-50/50 p-3.5 hover:border-red-200 transition-colors">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-red-500"><Icon name="alert" size={15} sw={2.2} /></span>
                  <p className="text-[12px] font-black text-ink-900 truncate">{r.equipmentName}</p>
                  <span className="ms-auto text-[10px] font-bold text-ink-400 whitespace-nowrap">{faDigits(timeStr(r.ts))}</span>
                </div>
                <p className="text-[12px] font-bold text-red-700">{it.itemTitle}{it.value != null && it.unit ? ` — ${faDigits(it.value)} ${it.unit}` : ""}</p>
                {it.note && <p className="text-[11px] text-ink-500 leading-5 mt-1 line-clamp-2">{it.note}</p>}
                <p className="text-[10.5px] font-bold text-ink-400 mt-1.5 flex items-center gap-1"><Icon name="user" size={11} />{r.technicianName} · {jShort(r.ts)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
