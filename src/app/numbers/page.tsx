"use client";

import { useEffect, useState } from "react";
import WeightChart from "@/components/WeightChart";
import { isMissingTable, listEvents, type Ev } from "@/lib/db";
import {
  addDays, age, bmr, currentWeight, proteinTarget, targetKcal, tdee, todayStr, type WeightPoint,
} from "@/lib/calc";
import { PROFILE } from "@/lib/profile";

export default function NumbersPage() {
  const today = todayStr();
  const [events, setEvents] = useState<Ev[]>([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [dbMissing, setDbMissing] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setEvents(await listEvents(["weight", "steps", "craving"], addDays(today, -120), today));
      } catch (e) {
        if (isMissingTable(e)) setDbMissing(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [today]);

  const weights: WeightPoint[] = events
    .filter((e) => e.type === "weight")
    .map((e) => ({ date: e.date, kg: (e.data as { kg: number }).kg }));

  const w7 = currentWeight(weights);
  const lost = Math.round((PROFILE.startWeightKg - w7) * 10) / 10;
  const toGo = Math.round((w7 - PROFILE.targetHigh) * 10) / 10;

  // 週速率：近 7 天均 vs 前 7 天均
  const last14 = [...weights].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 14);
  const recent = last14.slice(0, 7), prev = last14.slice(7);
  const rate =
    recent.length >= 3 && prev.length >= 3
      ? ((recent.reduce((s, p) => s + p.kg, 0) / recent.length -
          prev.reduce((s, p) => s + p.kg, 0) / prev.length) /
          (prev.reduce((s, p) => s + p.kg, 0) / prev.length)) * 100
      : null;

  const steps14 = events.filter((e) => e.type === "steps" && e.date > addDays(today, -14));
  const stepsAvg = steps14.length
    ? Math.round(steps14.reduce((s, e) => s + ((e.data as { steps: number }).steps ?? 0), 0) / steps14.length)
    : null;

  // 嘴饞 pattern（30天）
  const cravings = events.filter((e) => e.type === "craving" && e.date > addDays(today, -30));
  const resisted = cravings.filter((e) => (e.data as { resisted?: boolean }).resisted).length;
  const hourBuckets: Record<string, number> = {};
  cravings.forEach((c) => {
    const h = (c.data as { hour?: number }).hour;
    if (h === undefined) return;
    const bucket = h < 12 ? "早上" : h < 15 ? "中午" : h < 18 ? "下午" : h < 22 ? "晚上" : "深夜";
    hourBuckets[bucket] = (hourBuckets[bucket] ?? 0) + 1;
  });
  const topBucket = Object.entries(hourBuckets).sort((a, b) => b[1] - a[1])[0];

  if (loading) return <div className="py-20 text-center text-muted animate-pulse-soft">載入中…</div>;

  return (
    <main className="stagger space-y-4">
      <header className="pt-2">
        <div className="hud-label flex items-center gap-2"><span className="live-dot" />BIOMETRIC TELEMETRY</div>
        <h1 className="font-display glow mt-1 text-3xl font-bold text-green">數字</h1>
        <p className="text-xs text-muted">看趨勢，不看單日。水分一天能晃 1 公斤，七日均線才是真的。</p>
      </header>

      {dbMissing && (
        <div className="card border border-warn/40 p-4 text-sm">資料庫還沒初始化，到「更多」頁照步驟設定。</div>
      )}

      {/* 主數字 */}
      <div className="card brackets grid grid-cols-3 divide-x divide-line py-4 text-center">
        <div>
          <div className="font-display glow text-2xl font-bold text-green">{w7}</div>
          <div className="text-[11px] text-muted">七日均重</div>
        </div>
        <div>
          <div className="font-display text-2xl font-bold">{lost > 0 ? `-${lost}` : lost === 0 ? "0" : `+${-lost}`}</div>
          <div className="text-[11px] text-muted">vs 起點 {PROFILE.startWeightKg}</div>
        </div>
        <div>
          <div className="font-display text-2xl font-bold">{toGo > 0 ? toGo : "🎉"}</div>
          <div className="text-[11px] text-muted">{toGo > 0 ? `離 ${PROFILE.targetHigh} 還有` : "到目標帶了"}</div>
        </div>
      </div>

      {/* 圖表 */}
      <div className="card p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="hud-label">WEIGHT TREND</h2>
          <div className="flex gap-1">
            {[30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`rounded-full px-3 py-1 text-[11px] ${days === d ? "bg-green font-bold text-[#06120c] glow-box" : "bg-card-soft text-muted"}`}
              >
                {d}天
              </button>
            ))}
          </div>
        </div>
        <WeightChart points={weights} days={days} />
        {rate !== null && (
          <div className="mt-1 text-center text-[11px] text-muted">
            最近一週速率 <span className={`font-bold ${rate < 0 ? "text-green" : "text-warn"}`}>{rate.toFixed(2)}%</span>
            （健康區間 -0.5 ～ -1%/週）
          </div>
        )}
      </div>

      {/* TDEE 卡（自動隨體重重算）*/}
      <div className="card space-y-2 p-4 text-sm">
        <h2 className="hud-label">ENERGY TARGET · 隨七日均重自動重算</h2>
        <div className="flex justify-between"><span className="text-muted">基礎代謝 BMR</span><span className="font-display font-bold">{bmr(w7)} kcal</span></div>
        <div className="flex justify-between"><span className="text-muted">TDEE（×{PROFILE.activityFactor}）</span><span className="font-display font-bold">{tdee(w7)} kcal</span></div>
        <div className="flex justify-between text-green"><span>目標熱量（−{PROFILE.deficitKcal}）</span><span className="font-display font-bold">{targetKcal(w7)} kcal</span></div>
        <div className="flex justify-between"><span className="text-muted">蛋白質（{PROFILE.proteinPerKg} g/kg）</span><span className="font-display font-bold">{proteinTarget(w7)} g</span></div>
        <div className="flex justify-between"><span className="text-muted">走路</span><span className="font-display font-bold">{PROFILE.stepsGoal.toLocaleString()}+ 步</span></div>
        <p className="pt-1 text-[10px] leading-relaxed text-muted">
          Mifflin-St Jeor：10×體重 + 6.25×{PROFILE.heightCm} − 5×{age()} + 5。體重往下掉，目標會自動跟著降，不用手動調。
        </p>
      </div>

      {/* 步數 */}
      <div className="card flex items-center justify-between p-4">
        <div>
          <div className="hud-label">STEPS · 14D AVG</div>
          <div className="text-[11px] text-muted">Apple Watch 自動同步</div>
        </div>
        <div className="font-display text-2xl font-bold">{stepsAvg?.toLocaleString() ?? "—"}</div>
      </div>

      {/* 嘴饞 pattern */}
      <div className="card p-4">
        <h2 className="hud-label mb-2">CRAVING PATTERN · 30D</h2>
        {cravings.length === 0 ? (
          <p className="text-sm text-muted">還沒有 SOS 記錄。嘴饞時按下 SOS，這裡會浮現你的規律。</p>
        ) : (
          <div className="space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted">次數</span><span className="font-bold">{cravings.length} 次</span></div>
            <div className="flex justify-between"><span className="text-muted">擋下來</span><span className="font-bold text-green">{resisted} 次（{Math.round((resisted / cravings.length) * 100)}%）</span></div>
            {topBucket && (
              <div className="flex justify-between"><span className="text-muted">高危時段</span><span className="font-bold">{topBucket[0]}（{topBucket[1]} 次）</span></div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
