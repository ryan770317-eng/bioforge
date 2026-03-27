"use client";
import { useState, useEffect } from "react";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";
import { scheduleBreakfast, scheduleDinner } from "@/lib/notifications";

interface BanItem {
  name: string;
  emoji: string;
  banUntil: string;
}

const INITIAL_BAN: BanItem[] = [
  { name: "腰果",   emoji: "🥜", banUntil: "2026-09-20" },
  { name: "奇異果", emoji: "🥝", banUntil: "2026-09-20" },
  { name: "鮪魚",   emoji: "🐟", banUntil: "2026-06-20" },
];

const SETTING_KEYS = ["name","height_cm","weight_kg","protein_goal_g","water_goal_ml"] as const;
const AGE = 38;

// ── Health metric calculations ─────────────────────────────────
function calcBMI(heightCm: number, weightKg: number) {
  const h = heightCm / 100;
  const bmi = weightKg / (h * h);
  let label = ""; let color = "";
  if      (bmi < 18.5) { label = "過輕"; color = "#5B8CE8"; }
  else if (bmi < 24)   { label = "正常"; color = "#6B9E78"; }
  else if (bmi < 27)   { label = "過重"; color = "#E8734A"; }
  else                 { label = "肥胖"; color = "#E8734A"; }
  return { value: bmi.toFixed(1), label, color };
}

function calcProtein(weightKg: number) {
  return Math.round(weightKg * 1.6);
}

function calcWater(weightKg: number) {
  return Math.round(weightKg * 35);
}

function calcTDEE(heightCm: number, weightKg: number) {
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * AGE + 5;
  return Math.round(bmr * 1.2);
}

// ── Sub-components ─────────────────────────────────────────────
function HealthCard({ label, value, unit, sub, color, onApply }: {
  label: string; value: string; unit: string; sub: string; color: string;
  onApply?: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm px-4 py-3 flex flex-col gap-1">
      <p className="text-[10px] text-[#8B7D6B]">{label}</p>
      <p className="text-lg font-bold leading-none" style={{ color }}>
        {value}<span className="text-xs font-normal text-[#8B7D6B] ml-1">{unit}</span>
      </p>
      <p className="text-[10px] text-[#8B7D6B] leading-snug">{sub}</p>
      {onApply && (
        <button
          onClick={onApply}
          className="mt-1 self-start text-[10px] font-medium text-[#D4A24E] border border-[#D4A24E] rounded-full px-2 py-0.5 active:opacity-70 transition-opacity"
        >
          套用建議值
        </button>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const [name,        setName]        = useState("");
  const [height,      setHeight]      = useState("");
  const [weight,      setWeight]      = useState("");
  const [proteinGoal, setProteinGoal] = useState("105");
  const [waterGoal,   setWaterGoal]   = useState("2000");
  const [banItems,    setBanItems]    = useState<BanItem[]>(INITIAL_BAN);
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);

  // Notification state
  const [breakfastEnabled, setBreakfastEnabled] = useState(true);
  const [dinnerEnabled,    setDinnerEnabled]    = useState(true);
  const [breakfastTime,    setBreakfastTime]    = useState("08:00");
  const [dinnerTime,       setDinnerTime]       = useState("18:30");

  useEffect(() => {
    supabase
      .from("user_settings")
      .select("key,value")
      .in("key", [...SETTING_KEYS])
      .then(({ data }) => {
        if (!data) return;
        const map = new Map(data.map((r) => [r.key, r.value ?? ""]));
        if (map.has("name"))           setName(map.get("name")!);
        if (map.has("height_cm"))      setHeight(map.get("height_cm")!);
        if (map.has("weight_kg"))      setWeight(map.get("weight_kg")!);
        if (map.has("protein_goal_g")) setProteinGoal(map.get("protein_goal_g")!);
        if (map.has("water_goal_ml"))  setWaterGoal(map.get("water_goal_ml")!);
      });

    try {
      if (localStorage.getItem("notif_pref_v") !== "3") {
        ["notif_breakfast","notif_dinner","notif_breakfast_time","notif_dinner_time"].forEach(
          (k) => localStorage.removeItem(k)
        );
        localStorage.setItem("notif_pref_v", "3");
      }
      const bf = localStorage.getItem("notif_breakfast");
      const dn = localStorage.getItem("notif_dinner");
      const bt = localStorage.getItem("notif_breakfast_time");
      const dt = localStorage.getItem("notif_dinner_time");
      if (bf !== null) setBreakfastEnabled(bf === "true");
      if (dn !== null) setDinnerEnabled(dn === "true");
      if (bt !== null) setBreakfastTime(bt);
      if (dt !== null) setDinnerTime(dt);
    } catch {}
  }, []);

  async function save() {
    setSaving(true);
    const rows = [
      { key: "name",           value: name },
      { key: "height_cm",      value: height },
      { key: "weight_kg",      value: weight },
      { key: "protein_goal_g", value: proteinGoal },
      { key: "water_goal_ml",  value: waterGoal },
    ];
    await supabase.from("user_settings").upsert(rows, { onConflict: "key" });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function updateBanDate(index: number, date: string) {
    setBanItems((prev) => prev.map((item, i) => (i === index ? { ...item, banUntil: date } : item)));
  }

  function handleBreakfastEnabled(val: boolean) {
    setBreakfastEnabled(val);
    try { localStorage.setItem("notif_breakfast", String(val)); } catch {}
    if (val) scheduleBreakfast(breakfastTime);
  }

  function handleDinnerEnabled(val: boolean) {
    setDinnerEnabled(val);
    try { localStorage.setItem("notif_dinner", String(val)); } catch {}
    if (val) scheduleDinner(dinnerTime);
  }

  function handleBreakfastTime(val: string) {
    setBreakfastTime(val);
    try { localStorage.setItem("notif_breakfast_time", val); } catch {}
    if (breakfastEnabled) scheduleBreakfast(val);
  }

  function handleDinnerTime(val: string) {
    setDinnerTime(val);
    try { localStorage.setItem("notif_dinner_time", val); } catch {}
    if (dinnerEnabled) scheduleDinner(val);
  }

  // Compute health metrics (only when both height + weight are valid numbers)
  const h = parseFloat(height);
  const w = parseFloat(weight);
  const pg = parseInt(proteinGoal, 10);
  const hasMetrics = h > 0 && w > 0;

  const bmi         = hasMetrics ? calcBMI(h, w) : null;
  const recProtein  = hasMetrics ? calcProtein(w) : null;
  const recWater    = hasMetrics ? calcWater(w) : null;
  const tdee        = hasMetrics ? calcTDEE(h, w) : null;

  const inputCls = "border border-stone-200 rounded-xl px-4 py-3 w-full bg-white text-stone-800 placeholder:text-stone-300 focus:outline-none focus:border-[#D4A24E] text-sm transition-colors";

  return (
    <>
      <div className="fixed top-0 left-0 right-0 md:left-[200px] z-10 bg-[#FFF8F0] px-4 pt-4 pb-3 border-b border-stone-100">
        <div className="max-w-2xl mx-auto flex items-baseline justify-between">
          <h1 className="text-xl font-bold text-[#D4A24E]">設定</h1>
          {saved && <span className="text-xs text-[#6B9E78] font-medium">✅ 已儲存</span>}
        </div>
      </div>

      <main className="pt-[68px] pb-24 px-4 w-full max-w-2xl mx-auto space-y-4">

        {/* Personal data */}
        <section>
          <h2 className="text-xs font-semibold text-[#8B7D6B] uppercase tracking-wide mb-3 px-1">個人資料</h2>
          <div className="space-y-2">
            <div>
              <label className="text-xs text-[#8B7D6B] mb-1 block px-1">姓名</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="請輸入姓名"
                className={inputCls}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-[#8B7D6B] mb-1 block px-1">身高 (cm)</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="175"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="text-xs text-[#8B7D6B] mb-1 block px-1">體重 (kg)</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="72"
                  className={inputCls}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-[#8B7D6B] mb-1 block px-1">蛋白質目標 (g/日)</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={proteinGoal}
                  onChange={(e) => setProteinGoal(e.target.value)}
                  placeholder="105"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="text-xs text-[#8B7D6B] mb-1 block px-1">飲水目標 (ml/日)</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={waterGoal}
                  onChange={(e) => setWaterGoal(e.target.value)}
                  placeholder="2000"
                  className={inputCls}
                />
              </div>
            </div>
          </div>
          <button
            onClick={save}
            disabled={saving}
            className="mt-3 w-full py-2.5 rounded-full text-sm font-semibold text-white transition-opacity active:opacity-80"
            style={{ backgroundColor: "#D4A24E", opacity: saving ? 0.6 : 1 }}
          >
            {saving ? "儲存中…" : "儲存個人資料"}
          </button>
        </section>

        {/* Health metrics (show when height + weight available) */}
        {hasMetrics && bmi && recProtein && recWater && tdee && (
          <section>
            <h2 className="text-xs font-semibold text-[#8B7D6B] uppercase tracking-wide mb-3 px-1">個人化健康指標</h2>
            <div className="grid grid-cols-2 gap-2">
              <HealthCard
                label="BMI"
                value={bmi.value}
                unit={bmi.label}
                sub={`正常範圍 18.5 – 24`}
                color={bmi.color}
              />
              <HealthCard
                label="每日蛋白質建議"
                value={String(recProtein)}
                unit="g"
                sub={`體重 × 1.6g｜你的目標 ${isNaN(pg) ? proteinGoal : pg}g`}
                color={!isNaN(pg) && pg >= recProtein ? "#6B9E78" : "#E8734A"}
                onApply={() => setProteinGoal(String(recProtein))}
              />
              <HealthCard
                label="每日飲水建議"
                value={String(recWater)}
                unit="ml"
                sub={`體重 × 35ml`}
                color="#5B8CE8"
                onApply={() => setWaterGoal(String(recWater))}
              />
              <HealthCard
                label="TDEE 參考"
                value={String(tdee)}
                unit="kcal"
                sub="久坐係數 1.2，僅供參考"
                color="#D4A24E"
              />
            </div>
          </section>
        )}

        {/* Ban dates */}
        <section>
          <h2 className="text-xs font-semibold text-[#8B7D6B] uppercase tracking-wide mb-2 px-1">停食日期管理</h2>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-stone-50">
            {banItems.map((item, i) => (
              <div key={item.name} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-[#1A1A1A]">{item.emoji} {item.name}</span>
                {item.banUntil ? (
                  <input
                    type="date"
                    value={item.banUntil}
                    onChange={(e) => updateBanDate(i, e.target.value)}
                    className="text-sm text-[#D4A24E] outline-none bg-transparent"
                  />
                ) : (
                  <span className="text-xs font-medium text-[#E8734A] bg-[#FDECEA] px-2.5 py-0.5 rounded-full">永久停食</span>
                )}
              </div>
            ))}
          </div>
          <p className="text-[10px] text-[#8B7D6B] mt-1.5 px-1">點日期可修改解禁時間</p>
        </section>

        {/* Notifications */}
        <section>
          <h2 className="text-xs font-semibold text-[#8B7D6B] uppercase tracking-wide mb-2 px-1">推播通知</h2>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-stone-50">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-[#1A1A1A]">🌅 早餐保健品提醒</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={breakfastEnabled}
                  onChange={(e) => handleBreakfastEnabled(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-[#D4A24E] peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
              </label>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-[#1A1A1A]">早餐提醒時間</span>
              <input
                type="time"
                value={breakfastTime}
                onChange={(e) => handleBreakfastTime(e.target.value)}
                className="text-sm text-[#D4A24E] outline-none bg-transparent"
              />
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-[#1A1A1A]">🌙 晚餐保健品提醒</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={dinnerEnabled}
                  onChange={(e) => handleDinnerEnabled(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-[#D4A24E] peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
              </label>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-[#1A1A1A]">晚餐提醒時間</span>
              <input
                type="time"
                value={dinnerTime}
                onChange={(e) => handleDinnerTime(e.target.value)}
                className="text-sm text-[#D4A24E] outline-none bg-transparent"
              />
            </div>
          </div>
        </section>

        {/* About */}
        <section>
          <h2 className="text-xs font-semibold text-[#8B7D6B] uppercase tracking-wide mb-2 px-1">關於 BioForge</h2>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-stone-50">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-[#1A1A1A] font-medium">版本</span>
              <span className="text-sm text-[#8B7D6B]">v0.1.0</span>
            </div>
            <div className="px-4 py-3">
              <p className="text-sm text-[#8B7D6B] leading-relaxed">
                智慧健康管理，從飲食開始。<br />
                根據個人過敏原檢測，幫你記錄、追蹤、避開地雷食物。
              </p>
            </div>
          </div>
        </section>

      </main>

      <BottomNav />
    </>
  );
}
