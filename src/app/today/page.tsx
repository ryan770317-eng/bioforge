"use client";
import { useState, useEffect, useRef } from "react";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";

const WATER_GOAL = 2000;
const WATER_STEP = 250;
const WATER_CUPS = WATER_GOAL / WATER_STEP; // 8

const PROTEIN_GOAL = 105;
const PROTEIN_PRESETS = [
  { label: "雞蛋", g: 7 },
  { label: "豆漿", g: 8 },
  { label: "雞胸", g: 25 },
  { label: "豬肉", g: 20 },
  { label: "核桃", g: 5 },
];

function todayDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function todayLabel(): string {
  const d = new Date();
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function ProgressBar({ value, goal, color }: { value: number; goal: number; color: string }) {
  return (
    <div className="h-2 bg-stone-100 rounded-full overflow-hidden mt-2">
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{ width: `${Math.min((value / goal) * 100, 100)}%`, backgroundColor: color }}
      />
    </div>
  );
}

function RatingDots({
  value, onChange, max = 5, activeColor,
}: {
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
  const [waterCups, setWaterCups] = useState(0);
  const [protein,   setProtein]   = useState(0);
  const [customG,   setCustomG]   = useState("");
  const [cravings,  setCravings]  = useState(0);
  const [optOpen,   setOptOpen]   = useState(false);
  const [energy,    setEnergy]    = useState(0);
  const [gut,       setGut]       = useState(0);
  const [stress,    setStress]    = useState(0);
  const [saving,    setSaving]    = useState(false);
  const saveCount = useRef(0);

  // Load today's record on mount
  useEffect(() => {
    supabase
      .from("daily_logs")
      .select("*")
      .eq("date", todayDate())
      .single()
      .then(({ data }) => {
        if (!data) return;
        setWaterCups(Math.round((data.water_ml ?? 0) / WATER_STEP));
        setProtein(data.protein_g ?? 0);
        setCravings(data.craving_count ?? 0);
        setEnergy(data.afternoon_energy ?? 0);
        setGut(data.gut_comfort ?? 0);
        setStress(data.stress_level ?? 0);
      });
  }, []);

  async function upsert(fields: LogFields) {
    saveCount.current += 1;
    setSaving(true);
    await supabase
      .from("daily_logs")
      .upsert({ date: todayDate(), ...fields }, { onConflict: "date" });
    saveCount.current -= 1;
    if (saveCount.current === 0) setSaving(false);
  }

  function handleWater(cups: number) {
    setWaterCups(cups);
    upsert({ water_ml: cups * WATER_STEP });
  }

  function handleProtein(g: number) {
    setProtein(g);
    upsert({ protein_g: g });
  }

  function addProtein(g: number) {
    handleProtein(Math.min(protein + g, 999));
  }

  function submitCustom() {
    const g = parseInt(customG, 10);
    if (!isNaN(g) && g > 0) { addProtein(g); setCustomG(""); }
  }

  function handleCravings(n: number) {
    setCravings(n);
    upsert({ craving_count: n });
  }

  function handleEnergy(n: number) {
    setEnergy(n);
    upsert({ afternoon_energy: n });
  }

  function handleGut(n: number) {
    setGut(n);
    upsert({ gut_comfort: n });
  }

  function handleStress(n: number) {
    setStress(n);
    upsert({ stress_level: n });
  }

  const waterMl   = waterCups * WATER_STEP;
  const waterDone = waterCups >= WATER_CUPS;
  const proteinDone = protein >= PROTEIN_GOAL;

  return (
    <>
      {/* Fixed header */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md z-10 bg-[#FFF8F0] px-4 pt-4 pb-3 border-b border-stone-100">
        <div className="flex items-baseline justify-between">
          <h1 className="text-xl font-bold text-[#D4A24E]">今日打卡</h1>
          <div className="flex items-center gap-2">
            {saving && (
              <div className="w-1.5 h-1.5 rounded-full bg-[#D4A24E] animate-pulse" />
            )}
            <span className="text-xs text-[#8B7D6B]">{todayLabel()}</span>
          </div>
        </div>
      </div>

      <main className="pt-[68px] pb-24 px-4 max-w-md mx-auto space-y-3">

        {/* ── 飲水 ── */}
        <section className="bg-white rounded-2xl px-4 py-4 shadow-sm">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-sm font-semibold text-[#1A1A1A]">💧 飲水</h2>
            <span className={`text-xs font-medium ${waterDone ? "text-[#6B9E78]" : "text-[#8B7D6B]"}`}>
              {waterMl} / {WATER_GOAL} ml{waterDone ? " ✓" : ""}
            </span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {Array.from({ length: WATER_CUPS }, (_, i) => {
              const filled = i < waterCups;
              return (
                <button
                  key={i}
                  onClick={() => handleWater(filled ? i : i + 1)}
                  aria-label={`${(i + 1) * WATER_STEP}ml`}
                  className="flex flex-col items-center gap-0.5 transition-transform active:scale-95"
                >
                  <span className="text-2xl leading-none" style={{ filter: filled ? "none" : "grayscale(1) opacity(0.3)" }}>
                    💧
                  </span>
                  <span className="text-[9px] text-[#8B7D6B]">{WATER_STEP}</span>
                </button>
              );
            })}
          </div>
          <ProgressBar value={waterMl} goal={WATER_GOAL} color="#6B9E78" />
        </section>

        {/* ── 蛋白質 ── */}
        <section className="bg-white rounded-2xl px-4 py-4 shadow-sm">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-sm font-semibold text-[#1A1A1A]">🥩 蛋白質</h2>
            <span className={`text-xs font-medium ${proteinDone ? "text-[#6B9E78]" : "text-[#8B7D6B]"}`}>
              {protein} / {PROTEIN_GOAL} g{proteinDone ? " ✓" : ""}
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
            <button
              onClick={submitCustom}
              className="px-4 py-2 rounded-xl bg-[#D4A24E] text-white text-sm font-medium active:opacity-80 transition-opacity"
            >
              加入
            </button>
          </div>
          {protein > 0 && (
            <button onClick={() => handleProtein(0)} className="mt-2 text-xs text-[#8B7D6B]/60 underline">
              重置
            </button>
          )}
          <ProgressBar value={protein} goal={PROTEIN_GOAL} color="#D4A24E" />
        </section>

        {/* ── 渴望次數 ── */}
        <section className="bg-white rounded-2xl px-4 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#1A1A1A]">🍬 渴望次數</h2>
            <span className="text-xs text-[#8B7D6B]">今日 {cravings} 次</span>
          </div>
          <div className="mt-3">
            <RatingDots value={cravings} onChange={handleCravings} activeColor="#E8734A" />
          </div>
        </section>

        {/* ── 選填 ── */}
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
