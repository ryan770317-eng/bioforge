"use client";
import { useState, useEffect } from "react";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";
import { scheduleReminders } from "@/lib/notifications";

interface BanItem {
  name: string;
  emoji: string;
  banUntil: string;
}

const INITIAL_BAN: BanItem[] = [
  { name: "腰果",   emoji: "🥜", banUntil: "2026-09-20" },
  { name: "奇異果", emoji: "🥝", banUntil: "2026-09-20" },
  { name: "鮪魚",   emoji: "🐟", banUntil: "2026-06-20" },
  { name: "小麥",   emoji: "🌾", banUntil: "" },
];

const SETTING_KEYS = ["name","height_cm","weight_kg","protein_goal_g","water_goal_ml"] as const;

function SettingRow({ label, value, onChange, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; type?: "text" | "number";
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm text-[#1A1A1A] shrink-0 mr-4">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode={type === "number" ? "numeric" : undefined}
        className="text-sm text-[#D4A24E] text-right outline-none bg-transparent w-28 placeholder:text-[#C4B8AC]"
      />
    </div>
  );
}

function NotifToggleRow({ label, storageKey, defaultVal, onChange }: {
  label: string; storageKey: string; defaultVal: boolean; onChange?: () => void;
}) {
  const [on, setOn] = useState(defaultVal);

  useEffect(() => {
    try {
      const v = localStorage.getItem(storageKey);
      if (v !== null) setOn(v === "true");
    } catch {}
  }, [storageKey]);

  function toggle() {
    const next = !on;
    setOn(next);
    try { localStorage.setItem(storageKey, String(next)); } catch {}
    onChange?.();
  }
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm text-[#1A1A1A]">{label}</span>
      <button
        onClick={toggle}
        className="relative w-10 h-6 rounded-full transition-colors"
        style={{ backgroundColor: on ? "#D4A24E" : "#E7E0D8" }}
      >
        <span
          className="absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow-sm"
          style={{ transform: on ? "translateX(18px)" : "translateX(2px)" }}
        />
      </button>
    </div>
  );
}

function NotifTimeRow({ label, storageKey, defaultTime, onChange }: {
  label: string; storageKey: string; defaultTime: string; onChange?: () => void;
}) {
  const [time, setTime] = useState(defaultTime);

  useEffect(() => {
    try {
      const v = localStorage.getItem(storageKey);
      if (v !== null) setTime(v);
    } catch {}
  }, [storageKey]);
  function handleChange(v: string) {
    setTime(v);
    try { localStorage.setItem(storageKey, v); } catch {}
    onChange?.();
  }
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm text-[#1A1A1A]">{label}</span>
      <input
        type="time"
        value={time}
        onChange={(e) => handleChange(e.target.value)}
        className="text-sm text-[#D4A24E] outline-none bg-transparent"
      />
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
    setTimeout(() => setSaved(false), 2000);
  }

  function updateBanDate(index: number, date: string) {
    setBanItems((prev) => prev.map((item, i) => (i === index ? { ...item, banUntil: date } : item)));
  }

  return (
    <>
      <div className="fixed top-0 left-0 right-0 md:left-[200px] z-10 bg-[#FFF8F0] px-4 pt-4 pb-3 border-b border-stone-100">
        <div className="max-w-2xl mx-auto flex items-baseline justify-between">
          <h1 className="text-xl font-bold text-[#D4A24E]">設定</h1>
          {saved && <span className="text-xs text-[#6B9E78] font-medium">✓ 已儲存</span>}
        </div>
      </div>

      <main className="pt-[68px] pb-24 px-4 w-full max-w-2xl mx-auto space-y-4">

        {/* Personal data */}
        <section>
          <h2 className="text-xs font-semibold text-[#8B7D6B] uppercase tracking-wide mb-2 px-1">個人資料</h2>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-stone-50">
            <SettingRow label="姓名"             value={name}        onChange={setName}        type="text"   />
            <SettingRow label="身高 (cm)"         value={height}      onChange={setHeight}      type="number" />
            <SettingRow label="體重 (kg)"         value={weight}      onChange={setWeight}      type="number" />
            <SettingRow label="蛋白質目標 (g/日)" value={proteinGoal} onChange={setProteinGoal} type="number" />
            <SettingRow label="飲水目標 (ml/日)"  value={waterGoal}   onChange={setWaterGoal}   type="number" />
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
            <NotifToggleRow label="🌅 早餐保健品提醒" storageKey="notif_breakfast" defaultVal={true} onChange={scheduleReminders} />
            <NotifTimeRow   label="早餐提醒時間"       storageKey="notif_breakfast_time" defaultTime="08:00" onChange={scheduleReminders} />
            <NotifToggleRow label="🌙 晚餐保健品提醒" storageKey="notif_dinner"    defaultVal={true} onChange={scheduleReminders} />
            <NotifTimeRow   label="晚餐提醒時間"       storageKey="notif_dinner_time"    defaultTime="18:30" onChange={scheduleReminders} />
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
