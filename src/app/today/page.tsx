"use client";
import { useState, useEffect, useRef } from "react";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";

const DEFAULT_WATER_GOAL   = 2000;
const DEFAULT_PROTEIN_GOAL = 105;
const WATER_STEP = 250;

const PROTEIN_PRESETS = [
  { label: "雞蛋", g: 7 },
  { label: "豆漿", g: 8 },
  { label: "雞胸", g: 25 },
  { label: "豬肉", g: 20 },
  { label: "核桃", g: 5 },
];

function todayDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function todayLabel(): string {
  const d = new Date();
  return `${d.getMonth()+1}/${d.getDate()}`;
}

function ProgressBar({ value, goal, gradient, doneColor = "#6B9E78" }: {
  value: number; goal: number; gradient?: string; doneColor?: string;
}) {
  const pct  = Math.min((value / goal) * 100, 100);
  const done = pct >= 100;
  return (
    <div className="h-2 bg-stone-100 rounded-full overflow-hidden mt-2">
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{ width: `${pct}%`, background: done ? doneColor : (gradient ?? doneColor) }}
      />
    </div>
  );
}

function RatingDots({ value, onChange, max = 5, activeColor }: {
  value: number; onChange: (v: number) => void; max?: number; activeColor: string;
}) {
  return (
    <div className="flex gap-2">
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          onClick={() => onChange(n === value ? 0 : n)}
          className="w-8 h-8 rounded-full text-sm font-semibold transition-colors border"
          style={
            n <= value
              ? { backgroundColor: activeColor, borderColor: activeColor, color: "#fff" }
              : { backgroundColor: "#fff", borderColor: "#E7E0D8", color: "#8B7D6B" }
          }
        >
          {n}
        </button>
      ))}
    </div>
  );
}

type LogFields = {
  water_ml?: number;
  protein_g?: number;
  craving_count?: number;
  afternoon_energy?: number;
  gut_comfort?: number;
  stress_level?: number;
};

export default function TodayPage() {
  const [waterGoal,   setWaterGoal]   = useState(DEFAULT_WATER_GOAL);
  const [proteinGoal, setProteinGoal] = useState(DEFAULT_PROTEIN_GOAL);
  const waterCups = Math.round(waterGoal / WATER_STEP);

  const [cups,     setCups]     = useState(0);
  const [protein,  setProtein]  = useState(0);
  const [customG,  setCustomG]  = useState("");
  const [cravings, setCravings] = useState(0);
  const [optOpen,  setOptOpen]  = useState(false);
  const [energy,   setEnergy]   = useState(0);
  const [gut,      setGut]      = useState(0);
  const [stress,   setStress]   = useState(0);
  const [saving,    setSaving]   = useState(false);
  const [showToast, setShowToast] = useState(false);
  const saveCount = useRef(0);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load goals + today's log
  useEffect(() => {
    supabase
      .from("user_settings")
      .select("key,value")
      .in("key", ["protein_goal_g","water_goal_ml"])
      .then(({ data }) => {
        if (!data) return;
        const map = new Map(data.map((r) => [r.key, r.value]));
        const pg = parseInt(map.get("protein_goal_g") ?? "", 10);
        const wg = parseInt(map.get("water_goal_ml")  ?? "", 10);
        if (!isNaN(pg) && pg > 0) setProteinGoal(pg);
        if (!isNaN(wg) && wg > 0) setWaterGoal(wg);
      });

    supabase
      .from("daily_logs")
      .select("*")
      .eq("date", todayDate())
      .single()
      .then(({ data }) => {
        if (!data) return;
        setCups(Math.round((data.water_ml ?? 0) / WATER_STEP));
        setProtein(data.protein_g ?? 0);
        setCravings(data.craving_count ?? 0);
        setEnergy(data.afternoon_energy ?? 0);
        setGut(data.gut_comfort ?? 0);
        setStress(data.stress_level ?? 0);
      });
  }, []);

  function showError() {
    setShowToast(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setShowToast(false), 3000);
  }

  async function upsert(fields: LogFields, rollback?: () => void) {
    saveCount.current += 1;
    setSaving(true);
    const { error } = await supabase
      .from("daily_logs")
      .upsert({ date: todayDate(), ...fields }, { onConflict: "date" });
    saveCount.current -= 1;
    if (saveCount.current === 0) setSaving(false);
    if (error) {
      rollback?.();
      showError();
    }
  }

  function handleWater(next: number) {
    const prev = cups;
    setCups(next); // optimistic
    upsert({ water_ml: next * WATER_STEP }, () => setCups(prev));
  }

  function handleProtein(g: number) {
    const prev = protein;
    setProtein(g); // optimistic
    upsert({ protein_g: g }, () => setProtein(prev));
  }

  function addProtein(g: number) {
    handleProtein(Math.min(protein + g, 999));
  }

  function submitCustom() {
    const g = parseInt(customG, 10);
    if (!isNaN(g) && g > 0) { addProtein(g); setCustomG(""); }
  }

  function handleCravings(n: number) {
    const prev = cravings;
    setCravings(n);
    upsert({ craving_count: n }, () => setCravings(prev));
  }

  function handleEnergy(n: number) {
    const prev = energy;
    setEnergy(n);
    upsert({ afternoon_energy: n }, () => setEnergy(prev));
  }

  function handleGut(n: number) {
    const prev = gut;
    setGut(n);
    upsert({ gut_comfort: n }, () => setGut(prev));
  }

  function handleStress(n: number) {
    const prev = stress;
    setStress(n);
    upsert({ stress_level: n }, () => setStress(prev));
  }

  const waterMl     = cups * WATER_STEP;
  const waterDone   = waterMl >= waterGoal;
  const proteinDone = protein >= proteinGoal;

  return (
    <>
      {/* Toast */}
      {showToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-[#E8734A] text-white text-xs font-medium px-4 py-2 rounded-full shadow-lg pointer-events-none">
          儲存失敗，請重試
        </div>
      )}

      <div className="fixed top-0 left-0 right-0 md:left-[200px] z-10 bg-[#FFF8F0] px-4 pt-4 pb-3 border-b border-stone-100">
        <div className="max-w-2xl mx-auto flex items-baseline justify-between">
          <h1 className="text-xl font-bold text-[#D4A24E]">今日打卡</h1>
          <div className="flex items-center gap-2">
            {saving && <div className="w-1.5 h-1.5 rounded-full bg-[#D4A24E] animate-pulse" />}
            <span className="text-xs text-[#8B7D6B]">{todayLabel()}</span>
          </div>
        </div>
      </div>

      <main className="pt-[68px] pb-24 px-4 w-full max-w-2xl mx-auto space-y-3">

        {/* 飲水 */}
        <section className="bg-white rounded-2xl px-4 py-4 shadow-sm">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-sm font-semibold text-[#1A1A1A]">💧 飲水</h2>
            <span className={`text-xs font-medium ${waterDone ? "text-[#6B9E78]" : "text-[#8B7D6B]"}`}>
              {waterMl} / {waterGoal} ml{waterDone ? " ✓" : ""}
            </span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {Array.from({ length: waterCups }, (_, i) => {
              const filled = i < cups;
              return (
                <button
                  key={i}
                  onClick={() => handleWater(filled ? i : i + 1)}
                  aria-label={`${(i+1)*WATER_STEP}ml`}
                  className="flex flex-col items-center gap-0.5 transition-transform active:scale-95"
                >
                  <span className="text-2xl leading-none" style={{ filter: filled ? "none" : "grayscale(1) opacity(0.3)" }}>💧</span>
                  <span className="text-[9px] text-[#8B7D6B]">{WATER_STEP}</span>
                </button>
              );
            })}
          </div>
          <ProgressBar value={waterMl} goal={waterGoal} gradient="linear-gradient(to right, #D4A24E, #E8B96A)" />
          {waterDone && <p className="text-xs text-[#6B9E78] font-medium mt-1.5 text-center">🎉 今日達標！</p>}
        </section>

        {/* 蛋白質 */}
        <section className="bg-white rounded-2xl px-4 py-4 shadow-sm">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-sm font-semibold text-[#1A1A1A]">🥩 蛋白質</h2>
            <span className={`text-xs font-medium ${proteinDone ? "text-[#6B9E78]" : "text-[#8B7D6B]"}`}>
              {protein} / {proteinGoal} g{proteinDone ? " ✓" : ""}
            </span>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {PROTEIN_PRESETS.map(({ label, g }) => (
              <button
                key={label}
                onClick={() => addProtein(g)}
                className="text-xs font-medium px-3 py-1.5 rounded-full bg-[#FFF3E0] text-[#D4A24E] active:scale-95 transition-transform"
              >
                {label} <span className="opacity-70">+{g}g</span>
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              inputMode="numeric"
              placeholder="自訂 g"
              value={customG}
              onChange={(e) => setCustomG(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitCustom()}
              className="flex-1 bg-stone-50 rounded-xl px-3 py-2 text-sm outline-none border border-stone-100 focus:border-[#D4A24E] transition-colors placeholder:text-[#C4B8AC]"
            />
            <button onClick={submitCustom} className="px-4 py-2 rounded-xl bg-[#D4A24E] text-white text-sm font-medium active:opacity-80 transition-opacity">加入</button>
          </div>
          {protein > 0 && (
            <button onClick={() => handleProtein(0)} className="mt-2 text-xs text-[#8B7D6B]/60 underline">重置</button>
          )}
          <ProgressBar value={protein} goal={proteinGoal} />
          {proteinDone && <p className="text-xs text-[#6B9E78] font-medium mt-1.5 text-center">🎉 今日達標！</p>}
        </section>

        {/* 渴望次數 */}
        <section className="bg-white rounded-2xl px-4 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#1A1A1A]">🍬 渴望次數</h2>
            <span className="text-xs text-[#8B7D6B]">今日 {cravings} 次</span>
          </div>
          <div className="mt-3">
            <RatingDots value={cravings} onChange={handleCravings} activeColor="#E8734A" />
          </div>
          {cravings === 0 && <p className="text-xs text-[#6B9E78] mt-2">今天很棒，繼續保持 💪</p>}
        </section>

        {/* 選填 */}
        <section className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <button
            onClick={() => setOptOpen((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3.5"
          >
            <span className="text-sm font-semibold text-[#1A1A1A]">選填紀錄</span>
            <span className="text-xs text-[#8B7D6B] flex items-center gap-1">
              {optOpen ? "收起" : "展開"}
              <span className={`inline-block transition-transform ${optOpen ? "rotate-180" : ""}`}>▾</span>
            </span>
          </button>
          {optOpen && (
            <div className="px-4 pb-4 space-y-4 border-t border-stone-50">
              <div className="pt-4">
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-sm text-[#1A1A1A]">☀️ 下午精神</span>
                  <span className="text-xs text-[#8B7D6B]">{energy ? `${energy} 分` : "未填"}</span>
                </div>
                <RatingDots value={energy} onChange={handleEnergy} activeColor="#D4A24E" />
              </div>
              <div>
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-sm text-[#1A1A1A]">🫁 腸道舒適度</span>
                  <span className="text-xs text-[#8B7D6B]">{gut ? `${gut} 分` : "未填"}</span>
                </div>
                <RatingDots value={gut} onChange={handleGut} activeColor="#6B9E78" />
              </div>
              <div>
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-sm text-[#1A1A1A]">🧠 壓力指數</span>
                  <span className="text-xs text-[#8B7D6B]">{stress ? `${stress} 分` : "未填"}</span>
                </div>
                <RatingDots value={stress} onChange={handleStress} activeColor="#E8734A" />
              </div>
            </div>
          )}
        </section>

      </main>

      <BottomNav />
    </>
  );
}
