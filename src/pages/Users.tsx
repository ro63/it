import { useState } from "react";
import { Icon } from "../components/icons";
import { Badge, Field, Modal, Toggle, useToast } from "../components/ui";
import { useStore } from "../lib/store";
import type { Role, User } from "../lib/types";
import { faDigits, hashPass, ROLE_LABELS, uid } from "../lib/utils";

const ROLE_KIND: Record<Role, string> = { admin: "ember", supervisor: "info", technician: "ok", viewer: "neutral" };

export function UsersPage() {
  const { db, me, saveUser } = useStore();
  const toast = useToast();
  const [draft, setDraft] = useState<User | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [pw, setPw] = useState("");

  const startNew = () => {
    setDraft({ id: uid(), fullName: "", personnelCode: "", username: "", passwordHash: "", mobile: "", role: "technician", active: true, allowedChecklistIds: [], allowedSectionIds: [] });
    setIsNew(true); setPw("");
  };
  const startEdit = (u: User) => { setDraft({ ...u }); setIsNew(false); setPw(""); };

  const allSections = db.checklists.flatMap((c) => c.sections.map((s) => ({ id: s.id, label: `${c.name} / ${s.title}` })));

  const save = () => {
    if (!draft) return;
    if (!draft.fullName.trim() || !draft.username.trim() || !draft.personnelCode.trim()) { toast("نام، کد پرسنلی و نام کاربری الزامی است", "error"); return; }
    if (db.users.some((u) => u.username.toLowerCase() === draft.username.toLowerCase() && u.id !== draft.id)) { toast("این نام کاربری قبلاً ثبت شده است", "error"); return; }
    if (isNew && pw.length < 4) { toast("رمز عبور باید حداقل ۴ کاراکتر باشد", "error"); return; }
    const final: User = { ...draft, passwordHash: isNew ? hashPass(pw) : pw ? hashPass(pw) : draft.passwordHash };
    saveUser(final, isNew);
    toast(isNew ? "کاربر ایجاد شد" : "کاربر ویرایش شد", "ok");
    setDraft(null);
  };

  const toggleList = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3 anim-fade-up">
        <p className="text-[12.5px] font-bold text-ink-500 leading-6 max-w-2xl">
          علاوه بر نقش کلی، برای هر کاربر می‌توانید <b className="text-ink-800">دسترسی به فرم‌های مشخص</b> و حتی
          <b className="text-ink-800"> بخش‌های خاصی از فرم</b> تعریف کنید (مثلاً گروه برق فقط بخش‌های الکتریکی).
        </p>
        <button className="btn btn-primary shrink-0" onClick={startNew}><Icon name="plus" size={16} />کاربر جدید</button>
      </div>

      <div className="card overflow-hidden anim-fade-up" style={{ animationDelay: "0.05s" }}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[760px]">
            <thead>
              <tr>
                <th className="th">کاربر</th><th className="th">کد پرسنلی</th><th className="th">نام کاربری</th><th className="th">موبایل</th>
                <th className="th">نقش</th><th className="th">دسترسی فرم/بخش</th><th className="th">وضعیت</th><th className="th"></th>
              </tr>
            </thead>
            <tbody>
              {db.users.map((u) => (
                <tr key={u.id} className={`hover:bg-ink-50/60 transition-colors ${!u.active ? "opacity-55" : ""}`}>
                  <td className="td">
                    <div className="flex items-center gap-2.5">
                      <span className="w-9 h-9 rounded-lg bg-ink-900 text-ember-400 font-display text-base flex items-center justify-center shrink-0">{u.fullName.replace(" ", "").slice(0, 2)}</span>
                      <span className="font-black text-ink-800">{u.fullName}</span>
                    </div>
                  </td>
                  <td className="td font-mono font-bold text-ink-500" dir="ltr">{faDigits(u.personnelCode)}</td>
                  <td className="td font-mono text-ink-600" dir="ltr">{u.username}</td>
                  <td className="td font-mono text-ink-500" dir="ltr">{faDigits(u.mobile)}</td>
                  <td className="td"><Badge kind={ROLE_KIND[u.role]}>{ROLE_LABELS[u.role]}</Badge></td>
                  <td className="td text-[11px] font-bold text-ink-500">
                    {u.role === "admin" || u.role === "supervisor" ? "همه فرم‌ها و بخش‌ها" : (
                      <>
                        {u.allowedChecklistIds.length ? `${faDigits(u.allowedChecklistIds.length)} فرم` : "همه فرم‌ها"}
                        {" · "}
                        {u.allowedSectionIds.length ? `${faDigits(u.allowedSectionIds.length)} بخش خاص` : "همه بخش‌ها"}
                      </>
                    )}
                  </td>
                  <td className="td">
                    <div className="flex items-center gap-2">
                      <Toggle on={u.active} onChange={(v) => { saveUser({ ...u, active: v }, false); toast(v ? "کاربر فعال شد" : "کاربر غیرفعال شد", v ? "ok" : "warn"); }} />
                      <Badge kind={u.active ? "ok" : "neutral"} dot>{u.active ? "فعال" : "غیرفعال"}</Badge>
                    </div>
                  </td>
                  <td className="td">
                    <button className="btn btn-sm btn-ghost" onClick={() => startEdit(u)}><Icon name="pen" size={13} />ویرایش</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!draft} onClose={() => setDraft(null)} title={isNew ? "افزودن کاربر جدید" : `ویرایش — ${draft?.fullName}`} icon="users" w="max-w-2xl"
        footer={<>
          <button className="btn btn-ghost" onClick={() => setDraft(null)}>انصراف</button>
          <button className="btn btn-primary" onClick={save}><Icon name="check" size={16} />ذخیره کاربر</button>
        </>}>
        {draft && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="نام و نام خانوادگی"><input className="input" value={draft.fullName} onChange={(e) => setDraft({ ...draft, fullName: e.target.value })} placeholder="فردین عظمیان" /></Field>
              <Field label="کد پرسنلی"><input className="input font-mono" dir="ltr" value={draft.personnelCode} onChange={(e) => setDraft({ ...draft, personnelCode: e.target.value })} placeholder="1010" /></Field>
              <Field label="نام کاربری"><input className="input font-mono" dir="ltr" value={draft.username} onChange={(e) => setDraft({ ...draft, username: e.target.value.toLowerCase().trim() })} placeholder="f.azamian" /></Field>
              <Field label="شماره موبایل"><input className="input font-mono" dir="ltr" value={draft.mobile} onChange={(e) => setDraft({ ...draft, mobile: e.target.value })} placeholder="0913-…" /></Field>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="سطح دسترسی (نقش)">
                <select className="input" value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value as Role })}>
                  {(Object.keys(ROLE_LABELS) as Role[]).map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                </select>
              </Field>
              <Field label={isNew ? "رمز عبور" : "رمز عبور جدید (اختیاری)"} hint={isNew ? "رمز به‌صورت رمزنگاری‌شده ذخیره می‌شود" : "برای تغییر، رمز جدید وارد کنید — خالی یعنی بدون تغییر"}>
                <input className="input font-mono" dir="ltr" type="text" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••" />
              </Field>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-ink-100 bg-ink-50 px-3.5 py-3">
              <div>
                <p className="text-[12.5px] font-black text-ink-800">حساب فعال</p>
                <p className="text-[10.5px] text-ink-400 font-semibold">کاربران غیرفعال نمی‌توانند وارد سامانه شوند</p>
              </div>
              <Toggle on={draft.active} onChange={(v) => setDraft({ ...draft, active: v })} />
            </div>

            {(draft.role === "technician" || draft.role === "viewer") && (
              <>
                <Field label="دسترسی به فرم‌ها (چک‌لیست‌ها)" hint="خالی = دسترسی به همه فرم‌های فعال">
                  <div className="flex gap-1.5 flex-wrap">
                    {db.checklists.map((c) => (
                      <button key={c.id} className={`chip ${draft.allowedChecklistIds.includes(c.id) ? "chip-on" : ""}`}
                        onClick={() => setDraft({ ...draft, allowedChecklistIds: toggleList(draft.allowedChecklistIds, c.id) })}>
                        <Icon name="layers" size={11} />{c.name}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="دسترسی به بخش‌های خاص فرم‌ها" hint="مثلاً فقط بخش‌های الکتریکی — خالی = همه بخش‌های فرم‌های مجاز">
                  <div className="flex gap-1.5 flex-wrap">
                    {allSections.map((s) => (
                      <button key={s.id} className={`chip ${draft.allowedSectionIds.includes(s.id) ? "chip-on" : ""}`}
                        onClick={() => setDraft({ ...draft, allowedSectionIds: toggleList(draft.allowedSectionIds, s.id) })}>
                        <Icon name="lock" size={11} />{s.label}
                      </button>
                    ))}
                  </div>
                </Field>
              </>
            )}
            {(draft.role === "admin" || draft.role === "supervisor") && (
              <p className="text-[11px] font-bold text-sky-700 bg-sky-50 border border-sky-200 rounded-lg px-3 py-2.5 flex items-center gap-1.5">
                <Icon name="info" size={14} />این نقش به‌صورت پیش‌فرض به همه فرم‌ها و بخش‌ها دسترسی کامل دارد.
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
