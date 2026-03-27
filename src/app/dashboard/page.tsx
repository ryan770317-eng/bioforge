"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";

const WATER_STEP = 250;
const TOTAL_SUPPLEMENTS = 7;

const BAN_FOODS = [
  { name: "腰果", until: "2026-09-20" },
  { name: "奇異果", until: "2026-09-20" },
  { name: "鮪魚", until: "2026-06-20" },
];

function todayDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function daysUntil(dateStr: string): number {
  const today = new Date(); today.setHours(0,0,0,0);
  const target = new Date(dateStr); target.setHours(0,0,0,0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000*60*60*24));
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "早安";
  if (h < 18) return "午安";
  return "晚安";
}

function dateLabel(): string {
  const d = new Date();
  return `${d.getMonth()+1} 月 ${d.getDate()} 日`;
}

const TIP_KEY   = "health_tip_text";
const TIP_DATE_KEY = "health_tip_date";

export default function DashboardPage() {
  const [tip, setTip]           = useState<string | null>(null);
  const [tipLoading, setTipLoading] = useState(true);

  const [waterMl,   setWaterMl]   = useState(0);
  const [proteinG,  setProteinG]  = useState(0);
  const [cravings,  setCravings]  = useState(0);
  const [suppDone,  setSuppDone]  = useState(0);
  const [waterGoal,   setWaterGoal]   = useState(2000);
  const [proteinGoal, setProteinGoal] = useState(105);

  // Load tip (cached per day)
  useEffect(() => {
    const today = todayDate();
    const cached     = localStorage.getItem(TIP_KEY);
    const cachedDate = localStorage.getItem(TIP_DATE_KEY);
    if (cached && cachedDate === today) {
      setTip(cached);
      setTipLoading(false);
      return;
    }
    fetch(`/api/health-tip?date=${today}`)
      .then((r) => r.json())
      .then(({ tip: t }) => {
        if (t) {
          localStorage.setItem(TIP_KEY,      t);
          localStorage.setItem(TIP_DATE_KEY, today);
          setTip(t);
        } else {
          setTip(null);
        }
      })
      .catch(() => setTip(null))
      .finally(() => setTipLoading(false));
  }, []);

  // Load goals + today log
  useEffect(() => {
    const today = todayDate();

    supabase
      .from("user_settings")
      .select("key,value")
      .in("key", ["protein_goal_g","water_goal_ml"])
      .then(({ data }) => {
        if (!data) return;
        const map = new Map(data.map((r) => [r.key, r.value]));
        const pg = parseInt(map.get("protein_goal_g") ?? "", 10);
        const wg = parseInt(map.get("water_goal_ml")  ?? "", 10);
        if (!isNaN(pg) && pg > 0) setProteinGoal(pg);
        if (!isNaN(wg) && wg > 0) setWaterGoal(wg);
      });

    supabase
      .from("daily_logs")
      .select("water_ml,protein_g,craving_count")
      .eq("date", today)
      .single()
      .then(({ data }) => {
        if (!data) return;
        setWaterMl(data.water_ml ?? 0);
        setProteinG(data.protein_g ?? 0);
        setCravings(data.craving_count ?? 0);
      });

    supabase
      .from("supplement_logs")
      .select("supplement_name")
      .eq("date", today)
      .eq("taken", true)
      .then(({ data }) => {
        setSuppDone(data?.length ?? 0);
      });
  }, []);

  // 今日最重要建議
  const waterPct   = waterMl / waterGoal;
  const proteinPct = proteinG / proteinGoal;
  const priorityTip = (() => {
    if (waterPct <= proteinPct) {
      if (waterMl < 500) return "今天水喝得很少，趕快補！脫水會讓你更想吃甜食 💧";
      if (waterMl < 1500) return "水分還不夠，再喝幾杯就到目標了";
      if (waterMl < waterGoal) return "快到了！最後一哩路 💪";
      return "飲水達標！你的腸胃正在感謝你 ✅";
    } else {
      if (proteinG < 30) return "蛋白質嚴重不足，今天記得多吃一份雞胸或蛋";
      if (proteinG < 70) return "蛋白質還差一截，下一餐先吃肉再吃飯";
      if (proteinG < proteinGoal) return "蛋白質快達標了，再加一份豆漿或核桃";
      return "蛋白質達標！血糖今天會比較穩 ✅";
    }
  })();

  return (
    <>
      <div className="fixed top-0 left-0 right-0 md:left-[200px] z-10 bg-[#ebebeb] px-4 pt-4 pb-3 border-b border-stone-100">
        <div className="max-w-2xl mx-auto flex items-baseline justify-between">
          <h1 className="text-xl font-bold text-[#1a1a1a]">{greeting()} 👋</h1>
          <span className="text-xs text-[#8B7D6B]">{dateLabel()}</span>
        </div>
      </div>

      <main className="pt-[64px] pb-24 px-4 w-full max-w-2xl mx-auto space-y-4">

        {/* 每日健康小知識 */}
        <section className="rounded-2xl px-4 py-4" style={{ backgroundColor: "#e9f955" }}>
          <p className="text-[10px] font-semibold text-[#1a1a1a]/60 uppercase tracking-wide mb-1.5">今日健康小知識</p>
          {tipLoading ? (
            <p className="text-sm text-[#1a1a1a]/60">載入今日小知識...</p>
          ) : tip ? (
            <p className="text-sm font-medium text-[#1a1a1a] leading-relaxed">{tip}</p>
          ) : (
            <p className="text-sm text-[#1a1a1a]/60">今日小知識暫時無法載入</p>
          )}
        </section>

        {/* 今日進度 */}
        <section>
          <h2 className="text-sm font-semibold text-[#1A1A1A] mb-2 px-1">今日進度</h2>
          <div className="grid grid-cols-2 gap-2">
            {/* 飲水 */}
            <Link href="/today" className="bg-white rounded-2xl px-4 py-3 shadow-sm active:scale-[0.98] transition-transform block">
              <p className="text-xs text-[#8B7D6B] mb-1">💧 飲水</p>
              <p className="text-lg font-bold text-[#1a1a1a] leading-none mb-2">
                {waterMl}<span className="text-xs font-normal text-[#8B7D6B] ml-1">ml</span>
              </p>
              <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(waterMl / waterGoal * 100, 100)}%`,
                    backgroundColor: waterMl >= waterGoal ? "#6B9E78" : "#5B9BD5",
                  }}
                />
              </div>
              <p className="text-[10px] text-[#8B7D6B] mt-1">{waterGoal} ml 目標</p>
            </Link>

            {/* 蛋白質 */}
            <Link href="/today" className="bg-white rounded-2xl px-4 py-3 shadow-sm active:scale-[0.98] transition-transform block">
              <p className="text-xs text-[#8B7D6B] mb-1">🥩 蛋白質</p>
              <p className="text-lg font-bold text-[#1a1a1a] leading-none mb-2">
                {proteinG}<span className="text-xs font-normal text-[#8B7D6B] ml-1">g</span>
              </p>
              <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(proteinG / proteinGoal * 100, 100)}%`,
                    backgroundColor: proteinG >= proteinGoal ? "#6B9E78" : "#6B9E78",
                  }}
                />
              </div>
              <p className="text-[10px] text-[#8B7D6B] mt-1">{proteinGoal} g 目標</p>
            </Link>

            {/* 保健品 */}
            <Link href="/supplements" className="bg-white rounded-2xl px-4 py-3 shadow-sm active:scale-[0.98] transition-transform block">
              <p className="text-xs text-[#8B7D6B] mb-1">💊 保健品</p>
              <p className="text-lg font-bold text-[#1a1a1a] leading-none mb-1">
                {suppDone}
                <span className="text-sm font-normal text-[#8B7D6B]"> / {TOTAL_SUPPLEMENTS}</span>
              </p>
              <p className="text-[10px] text-[#8B7D6B]">
                {suppDone >= TOTAL_SUPPLEMENTS ? "今日全數完成 ✅" : `還剩 ${TOTAL_SUPPLEMENTS - suppDone} 顆`}
              </p>
            </Link>

            {/* 渴望 */}
            <Link href="/sos" className="bg-white rounded-2xl px-4 py-3 shadow-sm active:scale-[0.98] transition-transform block">
              <p className="text-xs text-[#8B7D6B] mb-1">⚡ 渴望</p>
              <p className="text-lg font-bold text-[#1a1a1a] leading-none mb-1">
                {cravings}
                <span className="text-sm font-normal text-[#8B7D6B]"> 次</span>
              </p>
              <p className="text-[10px] text-[#8B7D6B]">
                {cravings === 0 ? "今天很棒 💪" : cravings <= 2 ? "還不錯" : "今天有點多，去 SOS"}
              </p>
            </Link>
          </div>
        </section>

        {/* 停食倒數 */}
        <section>
          <h2 className="text-sm font-semibold text-[#1A1A1A] mb-2 px-1">停食倒數</h2>
          <div className="flex flex-wrap gap-2">
            {BAN_FOODS.map(({ name, until }) => {
              const days = daysUntil(until);
              return (
                <div
                  key={name}
                  className="flex items-center gap-1.5 bg-white rounded-full px-3 py-1.5 shadow-sm"
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: "#E8734A" }} />
                  <span className="text-xs font-medium text-[#1a1a1a]">{name}</span>
                  <span className="text-xs text-[#8B7D6B]">{days > 0 ? `${days}天` : "已到期"}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* 今日最重要建議 */}
        <section>
          <h2 className="text-sm font-semibold text-[#1A1A1A] mb-2 px-1">今日最重要建議</h2>
          <div className="bg-white rounded-2xl shadow-sm flex overflow-hidden">
            <div className="w-1 shrink-0" style={{ backgroundColor: "#e9f955" }} />
            <p className="px-4 py-3 text-sm text-[#1a1a1a]">{priorityTip}</p>
          </div>
        </section>

      </main>

      <BottomNav />
    </>
  );
}
