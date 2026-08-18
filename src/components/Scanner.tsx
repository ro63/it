import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { Icon } from "./icons";

/** اسکنر QR با دوربین + ورود دستی (سازگار با بارکدخوان‌های USB) */
export function Scanner({ onDecode }: { onDecode: (text: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const decodeRef = useRef(onDecode);
  decodeRef.current = onDecode;
  const [cam, setCam] = useState<"starting" | "live" | "error">("starting");
  const [errMsg, setErrMsg] = useState("");
  const [manual, setManual] = useState("");

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;
    let raf = 0;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        const v = videoRef.current;
        if (!v) return;
        v.srcObject = stream;
        await v.play();
        if (cancelled) return;
        setCam("live");
        const tick = () => {
          const video = videoRef.current, canvas = canvasRef.current;
          if (video && canvas && video.readyState >= 2 && video.videoWidth > 0) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext("2d", { willReadFrequently: true });
            if (ctx) {
              ctx.drawImage(video, 0, 0);
              const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const code = jsQR(img.data, img.width, img.height);
              if (code && code.data) { decodeRef.current(code.data); return; }
            }
          }
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      } catch {
        if (!cancelled) { setCam("error"); setErrMsg("دسترسی به دوربین ممکن نشد. کد تجهیز را دستی وارد کنید یا از بارکدخوان استفاده کنید."); }
      }
    })();
    return () => { cancelled = true; cancelAnimationFrame(raf); stream?.getTracks().forEach((t) => t.stop()); };
  }, []);

  return (
    <div>
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-ink-950">
        <video ref={videoRef} playsInline muted className={`absolute inset-0 w-full h-full object-cover ${cam === "live" ? "opacity-100" : "opacity-0"}`} />
        <canvas ref={canvasRef} className="hidden" />
        {cam === "starting" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-ink-300">
            <span className="w-9 h-9 rounded-full border-2 border-ink-600 border-t-ember-500 animate-spin" />
            <p className="text-xs font-semibold">در حال دسترسی به دوربین…</p>
          </div>
        )}
        {cam === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-ink-300 px-8 text-center">
            <span className="text-amber-400"><Icon name="alert" size={30} sw={1.5} /></span>
            <p className="text-xs font-semibold leading-6">{errMsg}</p>
          </div>
        )}
        {cam === "live" && (
          <>
            <div className="absolute inset-8 pointer-events-none">
              {["top-0 start-0 border-t-2 border-s-2", "top-0 end-0 border-t-2 border-e-2", "bottom-0 start-0 border-b-2 border-s-2", "bottom-0 end-0 border-b-2 border-e-2"].map((c) => (
                <span key={c} className={`absolute w-7 h-7 border-ember-400 rounded-sm ${c}`} />
              ))}
              <span className="absolute inset-x-2 h-0.5 rounded bg-ember-400/90 shadow-[0_0_14px_2px_rgba(234,138,48,0.8)]" style={{ animation: "scanline 2.6s ease-in-out infinite" }} />
            </div>
            <p className="absolute bottom-2.5 inset-x-0 text-center text-[11px] font-semibold text-white/85">QR تجهیز را مقابل دوربین بگیرید</p>
          </>
        )}
      </div>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => { e.preventDefault(); const v = manual.trim(); if (v) { decodeRef.current(v); setManual(""); } }}
      >
        <input className="input" dir="ltr" placeholder="یا کد تجهیز را وارد کنید…  (مثل PRS-1500)" value={manual} onChange={(e) => setManual(e.target.value)} />
        <button className="btn btn-dark shrink-0" type="submit" disabled={!manual.trim()}>
          <Icon name="check" size={16} />
          ثبت
        </button>
      </form>
      <p className="text-[11px] text-ink-400 mt-2 flex items-center gap-1.5">
        <Icon name="scan" size={13} />
        با بارکدخوان‌های USB نیز می‌توانید مستقیم داخل فیلد بالا اسکن کنید
      </p>
    </div>
  );
}

/** پیشوند استاندارد QR تجهیزات NIPCO */
export function qrPayload(code: string): string {
  return `NIPCO-EQ:${code}`;
}

export function parseQr(text: string): string {
  return text.replace(/^.*?NIPCO-EQ:/i, "").trim();
}
