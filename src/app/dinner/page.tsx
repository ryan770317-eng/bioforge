"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSetting, listEvents, setSetting, upsertDaily } from "@/lib/db";
import { todayStr } from "@/lib/calc";
import { DINNER_PRESETS } from "@/lib/profile";

export default function DinnerPage() {
  const router = useRouter();
  const today = todayStr();
  const [presets, setPresets] = useState<string[]>(DINNER_PRESETS);
  const [current, setCurrent] = useState<string | null>(null);
  const [custom, setCustom] = useState("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string[]>([]);

  useEffect(() => {
    let on = true;
    (async () => {
      try {
        const saved = await getSetting<string[]>("dinner_presets");
        if (on && saved?.length) setPresets(saved);
        const evs = await listEvents("dinner_plan", today, today);
        const choice = (evs[0]?.data as { choice?: string })?.choice;
        if (on && choice) setCurrent(choice);
      } catch {}
    })();
    return () => { on = false; };
  }, [today]);

  async function choose(choice: string) {
    if (!choice.trim()) return;
    await upsertDaily("dinner_plan", today, { choice: choice.trim() });
    setCurrent(choice.trim());
    setTimeout(() => router.push("/"), 400);
  }

  async function savePresets() {
    const cleaned = draft.map((p) => p.trim()).filter(Boolean);
    if (cleaned.length) {
      await setSetting("dinner_presets", cleaned);
      setPresets(cleaned);
    }
    setEditing(false);
  }

  return (
    <main className="space-y-4">
      <header className="pt-2">
        <h1 className="font-display text-2xl font-bold text-green">今晚晚餐</h1>
        <p className="mt-1 text-sm text-muted">
          現在不餓、頭腦清楚，最適合做決定。晚上壓力大的時候，照著選好的走就行。
        </p>
      </header>

      {current && (
        <div className="card border border-green/30 bg-green-soft p-4 text-sm">
          已決定：<span className="font-bold">{current}</span>（18:30 會提醒你照計畫走）
        </div>
      )}

      {!editing ? (
        <>
          <section className="space-y-2.5">
            {presets.map((p) => (
              <button
                key={p}
                onClick={() => choose(p)}
                className={`card w-full p-4 text-left text-sm active:scale-[0.99] ${current === p ? "border border-green" : ""}`}
              >
                {p}
              </button>
            ))}
          </section>

          <div className="card flex gap-2 p-3">
            <input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="今天想吃別的？打在這"
              className="min-w-0 flex-1 rounded-xl bg-bg px-3 py-2 text-sm outline-none"
            />
            <button onClick={() => choose(custom)} className="rounded-xl bg-green px-4 py-2 text-sm font-bold text-card">
              就這個
            </button>
          </div>

          <button onClick={() => { setDraft([...presets]); setEditing(true); }} className="w-full text-center text-xs text-muted underline">
            編輯常用選項
          </button>

          <p className="px-2 text-[11px] leading-relaxed text-muted">
            外食原則：先找蛋白質（雞、魚、蛋、豆）、不點大份不升級、飲料無糖或白開水。
            速食不是罪——是「沒計畫時的預設值」才是問題。
          </p>
        </>
      ) : (
        <section className="space-y-2.5">
          {draft.map((p, i) => (
            <input
              key={i}
              value={p}
              onChange={(e) => setDraft(draft.map((d, j) => (j === i ? e.target.value : d)))}
              className="card w-full p-3.5 text-sm outline-none"
            />
          ))}
          <div className="flex gap-2">
            <button onClick={() => setDraft([...draft, ""])} className="card flex-1 p-3 text-sm text-muted">+ 新增</button>
            <button onClick={savePresets} className="card flex-1 bg-green p-3 text-sm font-bold text-card">儲存</button>
          </div>
        </section>
      )}
    </main>
  );
}
