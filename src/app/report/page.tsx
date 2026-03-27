"use client";
import { useState, useEffect } from "react";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";

type Period = "7" | "30" | "90";

const WATER_GOAL = 2000;

const MILESTONES = [
  { name: "腰果",   emoji: "🥜", banFrom: "2026-01-01", banUntil: "2026-09-20" },
  { name: "奇異果", emoji: "🥝", banFrom: "2026-01-01", banUntil: "2026-09-20" },
  { name: "鮪魚",   emoji: "🐟", banFrom: "2026-01-01", banUntil: "2026-06-20" },
  { name: "小麥",   emoji: "🌾", banFrom: "2026-01-01", banUntil: null },
];

// ── Helpers ──────────────────────────────────────────────────
function localDate(daysAgo = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a), db = new Date(b);
  da.setHours(0, 0, 0, 0); db.setHours(0, 0, 0, 0);
  return Math.round((db.getTime() - da.getTime()) / 86400000);
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

function avgInt(arr: number[]): number {
  return arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
}

function avgFloat(arr: number[]): number {
  return arr.length
    ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10
    : 0;
}

// ── Sub-components ────────────────────────────────────────────
function MetricCard({ label, value, sub, color, barColor, pct }: {
  label: string; value: string; sub: string; color: string; barColor: string; pct: number | null;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex">
      <div className="w-1 shrink-0" style={{ backgroundColor: barColor }} />
      <div className="flex-1 px-4 py-3">
        <p className="text-[10px] text-[#8B7D6B] mb-1">{label}</p>
        <p className="text-lg font-bold leading-none" style={{ color }}>{value}</p>
        <p className="text-[10px] text-[#8B7D6B] mt-1">{sub}</p>
        {pct !== null && (
          <div className="h-1.5 bg-stone-100 rounded-full mt-2 overflow-hidden">
            <div className="h-full rounded-full transition-all"
              style={{ width: `${Math.min(pct * 100, 100)}%`, backgroundColor: color }} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────
export default function ReportPage() {
  const [period, setPeriod] = useState<Period>("7");
  const [loading, setLoading] = useState(true);
  const [water7,   setWater7]   = useState<number[]>(Array(7).fill(0));
  const [protein7, setProtein7] = useState<number[]>(Array(7).fill(0));
  const [craving7, setCraving7] = useState<number[]>(Array(7).fill(0));
  const [energy7,  setEnergy7]  = useState<(number | null)[]>(Array(7).fill(null));

  const dayLabels = last7DayLabels();
  const today = localDate();

  useEffect(() => {
    async function load() {
      setLoading(true);
      const dates = Array.from({ length: 7 }, (_, i) => localDate(6 - i));

      const { data } = await supabase
        .from("daily_logs")
        .select("date, water_ml, protein_g, craving_count, afternoon_energy")
        .in("date", dates);

      const map = new Map((data ?? []).map((r) => [r.date, r]));

      setWater7(  dates.map((d) => map.get(d)?.water_ml      ?? 0));
      setProtein7(dates.map((d) => map.get(d)?.protein_g     ?? 0));
      setCraving7(dates.map((d) => map.get(d)?.craving_count ?? 0));
      setEnergy7( dates.map((d) => map.get(d)?.afternoon_energy ?? null));
      setLoading(false);
    }
    load();
  }, []);

  const energyFilled = energy7.filter((v): v is number => v !== null);
  const metrics = {
    water:    avgInt(water7),
    protein:  avgInt(protein7),
    cravings: avgFloat(craving7),
    energy:   energyFilled.length ? avgFloat(energyFilled) : null,
  };

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
            <button key={p} onClick={() => setPeriod(p)}
              className="text-xs font-medium px-4 py-1.5 rounded-full transition-colors"
              style={period === p
                ? { backgroundColor: "#D4A24E", color: "#fff" }
                : { backgroundColor: "#fff", color: "#8B7D6B", border: "1px solid #F0EBE4" }}
            >{p} 天</button>
          ))}
        </div>
      </div>

      <main className="pt-[108px] pb-24 px-4 max-w-md mx-auto space-y-4">

        {loading ? (
          <div className="flex flex-col items-center justify-center pt-20 gap-3">
            <div className="w-7 h-7 rounded-full animate-spin"
              style={{ border: "3px solid #F5E6CC", borderTopColor: "#D4A24E" }} />
            <p className="text-xs text-[#8B7D6B]">載入資料中…</p>
          </div>
        ) : (
          <>
            {/* Core metrics */}
            <section>
              <h2 className="text-xs font-semibold text-[#8B7D6B] uppercase tracking-wide mb-2 px-1">
                核心指標（近 {period} 天平均）
              </h2>
              <div className="grid grid-cols-2 gap-2">
                <MetricCard
                  label="平均飲水" value={`${metrics.water} ml`}
                  sub="目標 2000 ml" color="#6B9E78" barColor="#5B8CE8"
                  pct={metrics.water / WATER_GOAL}
                />
                <MetricCard
                  label="平均蛋白質" value={`${metrics.protein} g`}
                  sub="目標 105 g" color="#D4A24E" barColor="#6B9E78"
                  pct={metrics.protein / 105}
                />
                <MetricCard
                  label="渴望次數" value={`${metrics.cravings} 次/天`}
                  sub="越低越好" color="#E8734A" barColor="#E8734A" pct={null}
                />
                <MetricCard
                  label="下午精神"
                  value={metrics.energy !== null ? `${metrics.energy} / 5` : "—"}
                  sub={metrics.energy !== null ? "平均評分" : "尚無資料"}
                  color="#D4A24E" barColor="#D4A24E"
                  pct={metrics.energy !== null ? metrics.energy / 5 : null}
                />
              </div>
            </section>

            {/* Bar chart — 7-day only uses real data */}
            {period === "7" ? (
              <section className="bg-white rounded-2xl px-4 pt-4 pb-3 shadow-sm">
                <h2 className="text-sm font-semibold text-[#1A1A1A] mb-4">💧 飲水趨勢（7天）</h2>
                <div className="flex items-end gap-1.5" style={{ height: 80 }}>
                  {water7.map((ml, i) => {
                    const pct = ml / WATER_GOAL;
                    const isToday = i === 6;
                    const reached = ml >= WATER_GOAL;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full">
                        <div className="flex-1 w-full flex items-end">
                          <div className="w-full rounded-t-md transition-all"
                            style={{
                              height: ml > 0 ? `${pct * 100}%` : "3px",
                              backgroundColor: isToday ? "#D4A24E"
                                : reached ? "#6B9E78"
                                : ml > 0 ? "#D4A24E4D" : "#F0EBE4",
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
                <div className="flex gap-4 mt-2 px-0.5">
                  {[["#6B9E78","達標"],["#D4A24E","今天"],["#D4A24E4D","未達標"]].map(([c,l]) => (
                    <div key={l} className="flex items-center gap-1">
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: c }} />
                      <span className="text-[9px] text-[#8B7D6B]">{l}</span>
                    </div>
                  ))}
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
                  const elapsed   = daysBetween(banFrom, today);
                  const total     = banUntil ? daysBetween(banFrom, banUntil) : null;
                  const remaining = banUntil ? daysBetween(today, banUntil) : null;
                  const pct       = total && total > 0 ? Math.min(elapsed / total, 1) : null;
                  return (
                    <div key={name} className="bg-white rounded-2xl px-4 py-3 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-[#1A1A1A]">{emoji} 停食{name}</p>
                          <p className="text-xs text-[#8B7D6B] mt-0.5">
                            {remaining !== null
                              ? remaining > 0 ? `還剩 ${remaining} 天解禁` : "解禁期已到 🎉"
                              : "永久停食"}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-bold text-[#D4A24E]">{elapsed}</span>
                          <span className="text-xs text-[#8B7D6B] ml-0.5">天</span>
                        </div>
                      </div>
                      {pct !== null && (
                        <div className="mt-2">
                          <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-[#D4A24E] transition-all"
                              style={{ width: `${pct * 100}%` }} />
                          </div>
                          <p className="text-[9px] text-[#8B7D6B] mt-0.5 text-right">
                            已撐過 {elapsed} 天 / 共 {total} 天
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </main>

      <BottomNav />
    </>
  );
}
