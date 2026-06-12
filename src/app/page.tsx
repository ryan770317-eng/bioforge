"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { addEvent, deleteEvent, isMissingTable, listEvents, upsertDaily, type Ev } from "@/lib/db";
import {
  addDays, currentPhase, currentWeight, dayN, monthCount, proteinTarget,
  targetKcal, todayStr, weekProgress, type WeightPoint,
} from "@/lib/calc";
import { PHASES, SUPPLEMENT_SLOTS } from "@/lib/profile";

type MealData = {
  items?: string[]; kcal?: number; kcal_range?: [number, number]; protein_g?: number;
  rating?: string; has_bread?: boolean; flags?: string[]; tip?: string;
  slot?: string; thumb?: string | null;
};

const RATING = {
  green: { dot: "bg-ok", label: "原型為主" },
  yellow: { dot: "bg-warn", label: "普通外食" },
  red: { dot: "bg-bad", label: "超加工" },
} as const;

const ANALYZING_LINES = ["看看這餐有什麼…", "估算熱量和蛋白質…", "對照你的地雷清單…"];

export default function TodayPage() {
  const today = todayStr();
  const [events, setEvents] = useState<Ev[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbMissing, setDbMissing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeLine, setAnalyzeLine] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [weightInput, setWeightInput] = useState("");
  const [editWeight, setEditWeight] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const evs = await listEvents(
        ["meal", "weight", "steps", "supplement", "dinner_plan", "craving", "bread"],
        addDays(today, -35),
        today
      );
      setEvents(evs);
      setDbMissing(false);
    } catch (e) {
      if (isMissingTable(e)) setDbMissing(true);
      else setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!analyzing) return;
    const t = setInterval(() => setAnalyzeLine((i) => (i + 1) % ANALYZING_LINES.length), 1800);
    return () => clearInterval(t);
  }, [analyzing]);

  // ── 衍生資料 ──────────────────────────────────────────────
  const todayEvs = events.filter((e) => e.date === today);
  const meals = todayEvs.filter((e) => e.type === "meal") as Ev<MealData>[];
  const todayWeight = todayEvs.find((e) => e.type === "weight")?.data as { kg?: number } | undefined;
  const todaySteps = (todayEvs.find((e) => e.type === "steps")?.data as { steps?: number })?.steps;
  const dinnerPlan = (todayEvs.find((e) => e.type === "dinner_plan")?.data as { choice?: string })?.choice;
  const takenSlots = new Map(
    todayEvs.filter((e) => e.type === "supplement").map((e) => [(e.data as { slot?: string }).slot, e.id])
  );

  const weights: WeightPoint[] = events
    .filter((e) => e.type === "weight")
    .map((e) => ({ date: e.date, kg: (e.data as { kg: number }).kg }));
  const w7 = currentWeight(weights);
  const kcalGoal = targetKcal(w7);
  const protGoal = proteinTarget(w7);
  const kcalSum = meals.reduce((s, m) => s + (m.data.kcal ?? 0), 0);
  const protSum = meals.reduce((s, m) => s + (m.data.protein_g ?? 0), 0);

  const loggedDates = new Set(events.filter((e) => e.type === "meal" || e.type === "weight").map((e) => e.date));
  const week = weekProgress(loggedDates, today);
  const month = monthCount(loggedDates, today);
  const phase = PHASES[currentPhase(today, w7)];
  const lastWeight = weights.sort((a, b) => b.date.localeCompare(a.date))[0]?.kg;

  // ── 動作 ──────────────────────────────────────────────────
  async function onPhoto(file: File) {
    setError(null);
    setAnalyzing(true);
    try {
      const [image, thumb] = await Promise.all([downscale(file, 1024, 0.8), downscale(file, 240, 0.6)]);
      const res = await fetch("/api/meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, thumb }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "分析失敗");
      if (data.dbError) setDbMissing(true);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setAnalyzing(false);
    }
  }

  async function saveWeight() {
    const kg = parseFloat(weightInput);
    if (!Number.isFinite(kg) || kg < 30 || kg > 150) return;
    await upsertDaily("weight", today, { kg: Math.round(kg * 10) / 10, source: "manual" });
    setEditWeight(false);
    setWeightInput("");
    load();
  }

  async function toggleSupplement(slot: string) {
    const id = takenSlots.get(slot);
    if (id) await deleteEvent(id);
    else await addEvent("supplement", today, { slot });
    load();
  }

  if (loading) {
    return <div className="py-20 text-center text-muted animate-pulse-soft">載入中…</div>;
  }

  return (
    <main className="stagger space-y-4">
      {/* 標頭 */}
      <header className="flex items-end justify-between pt-2">
        <div>
          <div className="hud-label flex items-center gap-2">
            <span className="live-dot" />
            DAY {String(dayN(today)).padStart(3, "0")} · {phase.name}
          </div>
          <h1 className="font-display glow mt-1 text-3xl font-bold text-green">今天</h1>
        </div>
        <div className="text-right">
          <div className="hud-label">WEEK LOG</div>
          <div className="font-display text-xl font-bold leading-tight">
            <span className="glow text-green">{week.done}</span>
            <span className="text-muted">/{week.target}</span>
          </div>
          <div className="text-[10px] text-muted">本月累計 {month} 天</div>
        </div>
      </header>

      {dbMissing && (
        <div className="card border border-warn/40 p-4 text-sm">
          資料庫還沒初始化——到 <Link href="/more" className="font-bold text-green underline">更多 → 初始設定</Link> 照步驟貼一次 SQL 就好。
        </div>
      )}
      {error && (
        <div className="card border border-bad/40 p-4 text-sm text-bad">{error}</div>
      )}

      {/* 拍照主按鈕 */}
      <input
        ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onPhoto(f); e.target.value = ""; }}
      />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={analyzing}
        className="card brackets relative flex w-full items-center gap-4 p-5 text-left transition-transform active:scale-[0.98] disabled:opacity-80"
      >
        {analyzing && <span className="scan-sweep" />}
        <div
          className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full ${
            analyzing ? "border border-line bg-card-soft" : "cam-breath bg-green"
          }`}
        >
          {analyzing ? (
            <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-green border-t-transparent" />
          ) : (
            <svg viewBox="0 0 24 24" className="h-8 w-8 text-[#06120c]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" />
            </svg>
          )}
        </div>
        <div>
          <div className="hud-label">{analyzing ? "ANALYZING…" : "MEAL CAPTURE"}</div>
          <div className="font-display text-lg font-bold">{analyzing ? ANALYZING_LINES[analyzeLine] : "拍這一餐"}</div>
          <div className="text-xs text-muted">{analyzing ? "AI 分析中，約 10 秒" : "按快門就完成記錄，熱量蛋白質 AI 估"}</div>
        </div>
      </button>

      {/* 今日數字 */}
      <div className="card grid grid-cols-3 divide-x divide-line p-0 text-center">
        <button onClick={() => { setEditWeight(true); setWeightInput(String(todayWeight?.kg ?? lastWeight ?? "")); }} className="py-4">
          <div className="font-display text-xl font-bold">{todayWeight?.kg ?? "—"}</div>
          <div className="text-[11px] text-muted">體重 kg{!todayWeight && "（點我記）"}</div>
        </button>
        <div className="py-4">
          <div className="font-display text-xl font-bold">{protSum}<span className="text-xs text-muted">/{protGoal}</span></div>
          <div className="text-[11px] text-muted">蛋白質 g</div>
        </div>
        <div className="py-4">
          <div className="font-display text-xl font-bold">{todaySteps?.toLocaleString() ?? "—"}</div>
          <div className="text-[11px] text-muted">步數（自動）</div>
        </div>
      </div>

      {editWeight && (
        <div className="card flex items-center gap-3 p-4">
          <input
            type="number" inputMode="decimal" step="0.1" autoFocus value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
            className="w-28 rounded-xl border border-line bg-black/40 px-3 py-2 font-display text-xl font-bold text-green outline-none focus:border-green/50"
          />
          <span className="text-sm text-muted">kg</span>
          <button onClick={saveWeight} className="glow-box ml-auto rounded-xl bg-green px-5 py-2 text-sm font-bold text-[#06120c]">存</button>
          <button onClick={() => setEditWeight(false)} className="text-sm text-muted">取消</button>
        </div>
      )}

      {/* 熱量列（階段1 淡化處理）*/}
      <div className="card p-4">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="hud-label">ENERGY INTAKE</span>
          <span className="font-display font-bold">{kcalSum}<span className="text-xs text-muted"> / {kcalGoal} kcal</span></span>
        </div>
        <div className="bar-track">
          <div
            className={`bar-fill ${kcalSum > kcalGoal ? "bar-fill--warn" : ""}`}
            style={{ width: `${Math.min(100, (kcalSum / kcalGoal) * 100)}%` }}
          />
        </div>
        {phase.id <= 1 && (
          <div className="mt-2 text-[11px] text-muted">階段 {phase.id}：先把記錄變自動，數字看看就好，不用達標。</div>
        )}
      </div>

      {/* 晚餐預決定 */}
      <Link href="/dinner" className="card flex items-center justify-between p-4">
        <div>
          <div className="text-sm font-bold">{dinnerPlan ? `今晚：${dinnerPlan}` : "晚餐還沒決定"}</div>
          <div className="text-[11px] text-muted">{dinnerPlan ? "照計畫走，不用再想" : "趁不餓先決定，晚上不靠意志力"}</div>
        </div>
        <span className="text-muted">›</span>
      </Link>

      {/* SOS */}
      <Link href="/sos" className="card glow-terra block border-terra/60 bg-gradient-to-r from-terra/25 to-terra/10 p-4 text-center">
        <div className="hud-label !text-terra">CRAVING ALERT</div>
        <div className="font-display text-lg font-bold text-terra">嘴饞 SOS</div>
        <div className="text-[11px] text-muted">想吃東西的時候按這裡，給我 10 分鐘</div>
      </Link>

      {/* 今日餐點 */}
      {meals.length > 0 && (
        <section className="space-y-2.5">
          <h2 className="hud-label px-1">MEAL LOG · 今天吃了</h2>
          {[...meals].reverse().map((m) => {
            const r = RATING[(m.data.rating as keyof typeof RATING) ?? "yellow"] ?? RATING.yellow;
            return (
              <div key={m.id} className="card flex gap-3 p-3.5">
                {m.data.thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`data:image/jpeg;base64,${m.data.thumb}`} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-card-soft text-xl">🍽</div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <span>{m.data.slot}</span>
                    <span className={`inline-block h-2 w-2 rounded-full ${r.dot}`} />
                    <span>{r.label}</span>
                    <span className="ml-auto font-display text-sm font-bold text-ink">
                      ~{m.data.kcal} <span className="text-[10px] font-normal text-muted">kcal・蛋白 {m.data.protein_g}g</span>
                    </span>
                  </div>
                  <div className="mt-0.5 truncate text-sm">{(m.data.items ?? []).join("、")}</div>
                  {(m.data.flags?.length ?? 0) > 0 && (
                    <div className="mt-1 text-[11px] text-bad">⚠ {m.data.flags!.join("・")}</div>
                  )}
                  {m.data.tip && <div className="mt-1 text-[11px] text-muted">{m.data.tip}</div>}
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* 保健品 */}
      <section className="card space-y-1 p-4">
        <h2 className="hud-label mb-2">SUPPLEMENTS · 保健品</h2>
        {SUPPLEMENT_SLOTS.map((s) => {
          const done = takenSlots.has(s.id);
          return (
            <button key={s.id} onClick={() => toggleSupplement(s.id)} className="flex w-full items-center gap-3 py-1.5 text-left">
              <span className={`flex h-6 w-6 items-center justify-center rounded-lg border-2 text-xs font-bold transition-all ${done ? "glow-box border-green bg-green text-[#06120c]" : "border-line text-transparent"}`}>✓</span>
              <span className={`text-sm ${done ? "text-muted line-through" : ""}`}>{s.label}</span>
              <span className="ml-auto text-[10px] text-muted">{s.note}</span>
            </button>
          );
        })}
      </section>
    </main>
  );
}

/** 縮圖：最長邊 maxDim 的 JPEG base64（不含 data: 前綴） */
async function downscale(file: File, maxDim: number, quality: number): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", quality).split(",")[1];
}
