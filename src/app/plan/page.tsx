"use client";

import { useCallback, useEffect, useState } from "react";
import { addEvent, listEvents, type Ev } from "@/lib/db";
import { currentPhase, currentWeight, dayN, todayStr, weekOf, type WeightPoint } from "@/lib/calc";
import { PHASES, PROFILE } from "@/lib/profile";

const PRINCIPLES = [
  { t: "蛋白質是主武器", d: "每餐 25–40g 先吃。PE-1 低所以要吃到上緣 + Digest Gold 跟餐。蛋白質夠，下午嘴饞自動變少。" },
  { t: "超加工食品是隱形地雷", d: "同樣熱量下會讓人每天多吃 ~500 kcal（NIH 代謝病房實驗）。含糖飲料和加工點心先砍，比計較主餐有效。" },
  { t: "絕對避開", d: "腰果（6級）、奇異果（5級）。鮪魚要新鮮、每 4 天一次。放久的魚和發酵物少碰（組織胺偏高）。" },
  { t: "蘋果/花椰菜/葵花籽", d: "1 級，每 4 天輪替一次就好，不用怕。" },
  { t: "嘴饞是生理現象", d: "美舒鬱會放大甜食渴望。對策不是忍，是 SOS 流程：水 → 走 10 分鐘 → 再決定。" },
];

export default function PlanPage() {
  const today = todayStr();
  const [events, setEvents] = useState<Ev[]>([]);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    try {
      const week = weekOf(today);
      setEvents(await listEvents(["meal", "bread", "weight"], week[0], week[6]));
    } catch {}
  }, [today]);

  useEffect(() => { load(); }, [load]);

  const weights: WeightPoint[] = events
    .filter((e) => e.type === "weight")
    .map((e) => ({ date: e.date, kg: (e.data as { kg: number }).kg }));
  const phaseId = currentPhase(today, currentWeight(weights));

  const breadUsed = events.filter(
    (e) =>
      (e.type === "meal" && (e.data as { has_bread?: boolean }).has_bread) ||
      e.type === "bread"
  ).length;

  async function addBread() {
    setAdding(true);
    try {
      await addEvent("bread", today, { manual: true });
      await load();
    } finally {
      setAdding(false);
    }
  }

  return (
    <main className="space-y-4">
      <header className="pt-2">
        <h1 className="font-display text-2xl font-bold text-green">計畫</h1>
        <p className="text-xs text-muted">
          第 {dayN(today)} 天・{PROFILE.startWeightKg} → {PROFILE.targetLow}–{PROFILE.targetHigh} kg・約 14–18 週
        </p>
      </header>

      {/* 麵包額度 */}
      <div className={`card p-4 ${breadUsed > PROFILE.breadQuotaPerWeek ? "border border-warn/50" : ""}`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold">🍞 本週麵包/甜點額度</h2>
            <p className="mt-0.5 text-[11px] text-muted">
              計畫內的放縱不是破功。事先想好哪餐吃、配蛋白質一起吃。
            </p>
          </div>
          <div className="text-right">
            <div className="font-display text-2xl font-bold">
              {breadUsed}<span className="text-sm text-muted">/{PROFILE.breadQuotaPerWeek}</span>
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <div className="flex flex-1 gap-1.5">
            {Array.from({ length: Math.max(PROFILE.breadQuotaPerWeek, breadUsed) }, (_, i) => (
              <div
                key={i}
                className={`h-2.5 flex-1 rounded-full ${
                  i < breadUsed ? (i < PROFILE.breadQuotaPerWeek ? "bg-gold" : "bg-warn") : "bg-card-soft"
                }`}
              />
            ))}
          </div>
          <button
            onClick={addBread}
            disabled={adding}
            className="rounded-xl bg-card-soft px-3 py-1.5 text-xs font-bold text-ink disabled:opacity-50"
          >
            +記一次
          </button>
        </div>
        {breadUsed > PROFILE.breadQuotaPerWeek && (
          <p className="mt-2 text-[11px] text-warn">超額了——不用罪惡感，下週重來。看數字頁的週趨勢就好。</p>
        )}
      </div>

      {/* 五階段 */}
      <section className="card space-y-0 p-4">
        <h2 className="mb-3 text-xs font-bold text-muted">五階段路線圖</h2>
        {PHASES.map((p) => {
          const active = p.id === phaseId;
          const done = p.id < phaseId;
          return (
            <div key={p.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    active ? "bg-green text-card" : done ? "bg-green-soft text-green" : "bg-card-soft text-muted"
                  }`}
                >
                  {done ? "✓" : p.id}
                </div>
                {p.id < 4 && <div className={`w-0.5 flex-1 ${done ? "bg-green-soft" : "bg-card-soft"}`} />}
              </div>
              <div className={`pb-4 ${active ? "" : "opacity-60"}`}>
                <div className="text-sm font-bold">
                  {p.name} <span className="text-[10px] font-normal text-muted">{p.range}</span>
                  {active && <span className="ml-1 rounded-full bg-green px-2 py-0.5 text-[10px] text-card">現在</span>}
                </div>
                <p className="mt-0.5 text-xs leading-relaxed text-muted">{p.focus}</p>
              </div>
            </div>
          );
        })}
      </section>

      {/* 飲食原則 */}
      <section className="card space-y-3 p-4">
        <h2 className="text-xs font-bold text-muted">飲食原則</h2>
        {PRINCIPLES.map((p) => (
          <div key={p.t}>
            <div className="text-sm font-bold">{p.t}</div>
            <p className="text-xs leading-relaxed text-muted">{p.d}</p>
          </div>
        ))}
      </section>

      <p className="px-2 text-center text-[11px] text-muted">
        真正的目標是過程：先做滿 12 週，不是「12 週瘦幾公斤」。
      </p>
    </main>
  );
}
