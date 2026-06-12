"use client";

import { useCallback, useEffect, useState } from "react";
import { listEvents, type Ev } from "@/lib/db";
import {
  addDays, avgWeight, currentPhase, currentWeight, proteinTarget, todayStr, weekOf, type WeightPoint,
} from "@/lib/calc";
import { PROFILE } from "@/lib/profile";

export default function WeekPage() {
  const today = todayStr();
  const [offset, setOffset] = useState(0); // 0=本週, 1=上週
  const [events, setEvents] = useState<Ev[]>([]);
  const [sharing, setSharing] = useState(false);

  const anchor = addDays(today, -offset * 7);
  const week = weekOf(anchor);
  const prevWeek = weekOf(addDays(week[0], -7));

  const load = useCallback(async () => {
    const wk = weekOf(addDays(today, -offset * 7));
    const pw = weekOf(addDays(wk[0], -7));
    try {
      setEvents(await listEvents(["meal", "weight", "steps", "craving", "bread"], pw[0], wk[6]));
    } catch {}
  }, [today, offset]);

  useEffect(() => { load(); }, [load]);

  // ── 本週統計 ──────────────────────────────────────────────
  const inWeek = (e: Ev) => week.includes(e.date);
  const weights: WeightPoint[] = events
    .filter((e) => e.type === "weight")
    .map((e) => ({ date: e.date, kg: (e.data as { kg: number }).kg }));

  const curAvg = avgWeight(weights, week);
  const prevAvg = avgWeight(weights, prevWeek);
  const rate = curAvg && prevAvg ? ((curAvg - prevAvg) / prevAvg) * 100 : null;

  const meals = events.filter((e) => e.type === "meal" && inWeek(e));
  const loggedDays = new Set(
    events.filter((e) => (e.type === "meal" || e.type === "weight") && inWeek(e)).map((e) => e.date)
  ).size;

  const protGoal = proteinTarget(currentWeight(weights));
  const protByDay: Record<string, number> = {};
  meals.forEach((m) => {
    protByDay[m.date] = (protByDay[m.date] ?? 0) + ((m.data as { protein_g?: number }).protein_g ?? 0);
  });
  const protDays = Object.values(protByDay).filter((g) => g >= protGoal * 0.85).length;

  const stepsList = events.filter((e) => e.type === "steps" && inWeek(e));
  const stepsAvg = stepsList.length
    ? Math.round(stepsList.reduce((s, e) => s + ((e.data as { steps: number }).steps ?? 0), 0) / stepsList.length)
    : null;

  const cravings = events.filter((e) => e.type === "craving" && inWeek(e));
  const resisted = cravings.filter((e) => (e.data as { resisted?: boolean }).resisted).length;

  const breadUsed = events.filter(
    (e) => inWeek(e) && ((e.type === "meal" && (e.data as { has_bread?: boolean }).has_bread) || e.type === "bread")
  ).length;

  const phaseId = currentPhase(today, currentWeight(weights));

  // ── 微調建議（handoff 階段 3 邏輯）────────────────────────
  let advice: string;
  if (phaseId <= 1) {
    advice = "現在是養習慣期，赤字還不用管。本週唯一目標：記錄天數比上週多。";
  } else if (rate === null) {
    advice = "體重資料還不夠（兩週都要至少量 3 天），先把量體重變成早上的反射動作。";
  } else if (rate > -0.25) {
    advice = "週均沒什麼動。如果不太餓：每天減 200 kcal 或加 2000 步。如果記錄不完整，先補記錄再說。";
  } else if (rate < -1.25) {
    advice = "掉太快了。每天加回 150 kcal，多放高飽足感食物（蛋白質、纖維），保護肌肉和續航力。";
  } else {
    advice = "速率在健康區間（每週 0.5–1%），照舊就好。不要因為某一天反彈就改策略。";
  }

  // ── 分享卡 ────────────────────────────────────────────────
  async function shareCard() {
    setSharing(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 720; canvas.height = 900;
      const ctx = canvas.getContext("2d")!;

      ctx.fillStyle = "#f5efe3"; ctx.fillRect(0, 0, 720, 900);
      ctx.fillStyle = "#1d4a38";
      ctx.font = "bold 40px 'Noto Sans TC', sans-serif";
      ctx.fillText("體態計畫・週報", 56, 96);
      ctx.fillStyle = "#8b8273";
      ctx.font = "26px 'Noto Sans TC', sans-serif";
      ctx.fillText(`${week[0].slice(5).replace("-", "/")} – ${week[6].slice(5).replace("-", "/")}`, 56, 140);

      ctx.fillStyle = "#fffcf5";
      roundRect(ctx, 56, 180, 608, 240, 24); ctx.fill();
      ctx.fillStyle = "#8b8273"; ctx.font = "24px 'Noto Sans TC'";
      ctx.fillText("週均體重", 96, 240);
      ctx.fillStyle = "#1d4a38"; ctx.font = "bold 96px Georgia, serif";
      ctx.fillText(curAvg ? `${curAvg}` : "—", 96, 348);
      if (rate !== null) {
        ctx.fillStyle = rate < 0 ? "#4a7c59" : "#c79a3d";
        ctx.font = "bold 32px 'Noto Sans TC'";
        ctx.fillText(`${rate > 0 ? "+" : ""}${rate.toFixed(2)}% vs 上週`, 340, 348);
      }

      const rows: [string, string][] = [
        ["記錄天數", `${loggedDays} / 7`],
        ["蛋白質達標", `${protDays} 天`],
        ["平均步數", stepsAvg ? stepsAvg.toLocaleString() : "—"],
        ["嘴饞擋下", cravings.length ? `${resisted}/${cravings.length} 次` : "0 次"],
        ["麵包額度", `${breadUsed} / ${PROFILE.breadQuotaPerWeek}`],
      ];
      rows.forEach(([label, val], i) => {
        const y = 480 + i * 64;
        ctx.fillStyle = "#8b8273"; ctx.font = "26px 'Noto Sans TC'";
        ctx.fillText(label, 56, y);
        ctx.fillStyle = "#2a2722"; ctx.font = "bold 28px 'Noto Sans TC'";
        ctx.fillText(val, 480, y);
      });

      ctx.fillStyle = "#8b8273"; ctx.font = "22px 'Noto Sans TC'";
      ctx.fillText(`${PROFILE.startWeightKg} → ${PROFILE.targetLow}–${PROFILE.targetHigh} kg 路上`, 56, 850);

      const blob: Blob = await new Promise((res) => canvas.toBlob((b) => res(b!), "image/png"));
      const file = new File([blob], `週報_${week[0]}.png`, { type: "image/png" });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "體態計畫週報" });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = file.name; a.click();
        URL.revokeObjectURL(url);
      }
    } catch {} finally {
      setSharing(false);
    }
  }

  return (
    <main className="space-y-4">
      <header className="flex items-end justify-between pt-2">
        <div>
          <h1 className="font-display text-2xl font-bold text-green">週報</h1>
          <p className="text-xs text-muted">{week[0].slice(5)} – {week[6].slice(5)}</p>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setOffset(offset + 1)} className="rounded-full bg-card-soft px-3 py-1 text-xs">‹ 前週</button>
          <button onClick={() => setOffset(Math.max(0, offset - 1))} disabled={offset === 0} className="rounded-full bg-card-soft px-3 py-1 text-xs disabled:opacity-40">本週 ›</button>
        </div>
      </header>

      <div className="card p-5 text-center">
        <div className="text-xs text-muted">週均體重</div>
        <div className="font-display text-5xl font-bold text-green">{curAvg ?? "—"}</div>
        {rate !== null && (
          <div className={`mt-1 text-sm font-bold ${rate < 0 ? "text-ok" : "text-warn"}`}>
            {rate > 0 ? "+" : ""}{rate.toFixed(2)}% vs 上週（{prevAvg}）
          </div>
        )}
      </div>

      <div className="card divide-y divide-[#eee5d2] p-4 text-sm [&>div]:flex [&>div]:justify-between [&>div]:py-2">
        <div><span className="text-muted">記錄天數</span><span className="font-display font-bold">{loggedDays} / 7</span></div>
        <div><span className="text-muted">蛋白質達標（≥85%）</span><span className="font-display font-bold">{protDays} 天</span></div>
        <div><span className="text-muted">平均步數</span><span className="font-display font-bold">{stepsAvg?.toLocaleString() ?? "—"}</span></div>
        <div><span className="text-muted">嘴饞 SOS</span><span className="font-display font-bold">{cravings.length ? `擋下 ${resisted}/${cravings.length}` : "0 次"}</span></div>
        <div><span className="text-muted">麵包額度</span><span className="font-display font-bold">{breadUsed} / {PROFILE.breadQuotaPerWeek}</span></div>
      </div>

      <div className="card border-l-4 border-green p-4">
        <h2 className="text-xs font-bold text-muted">下週微調</h2>
        <p className="mt-1 text-sm leading-relaxed">{advice}</p>
      </div>

      <button
        onClick={shareCard}
        disabled={sharing}
        className="card w-full bg-green p-4 text-center font-display text-lg font-bold text-card active:scale-[0.99] disabled:opacity-60"
      >
        {sharing ? "產生中…" : "分享週報卡 →"}
      </button>
      <p className="text-center text-[11px] text-muted">
        傳給家人朋友。有人看著，維持率差三倍（66% vs 24%）。
      </p>
    </main>
  );
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
