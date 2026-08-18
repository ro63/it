import { useState } from "react";
import { GroupGlyph, Icon } from "../components/icons";
import { Badge, Confirm, Empty, Field, Modal, Toggle, useToast } from "../components/ui";
import { useStore } from "../lib/store";
import type { Checklist, ChecklistItem, ChecklistSection, ItemType, Role } from "../lib/types";
import { faDigits, ROLE_LABELS, uid } from "../lib/utils";

const TYPE_LABELS: Record<ItemType, string> = { status: "فقط وضعیت (OK/NOK)", number: "فقط عددی", both: "وضعیت + عدد" };
const ROLES: Role[] = ["admin", "supervisor", "technician", "viewer"];

function newItem(): ChecklistItem {
  return { id: uid(), title: "", type: "status", unit: "", min: null, max: null, active: true };
}
function newSection(): ChecklistSection {
  return { id: uid(), title: "بخش جدید", active: true, allowedUserIds: [], allowedRoles: [], items: [newItem()] };
}

export function ChecklistsPage() {
  const { db, me, saveChecklist, deleteChecklist } = useStore();
  const toast = useToast();
  const canEdit = me?.role === "admin" || me?.role === "supervisor";

  const [draft, setDraft] = useState<Checklist | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [del, setDel] = useState<Checklist | null>(null);
  const [openSec, setOpenSec] = useState<string | null>(null);

  const startNew = () => {
    const c: Checklist = { id: uid(), name: "", groupIds: [db.groups[0]?.id ?? ""], active: true, sections: [newSection()] };
    setDraft(c); setIsNew(true); setOpenSec(c.sections[0].id);
  };
  const startEdit = (c: Checklist) => { setDraft(JSON.parse(JSON.stringify(c)) as Checklist); setIsNew(false); setOpenSec(c.sections[0]?.id ?? null); };

  const patchSec = (sid: string, patch: Partial<ChecklistSection>) =>
    setDraft((d) => d && ({ ...d, sections: d.sections.map((s) => (s.id === sid ? { ...s, ...patch } : s)) }));
  const patchItem = (sid: string, iid: string, patch: Partial<ChecklistItem>) =>
    setDraft((d) => d && ({
      ...d,
      sections: d.sections.map((s) => s.id === sid ? { ...s, items: s.items.map((i) => (i.id === iid ? { ...i, ...patch } : i)) } : s),
    }));
  const moveItem = (sid: string, iid: string, dir: -1 | 1) =>
    setDraft((d) => {
      if (!d) return d;
      return {
        ...d,
        sections: d.sections.map((s) => {
          if (s.id !== sid) return s;
          const idx = s.items.findIndex((i) => i.id === iid);
          const j = idx + dir;
          if (idx < 0 || j < 0 || j >= s.items.length) return s;
          const items = [...s.items];
          [items[idx], items[j]] = [items[j], items[idx]];
          return { ...s, items };
        }),
      };
    });

  const save = () => {
    if (!draft) return;
    if (!draft.name.trim()) { toast("نام چک‌لیست الزامی است", "error"); return; }
    if (draft.groupIds.length === 0) { toast("حداقل یک گروه تجهیز انتخاب کنید", "error"); return; }
    const clean: Checklist = {
      ...draft,
      sections: draft.sections.filter((s) => s.title.trim()).map((s) => ({ ...s, items: s.items.filter((i) => i.title.trim()) })),
    };
    if (clean.sections.length === 0) { toast("حداقل یک بخش با عنوان و یک آیتم تعریف کنید", "error"); return; }
    saveChecklist(clean, isNew);
    toast(isNew ? "چک‌لیست ایجاد شد" : "چک‌لیست ذخیره شد", "ok");
    setDraft(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap anim-fade-up">
        <p className="text-[12.5px] font-bold text-ink-500 leading-6 max-w-2xl">
          فرم‌های کنترل روزانه کاملاً داینامیک هستند؛ آیتم‌ها را اضافه، حذف یا غیرفعال کنید،
          به گروه‌های تجهیز اختصاص دهید و برای هر بخش <b className="text-ink-800">سطح دسترسی جداگانه</b> تعیین کنید —
          مثلاً فقط گروه برق، بخش «برق و سنسورها» را ببیند و تکمیل کند.
        </p>
        {canEdit && <button className="btn btn-primary shrink-0" onClick={startNew}><Icon name="plus" size={16} />چک‌لیست جدید</button>}
      </div>

      <div className="grid md:grid-cols-2 gap-3.5 stagger">
        {db.checklists.map((c) => {
          const items = c.sections.reduce((a, s) => a + s.items.filter((i) => i.active).length, 0);
          const restricted = c.sections.filter((s) => s.allowedUserIds.length > 0 || s.allowedRoles.length > 0).length;
          return (
            <div key={c.id} className={`card p-4 hover:shadow-pop transition-all duration-300 ${!c.active ? "opacity-60" : ""}`}>
              <div className="flex items-start gap-3">
                <span className="w-11 h-11 rounded-xl bg-ink-900 text-ember-400 flex items-center justify-center shrink-0"><Icon name="layers" size={21} /></span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-lg text-ink-900 leading-6 truncate">{c.name}</h3>
                    <Badge kind={c.active ? "ok" : "neutral"} dot>{c.active ? "فعال" : "غیرفعال"}</Badge>
                  </div>
                  <p className="text-[11px] font-bold text-ink-400 mt-0.5">
                    {faDigits(c.sections.length)} بخش · {faDigits(items)} آیتم فعال
                    {restricted > 0 && <span className="text-ember-600"> · {faDigits(restricted)} بخش با دسترسی محدود</span>}
                  </p>
                </div>
                {canEdit && (
                  <div className="flex flex-col items-end gap-2">
                    <Toggle on={c.active} onChange={(v) => { saveChecklist({ ...c, active: v }, false); toast(v ? "چک‌لیست فعال شد" : "چک‌لیست غیرفعال شد", "info"); }} />
                    <div className="flex gap-1">
                      <button className="w-8 h-8 rounded-md border border-ink-200 flex items-center justify-center text-ink-500 hover:border-ink-400 cursor-pointer" onClick={() => startEdit(c)}><Icon name="pen" size={14} /></button>
                      <button className="w-8 h-8 rounded-md border border-red-200 flex items-center justify-center text-red-500 hover:bg-red-50 cursor-pointer" onClick={() => setDel(c)}><Icon name="trash" size={14} /></button>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-1.5 flex-wrap mt-3">
                {c.groupIds.map((gid) => {
                  const g = db.groups.find((x) => x.id === gid);
                  if (!g) return null;
                  return (
                    <span key={gid} className="chip cursor-default" style={{ borderColor: g.color + "55", color: g.color, background: g.color + "0d" }}>
                      <GroupGlyph icon={g.icon} color={g.color} size={18} />
                      {g.name}
                    </span>
                  );
                })}
              </div>
              <div className="mt-3 pt-3 border-t border-ink-50 space-y-1">
                {c.sections.map((s) => (
                  <p key={s.id} className="flex items-center gap-2 text-[11.5px] font-bold text-ink-500">
                    <span className={`w-1.5 h-1.5 rounded-full ${s.active ? "bg-emerald-500" : "bg-ink-300"}`} />
                    {s.title}
                    <span className="text-ink-300">— {faDigits(s.items.filter((i) => i.active).length)} آیتم</span>
                    {(s.allowedUserIds.length > 0 || s.allowedRoles.length > 0) && (
                      <span className="ms-auto flex items-center gap-1 text-ember-600"><Icon name="lock" size={11} />دسترسی محدود</span>
                    )}
                  </p>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {db.checklists.length === 0 && <div className="card"><Empty icon="layers" title="چک‌لیستی تعریف نشده" desc="اولین فرم کنترل روزانه را بسازید." /></div>}

      {/* سازنده فرم */}
      <Modal open={!!draft} onClose={() => setDraft(null)} title={isNew ? "چک‌لیست جدید" : "ویرایش چک‌لیست"} icon="layers" w="max-w-3xl"
        footer={<>
          <button className="btn btn-ghost" onClick={() => setDraft(null)}>انصراف</button>
          <button className="btn btn-primary" onClick={save}><Icon name="check" size={16} />ذخیره چک‌لیست</button>
        </>}>
        {draft && (
          <div className="space-y-5">
            <div className="grid sm:grid-cols-[1fr_auto] gap-4 items-start">
              <Field label="نام فرم / چک‌لیست"><input className="input" placeholder="کنترل روزانه …" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></Field>
              <div className="flex items-center gap-2.5 pt-6">
                <span className="text-[11.5px] font-black text-ink-600">فعال</span>
                <Toggle on={draft.active} onChange={(v) => setDraft({ ...draft, active: v })} />
              </div>
            </div>

            <Field label="اختصاص به گروه‌های تجهیز" hint="این فرم هنگام اسکن QR هر تجهیزِ این گروه‌ها باز می‌شود">
              <div className="flex gap-1.5 flex-wrap">
                {db.groups.map((g) => {
                  const on = draft.groupIds.includes(g.id);
                  return (
                    <button key={g.id} className={`chip ${on ? "chip-on" : ""}`}
                      onClick={() => setDraft({ ...draft, groupIds: on ? draft.groupIds.filter((x) => x !== g.id) : [...draft.groupIds, g.id] })}>
                      <GroupGlyph icon={g.icon} color={g.color} size={18} />
                      {g.name}
                    </button>
                  );
                })}
              </div>
            </Field>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-display text-lg text-ink-900">بخش‌های فرم</h4>
                <button className="btn btn-sm btn-dark" onClick={() => { const s = newSection(); setDraft({ ...draft, sections: [...draft.sections, s] }); setOpenSec(s.id); }}>
                  <Icon name="plus" size={13} />افزودن بخش
                </button>
              </div>

              {draft.sections.map((sec, si) => (
                <div key={sec.id} className="rounded-xl border border-ink-100 bg-ink-50/50 overflow-hidden">
                  <div className="flex items-center gap-2.5 p-3 bg-white border-b border-ink-100">
                    <span className="w-7 h-7 rounded-md bg-ink-900 text-ember-400 font-display text-sm flex items-center justify-center shrink-0">{faDigits(si + 1)}</span>
                    <input className="input h-9 font-black" value={sec.title} placeholder="عنوان بخش (مثلاً برق و سنسورها)"
                      onChange={(e) => patchSec(sec.id, { title: e.target.value })} />
                    <Toggle on={sec.active} onChange={(v) => patchSec(sec.id, { active: v })} />
                    <button className="w-8 h-8 rounded-md border border-ink-200 flex items-center justify-center text-ink-500 hover:border-ink-400 cursor-pointer"
                      onClick={() => setOpenSec(openSec === sec.id ? null : sec.id)}>
                      <Icon name="chevD" size={14} className={`transition-transform ${openSec === sec.id ? "rotate-180" : ""}`} />
                    </button>
                    <button className="w-8 h-8 rounded-md border border-red-200 text-red-500 flex items-center justify-center hover:bg-red-50 cursor-pointer"
                      onClick={() => setDraft({ ...draft, sections: draft.sections.filter((x) => x.id !== sec.id) })}>
                      <Icon name="trash" size={14} />
                    </button>
                  </div>

                  {openSec === sec.id && (
                    <div className="p-3.5 space-y-4 anim-fade">
                      {/* دسترسی بخش */}
                      <div className="rounded-lg border border-ember-200 bg-ember-50/60 p-3">
                        <p className="text-[11.5px] font-black text-ember-800 flex items-center gap-1.5 mb-2">
                          <Icon name="lock" size={13} />
                          دسترسی این بخش — چه کسانی این بخش را ببینند و تکمیل کنند؟
                        </p>
                        <div className="flex gap-1.5 flex-wrap mb-2">
                          {ROLES.map((r) => {
                            const on = sec.allowedRoles.includes(r);
                            return (
                              <button key={r} className={`chip ${on ? "chip-on" : ""}`}
                                onClick={() => patchSec(sec.id, { allowedRoles: on ? sec.allowedRoles.filter((x) => x !== r) : [...sec.allowedRoles, r] })}>
                                {ROLE_LABELS[r]}
                              </button>
                            );
                          })}
                        </div>
                        <p className="text-[10.5px] font-bold text-ink-500 mb-1.5">یا کاربران مشخص:</p>
                        <div className="flex gap-1.5 flex-wrap">
                          {db.users.filter((u) => u.active).map((u) => {
                            const on = sec.allowedUserIds.includes(u.id);
                            return (
                              <button key={u.id} className={`chip ${on ? "chip-on" : ""}`}
                                onClick={() => patchSec(sec.id, { allowedUserIds: on ? sec.allowedUserIds.filter((x) => x !== u.id) : [...sec.allowedUserIds, u.id] })}>
                                <Icon name="user" size={11} />{u.fullName}
                              </button>
                            );
                          })}
                        </div>
                        <p className="text-[10px] text-ink-400 font-semibold mt-2">اگر هیچ نقش/کاربری انتخاب نشود، بخش برای همه کاربرانِ مجاز به فرم قابل دسترس است.</p>
                      </div>

                      {/* آیتم‌ها */}
                      <div className="space-y-2">
                        {sec.items.map((it, ii) => (
                          <div key={it.id} className={`rounded-lg border bg-white p-2.5 ${it.active ? "border-ink-100" : "border-ink-100 opacity-50"}`}>
                            <div className="flex items-center gap-2">
                              <span className="text-[10.5px] font-black text-ink-300 w-5 text-center shrink-0">{faDigits(ii + 1)}</span>
                              <input className="input h-9 text-[12.5px] font-bold" placeholder="عنوان آیتم — مثلاً بررسی فشار سیستم" value={it.title}
                                onChange={(e) => patchItem(sec.id, it.id, { title: e.target.value })} />
                              <select className="input h-9 w-40 shrink-0 text-[11.5px] font-bold" value={it.type}
                                onChange={(e) => patchItem(sec.id, it.id, { type: e.target.value as ItemType })}>
                                {(Object.keys(TYPE_LABELS) as ItemType[]).map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                              </select>
                              <button className="w-8 h-8 shrink-0 rounded-md border border-ink-200 text-ink-500 flex items-center justify-center hover:border-ink-400 cursor-pointer disabled:opacity-30" disabled={ii === 0} onClick={() => moveItem(sec.id, it.id, -1)}><Icon name="up" size={13} /></button>
                              <button className="w-8 h-8 shrink-0 rounded-md border border-ink-200 text-ink-500 flex items-center justify-center hover:border-ink-400 cursor-pointer disabled:opacity-30" disabled={ii === sec.items.length - 1} onClick={() => moveItem(sec.id, it.id, 1)}><Icon name="down" size={13} /></button>
                              <Toggle on={it.active} onChange={(v) => patchItem(sec.id, it.id, { active: v })} />
                              <button className="w-8 h-8 shrink-0 rounded-md border border-red-200 text-red-500 flex items-center justify-center hover:bg-red-50 cursor-pointer"
                                onClick={() => patchSec(sec.id, { items: sec.items.filter((x) => x.id !== it.id) })}>
                                <Icon name="trash" size={13} />
                              </button>
                            </div>
                            {it.type !== "status" && (
                              <div className="flex items-center gap-2 mt-2 ms-7 flex-wrap">
                                <input className="input h-8 w-24 text-[11.5px]" placeholder="واحد (بار)" value={it.unit ?? ""} onChange={(e) => patchItem(sec.id, it.id, { unit: e.target.value })} />
                                <span className="text-[10.5px] font-bold text-ink-400">محدوده مجاز:</span>
                                <input className="input h-8 w-20 text-[11.5px] text-center" dir="ltr" type="number" step="any" placeholder="حداقل"
                                  value={it.min ?? ""} onChange={(e) => patchItem(sec.id, it.id, { min: e.target.value === "" ? null : Number(e.target.value) })} />
                                <span className="text-ink-300 font-black">—</span>
                                <input className="input h-8 w-20 text-[11.5px] text-center" dir="ltr" type="number" step="any" placeholder="حداکثر"
                                  value={it.max ?? ""} onChange={(e) => patchItem(sec.id, it.id, { max: e.target.value === "" ? null : Number(e.target.value) })} />
                                <span className="text-[10px] text-ink-400 font-semibold">عدد خارج از محدوده = هشدار/خرابی</span>
                              </div>
                            )}
                          </div>
                        ))}
                        <button className="btn btn-sm btn-ghost w-full" onClick={() => patchSec(sec.id, { items: [...sec.items, newItem()] })}>
                          <Icon name="plus" size={13} />افزودن آیتم به این بخش
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <p className="text-[11px] font-bold text-ink-400 flex items-center gap-1.5 bg-ink-50 border border-ink-100 rounded-lg px-3 py-2.5">
              <Icon name="info" size={14} className="text-sky-500" />
              گزینه‌های وضعیت فرم (OK/NOK و…) در بخش «سیستم و اعلان‌ها ← گزینه‌های وضعیت» قابل گسترش هستند.
            </p>
          </div>
        )}
      </Modal>

      <Confirm open={!!del} onClose={() => setDel(null)} title="حذف چک‌لیست"
        body={`چک‌لیست «${del?.name}» حذف شود؟ سوابق ثبت‌شده‌ی قبلی حفظ می‌مانند.`}
        onYes={() => { if (del) { deleteChecklist(del.id); toast("چک‌لیست حذف شد", "ok"); } }} />
    </div>
  );
}
