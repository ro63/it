import { useCallback, useEffect, useMemo, useState } from "react";
import { GroupGlyph, Icon } from "../components/icons";
import { Scanner, parseQr } from "../components/Scanner";
import { Badge, Empty, Modal, Seg, useToast } from "../components/ui";
import { canAccessChecklist, useStore, visibleSections, type PageId } from "../lib/store";
import type { AttachmentMeta, Checklist, ChecklistItem, ChecklistSection, InspectionRecord, RecordItem } from "../lib/types";
import { compressImage, detectShift, faDigits, fmtSize, jKey, jLong, shiftStarted, timeStr, uid } from "../lib/utils";

interface Answer { statusId?: string; value: string; note: string; photos: string[]; files: AttachmentMeta[]; open: boolean }

const emptyAns = (): Answer => ({ value: "", note: "", photos: [], files: [], open: false });

const KIND_STYLE: Record<string, string> = {
  ok: "bg-emerald-500 border-emerald-500 text-white shadow-sm",
  warn: "bg-amber-500 border-amber-500 text-white shadow-sm",
  nok: "bg-red-600 border-red-600 text-white shadow-sm",
};

function ItemRow({ it, ans, onChange, showErr }: {
  it: ChecklistItem; ans: Answer; showErr: boolean;
  onChange: (patch: Partial<Answer>) => void;
}) {
  const { db } = useStore();
  const opts = db.settings.statusOptions;
  const needStatus = it.type !== "number";
  const needValue = it.type !== "status";
  const val = ans.value.trim() === "" ? null : Number(ans.value);
  const outOfRange = val != null && ((it.min != null && val < it.min) || (it.max != null && val > it.max));
  const missing = (needStatus && !ans.statusId) || (needValue && val == null);
  const err = showErr && missing;

  const addPhotos = async (list: FileList | null) => {
    if (!list) return;
    for (const f of Array.from(list).slice(0, 4)) {
      try {
        const url = await compressImage(f);
        onChange({ photos: [...ans.photos, url] });
      } catch { /* ignore */ }
    }
  };
  const addFiles = (list: FileList | null, kind: "video" | "audio") => {
    if (!list) return;
    const metas: AttachmentMeta[] = Array.from(list).slice(0, 3).map((f) => ({ name: f.name, size: f.size, mime: f.type, kind }));
    onChange({ files: [...ans.files, ...metas] });
  };

  return (
    <div className={`rounded-xl border p-3.5 transition-colors ${err ? "border-red-300 bg-red-50/40" : outOfRange ? "border-amber-300 bg-amber-50/40" : "border-ink-100 bg-white hover:border-ink-200"}`}>
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[13px] font-black text-ink-800">{it.title}</p>
            {needValue && (it.min != null || it.max != null) && (
              <span className="text-[10px] font-bold text-ink-400 bg-ink-50 border border-ink-100 rounded-full px-2 py-0.5" dir="ltr">
                {faDigits(`${it.min ?? "—"} … ${it.max ?? "—"}`)} {it.unit}
              </span>
            )}
            {outOfRange && <Badge kind="warn">خارج از محدوده</Badge>}
            {ans.photos.length > 0 && <Badge kind="info">{faDigits(ans.photos.length)} عکس</Badge>}
            {ans.files.length > 0 && <Badge kind="neutral">{faDigits(ans.files.length)} فایل</Badge>}
          </div>
          {err && <p className="text-[10.5px] font-bold text-red-600 mt-1 flex items-center gap-1"><Icon name="alert" size={11} sw={2.4} />پاسخ این آیتم الزامی است</p>}
        </div>
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {needStatus && opts.map((o) => (
            <button key={o.id} onClick={() => onChange({ statusId: ans.statusId === o.id ? undefined : o.id })}
              className={`h-9 px-3.5 rounded-lg border text-xs font-black transition-all cursor-pointer ${ans.statusId === o.id ? KIND_STYLE[o.kind] : "bg-white border-ink-200 text-ink-500 hover:border-ink-400"}`}>
              <span dir="ltr">{o.short}</span> · {o.label}
            </button>
          ))}
          {needValue && (
            <div className="flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-2 h-9 focus-within:border-ember-400 focus-within:ring-2 focus-within:ring-ember-500/15">
              <input className="w-20 bg-transparent text-center text-sm font-black text-ink-900 outline-none" dir="ltr" inputMode="decimal" type="number" step="any"
                placeholder="—" value={ans.value} onChange={(e) => onChange({ value: e.target.value })} />
              {it.unit && <span className="text-[10.5px] font-bold text-ink-400 whitespace-nowrap">{it.unit}</span>}
            </div>
          )}
          <button onClick={() => onChange({ open: !ans.open })}
            className={`h-9 w-9 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${ans.open || ans.note || ans.files.length ? "border-ember-300 bg-ember-50 text-ember-600" : "border-ink-200 text-ink-400 hover:text-ink-700"}`}>
            <Icon name="chevD" size={15} className={`transition-transform ${ans.open ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {ans.open && (
        <div className="mt-3 pt-3 border-t border-dashed border-ink-100 anim-fade">
          <textarea className="input" rows={2} placeholder="توضیحات این آیتم (اختیاری)…" value={ans.note} onChange={(e) => onChange({ note: e.target.value })} />
          <div className="flex items-center gap-2 mt-2.5 flex-wrap">
            <label className="btn btn-sm btn-ghost cursor-pointer">
              <Icon name="camera" size={14} />ثبت عکس
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { addPhotos(e.target.files); e.target.value = ""; }} />
            </label>
            <label className="btn btn-sm btn-ghost cursor-pointer">
              <Icon name="video" size={14} />ویدئو
              <input type="file" accept="video/*" className="hidden" onChange={(e) => { addFiles(e.target.files, "video"); e.target.value = ""; }} />
            </label>
            <label className="btn btn-sm btn-ghost cursor-pointer">
              <Icon name="mic" size={14} />صوت
              <input type="file" accept="audio/*" className="hidden" onChange={(e) => { addFiles(e.target.files, "audio"); e.target.value = ""; }} />
            </label>
            <span className="text-[10px] text-ink-400 font-semibold">ویدئو/صوت در نسخه سرور آپلود می‌شود — متادیتا ثبت می‌گردد</span>
          </div>
          {ans.photos.length > 0 && (
            <div className="flex gap-2 mt-2.5 flex-wrap">
              {ans.photos.map((p, i) => (
                <div key={i} className="relative group">
                  <img src={p} alt="" className="w-16 h-16 object-cover rounded-lg border border-ink-100" />
                  <button onClick={() => onChange({ photos: ans.photos.filter((_, j) => j !== i) })}
                    className="absolute -top-1.5 -end-1.5 w-5 h-5 rounded-full bg-red-500 text-white items-center justify-center hidden group-hover:flex cursor-pointer">
                    <Icon name="x" size={10} sw={3} />
                  </button>
                </div>
              ))}
            </div>
          )}
          {ans.files.length > 0 && (
            <div className="flex gap-2 mt-2.5 flex-wrap">
              {ans.files.map((f, i) => (
                <span key={i} className="chip">
                  <Icon name={f.kind === "video" ? "video" : "mic"} size={12} />
                  <b className="max-w-32 truncate">{f.name}</b>
                  <span className="text-ink-400">{fmtSize(f.size)}</span>
                  <button onClick={() => onChange({ files: ans.files.filter((_, j) => j !== i) })} className="text-red-500 cursor-pointer"><Icon name="x" size={11} sw={2.6} /></button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function Inspection({ initialCode, go }: { initialCode?: string; go: (p: PageId) => void }) {
  const { db, me, saveRecord } = useStore();
  const toast = useToast();
  const [eqId, setEqId] = useState<string | null>(null);
  const [scanOpen, setScanOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [shift, setShift] = useState(() => detectShift(db.settings.shifts));
  const [geo, setGeo] = useState<{ st: "loading" | "done"; text: string }>({ st: "loading", text: "در حال دریافت موقعیت…" });
  const [showErr, setShowErr] = useState(false);
  const [saved, setSaved] = useState<InspectionRecord | null>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(iv);
  }, []);

  const eq = useMemo(() => db.equipment.find((e) => e.id === eqId) ?? null, [db.equipment, eqId]);

  useEffect(() => {
    if (initialCode) {
      const found = db.equipment.find((e) => e.code.toLowerCase() === initialCode.toLowerCase());
      if (found) setEqId(found.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCode]);

  useEffect(() => {
    setAnswers({}); setShowErr(false); setSaved(null);
    setShift(detectShift(db.settings.shifts));
    if (!eqId) return;
    setGeo({ st: "loading", text: "در حال دریافت موقعیت مکانی…" });
    let alive = true;
    const fallback = () => alive && setGeo({ st: "done", text: "موقعیت مکانی در دسترس نیست — موقعیت تجهیز ثبت می‌شود" });
    if (!navigator.geolocation) { fallback(); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => alive && setGeo({ st: "done", text: `مختصات ثبت شد: ${p.coords.latitude.toFixed(4)}, ${p.coords.longitude.toFixed(4)}` }),
      fallback,
      { timeout: 5000 },
    );
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eqId]);

  const onDecode = useCallback((text: string) => {
    const code = parseQr(text);
    const found = db.equipment.find((e) => e.code.toLowerCase() === code.toLowerCase());
    if (!found) { toast(`تجهیزی با کد «${faDigits(code)}» یافت نشد`, "error"); return; }
    setEqId(found.id);
    setScanOpen(false);
    toast(`تجهیز شناسایی شد: ${found.name}`, "info");
  }, [db.equipment, toast]);

  const form = useMemo(() => {
    if (!eq || !me) return { cls: [] as { name: string; checklist: Checklist; sections: ChecklistSection[] }[], items: [] as ChecklistItem[] };
    const cls = db.checklists.filter((c) => c.active && c.groupIds.includes(eq.groupId) && canAccessChecklist(me, c));
    const withSecs = cls.map((c) => ({ name: c.name, checklist: c, sections: visibleSections(me, c) }));
    const items = withSecs.flatMap((c) => c.sections.flatMap((s) => s.items.filter((i) => i.active)));
    return { cls: withSecs, items };
  }, [db.checklists, eq, me]);

  const setAns = (id: string, patch: Partial<Answer>) =>
    setAnswers((a) => ({ ...a, [id]: { ...(a[id] ?? emptyAns()), ...patch } }));

  const answeredCount = form.items.filter((it) => {
    const a = answers[it.id] ?? emptyAns();
    const okS = it.type === "number" || !!a.statusId;
    const okV = it.type === "status" || a.value.trim() !== "";
    return okS && okV;
  }).length;

  const doSave = () => {
    if (!eq || !me) return;
    if (answeredCount < form.items.length) {
      setShowErr(true);
      toast(`پاسخ همه آیتم‌ها الزامی است — ${faDigits(form.items.length - answeredCount)} آیتم بی‌پاسخ`, "error");
      return;
    }
    const cl0 = db.checklists.find((c) => c.active && c.groupIds.includes(eq.groupId));
    const g = db.groups.find((x) => x.id === eq.groupId);
    const items: RecordItem[] = [];
    for (const { sections } of form.cls) {
      for (const sec of sections) for (const it of sec.items.filter((i) => i.active)) {
        const a = answers[it.id] ?? emptyAns();
        items.push({
          itemId: it.id, sectionId: sec.id, sectionTitle: sec.title, itemTitle: it.title,
          type: it.type, unit: it.unit, min: it.min, max: it.max,
          statusId: a.statusId, value: a.value.trim() === "" ? null : Number(a.value),
          note: a.note.trim(), photos: a.photos, files: a.files,
        });
      }
    }
    const rec: InspectionRecord = {
      id: uid(), ts: Date.now(), dateKey: jKey(Date.now()), shift,
      technicianId: me.id, technicianName: me.fullName,
      equipmentId: eq.id, equipmentName: eq.name, equipmentCode: eq.code,
      groupId: eq.groupId, groupName: g?.name ?? "", checklistId: cl0?.id ?? "", checklistName: cl0?.name ?? "",
      location: geo.text.includes("مختصات") ? `${eq.location} (${geo.text.replace("مختصات ثبت شد: ", "")})` : eq.location,
      items, generalNote: "",
    };
    saveRecord(rec);
    setSaved(rec);
    setAnswers({});
    setShowErr(false);
    toast("بازدید با موفقیت ثبت شد", "ok");
  };

  /* ---------- فاز انتخاب تجهیز ---------- */
  if (!eq) {
    const todayKey = jKey(now.getTime());
    const startedShifts = Math.max(1, db.settings.shifts.filter((s) => shiftStarted(s, now)).length);
    const visibleEq = db.equipment
      .filter((e) => e.status !== "inactive")
      .filter((e) => !groupFilter || e.groupId === groupFilter)
      .filter((e) => !search || e.name.includes(search) || e.code.toLowerCase().includes(search.toLowerCase()));
    return (
      <div className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-3.5 anim-fade-up">
          <button onClick={() => setScanOpen(true)} className="card p-5 flex items-center gap-4 text-start hover:border-ember-300 hover:shadow-pop transition-all group cursor-pointer">
            <span className="w-14 h-14 rounded-xl bg-ember-500 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform"><Icon name="scan" size={27} /></span>
            <span>
              <p className="font-display text-xl text-ink-900">اسکن QR تجهیز</p>
              <p className="text-[11.5px] text-ink-400 font-semibold mt-0.5 leading-5">دوربین موبایل، تبلت یا بارکدخوان — تجهیز خودکار شناسایی می‌شود</p>
            </span>
          </button>
          <div className="card p-5 flex items-center gap-4">
            <span className="w-14 h-14 rounded-xl bg-ink-900 text-ember-400 flex items-center justify-center shrink-0"><Icon name="clipboard" size={25} /></span>
            <div className="flex-1">
              <p className="font-display text-xl text-ink-900">یا انتخاب از فهرست</p>
              <p className="text-[11.5px] text-ink-400 font-semibold mt-0.5">جستجو یا فیلتر بر اساس گروه تجهیز</p>
            </div>
          </div>
        </div>

        <div className="card p-4 anim-fade-up" style={{ animationDelay: "0.06s" }}>
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <div className="relative flex-1">
              <span className="absolute start-3 top-1/2 -translate-y-1/2 text-ink-400"><Icon name="search" size={16} /></span>
              <input className="input ps-9" placeholder="جستجوی نام یا کد تجهیز…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              <button className={`chip ${!groupFilter ? "chip-on" : ""}`} onClick={() => setGroupFilter(null)}>همه</button>
              {db.groups.filter((g) => g.active).map((g) => (
                <button key={g.id} className={`chip ${groupFilter === g.id ? "chip-on" : ""}`} onClick={() => setGroupFilter(groupFilter === g.id ? null : g.id)}>
                  {g.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-2.5 mt-4">
            {visibleEq.map((e) => {
              const g = db.groups.find((x) => x.id === e.groupId);
              const doneToday = db.records.filter((r) => r.equipmentId === e.id && r.dateKey === todayKey).length;
              const status = doneToday >= startedShifts ? "ok" : doneToday > 0 ? "warn" : "none";
              return (
                <button key={e.id} onClick={() => setEqId(e.id)}
                  className="flex items-center gap-3 rounded-xl border border-ink-100 bg-white p-3 hover:border-ember-300 hover:shadow-card transition-all text-start cursor-pointer">
                  {g && <GroupGlyph icon={g.icon} color={g.color} size={40} />}
                  <span className="flex-1 min-w-0">
                    <span className="block text-[12.5px] font-black text-ink-800 truncate">{e.name}</span>
                    <span className="block text-[10.5px] font-bold text-ink-400 mt-0.5" dir="ltr">{e.code}</span>
                  </span>
                  <span className="flex flex-col items-end gap-1">
                    <Badge kind={status === "ok" ? "ok" : status === "warn" ? "warn" : "neutral"} dot>
                      {status === "ok" ? "تکمیل" : status === "warn" ? `${faDigits(doneToday)} بازدید` : "بدون بازدید"}
                    </Badge>
                    {e.status === "repair" && <Badge kind="warn">در تعمیر</Badge>}
                    {e.status === "out" && <Badge kind="nok">خارج از سرویس</Badge>}
                  </span>
                </button>
              );
            })}
          </div>
          {visibleEq.length === 0 && <Empty icon="search" title="تجهیزی یافت نشد" desc="عبارت جستجو یا فیلتر گروه را تغییر دهید" />}
        </div>

        <Modal open={scanOpen} onClose={() => setScanOpen(false)} title="اسکن QR تجهیز" icon="scan">
          <Scanner onDecode={onDecode} />
        </Modal>
      </div>
    );
  }

  /* ---------- فاز موفقیت ---------- */
  if (saved) {
    const nokCount = saved.items.filter((i) => {
      const o = db.settings.statusOptions.find((x) => x.id === i.statusId);
      return o?.kind === "nok" || (i.value != null && ((i.min != null && i.value < i.min) || (i.max != null && i.value > i.max)));
    }).length;
    return (
      <div className="max-w-xl mx-auto card p-8 text-center anim-pop">
        <span className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${nokCount ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"}`}>
          <Icon name={nokCount ? "alert" : "check"} size={30} sw={2.4} />
        </span>
        <h2 className="font-display text-3xl text-ink-900 mt-4">بازدید ثبت شد</h2>
        <p className="text-sm text-ink-500 font-semibold mt-1.5">
          {saved.equipmentName} · شیفت {faDigits(saved.shift)} · {faDigits(timeStr(saved.ts))}
        </p>
        <div className="flex justify-center gap-6 mt-5">
          <div><p className="font-display text-3xl text-emerald-600">{faDigits(saved.items.length - nokCount)}</p><p className="text-[11px] font-bold text-ink-400">سالم</p></div>
          <div className="w-px bg-ink-100" />
          <div><p className="font-display text-3xl text-red-600">{faDigits(nokCount)}</p><p className="text-[11px] font-bold text-ink-400">معیوب</p></div>
        </div>
        {nokCount > 0 && (
          <p className="text-[11.5px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 mt-5 leading-6">
            اعلان خرابی برای مدیر سیستم و سرپرست نت ارسال شد (برنامه {db.settings.channels.sms ? "+ پیامک" : ""} {db.settings.channels.email ? "+ ایمیل" : ""})
          </p>
        )}
        <div className="flex gap-2.5 mt-6 justify-center">
          <button className="btn btn-primary" onClick={() => setEqId(null)}><Icon name="scan" size={16} />بازدید بعدی</button>
          <button className="btn btn-ghost" onClick={() => go("dashboard")}>داشبورد</button>
        </div>
      </div>
    );
  }

  /* ---------- فاز فرم ---------- */
  const g = db.groups.find((x) => x.id === eq.groupId);
  const recent = db.records.filter((r) => r.equipmentId === eq.id).slice(0, 4);
  return (
    <div className="space-y-4 pb-24">
      <div className="card p-4 anim-fade-up">
        <div className="flex items-center gap-3.5 flex-wrap">
          <button className="btn btn-sm btn-ghost" onClick={() => setEqId(null)}><Icon name="chevR" size={14} />تغییر تجهیز</button>
          {g && <GroupGlyph icon={g.icon} color={g.color} size={48} />}
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-2xl text-ink-900 leading-8">{eq.name}</h2>
            <p className="text-[11.5px] font-bold text-ink-400 flex items-center gap-3 flex-wrap mt-0.5">
              <span className="text-ember-600 font-mono" dir="ltr">{eq.code}</span>
              <span className="flex items-center gap-1"><Icon name="pin" size={12} />{eq.location}</span>
              <span>{g?.name}</span>
            </p>
          </div>
          <Badge kind={eq.status === "active" ? "ok" : eq.status === "repair" ? "warn" : "nok"} dot>
            {eq.status === "active" ? "فعال" : eq.status === "repair" ? "در تعمیر" : "خارج از سرویس"}
          </Badge>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4 pt-4 border-t border-ink-100">
          <div>
            <span className="label">تاریخ و ساعت</span>
            <p className="text-[13px] font-black text-ink-800">{jLong(now.getTime())} · <span className="font-display text-base">{timeStr(now.getTime())}</span></p>
          </div>
          <div>
            <span className="label">شیفت کاری</span>
            <Seg options={db.settings.shifts.map((s) => ({ id: String(s.id) as string, label: `${s.name} (${faDigits(s.start)}–${faDigits(s.end)})` }))}
              value={String(shift)} onChange={(v) => setShift(Number(v))} />
          </div>
          <div>
            <span className="label">تکنسین</span>
            <p className="text-[13px] font-black text-ink-800 flex items-center gap-1.5"><Icon name="user" size={14} className="text-ember-500" />{me?.fullName}</p>
          </div>
          <div>
            <span className="label">موقعیت ثبت</span>
            <p className={`text-[11.5px] font-bold ${geo.st === "loading" ? "text-ink-400" : "text-emerald-700"} flex items-center gap-1.5`}>
              <Icon name="pin" size={13} />{geo.text}
            </p>
          </div>
        </div>
      </div>

      {form.cls.length === 0 ? (
        <div className="card"><Empty icon="layers" title="چک‌لیستی برای این گروه تجهیز تعریف نشده" desc="مدیر سیستم باید چک‌لیست فعال با دسترسی شما به این گروه اختصاص دهد." /></div>
      ) : (
        form.cls.map((c) => (
          <div key={c.name} className="card p-4 anim-fade-up">
            <div className="flex items-center gap-2.5 mb-3.5">
              <span className="w-8 h-8 rounded-lg bg-ink-900 text-ember-400 flex items-center justify-center"><Icon name="layers" size={16} /></span>
              <div>
                <h3 className="font-display text-lg text-ink-900 leading-6">{c.name}</h3>
                <p className="text-[10.5px] font-bold text-ink-400">{faDigits(c.sections.length)} بخش · {faDigits(c.sections.reduce((a, s) => a + s.items.filter((i) => i.active).length, 0))} آیتم — بخش‌ها بر اساس سطح دسترسی شما نمایش داده می‌شوند</p>
              </div>
            </div>
            {c.sections.length === 0 && <p className="text-xs text-amber-700 font-bold bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">شما به بخش‌های این فرم دسترسی ندارید (دسترسی در تنظیمات چک‌لیست تعیین می‌شود).</p>}
            <div className="space-y-4">
              {c.sections.map((sec) => (
                <div key={sec.id}>
                  <p className="flex items-center gap-2 text-[12px] font-black text-ink-600 mb-2">
                    <span className="w-1 h-4 rounded-full bg-ember-500" />
                    {sec.title}
                    <span className="text-[10px] font-bold text-ink-300">({faDigits(sec.items.filter((i) => i.active).length)} آیتم)</span>
                  </p>
                  <div className="space-y-2">
                    {sec.items.filter((i) => i.active).map((it) => (
                      <ItemRow key={it.id} it={it} ans={answers[it.id] ?? emptyAns()} showErr={showErr} onChange={(p) => setAns(it.id, p)} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {recent.length > 0 && (
        <div className="card p-4 anim-fade-up">
          <p className="font-display text-base text-ink-900 mb-2">آخرین بازدیدهای این تجهیز</p>
          <div className="divide-y divide-ink-50">
            {recent.map((r) => {
              const bad = r.items.filter((i) => {
                const o = db.settings.statusOptions.find((x) => x.id === i.statusId);
                return o?.kind === "nok" || (i.value != null && ((i.min != null && i.value < i.min) || (i.max != null && i.value > i.max)));
              }).length;
              return (
                <div key={r.id} className="flex items-center gap-3 py-2">
                  <Badge kind="neutral">شیفت {faDigits(r.shift)}</Badge>
                  <span className="text-[11.5px] font-bold text-ink-600 flex-1 truncate">{r.technicianName}</span>
                  <span className="text-[10.5px] font-bold text-ink-400">{jLong(r.ts)} · {timeStr(r.ts)}</span>
                  <Badge kind={bad ? "nok" : "ok"} dot>{bad ? `${faDigits(bad)} خرابی` : "سالم"}</Badge>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* نوار ثبت شناور */}
      <div className="fixed bottom-4 inset-x-4 lg:inset-x-auto lg:start-[268px] lg:end-7 z-40 no-print">
        <div className="card px-4 py-3 flex items-center gap-3 shadow-pop">
          <div className="flex-1">
            <p className="text-[11px] font-black text-ink-600 mb-1">پیشرفت تکمیل فرم — {faDigits(answeredCount)} از {faDigits(form.items.length)} آیتم</p>
            <div className="h-1.5 rounded-full bg-ink-100 overflow-hidden">
              <div className="h-full rounded-full bg-ember-500 transition-all duration-500" style={{ width: `${form.items.length ? (answeredCount / form.items.length) * 100 : 0}%` }} />
            </div>
          </div>
          <button className="btn btn-primary h-11 px-6" onClick={doSave} disabled={form.items.length === 0}>
            <Icon name="check" size={17} sw={2.4} />
            ثبت نهایی بازدید
          </button>
        </div>
      </div>
    </div>
  );
}
