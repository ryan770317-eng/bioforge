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
  { name: "腰果", ige: 14, igg: 49464, iggGrade: 6, status: "banned", banUntil: "2026-09-20" },
  { name: "奇異果", ige: 0, igg: 25032, iggGrade: 5, status: "banned", banUntil: "2026-09-20" },
  { name: "鮪魚", ige: 13, igg: 10313, iggGrade: 3, status: "banned", banUntil: "2026-06-20" },
  { name: "小麥", ige: 4, igg: 2039, iggGrade: 1, status: "banned", note: "主要發炎來源，完全避開（麵包、麵條、可頌、水餃皮）" },
  { name: "花椰菜", ige: 0, igg: 5866, iggGrade: 2, status: "rotation", rotationDays: 4 },
  { name: "蓮子", ige: 0, igg: 5014, iggGrade: 2, status: "rotation", rotationDays: 4 },
  { name: "蚌", ige: 0, igg: 2915, iggGrade: 1, status: "rotation", rotationDays: 4 },
  { name: "洋蔥", ige: 0, igg: 2895, iggGrade: 1, status: "rotation", rotationDays: 4 },
  { name: "蘋果", ige: 0, igg: 2700, iggGrade: 1, status: "rotation", rotationDays: 4 },
  { name: "花枝", ige: 0, igg: 2189, iggGrade: 1, status: "rotation", rotationDays: 4 },
  { name: "蔥", ige: 0, igg: 1930, iggGrade: 0, status: "observe", note: "接近1級門檻" },
  { name: "葵花籽", ige: 0, igg: 1796, iggGrade: 0, status: "observe" },
  { name: "蘿蔔", ige: 267, igg: 1342, iggGrade: 0, status: "observe", note: "IgE+IgG 雙重反應" },
  { name: "鮭魚", ige: 0, igg: 1195, iggGrade: 0, status: "observe", note: "不作為主要 Omega-3 來源，≤2次/週" },
  { name: "豌豆", ige: 0, igg: 1042, iggGrade: 0, status: "observe" },
  { name: "杏仁", ige: 0, igg: 930, iggGrade: 0, status: "observe", note: "≤2次/週" },
  { name: "蕎麥", ige: 0, igg: 880, iggGrade: 0, status: "observe", note: "≤2次/週" },
  { name: "綠豆", ige: 0, igg: 645, iggGrade: 0, status: "observe" },
  { name: "大蒜", ige: 0, igg: 394, iggGrade: 0, status: "observe" },
  { name: "米飯", ige: 20, igg: 419, iggGrade: 0, status: "observe", note: "基本安全但 IgE 稍有反應" },
  { name: "草莓", ige: 0, igg: 200, iggGrade: 0, status: "observe" },
  { name: "茶", ige: 0, igg: 188, iggGrade: 0, status: "observe", note: "適量即可" },
  { name: "萵苣", ige: 0, igg: 178, iggGrade: 0, status: "observe" },
  { name: "紅豆", ige: 0, igg: 123, iggGrade: 0, status: "observe" },
  { name: "木瓜", ige: 0, igg: 120, iggGrade: 0, status: "observe" },
  { name: "海帶", ige: 0, igg: 102, iggGrade: 0, status: "observe" },
  { name: "芭樂", ige: 0, igg: 95, iggGrade: 0, status: "observe" },
  { name: "雞肉", ige: 0, igg: 0, iggGrade: 0, status: "safe" },
  { name: "豬肉", ige: 0, igg: 0, iggGrade: 0, status: "safe" },
  { name: "雞蛋", ige: 0, igg: 0, iggGrade: 0, status: "safe" },
  { name: "白飯", ige: 20, igg: 419, iggGrade: 0, status: "safe", note: "IgE 微量但臨床安全" },
  { name: "地瓜", ige: 0, igg: 0, iggGrade: 0, status: "safe" },
  { name: "芋頭", ige: 0, igg: 0, iggGrade: 0, status: "safe" },
  { name: "核桃", ige: 0, igg: 0, iggGrade: 0, status: "safe" },
  { name: "香蕉", ige: 0, igg: 0, iggGrade: 0, status: "safe" },
  { name: "高麗菜", ige: 0, igg: 0, iggGrade: 0, status: "safe" },
  { name: "菠菜", ige: 0, igg: 0, iggGrade: 0, status: "safe" },
  { name: "南瓜", ige: 0, igg: 0, iggGrade: 0, status: "safe" },
  { name: "小黃瓜", ige: 0, igg: 0, iggGrade: 0, status: "safe" },
  { name: "蘆筍", ige: 0, igg: 0, iggGrade: 0, status: "safe" },
  { name: "竹筍", ige: 0, igg: 0, iggGrade: 0, status: "safe" },
  { name: "黃豆", ige: 0, igg: 0, iggGrade: 0, status: "safe" },
  { name: "豆漿", ige: 0, igg: 0, iggGrade: 0, status: "safe" },
  { name: "椰子", ige: 0, igg: 0, iggGrade: 0, status: "safe" },
  { name: "椰奶", ige: 0, igg: 0, iggGrade: 0, status: "safe" },
  { name: "可可豆", ige: 0, igg: 0, iggGrade: 0, status: "safe" },
  { name: "橄欖油", ige: 0, igg: 0, iggGrade: 0, status: "safe" },
  { name: "椰子油", ige: 0, igg: 0, iggGrade: 0, status: "safe" },
  { name: "酪梨", ige: 0, igg: 0, iggGrade: 0, status: "safe" },
  { name: "西瓜", ige: 0, igg: 0, iggGrade: 0, status: "safe" },
  { name: "梨", ige: 0, igg: 0, iggGrade: 0, status: "safe" },
  { name: "黑咖啡", ige: 0, igg: 0, iggGrade: 0, status: "safe" },
];

const STATUS_ORDER: FoodStatus[] = ["banned", "rotation", "observe", "safe"];

const STATUS_CONFIG: Record<FoodStatus, { label: string; bg: string; text: string }> = {
  safe:     { label: "✅ 安全", bg: "bg-[#EEF6F1]", text: "text-[#6B9E78]" },
  rotation: { label: "🔄 輪替", bg: "bg-[#FFF3E0]", text: "text-[#D4A24E]" },
  observe:  { label: "⚠️ 觀察", bg: "bg-[#F5F0EB]", text: "text-[#8B7D6B]" },
  banned:   { label: "🚫 停食", bg: "bg-[#FDECEA]", text: "text-[#E8734A]" },
};

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

// ── Restaurant data ───────────────────────────────────────────
interface Restaurant {
  id: string;
  name: string;
  emoji: string;
  safe: string[];
  avoid: string[];
}

const RESTAURANTS: Restaurant[] = [
  {
    id: "mos",
    name: "摩斯漢堡",
    emoji: "🍔",
    safe:  ["米漢堡（去洋蔥）", "烤雞", "玉米濃湯", "無糖紅茶"],
    avoid: ["小麥麵包漢堡", "洋蔥圈", "薯條"],
  },
  {
    id: "mcdonalds",
    name: "麥當勞",
    emoji: "🍟",
    safe:  ["嫩煎雞腿排（不夾麵包）", "沙拉", "無糖紅茶"],
    avoid: ["漢堡麵包", "薯條", "麥克雞塊（裹粉=小麥）"],
  },
  {
    id: "subway",
    name: "Subway",
    emoji: "🥗",
    safe:  ["沙拉碗（不要麵包）", "雞胸肉（避洋蔥）"],
    avoid: ["麵包體", "美乃滋"],
  },
  {
    id: "kfc",
    name: "肯德基",
    emoji: "🍗",
    safe:  ["烤雞（如有）", "玉米"],
    avoid: ["炸雞（裹粉=小麥）", "薯條"],
  },
  {
    id: "convenience",
    name: "便利商店",
    emoji: "🏪",
    safe:  ["茶葉蛋", "即食雞胸肉", "無糖豆漿", "地瓜", "無調味堅果（確認無腰果）", "香蕉", "黑咖啡"],
    avoid: ["麵包／三明治", "鮪魚飯糰", "含糖飲料", "含腰果堅果包", "炸物"],
  },
  {
    id: "buffet",
    name: "自助餐",
    emoji: "🍱",
    safe:  ["白飯（半碗）", "滷雞腿／滷豬肉", "炒高麗菜／炒菠菜", "滷蛋"],
    avoid: ["炸排骨（裹粉）", "炒洋蔥", "鮪魚料理"],
  },
];

// ── Tabs & helpers ────────────────────────────────────────────
type Mode      = "food" | "restaurant";
type FilterTab = "all" | FoodStatus;

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "all",      label: "全部" },
  { key: "banned",   label: "🚫 停食" },
  { key: "rotation", label: "🔄 輪替" },
  { key: "observe",  label: "⚠️ 觀察" },
  { key: "safe",     label: "✅ 安全" },
];

function todayLabel(): string {
  const d = new Date();
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

// ── Page ─────────────────────────────────────────────────────
export default function ScanPage() {
  const [mode,     setMode]     = useState<Mode>("food");
  const [query,    setQuery]    = useState("");
  const [tab,      setTab]      = useState<FilterTab>("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const filtered = FOOD_DATABASE
    .filter((f) => f.name.includes(query) && (tab === "all" || f.status === tab))
    .sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status));

  return (
    <>
      {/* ── Fixed header ── */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md z-10 bg-[#FFF8F0] px-4 pt-4 pb-2 border-b border-stone-100">

        {/* Title row */}
        <div className="flex items-baseline justify-between mb-3">
          <h1 className="text-xl font-bold text-[#D4A24E]">食物安全掃描器</h1>
          <span className="text-xs text-[#8B7D6B]">{todayLabel()}</span>
        </div>

        {/* Mode tabs */}
        <div className="flex gap-2 mb-3">
          {([["food","食物查詢"],["restaurant","外食模式"]] as [Mode, string][]).map(([m, label]) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="flex-1 py-1.5 rounded-full text-xs font-semibold transition-colors"
              style={mode === m
                ? { backgroundColor: "#D4A24E", color: "#fff" }
                : { backgroundColor: "#fff", color: "#8B7D6B", border: "1px solid #F0EBE4" }}
            >{label}</button>
          ))}
        </div>

        {/* Food mode: search + filter tabs */}
        {mode === "food" && (
          <>
            <input
              type="search"
              placeholder="搜尋食物名稱…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-white rounded-2xl px-4 py-2.5 text-sm outline-none border border-stone-100 focus:border-[#D4A24E] transition-colors placeholder:text-[#C4B8AC] mb-2.5"
            />
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {FILTER_TABS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`shrink-0 text-xs font-medium px-3 py-1 rounded-full transition-colors ${
                    tab === key ? "bg-[#D4A24E] text-white" : "bg-white text-[#8B7D6B] border border-stone-100"
                  }`}
                >{label}</button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Content ── */}
      {mode === "food" ? (
        <main className="pt-[204px] pb-24 px-4 max-w-md mx-auto">
          {filtered.length === 0 ? (
            <p className="text-center text-[#8B7D6B] text-sm pt-12">
              {query ? `找不到「${query}」` : "此分類目前沒有食物"}
            </p>
          ) : (
            <ul className="flex flex-col gap-2 pt-2">
              {filtered.map((food) => {
                const cfg  = STATUS_CONFIG[food.status];
                const days = food.banUntil ? daysUntil(food.banUntil) : null;
                const cardBg =
                  food.status === "safe"     ? "bg-[#6B9E7814]" :
                  food.status === "banned"   ? "bg-[#E8734A14]" :
                  food.status === "rotation" ? "bg-[#D4A24E14]" : "bg-white";
                return (
                  <li
                    key={food.name}
                    className={`rounded-2xl px-4 py-2.5 shadow-sm ${cardBg}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-[#1A1A1A]">{food.name}</span>
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full whitespace-nowrap ${cfg.bg} ${cfg.text}`}>
                        {cfg.label}
                      </span>
                    </div>
                    {food.status === "banned" && days !== null && (
                      <p className={`text-xs mt-0.5 ${days > 0 ? "text-[#E8734A]" : "text-[#6B9E78]"}`}>
                        {days > 0 ? `還剩 ${days} 天` : "停食期已到"}
                      </p>
                    )}
                    {food.status === "rotation" && food.rotationDays && (
                      <p className="text-xs text-[#D4A24E] mt-0.5">每 {food.rotationDays} 天 1 次</p>
                    )}
                    {food.note && (
                      <p className="text-xs text-[#8B7D6B] mt-0.5">{food.note}</p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </main>
      ) : (
        <main className="pt-[116px] pb-24 px-4 max-w-md mx-auto w-full flex flex-col gap-2">
          {RESTAURANTS.map((r) => {
            const open = expanded.has(r.id);
            return (
              <div key={r.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {/* Restaurant header */}
                <button
                  onClick={() => toggleExpand(r.id)}
                  className="w-full flex items-center justify-between px-4 py-3.5"
                >
                  <span className="text-sm font-semibold text-[#1A1A1A]">
                    {r.emoji} {r.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#8B7D6B]">
                      ✅{r.safe.length} 🚫{r.avoid.length}
                    </span>
                    <span
                      className="text-[#8B7D6B] text-xs transition-transform inline-block"
                      style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
                    >▾</span>
                  </div>
                </button>

                {/* Expanded content */}
                {open && (
                  <div className="px-4 pb-4 border-t border-stone-50 space-y-3 pt-3">
                    {/* Safe items */}
                    <div>
                      <p className="text-[10px] font-semibold text-[#6B9E78] uppercase tracking-wide mb-1.5">可以吃</p>
                      <ul className="space-y-1">
                        {r.safe.map((item) => (
                          <li key={item} className="flex items-start gap-2">
                            <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-[#6B9E78]" />
                            <span className="text-sm text-[#1A1A1A]">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    {/* Avoid items */}
                    <div>
                      <p className="text-[10px] font-semibold text-[#E8734A] uppercase tracking-wide mb-1.5">避開</p>
                      <ul className="space-y-1">
                        {r.avoid.map((item) => (
                          <li key={item} className="flex items-start gap-2">
                            <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-[#E8734A]" />
                            <span className="text-sm text-[#8B7D6B]">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </main>
      )}

      <BottomNav />
    </>
  );
}
