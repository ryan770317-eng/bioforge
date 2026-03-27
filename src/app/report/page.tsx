"use client";
import { useState } from "react";
import BottomNav from "@/components/BottomNav";

type Period = "7" | "30" | "90";

// ── Hardcoded demo data ──────────────────────────────────────
const WATER_7D = [1500, 1750, 2000, 1500, 1250, 2000, 1750];
const WATER_GOAL = 2000;

const METRICS: Record<Period, { water: number; protein: number; cravings: number; energy: number }> = {
  "7":  { water: 1679, protein: 78, cravings: 1.4, energy: 3.6 },
  "30": { water: 1720, protein: 82, cravings: 1.1, energy: 3.8 },
  "90": { water: 1650, protein: 75, cravings: 1.7, energy: 3.4 },
};

const MILESTONES = [
  { name: "腰果",   emoji: "🥜", banFrom: "2026-01-01", banUntil: "2026-09-20" },
  { name: "奇異果", emoji: "🥝", banFrom: "2026-01-01", banUntil: "2026-09-20" },
  { name: "鮪魚",   emoji: "🐟", banFrom: "2026-01-01", banUntil: "2026-06-20" },
  { name: "小麥",   emoji: "🌾", banFrom: "2026-01-01", banUntil: null },
];

// ── Helpers ──────────────────────────────────────────────────
function daysBetween(a: string, b: string): number {
  const da = new Date(a), db = new Date(b);
  da.setHours(0, 0, 0, 0); db.setHours(0, 0, 0, 0);
  return Math.round((db.getTime() - da.getTime()) / 86400000);
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function dateRangeLabel(period: Period): string {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - parseInt(period) + 1);
  const fmt = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
  return `${fmt(start)} – ${fmt(end)}`;
}

function last7DayLabels(): string[] {
  const names = ["日", "一", "二", "三", "四", "五", "六"];
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return names[d.getDay()];
  });
}

// ── Sub-components ────────────────────────────────────────────
function MetricCard({
  label, value, sub, color, pct,
}: {
  label: string; value: string; sub: string; color: string; pct: number | null;
}) {
  return (
    <div className="bg-white rounded-2xl px-4 py-3 shadow-sm">
      <p className="text-[10px] text-[#8B7D6B] mb-1">{label}</p>
      <p className="text-lg font-bold leading-none" style={{ color }}>{value}</p>
      <p className="text-[10px] text-[#8B7D6B] mt-1">{sub}</p>
      {pct !== null && (
        <div className="h-1.5 bg-stone-100 rounded-full mt-2 overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${Math.min(pct * 100, 100)}%`, backgroundColor: color }}
          />
        </div>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────
export default function ReportPage() {
  const [period, setPeriod] = useState<Period>("7");
  const m = METRICS[period];
  const dayLabels = last7DayLabels();
  const today = todayStr();

  return (
    <>
      {/* Fixed header */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md z-10 bg-[#FFF8F0] px-4 pt-4 pb-3 border-b border-stone-100">
        <div className="flex items-baseline justify-between mb-3">
          <h1 className="text-xl font-bold text-[#D4A24E]">週報</h1>
          <span className="text-xs text-[#8B7D6B]">{dateRangeLabel(period)}</span>
        </div>
        <div className="flex gap-2">
          {(["7", "30", "90"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="text-xs font-medium px-4 py-1.5 rounded-full transition-colors"
              style={
                period === p
                  ? { backgroundColor: "#D4A24E", color: "#fff" }
                  : { backgroundColor: "#fff", color: "#8B7D6B", border: "1px solid #F0EBE4" }
              }
            >
              {p} 天
            </button>
          ))}
        </div>
      </div>

      <main className="pt-[108px] pb-24 px-4 max-w-md mx-auto space-y-4">

        {/* Core metrics */}
        <section>
          <h2 className="text-xs font-semibold text-[#8B7D6B] uppercase tracking-wide mb-2 px-1">核心指標</h2>
          <div className="grid grid-cols-2 gap-2">
            <MetricCard
              label="平均飲水"
              value={`${m.water} ml`}
              sub="目標 2000 ml"
              color="#6B9E78"
              pct={m.water / WATER_GOAL}
            />
            <MetricCard
              label="平均蛋白質"
              value={`${m.protein} g`}
              sub="目標 105 g"
              color="#D4A24E"
              pct={m.protein / 105}
            />
            <MetricCard
              label="渴望次數"
              value={`${m.cravings} 次/天`}
              sub="越低越好"
              color="#E8734A"
              pct={null}
            />
            <MetricCard
              label="下午精神"
              value={`${m.energy} / 5`}
              sub="平均評分"
              color="#D4A24E"
              pct={m.energy / 5}
            />
          </div>
        </section>

        {/* Bar chart — only 7-day */}
        {period === "7" ? (
          <section className="bg-white rounded-2xl px-4 pt-4 pb-3 shadow-sm">
            <h2 className="text-sm font-semibold text-[#1A1A1A] mb-4">💧 飲水趨勢（7天）</h2>
            <div className="flex items-end gap-1.5" style={{ height: 80 }}>
              {WATER_7D.map((ml, i) => {
                const pct = ml / WATER_GOAL;
                const isToday = i === 6;
                const reached = ml >= WATER_GOAL;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full">
                    <div className="flex-1 w-full flex items-end">
                      <div
                        className="w-full rounded-t-md transition-all"
                        style={{
                          height: `${pct * 100}%`,
                          backgroundColor: isToday
                            ? "#D4A24E"
                            : reached
                            ? "#6B9E78"
                            : "#D4A24E4D",
                        }}
                      />
                    </div>
                    <span className="text-[9px] text-[#8B7D6B] leading-none">{dayLabels[i]}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-1.5 px-0.5">
              <span className="text-[9px] text-[#8B7D6B]">0</span>
              <span className="text-[9px] text-[#8B7D6B]">目標 {WATER_GOAL} ml</span>
            </div>
            {/* Legend */}
            <div className="flex gap-4 mt-2 px-0.5">
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-sm bg-[#6B9E78]" />
                <span className="text-[9px] text-[#8B7D6B]">達標</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-sm bg-[#D4A24E]" />
                <span className="text-[9px] text-[#8B7D6B]">今天</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-sm bg-[#D4A24E4D]" />
                <span className="text-[9px] text-[#8B7D6B]">未達標</span>
              </div>
            </div>
          </section>
        ) : (
          <section className="bg-white rounded-2xl px-4 py-6 shadow-sm flex items-center justify-center">
            <p className="text-sm text-[#8B7D6B]">趨勢圖將在後續版本推出 📈</p>
          </section>
        )}

        {/* Milestones */}
        <section>
          <h2 className="text-xs font-semibold text-[#8B7D6B] uppercase tracking-wide mb-2 px-1">🏅 停食里程碑</h2>
          <div className="space-y-2">
            {MILESTONES.map(({ name, emoji, banFrom, banUntil }) => {
              const elapsed = daysBetween(banFrom, today);
              const remaining = banUntil ? daysBetween(today, banUntil) : null;
              return (
                <div
                  key={name}
                  className="bg-white rounded-2xl px-4 py-3 shadow-sm flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-[#1A1A1A]">
                      {emoji} 停食{name}
                    </p>
                    <p className="text-xs text-[#8B7D6B] mt-0.5">
                      {remaining !== null
                        ? remaining > 0
                          ? `還剩 ${remaining} 天解禁`
                          : "解禁期已到 🎉"
                        : "永久停食"}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-[#D4A24E]">{elapsed}</span>
                    <span className="text-xs text-[#8B7D6B] ml-0.5">天</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </main>

      <BottomNav />
    </>
  );
}
