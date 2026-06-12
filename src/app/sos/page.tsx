"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { addEvent } from "@/lib/db";
import { todayStr } from "@/lib/calc";

const TRIGGERS = ["壓力", "無聊", "累了想補體力", "真的餓", "習慣/路過"];

export default function SosPage() {
  const router = useRouter();
  const [step, setStep] = useState<"water" | "timer" | "check">("water");
  const [secondsLeft, setSecondsLeft] = useState(10 * 60);
  const [trigger, setTrigger] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (step !== "timer") return;
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) { clearInterval(t); setStep("check"); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [step]);

  async function finish(resisted: boolean) {
    setSaving(true);
    const hour = new Date().getHours();
    try {
      await addEvent("craving", todayStr(), { trigger, resisted, hour });
    } catch {}
    router.push(resisted ? "/?sos=win" : "/");
  }

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <main className="flex min-h-[70vh] flex-col justify-center space-y-6 text-center">
      {step === "water" && (
        <>
          <div className="text-6xl">🥛</div>
          <h1 className="font-display text-2xl font-bold text-green">先喝一大杯水</h1>
          <p className="mx-auto max-w-xs text-sm leading-relaxed text-muted">
            渴望是一波浪，通常 10–15 分鐘就退。<br />
            你在吃美舒鬱，甜食渴望會被放大——<br />
            <span className="font-bold text-ink">這是藥物反應，不是你意志力差。</span>
          </p>
          <button
            onClick={() => setStep("timer")}
            className="card mx-auto w-full max-w-xs bg-green p-4 font-display text-lg font-bold text-card active:scale-[0.98]"
          >
            喝了，開始 10 分鐘
          </button>
          <button onClick={() => setStep("check")} className="text-xs text-muted underline">
            跳過計時
          </button>
        </>
      )}

      {step === "timer" && (
        <>
          <h1 className="font-display text-xl font-bold text-green">起身走一走</h1>
          <div className="font-display text-7xl font-bold tabular-nums text-ink">{mm}:{ss}</div>
          <p className="mx-auto max-w-xs text-sm leading-relaxed text-muted">
            離開現場最有效：樓下繞一圈、倒個水、找件需要專注的小事。
            15 分鐘的走路被證實能直接壓低對甜食的渴望。
          </p>
          <button onClick={() => setStep("check")} className="text-xs text-muted underline">
            提早結束
          </button>
        </>
      )}

      {step === "check" && (
        <>
          <h1 className="font-display text-2xl font-bold text-green">現在感覺怎麼樣？</h1>
          <div className="space-y-2 px-2">
            <div className="mb-1 text-xs text-muted">剛剛是什麼引起的？</div>
            <div className="flex flex-wrap justify-center gap-2">
              {TRIGGERS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTrigger(t)}
                  className={`rounded-full border px-4 py-2 text-sm ${
                    trigger === t ? "border-green bg-green text-card" : "border-[#d8cdb6] bg-card"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2 px-2 pt-2">
            <button
              onClick={() => finish(true)}
              disabled={saving}
              className="card w-full bg-green p-4 font-display text-lg font-bold text-card active:scale-[0.98]"
            >
              退了，不吃了 💪
            </button>
            <button
              onClick={() => finish(false)}
              disabled={saving}
              className="card w-full p-4 text-sm text-muted active:scale-[0.98]"
            >
              還是想吃——記下來就好，記了就是贏一半
            </button>
          </div>
          <p className="text-[11px] text-muted">兩個按鈕都會記錄。資料會幫你找出嘴饞的時間規律。</p>
        </>
      )}
    </main>
  );
}
