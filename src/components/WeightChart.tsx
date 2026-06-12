"use client";

import { ma7, type WeightPoint } from "@/lib/calc";
import { PROFILE } from "@/lib/profile";

/** 體重圖：每日點 + 七日均線 + 目標帶（純 SVG，無套件） */
export default function WeightChart({ points, days }: { points: WeightPoint[]; days: number }) {
  const W = 340, H = 200, PAD = { t: 12, r: 8, b: 22, l: 34 };

  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date)).slice(-days);
  if (sorted.length < 2) {
    return (
      <div className="flex h-[200px] items-center justify-center text-sm text-muted">
        量兩天體重就有圖了
      </div>
    );
  }

  const ma = ma7(sorted);
  const kgs = sorted.map((p) => p.kg);
  const yMin = Math.min(PROFILE.targetLow, Math.min(...kgs)) - 0.5;
  const yMax = Math.max(...kgs, PROFILE.startWeightKg) + 0.5;

  const x = (i: number) => PAD.l + (i / (sorted.length - 1)) * (W - PAD.l - PAD.r);
  const y = (kg: number) => PAD.t + (1 - (kg - yMin) / (yMax - yMin)) * (H - PAD.t - PAD.b);

  const maPath = ma.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.kg).toFixed(1)}`).join(" ");

  // y 軸刻度：整數 kg
  const ticks: number[] = [];
  for (let k = Math.ceil(yMin); k <= Math.floor(yMax); k++) ticks.push(k);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {/* 目標帶 62–64 */}
      <rect
        x={PAD.l} width={W - PAD.l - PAD.r}
        y={y(PROFILE.targetHigh)} height={Math.max(0, y(PROFILE.targetLow) - y(PROFILE.targetHigh))}
        fill="var(--green-soft)" opacity="0.7" rx="4"
      />
      <text x={W - PAD.r - 4} y={y(PROFILE.targetHigh) + 12} textAnchor="end" fontSize="9" fill="var(--green)">
        目標 {PROFILE.targetLow}–{PROFILE.targetHigh}
      </text>

      {ticks.map((k) => (
        <g key={k}>
          <line x1={PAD.l} x2={W - PAD.r} y1={y(k)} y2={y(k)} stroke="#e8dfcc" strokeWidth="1" />
          <text x={PAD.l - 5} y={y(k) + 3} textAnchor="end" fontSize="9" fill="var(--muted)">{k}</text>
        </g>
      ))}

      {/* 每日點 */}
      {sorted.map((p, i) => (
        <circle key={p.date} cx={x(i)} cy={y(p.kg)} r="2.4" fill="var(--muted)" opacity="0.55" />
      ))}

      {/* 七日均線 */}
      <path d={maPath} fill="none" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* 首尾日期 */}
      <text x={PAD.l} y={H - 6} fontSize="9" fill="var(--muted)">{sorted[0].date.slice(5)}</text>
      <text x={W - PAD.r} y={H - 6} textAnchor="end" fontSize="9" fill="var(--muted)">{sorted[sorted.length - 1].date.slice(5)}</text>
    </svg>
  );
}
