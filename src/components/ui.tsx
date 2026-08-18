import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Icon, type IconName } from "./icons";

/* ---------- Toast ---------- */
type ToastKind = "ok" | "error" | "info" | "warn";
interface ToastItem { id: number; msg: string; kind: ToastKind }
const ToastCtx = createContext<(msg: string, kind?: ToastKind) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const seq = useRef(0);
  const push = (msg: string, kind: ToastKind = "ok") => {
    const id = ++seq.current;
    setItems((l) => [...l, { id, msg, kind }]);
    setTimeout(() => setItems((l) => l.filter((t) => t.id !== id)), 3800);
  };
  const icons: Record<ToastKind, IconName> = { ok: "check", error: "alert", info: "info", warn: "alert" };
  const colors: Record<ToastKind, string> = {
    ok: "bg-ink-900 text-emerald-300 border-emerald-500/30",
    error: "bg-ink-900 text-red-300 border-red-500/30",
    info: "bg-ink-900 text-sky-300 border-sky-500/30",
    warn: "bg-ink-900 text-amber-300 border-amber-500/30",
  };
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed bottom-4 start-4 z-[90] flex flex-col gap-2 max-w-[92vw]">
        {items.map((t) => (
          <div key={t.id} className={`anim-pop flex items-center gap-2.5 rounded-lg border px-4 py-2.5 text-sm font-semibold shadow-pop ${colors[t.kind]}`}>
            <span className="shrink-0"><Icon name={icons[t.kind]} size={17} sw={2.2} /></span>
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* ---------- Modal ---------- */
export function Modal({ open, onClose, title, icon, children, footer, w = "max-w-lg" }: {
  open: boolean; onClose: () => void; title: string; icon?: IconName; children: ReactNode; footer?: ReactNode; w?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", h); document.body.style.overflow = ""; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-6">
      <div className="absolute inset-0 bg-ink-950/60 anim-fade" onClick={onClose} />
      <div className={`relative card anim-pop w-full ${w} max-h-[92vh] flex flex-col rounded-b-none sm:rounded-b-[0.85rem]`}>
        <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-ink-100 shrink-0">
          {icon && <span className="text-ember-500"><Icon name={icon} size={19} /></span>}
          <h3 className="font-display text-lg leading-7 text-ink-900 flex-1">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-md flex items-center justify-center text-ink-400 hover:bg-ink-50 hover:text-ink-700 transition-colors cursor-pointer">
            <Icon name="x" size={17} sw={2.2} />
          </button>
        </div>
        <div className="p-5 overflow-y-auto grow">{children}</div>
        {footer && <div className="px-5 py-3.5 border-t border-ink-100 flex items-center gap-2 justify-end shrink-0">{footer}</div>}
      </div>
    </div>
  );
}

export function Confirm({ open, onClose, onYes, title, body, yesLabel = "بله، حذف شود" }: {
  open: boolean; onClose: () => void; onYes: () => void; title: string; body: string; yesLabel?: string;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} icon="alert" w="max-w-sm"
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>انصراف</button>
        <button className="btn" style={{ background: "#c73e34", color: "#fff" }} onClick={() => { onYes(); onClose(); }}>{yesLabel}</button>
      </>}>
      <p className="text-sm text-ink-600 leading-7">{body}</p>
    </Modal>
  );
}

/* ---------- Badge ---------- */
const BADGE: Record<string, string> = {
  ok: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warn: "bg-amber-50 text-amber-700 border-amber-200",
  nok: "bg-red-50 text-red-700 border-red-200",
  info: "bg-sky-50 text-sky-700 border-sky-200",
  neutral: "bg-ink-50 text-ink-500 border-ink-200",
  dark: "bg-ink-900 text-ink-100 border-ink-700",
  ember: "bg-ember-50 text-ember-700 border-ember-200",
};
export function Badge({ kind = "neutral", children, dot }: { kind?: string; children: ReactNode; dot?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold whitespace-nowrap ${BADGE[kind] ?? BADGE.neutral}`}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

/* ---------- Toggle ---------- */
export function Toggle({ on, onChange, disabled }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button type="button" disabled={disabled} onClick={() => onChange(!on)}
      className={`relative w-10 h-[22px] rounded-full transition-colors duration-200 shrink-0 cursor-pointer disabled:opacity-40 ${on ? "bg-emerald-500" : "bg-ink-200"}`}
      aria-pressed={on}>
      <span className={`absolute top-[3px] start-[3px] w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${on ? "-translate-x-[18px]" : ""}`} />
    </button>
  );
}

/* ---------- Field ---------- */
export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div>
      <span className="label">{label}</span>
      {children}
      {hint && <p className="text-[11px] text-ink-400 mt-1">{hint}</p>}
    </div>
  );
}

/* ---------- Segmented ---------- */
export function Seg<T extends string>({ options, value, onChange }: {
  options: { id: T; label: string; icon?: IconName }[]; value: T; onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-ink-200 bg-white p-0.5 gap-0.5">
      {options.map((o) => (
        <button key={o.id} onClick={() => onChange(o.id)}
          className={`flex items-center gap-1.5 rounded-md px-3 h-8 text-xs font-bold transition-all cursor-pointer ${value === o.id ? "bg-ink-900 text-white shadow-sm" : "text-ink-500 hover:text-ink-800 hover:bg-ink-50"}`}>
          {o.icon && <Icon name={o.icon} size={14} />}
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- Empty ---------- */
export function Empty({ icon = "box", title, desc }: { icon?: IconName; title: string; desc?: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4">
      <div className="w-14 h-14 rounded-2xl bg-ink-50 border border-ink-100 flex items-center justify-center text-ink-300 mb-3">
        <Icon name={icon} size={26} sw={1.5} />
      </div>
      <p className="font-display text-lg text-ink-700">{title}</p>
      {desc && <p className="text-xs text-ink-400 mt-1 max-w-xs leading-6">{desc}</p>}
    </div>
  );
}

/* ---------- Progress ---------- */
export function Bar({ value, color = "var(--color-ember-500)", h = 7 }: { value: number; color?: string; h?: number }) {
  return (
    <div className="w-full rounded-full bg-ink-100 overflow-hidden" style={{ height: h }}>
      <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color }} />
    </div>
  );
}

export function Dot({ color, pulse }: { color: string; pulse?: boolean }) {
  return <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${pulse ? "animate-pulse" : ""}`} style={{ background: color, animationDuration: "1.6s" }} />;
}
