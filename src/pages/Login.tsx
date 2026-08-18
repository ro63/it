import { useCallback, useState } from "react";
import { DEMO_ACCOUNTS } from "../lib/seed";
import { useStore } from "../lib/store";
import type { Equipment } from "../lib/types";
import { faDigits, ROLE_LABELS } from "../lib/utils";
import { GroupGlyph, Icon, NipcoLogo } from "../components/icons";
import { Scanner, parseQr } from "../components/Scanner";
import { Seg, useToast } from "../components/ui";

const HERO_IMG = "https://image.qwenlm.ai/generated-images/f3203668-ad97-4736-af52-a1a3ba5126bb/_result.png";

export function Login({ onDone }: { onDone: (eqCode?: string) => void }) {
  const { db, login } = useStore();
  const toast = useToast();
  const [tab, setTab] = useState<"login" | "qr">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [qrEq, setQrEq] = useState<Equipment | null>(null);
  const [qrUser, setQrUser] = useState("");
  const [qrPass, setQrPass] = useState("");

  const doLogin = (u: string, p: string, eqCode?: string) => {
    setBusy(true);
    setTimeout(() => {
      const res = login(u, p);
      setBusy(false);
      if (res.ok) { toast(res.msg, "ok"); onDone(eqCode); }
      else { setErr(res.msg); toast(res.msg, "error"); }
    }, 350);
  };

  const onDecode = useCallback((text: string) => {
    const code = parseQr(text);
    const eq = db.equipment.find((e) => e.code.toLowerCase() === code.toLowerCase());
    if (!eq) { toast(`تجهیزی با کد «${faDigits(code)}» یافت نشد`, "error"); return; }
    setQrEq(eq);
    toast(`تجهیز شناسایی شد: ${eq.name}`, "info");
  }, [db.equipment, toast]);

  const group = qrEq ? db.groups.find((g) => g.id === qrEq.groupId) : null;

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[1.15fr_1fr]">
      {/* پنل تصویری */}
      <div className="relative hidden lg:flex flex-col justify-end overflow-hidden bg-ink-950 p-10">
        <img src={HERO_IMG} alt="سالن تولید NIPCO" className="absolute inset-0 w-full h-full object-cover opacity-75" onError={(e) => (e.currentTarget.style.display = "none")} />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/45 to-ink-950/15" />
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-ink-950/80 to-transparent" />
        <div className="absolute top-8 start-10 flex items-center gap-3">
          <NipcoLogo size={46} />
          <div>
            <p className="text-white font-black text-lg tracking-[0.25em]" dir="ltr">NIPCO</p>
            <p className="text-ink-300 text-[11px] font-semibold">صنایع قطعه‌سازی خودرو</p>
          </div>
        </div>
        <div className="relative anim-fade-up">
          <p className="text-ember-400 text-xs font-black tracking-widest mb-3">واحد نگهداری و تعمیرات</p>
          <h1 className="font-display text-[3.3rem] leading-[1.15] text-white max-w-xl">
            سامانه کنترل روزانه تجهیزات
          </h1>
          <p className="text-ink-200 text-sm leading-8 mt-4 max-w-lg">
            اسکن QR تجهیز، ثبت چک‌لیست‌های داینامیک در سه شیفت کاری، ثبت مقادیر فشار و دما،
            عکس و توضیحات — و گزارش‌گیری لحظه‌ای از وضعیت پرس‌ها، ربات‌ها، کمپرسورها، لیفتراک‌ها و موتورخانه.
          </p>
          <div className="flex flex-wrap gap-2 mt-6">
            {["اسکن QR با دوربین و بارکدخوان", "چک‌لیست داینامیک با دسترسی سطحی", "خروجی Excel و PDF", "قابل نصب روی موبایل و تبلت"].map((f) => (
              <span key={f} className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-ink-100 backdrop-blur-sm">
                <span className="text-ember-400"><Icon name="check" size={12} sw={2.6} /></span>
                {f}
              </span>
            ))}
          </div>
        </div>
        <p className="relative mt-8 pt-5 border-t border-white/10 text-[11px] font-semibold text-ink-400">
          تحلیل و طراحی سیستم: <span className="text-ink-100">محمد روشندل</span>
        </p>
      </div>

      {/* پنل ورود */}
      <div className="flex items-center justify-center p-5 sm:p-8 min-h-screen">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-7 justify-center">
            <NipcoLogo size={52} />
            <div>
              <p className="font-black text-lg tracking-[0.25em] text-ink-900" dir="ltr">NIPCO</p>
              <p className="text-ink-500 text-[11px] font-bold">سامانه کنترل روزانه تجهیزات</p>
            </div>
          </div>

          <div className="anim-fade-up">
            <Seg
              options={[{ id: "login" as const, label: "ورود با حساب کاربری", icon: "lock" as const }, { id: "qr" as const, label: "ورود با اسکن QR", icon: "qr" as const }]}
              value={tab} onChange={(t) => { setTab(t); setErr(""); }}
            />
          </div>

          <div className="card p-6 mt-4 anim-fade-up" style={{ animationDelay: "0.06s" }}>
            {tab === "login" ? (
              <form onSubmit={(e) => { e.preventDefault(); setErr(""); doLogin(username, password); }}>
                <h2 className="font-display text-2xl text-ink-900">ورود به سامانه</h2>
                <p className="text-xs text-ink-400 mt-0.5 mb-5">برای ثبت و مشاهده بازدیدهای روزانه وارد شوید</p>
                <div className="space-y-4">
                  <div>
                    <span className="label">نام کاربری</span>
                    <input className="input" dir="ltr" autoComplete="username" placeholder="j.takhti" value={username} onChange={(e) => setUsername(e.target.value)} required />
                  </div>
                  <div>
                    <span className="label">رمز عبور</span>
                    <div className="relative">
                      <input className="input pe-10" dir="ltr" type={showPw ? "text" : "password"} autoComplete="current-password" placeholder="••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                      <button type="button" onClick={() => setShowPw(!showPw)} className="absolute end-2.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700 cursor-pointer">
                        <Icon name="eye" size={17} />
                      </button>
                    </div>
                  </div>
                  {err && (
                    <p className="flex items-center gap-2 text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                      <Icon name="alert" size={14} sw={2.2} />{err}
                    </p>
                  )}
                  <button className="btn btn-primary w-full h-11 text-[15px]" disabled={busy}>
                    {busy ? <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" /> : <Icon name="logout" size={17} className="-scale-x-100" />}
                    {busy ? "در حال احراز هویت…" : "ورود"}
                  </button>
                </div>
              </form>
            ) : !qrEq ? (
              <div>
                <h2 className="font-display text-2xl text-ink-900">اسکن QR تجهیز</h2>
                <p className="text-xs text-ink-400 mt-0.5 mb-4">ابتدا QR دستگاه را اسکن کنید؛ سپس با حساب خود وارد شوید تا بازدید ثبت گردد.</p>
                <Scanner onDecode={onDecode} />
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); setErr(""); doLogin(qrUser, qrPass, qrEq.code); }}>
                <div className="flex items-center gap-3 rounded-xl border border-ink-100 bg-ink-50 p-3.5">
                  {group && <GroupGlyph icon={group.icon} color={group.color} size={46} />}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-ink-900 truncate">{qrEq.name}</p>
                    <p className="text-[11px] text-ink-500 mt-0.5 flex items-center gap-2">
                      <span className="font-mono font-bold text-ember-600" dir="ltr">{qrEq.code}</span>
                      <span className="flex items-center gap-1"><Icon name="pin" size={11} />{qrEq.location}</span>
                    </p>
                  </div>
                  <span className="text-emerald-500"><Icon name="check" size={20} sw={2.4} /></span>
                </div>
                <div className="space-y-4 mt-4">
                  <div>
                    <span className="label">نام کاربری تکنسین</span>
                    <input className="input" dir="ltr" placeholder="f.azamian" value={qrUser} onChange={(e) => setQrUser(e.target.value)} required />
                  </div>
                  <div>
                    <span className="label">رمز عبور</span>
                    <input className="input" dir="ltr" type="password" value={qrPass} onChange={(e) => setQrPass(e.target.value)} required />
                  </div>
                  {err && (
                    <p className="flex items-center gap-2 text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                      <Icon name="alert" size={14} sw={2.2} />{err}
                    </p>
                  )}
                  <button className="btn btn-primary w-full h-11 text-[15px]" disabled={busy}>
                    {busy ? <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" /> : <Icon name="clipboard" size={17} />}
                    {busy ? "در حال ورود…" : "ورود و شروع بازدید"}
                  </button>
                  <button type="button" className="btn btn-ghost w-full" onClick={() => setQrEq(null)}>اسکن تجهیز دیگر</button>
                </div>
              </form>
            )}
          </div>

          <div className="card p-4 mt-4 anim-fade-up" style={{ animationDelay: "0.12s" }}>
            <p className="text-[11px] font-bold text-ink-500 mb-2.5 flex items-center gap-1.5">
              <Icon name="users" size={13} />
              حساب‌های نمونه — رمز عبور همه: <b className="text-ember-600" dir="ltr">{faDigits("1234")}</b>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {DEMO_ACCOUNTS.map((a) => (
                <button key={a.username} className="chip hover:border-ember-400 hover:text-ember-700" onClick={() => { setTab("login"); setErr(""); doLogin(a.username, "1234"); }}>
                  <span className="font-bold text-ink-800">{a.label}</span>
                  <span className="text-ink-400">·</span>
                  <span>{a.role}</span>
                </button>
              ))}
            </div>
          </div>

          <p className="text-center text-[11px] text-ink-400 mt-5 leading-6">
            {faDigits("NIPCO")} — واحد نت · نسخه {faDigits("1.0")} · PWA
          </p>
        </div>
      </div>
    </div>
  );
}
