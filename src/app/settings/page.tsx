"use client";
import { useState } from "react";
import BottomNav from "@/components/BottomNav";

interface BanItem {
  name: string;
  emoji: string;
  banUntil: string; // "" = permanent
}

const INITIAL_BAN: BanItem[] = [
  { name: "腰果",   emoji: "🥜", banUntil: "2026-09-20" },
  { name: "奇異果", emoji: "🥝", banUntil: "2026-09-20" },
  { name: "鮪魚",   emoji: "🐟", banUntil: "2026-06-20" },
  { name: "小麥",   emoji: "🌾", banUntil: "" },
];

function SettingRow({
  label, value, onChange, type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: "text" | "number";
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

export default function SettingsPage() {
  // Personal
  const [name,        setName]        = useState("Ryan");
  const [height,      setHeight]      = useState("175");
  const [weight,      setWeight]      = useState("72");
  const [proteinGoal, setProteinGoal] = useState("105");
  const [waterGoal,   setWaterGoal]   = useState("2000");

  // Ban dates
  const [banItems, setBanItems] = useState<BanItem[]>(INITIAL_BAN);

  function updateBanDate(index: number, date: string) {
    setBanItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, banUntil: date } : item))
    );
  }

  return (
    <>
      {/* Fixed header */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md z-10 bg-[#FFF8F0] px-4 pt-4 pb-3 border-b border-stone-100">
        <h1 className="text-xl font-bold text-[#D4A24E]">設定</h1>
      </div>

      <main className="pt-[68px] pb-24 px-4 max-w-md mx-auto space-y-4">

        {/* Personal data */}
        <section>
          <h2 className="text-xs font-semibold text-[#8B7D6B] uppercase tracking-wide mb-2 px-1">個人資料</h2>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-stone-50">
            <SettingRow label="姓名"               value={name}        onChange={setName}        type="text"   />
            <SettingRow label="身高 (cm)"           value={height}      onChange={setHeight}      type="number" />
            <SettingRow label="體重 (kg)"           value={weight}      onChange={setWeight}      type="number" />
            <SettingRow label="蛋白質目標 (g/日)"   value={proteinGoal} onChange={setProteinGoal} type="number" />
            <SettingRow label="飲水目標 (ml/日)"    value={waterGoal}   onChange={setWaterGoal}   type="number" />
          </div>
        </section>

        {/* Ban date management */}
        <section>
          <h2 className="text-xs font-semibold text-[#8B7D6B] uppercase tracking-wide mb-2 px-1">停食日期管理</h2>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-stone-50">
            {banItems.map((item, i) => (
              <div key={item.name} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-[#1A1A1A]">
                  {item.emoji} {item.name}
                </span>
                {item.banUntil ? (
                  <input
                    type="date"
                    value={item.banUntil}
                    onChange={(e) => updateBanDate(i, e.target.value)}
                    className="text-sm text-[#D4A24E] outline-none bg-transparent"
                  />
                ) : (
                  <span className="text-xs font-medium text-[#E8734A] bg-[#FDECEA] px-2.5 py-0.5 rounded-full">
                    永久停食
                  </span>
                )}
              </div>
            ))}
          </div>
          <p className="text-[10px] text-[#8B7D6B] mt-1.5 px-1">點日期可修改解禁時間</p>
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
                智慧健康管理，從飲食開始。
                <br />
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
