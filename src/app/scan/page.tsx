"use client";
import { useState } from "react";
import BottomNav from "@/components/BottomNav";

type FoodStatus = "safe" | "rotation" | "observe" | "banned";

interface FoodItem {
  name: string;
  ige: number;
  igg: number;
  iggGrade: number;
  status: FoodStatus;
  rotationDays?: number;
  banUntil?: string;
  note?: string;
}

const FOOD_DATABASE: FoodItem[] = [
  { name: "腰果",   ige: 14, igg: 49464, iggGrade: 6, status: "banned", banUntil: "2026-09-20" },
  { name: "奇異果", ige: 0,  igg: 25032, iggGrade: 5, status: "banned", banUntil: "2026-09-20" },
  { name: "鮪魚",   ige: 13, igg: 10313, iggGrade: 3, status: "banned", banUntil: "2026-06-20" },
  { name: "小麥",   ige: 4,  igg: 2039,  iggGrade: 1, status: "banned", note: "主要發炎來源，完全避開（麵包、麵條、可頌、水餃皮）" },
  { name: "花椰菜", ige: 0,  igg: 5866,  iggGrade: 2, status: "rotation", rotationDays: 4 },
  { name: "蓮子",   ige: 0,  igg: 5014,  iggGrade: 2, status: "rotation", rotationDays: 4 },
  { name: "蚌",     ige: 0,  igg: 2915,  iggGrade: 1, status: "rotation", rotationDays: 4 },
  { name: "洋蔥",   ige: 0,  igg: 2895,  iggGrade: 1, status: "rotation", rotationDays: 4 },
  { name: "蘋果",   ige: 0,  igg: 2700,  iggGrade: 1, status: "rotation", rotationDays: 4 },
  { name: "花枝",   ige: 0,  igg: 2189,  iggGrade: 1, status: "rotation", rotationDays: 4 },
  { name: "蔥",     ige: 0,  igg: 1930,  iggGrade: 0, status: "observe", note: "接近1級門檻" },
  { name: "葵花籽", ige: 0,  igg: 1796,  iggGrade: 0, status: "observe" },
  { name: "蘿蔔",   ige: 267,igg: 1342,  iggGrade: 0, status: "observe", note: "IgE+IgG 雙重反應" },
  { name: "鮭魚",   ige: 0,  igg: 1195,  iggGrade: 0, status: "observe", note: "≤2次/週" },
  { name: "豌豆",   ige: 0,  igg: 1042,  iggGrade: 0, status: "observe" },
  { name: "杏仁",   ige: 0,  igg: 930,   iggGrade: 0, status: "observe", note: "≤2次/週" },
  { name: "蕎麥",   ige: 0,  igg: 880,   iggGrade: 0, status: "observe", note: "≤2次/週" },
  { name: "綠豆",   ige: 0,  igg: 645,   iggGrade: 0, status: "observe" },
  { name: "大蒜",   ige: 0,  igg: 394,   iggGrade: 0, status: "observe" },
  { name: "米飯",   ige: 20, igg: 419,   iggGrade: 0, status: "observe", note: "基本安全但 IgE 稍有反應" },
  { name: "草莓",   ige: 0,  igg: 200,   iggGrade: 0, status: "observe" },
  { name: "茶",     ige: 0,  igg: 188,   iggGrade: 0, status: "observe", note: "適量即可" },
  { name: "萵苣",   ige: 0,  igg: 178,   iggGrade: 0, status: "observe" },
  { name: "紅豆",   ige: 0,  igg: 123,   iggGrade: 0, status: "observe" },
  { name: "木瓜",   ige: 0,  igg: 120,   iggGrade: 0, status: "observe" },
  { name: "海帶",   ige: 0,  igg: 102,   iggGrade: 0, status: "observe" },
  { name: "芭樂",   ige: 0,  igg: 95,    iggGrade: 0, status: "observe" },
  { name: "雞肉",   ige: 0,  igg: 0,     iggGrade: 0, status: "safe" },
  { name: "豬肉",   ige: 0,  igg: 0,     iggGrade: 0, status: "safe" },
  { name: "雞蛋",   ige: 0,  igg: 0,     iggGrade: 0, status: "safe" },
  { name: "白飯",   ige: 20, igg: 419,   iggGrade: 0, status: "safe", note: "IgE 微量但臨床安全" },
  { name: "地瓜",   ige: 0,  igg: 0,     iggGrade: 0, status: "safe" },
  { name: "芋頭",   ige: 0,  igg: 0,     iggGrade: 0, status: "safe" },
  { name: "核桃",   ige: 0,  igg: 0,     iggGrade: 0, status: "safe" },
  { name: "香蕉",   ige: 0,  igg: 0,     iggGrade: 0, status: "safe" },
  { name: "高麗菜", ige: 0,  igg: 0,     iggGrade: 0, status: "safe" },
  { name: "菠菜",   ige: 0,  igg: 0,     iggGrade: 0, status: "safe" },
  { name: "南瓜",   ige: 0,  igg: 0,     iggGrade: 0, status: "safe" },
  { name: "小黃瓜", ige: 0,  igg: 0,     iggGrade: 0, status: "safe" },
  { name: "蘆筍",   ige: 0,  igg: 0,     iggGrade: 0, status: "safe" },
  { name: "竹筍",   ige: 0,  igg: 0,     iggGrade: 0, status: "safe" },
  { name: "黃豆",   ige: 0,  igg: 0,     iggGrade: 0, status: "safe" },
  { name: "豆漿",   ige: 0,  igg: 0,     iggGrade: 0, status: "safe" },
  { name: "椰子",   ige: 0,  igg: 0,     iggGrade: 0, status: "safe" },
  { name: "椰奶",   ige: 0,  igg: 0,     iggGrade: 0, status: "safe" },
  { name: "可可豆", ige: 0,  igg: 0,     iggGrade: 0, status: "safe" },
  { name: "橄欖油", ige: 0,  igg: 0,     iggGrade: 0, status: "safe" },
  { name: "椰子油", ige: 0,  igg: 0,     iggGrade: 0, status: "safe" },
  { name: "酪梨",   ige: 0,  igg: 0,     iggGrade: 0, status: "safe" },
  { name: "西瓜",   ige: 0,  igg: 0,     iggGrade: 0, status: "safe" },
  { name: "梨",     ige: 0,  igg: 0,     iggGrade: 0, status: "safe" },
  { name: "黑咖啡", ige: 0,  igg: 0,     iggGrade: 0, status: "safe" },
];

const STATUS_ORDER: FoodStatus[] = ["banned", "rotation", "observe", "safe"];

const STATUS_CONFIG: Record<FoodStatus, { label: string; dot: string; text: string; cardBg: string }> = {
  safe:     { label: "安全", dot: "#6B9E78", text: "#6B9E78", cardBg: "#F0FFF4" },
  rotation: { label: "輪替", dot: "#D4A24E", text: "#D4A24E", cardBg: "#FFFBF0" },
  observe:  { label: "觀察", dot: "#8B7D6B", text: "#8B7D6B", cardBg: "#FFFDF0" },
  banned:   { label: "停食", dot: "#E8734A", text: "#E8734A", cardBg: "#FFF0ED" },
};

const AI_VERDICT_CONFIG: Record<string, { bg: string; text: string; dot: string }> = {
  安全: { bg: "#F0FFF4", text: "#6B9E78", dot: "#6B9E78" },
  小心: { bg: "#FFFBF0", text: "#D4A24E", dot: "#D4A24E" },
  停食: { bg: "#FFF0ED", text: "#E8734A", dot: "#E8734A" },
};

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0,0,0,0);
  const target = new Date(dateStr);
  target.setHours(0,0,0,0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000*60*60*24));
}

type FilterTab = "all" | FoodStatus;

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "all",      label: "全部" },
  { key: "banned",   label: "停食" },
  { key: "rotation", label: "輪替" },
  { key: "observe",  label: "觀察" },
  { key: "safe",     label: "安全" },
];

type AiResult = {
  verdict: string;
  risk: string;
  reason: string;
  tip: string | null;
};

function todayLabel(): string {
  const d = new Date();
  return `${d.getMonth()+1}/${d.getDate()}`;
}

export default function ScanPage() {
  const [query,    setQuery]    = useState("");
  const [tab,      setTab]      = useState<FilterTab>("all");
  const [aiResult, setAiResult] = useState<AiResult | null>(null);
  const [aiFood,   setAiFood]   = useState("");
  const [loading,  setLoading]  = useState(false);

  const filtered = FOOD_DATABASE
    .filter((f) => f.name.includes(query) && (tab === "all" || f.status === tab))
    .sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status));

  const noDbResult = query.trim().length > 0 && filtered.length === 0;

  async function runAiCheck(food: string) {
    if (!food.trim() || loading) return;
    setLoading(true);
    setAiResult(null);
    setAiFood(food);
    try {
      const res = await fetch("/api/food-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ food }),
      });
      const data = await res.json();
      setAiResult(data);
    } catch {
      setAiResult({ verdict: "小心", risk: "中", reason: "網路錯誤，請重試", tip: null });
    }
    setLoading(false);
  }

  function handleSearch(val: string) {
    setQuery(val);
    setAiResult(null);
  }

  return (
    <>
      {/* Fixed header */}
      <div className="fixed top-0 left-0 right-0 md:left-[200px] z-10 bg-[#ebebeb] px-4 pt-4 pb-2 border-b border-stone-100">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-baseline justify-between mb-3">
            <h1 className="text-xl font-bold text-[#1a1a1a]">食物安全掃描器</h1>
            <span className="text-xs text-[#8B7D6B]">{todayLabel()}</span>
          </div>
          <input
            type="search"
            placeholder="搜尋或輸入食物名稱…"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && noDbResult && runAiCheck(query)}
            className="w-full bg-white rounded-2xl px-4 py-2.5 text-sm outline-none border border-stone-100 focus:border-[#e9f955] transition-colors placeholder:text-[#C4B8AC] mb-2.5"
          />
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {FILTER_TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`shrink-0 text-xs font-medium px-3 py-1 rounded-full transition-colors ${
                  tab === key ? "bg-[#e9f955] text-[#1a1a1a]" : "bg-transparent text-[#6b6b6b] border border-stone-200"
                }`}
              >{label}</button>
            ))}
          </div>
        </div>
      </div>

      <main className="pt-[164px] pb-24 px-4 w-full max-w-2xl mx-auto">

        {/* DB results */}
        {filtered.length > 0 && (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2">
            {filtered.map((food) => {
              const cfg  = STATUS_CONFIG[food.status];
              const days = food.banUntil ? daysUntil(food.banUntil) : null;
              const infoText =
                food.status === "banned" && days !== null
                  ? (days > 0 ? `還剩 ${days} 天` : "停食期已到")
                  : food.status === "rotation" && food.rotationDays
                  ? `每 ${food.rotationDays} 天 1 次`
                  : null;
              return (
                <li key={food.name} className="rounded-2xl px-4 py-3 shadow-sm" style={{ backgroundColor: cfg.cardBg }}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-[#1A1A1A]">{food.name}</span>
                    <span className="flex items-center gap-1.5 whitespace-nowrap">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cfg.dot }} />
                      <span className="text-xs font-medium" style={{ color: cfg.text }}>{cfg.label}</span>
                    </span>
                  </div>
                  {(infoText || food.note) && (
                    <p className="text-sm text-stone-400 mt-0.5">{infoText ?? food.note}</p>
                  )}
                  {infoText && food.note && (
                    <p className="text-sm text-stone-400 mt-0.5">{food.note}</p>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {/* Not in DB → AI check */}
        {noDbResult && (
          <div className="pt-4 flex flex-col items-center gap-4">
            <p className="text-sm text-[#8B7D6B] text-center">
              「{query}」不在資料庫裡
            </p>

            {!aiResult && (
              <button
                onClick={() => runAiCheck(query)}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-opacity active:opacity-70"
                style={{ backgroundColor: "#e9f955", color: "#1a1a1a", opacity: loading ? 0.6 : 1 }}
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-[#1a1a1a]/20 border-t-[#1a1a1a] animate-spin" />
                    AI 判斷中…
                  </>
                ) : "請 AI 幫我判斷"}
              </button>
            )}

            {aiResult && (() => {
              const cfg = AI_VERDICT_CONFIG[aiResult.verdict] ?? AI_VERDICT_CONFIG["小心"];
              return (
                <div className="w-full rounded-2xl px-4 py-4 shadow-sm" style={{ backgroundColor: cfg.bg }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-[#1A1A1A]">{aiFood}</span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.dot }} />
                      <span className="text-xs font-semibold" style={{ color: cfg.text }}>
                        {aiResult.verdict}・風險{aiResult.risk}
                      </span>
                    </span>
                  </div>
                  <p className="text-sm text-[#1a1a1a] leading-relaxed">{aiResult.reason}</p>
                  {aiResult.tip && (
                    <p className="text-xs text-[#8B7D6B] mt-1.5">{aiResult.tip}</p>
                  )}
                  <div className="flex items-center gap-1 mt-3">
                    <span className="text-[9px] text-[#C4B8AC]">由 AI 根據個人過敏原資料判斷，僅供參考</span>
                  </div>
                  <button
                    onClick={() => runAiCheck(query)}
                    disabled={loading}
                    className="mt-2 text-xs text-[#8B7D6B]/70 underline"
                  >重新判斷</button>
                </div>
              );
            })()}
          </div>
        )}

        {/* Empty state when no query */}
        {query.trim() === "" && tab === "all" && (
          <p className="text-center text-[#8B7D6B] text-xs pt-6">
            輸入食物名稱查詢，不在資料庫可請 AI 判斷
          </p>
        )}

        {/* Empty state when filter but no results in DB */}
        {query.trim() === "" && tab !== "all" && filtered.length === 0 && (
          <p className="text-center text-[#8B7D6B] text-sm pt-12">此分類目前沒有食物</p>
        )}

      </main>

      <BottomNav />
    </>
  );
}
