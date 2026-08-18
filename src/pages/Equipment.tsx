import { useMemo, useState } from "react";
import QRCode from "react-qr-code";
import { GROUP_COLORS, GroupGlyph, ICON_CHOICES, Icon, type IconName } from "../components/icons";
import { qrPayload } from "../components/Scanner";
import { Badge, Confirm, Field, Modal, Toggle, useToast } from "../components/ui";
import { roleAtLeast, useStore } from "../lib/store";
import type { Equipment, EquipmentGroup, EqStatus } from "../lib/types";
import { compressImage, EQ_STATUS_LABELS, faDigits, uid } from "../lib/utils";

const STATUS_KIND: Record<EqStatus, string> = { active: "ok", inactive: "neutral", repair: "warn", out: "nok" };

export function EquipmentPage() {
  const { db, me, saveGroup, deleteGroup, saveEquipment, deleteEquipment } = useStore();
  const toast = useToast();
  const canEdit = roleAtLeast(me, "supervisor");

  const [selGroup, setSelGroup] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [gModal, setGModal] = useState<EquipmentGroup | null>(null);
  const [gNew, setGNew] = useState(false);
  const [eModal, setEModal] = useState<Equipment | null>(null);
  const [eNew, setENew] = useState(false);
  const [qrEq, setQrEq] = useState<Equipment | null>(null);
  const [del, setDel] = useState<{ type: "g" | "e"; id: string; name: string } | null>(null);

  const list = useMemo(() => db.equipment
    .filter((e) => !selGroup || e.groupId === selGroup)
    .filter((e) => !search || e.name.includes(search) || e.code.toLowerCase().includes(search.toLowerCase())),
    [db.equipment, selGroup, search]);

  const openNewGroup = () => { setGModal({ id: uid(), name: "", icon: ICON_CHOICES[6], color: GROUP_COLORS[0], active: true }); setGNew(true); };
  const openNewEq = () => {
    setEModal({ id: uid(), code: "", name: "", groupId: selGroup ?? db.groups[0]?.id ?? "", location: "", status: "active", commissionDate: "" });
    setENew(true);
  };

  return (
    <div className="grid lg:grid-cols-[290px_1fr] gap-4 items-start">
      {/* گروه‌ها */}
      <div className="card p-4 lg:sticky lg:top-24 anim-fade-up">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-lg text-ink-900">گروه‌های تجهیز</h3>
          {canEdit && (
            <button className="btn btn-sm btn-dark" onClick={openNewGroup}><Icon name="plus" size={14} />گروه جدید</button>
          )}
        </div>
        <div className="space-y-1.5">
          <button onClick={() => setSelGroup(null)}
            className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[12.5px] font-black transition-colors cursor-pointer ${!selGroup ? "bg-ink-900 text-white" : "text-ink-600 hover:bg-ink-50"}`}>
            <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${!selGroup ? "bg-white/10 text-ember-400" : "bg-ink-50 text-ink-400"}`}><Icon name="box" size={16} /></span>
            همه تجهیزات
            <span className="ms-auto text-[11px] font-bold opacity-70">{faDigits(db.equipment.length)}</span>
          </button>
          {db.groups.map((g) => {
            const count = db.equipment.filter((e) => e.groupId === g.id).length;
            const active = selGroup === g.id;
            return (
              <div key={g.id} className={`group flex items-center gap-2.5 rounded-lg px-3 py-2.5 transition-colors cursor-pointer ${active ? "bg-ink-900 text-white" : "hover:bg-ink-50"}`}
                onClick={() => setSelGroup(active ? null : g.id)}>
                <GroupGlyph icon={g.icon} color={g.color} size={32} />
                <div className="flex-1 min-w-0">
                  <p className={`text-[12.5px] font-black truncate ${active ? "text-white" : "text-ink-700"}`}>{g.name}</p>
                  <p className={`text-[10px] font-bold ${active ? "text-ink-300" : "text-ink-400"}`}>{faDigits(count)} تجهیز {!g.active && "· غیرفعال"}</p>
                </div>
                {canEdit && (
                  <span className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    <button className={`w-7 h-7 rounded-md flex items-center justify-center cursor-pointer ${active ? "text-ink-300 hover:bg-white/10" : "text-ink-400 hover:bg-ink-100"}`} onClick={() => { setGModal({ ...g }); setGNew(false); }} title="ویرایش"><Icon name="pen" size={13} /></button>
                    <button className={`w-7 h-7 rounded-md flex items-center justify-center cursor-pointer ${active ? "text-ink-300 hover:bg-white/10" : "text-ink-400 hover:bg-red-50 hover:text-red-500"}`} onClick={() => setDel({ type: "g", id: g.id, name: g.name })} title="حذف"><Icon name="trash" size={13} /></button>
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-[10.5px] text-ink-400 font-semibold leading-5 mt-4 pt-3 border-t border-ink-100">
          گروه‌ها مبنای اختصاص چک‌لیست و گزارش‌گیری هستند. تجهیزات جدید را می‌توانید به هر گروه اضافه کنید.
        </p>
      </div>

      {/* تجهیزات */}
      <div className="space-y-3.5 min-w-0">
        <div className="card p-4 flex flex-col sm:flex-row gap-3 sm:items-center anim-fade-up" style={{ animationDelay: "0.05s" }}>
          <div className="relative flex-1">
            <span className="absolute start-3 top-1/2 -translate-y-1/2 text-ink-400"><Icon name="search" size={16} /></span>
            <input className="input ps-9" placeholder="جستجوی نام یا کد…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          {canEdit && <button className="btn btn-primary shrink-0" onClick={openNewEq}><Icon name="plus" size={16} />ثبت تجهیز جدید</button>}
        </div>

        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3 stagger">
          {list.map((e) => {
            const g = db.groups.find((x) => x.id === e.groupId);
            return (
              <div key={e.id} className="card overflow-hidden group hover:shadow-pop transition-all duration-300">
                <div className="h-24 relative overflow-hidden" style={{ background: `${g?.color ?? "#5b7085"}18` }}>
                  <div className="absolute inset-0 opacity-[0.35]" style={{ backgroundImage: `repeating-linear-gradient(-45deg, ${g?.color ?? "#5b7085"}22 0 10px, transparent 10px 20px)` }} />
                  {e.image ? (
                    <img src={e.image} alt={e.name} className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center" style={{ color: g?.color ?? "#5b7085" }}>
                      <Icon name={(g?.icon ?? "box") as IconName} size={52} sw={1.3} />
                    </span>
                  )}
                  <span className="absolute top-2.5 start-2.5"><Badge kind={STATUS_KIND[e.status]} dot>{EQ_STATUS_LABELS[e.status]}</Badge></span>
                </div>
                <div className="p-3.5">
                  <p className="text-[13.5px] font-black text-ink-900 truncate">{e.name}</p>
                  <p className="text-[10.5px] font-bold text-ink-400 flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-ember-600 font-mono text-[11px]" dir="ltr">{e.code}</span>
                    <span className="flex items-center gap-1"><Icon name="pin" size={11} />{e.location || "—"}</span>
                  </p>
                  <p className="text-[10.5px] font-bold text-ink-400 mt-1 flex items-center gap-1"><Icon name="calendar" size={11} />بهره‌برداری: {e.commissionDate || "—"}</p>
                  <div className="flex gap-1.5 mt-3">
                    <button className="btn btn-sm btn-dark flex-1" onClick={() => setQrEq(e)}><Icon name="qr" size={13} />QR Code</button>
                    {canEdit && (
                      <>
                        <button className="btn btn-sm btn-ghost" onClick={() => { setEModal({ ...e }); setENew(false); }} title="ویرایش"><Icon name="pen" size={13} /></button>
                        <button className="btn btn-sm btn-danger" onClick={() => setDel({ type: "e", id: e.id, name: e.name })} title="حذف"><Icon name="trash" size={13} /></button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {list.length === 0 && <div className="card"><div className="p-4"><p className="text-center text-sm text-ink-400 font-bold py-8">تجهیزی مطابق جستجو یافت نشد</p></div></div>}
      </div>

      {/* مودال گروه */}
      <Modal open={!!gModal} onClose={() => setGModal(null)} title={gNew ? "گروه تجهیز جدید" : "ویرایش گروه تجهیز"} icon="box"
        footer={<>
          <button className="btn btn-ghost" onClick={() => setGModal(null)}>انصراف</button>
          <button className="btn btn-primary" onClick={() => {
            if (!gModal) return;
            if (!gModal.name.trim()) { toast("نام گروه الزامی است", "error"); return; }
            saveGroup(gModal, gNew);
            toast(gNew ? "گروه اضافه شد" : "گروه ویرایش شد", "ok");
            setGModal(null);
          }}><Icon name="check" size={16} />ذخیره</button>
        </>}>
        {gModal && (
          <div className="space-y-4">
            <Field label="نام گروه"><input className="input" placeholder="مثلاً: خطوط مونتاژ" value={gModal.name} onChange={(e) => setGModal({ ...gModal, name: e.target.value })} /></Field>
            <Field label="آیکون گروه">
              <div className="flex gap-2 flex-wrap">
                {ICON_CHOICES.map((ic) => (
                  <button key={ic} onClick={() => setGModal({ ...gModal, icon: ic })}
                    className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${gModal.icon === ic ? "border-ember-500 bg-ember-50 text-ember-600" : "border-ink-200 text-ink-400 hover:border-ink-400"}`}>
                    <Icon name={ic} size={19} />
                  </button>
                ))}
              </div>
            </Field>
            <Field label="رنگ گروه">
              <div className="flex gap-2 flex-wrap">
                {GROUP_COLORS.map((c) => (
                  <button key={c} onClick={() => setGModal({ ...gModal, color: c })}
                    className={`w-8 h-8 rounded-full transition-transform cursor-pointer ${gModal.color === c ? "scale-110 ring-2 ring-offset-2 ring-ink-400" : "hover:scale-110"}`}
                    style={{ background: c }} />
                ))}
              </div>
            </Field>
            <div className="flex items-center justify-between rounded-lg border border-ink-100 bg-ink-50 px-3.5 py-3">
              <div>
                <p className="text-[12.5px] font-black text-ink-800">گروه فعال</p>
                <p className="text-[10.5px] text-ink-400 font-semibold">گروه‌های غیرفعال در فرم‌ها نمایش داده نمی‌شوند</p>
              </div>
              <Toggle on={gModal.active} onChange={(v) => setGModal({ ...gModal, active: v })} />
            </div>
          </div>
        )}
      </Modal>

      {/* مودال تجهیز */}
      <Modal open={!!eModal} onClose={() => setEModal(null)} title={eNew ? "ثبت تجهیز جدید" : "ویرایش تجهیز"} icon="wrench" w="max-w-xl"
        footer={<>
          <button className="btn btn-ghost" onClick={() => setEModal(null)}>انصراف</button>
          <button className="btn btn-primary" onClick={() => {
            if (!eModal) return;
            if (!eModal.code.trim() || !eModal.name.trim()) { toast("کد و نام تجهیز الزامی است", "error"); return; }
            saveEquipment(eModal, eNew);
            toast(eNew ? "تجهیز اضافه شد — QR Code آماده چاپ است" : "تجهیز ویرایش شد", "ok");
            setEModal(null);
          }}><Icon name="check" size={16} />ذخیره</button>
        </>}>
        {eModal && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="کد تجهیز (مقدار QR)"><input className="input font-mono" dir="ltr" placeholder="PRS-2500" value={eModal.code} onChange={(e) => setEModal({ ...eModal, code: e.target.value.toUpperCase() })} /></Field>
              <Field label="گروه تجهیز">
                <select className="input" value={eModal.groupId} onChange={(e) => setEModal({ ...eModal, groupId: e.target.value })}>
                  {db.groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </Field>
            </div>
            <Field label="نام تجهیز"><input className="input" placeholder="پرس هیدرولیک ۲۵۰۰ تن" value={eModal.name} onChange={(e) => setEModal({ ...eModal, name: e.target.value })} /></Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="محل استقرار"><input className="input" placeholder="سالن پرسکاری — دهانه ۷" value={eModal.location} onChange={(e) => setEModal({ ...eModal, location: e.target.value })} /></Field>
              <Field label="تاریخ بهره‌برداری (شمسی)"><input className="input" dir="ltr" placeholder="۱۴۰۲/۰۵/۱۰" value={eModal.commissionDate} onChange={(e) => setEModal({ ...eModal, commissionDate: e.target.value })} /></Field>
            </div>
            <Field label="وضعیت تجهیز">
              <div className="flex gap-1.5 flex-wrap">
                {(Object.keys(EQ_STATUS_LABELS) as EqStatus[]).map((st) => (
                  <button key={st} className={`chip ${eModal.status === st ? "chip-on" : ""}`} onClick={() => setEModal({ ...eModal, status: st })}>{EQ_STATUS_LABELS[st]}</button>
                ))}
              </div>
            </Field>
            <Field label="تصویر تجهیز" hint="تصویر به‌صورت فشرده در پایگاه داده محلی ذخیره می‌شود">
              <div className="flex items-center gap-3">
                <label className="btn btn-ghost cursor-pointer">
                  <Icon name="image" size={15} />انتخاب تصویر
                  <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (f && eModal) {
                      try { setEModal({ ...eModal, image: await compressImage(f, 640, 0.7) }); } catch { toast("خطا در خواندن تصویر", "error"); }
                    }
                    e.target.value = "";
                  }} />
                </label>
                {eModal.image ? (
                  <span className="relative">
                    <img src={eModal.image} alt="" className="w-14 h-14 object-cover rounded-lg border border-ink-100" />
                    <button className="absolute -top-1.5 -end-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center cursor-pointer" onClick={() => setEModal({ ...eModal, image: undefined })}><Icon name="x" size={10} sw={3} /></button>
                  </span>
                ) : <span className="text-[11px] text-ink-400 font-semibold">بدون تصویر — آیکون گروه نمایش داده می‌شود</span>}
              </div>
            </Field>
          </div>
        )}
      </Modal>

      {/* مودال QR */}
      <Modal open={!!qrEq} onClose={() => setQrEq(null)} title="QR Code تجهیز" icon="qr" w="max-w-md"
        footer={<>
          <button className="btn btn-ghost no-print" onClick={() => setQrEq(null)}>بستن</button>
          <button className="btn btn-primary no-print" onClick={() => window.print()}><Icon name="printer" size={16} />چاپ برچسب</button>
        </>}>
        {qrEq && (
          <div className="print-area text-center">
            <p className="hidden print:block font-black text-sm mb-2">شرکت صنایع قطعه‌سازی خودرو NIPCO — واحد نت</p>
            <div className="inline-block p-5 rounded-2xl border-2 border-ink-900 bg-white">
              <QRCode value={qrPayload(qrEq.code)} size={190} fgColor="#151c24" bgColor="#ffffff" />
            </div>
            <p className="font-display text-xl text-ink-900 mt-3">{qrEq.name}</p>
            <p className="font-mono font-black text-ember-600 mt-0.5" dir="ltr">{qrPayload(qrEq.code)}</p>
            <p className="text-[11px] font-bold text-ink-400 mt-1.5 flex items-center justify-center gap-1.5">
              <Icon name="pin" size={12} />{qrEq.location || "—"}
            </p>
            <p className="hidden print:block text-[10px] font-bold text-ink-500 mt-2">با اسکن این کد، فرم کنترل روزانه تجهیز باز می‌شود</p>
          </div>
        )}
      </Modal>

      <Confirm open={!!del} onClose={() => setDel(null)} title={del?.type === "g" ? "حذف گروه تجهیز" : "حذف تجهیز"}
        body={del?.type === "g"
          ? `گروه «${del?.name}» حذف شود؟ گروهی که دارای تجهیز باشد حذف نمی‌شود.`
          : `تجهیز «${del?.name}» برای همیشه حذف شود؟ سوابق بازدید آن حفظ می‌ماند.`}
        onYes={() => {
          if (!del) return;
          if (del.type === "g") {
            const res = deleteGroup(del.id);
            toast(res.msg, res.ok ? "ok" : "error");
            if (res.ok && selGroup === del.id) setSelGroup(null);
          } else {
            deleteEquipment(del.id);
            toast("تجهیز حذف شد", "ok");
          }
        }} />
    </div>
  );
}
