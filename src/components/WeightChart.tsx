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

  const areaPath =
    maPath +
    ` L${x(ma.length - 1).toFixed(1)},${H - PAD.b} L${x(0).toFixed(1)},${H - PAD.b} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      <defs>
        <linearGradient id="maFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(43,255,168,0.22)" />
          <stop offset="100%" stopColor="rgba(43,255,168,0)" />
        </linearGradient>
        <filter id="lineGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.4" floodColor="#2bffa8" floodOpacity="0.8" />
        </filter>
      </defs>

      {/* 目標帶 62–64 */}
      <rect
        x={PAD.l} width={W - PAD.l - PAD.r}
        y={y(PROFILE.targetHigh)} height={Math.max(0, y(PROFILE.targetLow) - y(PROFILE.targetHigh))}
        fill="rgba(43,255,168,0.06)" stroke="rgba(43,255,168,0.25)" strokeDasharray="4 4" strokeWidth="1" rx="3"
      />
      <text x={W - PAD.r - 4} y={y(PROFILE.targetHigh) + 12} textAnchor="end" fontSize="9" fill="var(--green)" style={{ fontFamily: "var(--font-jbmono)" }}>
        TARGET {PROFILE.targetLow}–{PROFILE.targetHigh}
      </text>

      {ticks.map((k) => (
        <g key={k}>
          <line x1={PAD.l} x2={W - PAD.r} y1={y(k)} y2={y(k)} stroke="rgba(120,255,190,0.08)" strokeWidth="1" />
          <text x={PAD.l - 5} y={y(k) + 3} textAnchor="end" fontSize="9" fill="var(--muted)" style={{ fontFamily: "var(--font-jbmono)" }}>{k}</text>
        </g>
      ))}

      {/* 均線下方漸層 */}
      <path d={areaPath} fill="url(#maFill)" />

      {/* 每日點 */}
      {sorted.map((p, i) => (
        <circle key={p.date} cx={x(i)} cy={y(p.kg)} r="2.2" fill="var(--muted)" opacity="0.6" />
      ))}

      {/* 七日均線（磷光） */}
      <path d={maPath} fill="none" stroke="var(--green)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" filter="url(#lineGlow)" />

      {/* 最新點 */}
      <circle cx={x(ma.length - 1)} cy={y(ma[ma.length - 1].kg)} r="3.5" fill="var(--green)" filter="url(#lineGlow)" />

      {/* 首尾日期 */}
      <text x={PAD.l} y={H - 6} fontSize="9" fill="var(--muted)" style={{ fontFamily: "var(--font-jbmono)" }}>{sorted[0].date.slice(5)}</text>
      <text x={W - PAD.r} y={H - 6} textAnchor="end" fontSize="9" fill="var(--muted)" style={{ fontFamily: "var(--font-jbmono)" }}>{sorted[sorted.length - 1].date.slice(5)}</text>
    </svg>
  );
}
