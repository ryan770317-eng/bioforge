"use client";
import { useState, useEffect, useRef } from "react";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";

const TIMER_SECONDS = 5 * 60;

const SNACKS = [
  { id: "egg",      label: "茶葉蛋", emoji: "🥚", protein: "6g" },
  { id: "edamame",  label: "毛豆",   emoji: "🫛", protein: "8g / 半碗" },
  { id: "chicken",  label: "雞胸",   emoji: "🍗", protein: "25g / 100g" },
  { id: "walnut",   label: "核桃",   emoji: "🌰", protein: "5g / 30g" },
];

const ALTERNATIVES = [
  { id: "water",  label: "再喝一杯水" },
  { id: "walk",   label: "出去走 5 分鐘" },
  { id: "brush",  label: "去刷牙" },
  { id: "gum",    label: "嚼無糖口香糖" },
  { id: "squat",  label: "做 10 個深蹲" },
];

const ENCOURAGEMENTS = [
  "你剛剛做了一件很難的事。真的。",
  "不是完美，是進步。已經很好了。",
  "渴望會過去，但你今天的選擇會留下來。",
];

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

const CIRCUMFERENCE = 2 * Math.PI * 44;

export default function SosPage() {
  const [step, setStep] = useState(1);

  // Step 1 — timer
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerDone, setTimerDone] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Step 2 — snacks
  const [selectedSnacks, setSelectedSnacks] = useState<Set<string>>(new Set());

  // Step 3 — craving + alternatives
  const [cravingLevel, setCravingLevel] = useState(0);
  const [selectedAlts, setSelectedAlts] = useState<Set<string>>(new Set());

  // Step 4 — random encouragement, stable across renders
  const [encouragement] = useState(
    () => ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]
  );

  useEffect(() => {
    if (timerRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(intervalRef.current!);
            setTimerRunning(false);
            setTimerDone(true);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerRunning]);

  function resetTimer() {
    setTimerRunning(false);
    setTimeLeft(TIMER_SECONDS);
    setTimerDone(false);
  }

  function todayDate(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  }

  async function finishAndLog() {
    setStep(4);
    const chosenAlts = ALTERNATIVES.filter((a) => selectedAlts.has(a.id)).map((a) => a.label).join("、");
    await supabase.from("craving_logs").insert({
      date:               todayDate(),
      intensity:          cravingLevel || null,
      alternative_chosen: chosenAlts || null,
      success:            selectedAlts.size > 0,
    });
  }

  function resetAll() {
    setStep(1);
    resetTimer();
    setSelectedSnacks(new Set());
    setCravingLevel(0);
    setSelectedAlts(new Set());
  }

  function toggleSnack(id: string) {
    setSelectedSnacks((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAlt(id: string) {
    setSelectedAlts((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const progressPct = ((TIMER_SECONDS - timeLeft) / TIMER_SECONDS) * 100;
  const dashOffset = CIRCUMFERENCE * (1 - progressPct / 100);

  return (
    <>
      {/* Fixed header */}
      <div className="fixed top-0 left-0 right-0 md:left-[200px] z-10 bg-[#ebebeb] px-4 pt-4 pb-3 border-b border-stone-100">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-[#1a1a1a]">渴望急救</h1>
          {/* Step indicator */}
          <div className="flex gap-2 items-center">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className="rounded-full transition-all duration-300"
                style={{
                  width: 8, height: 8,
                  backgroundColor: s < step ? "#6B9E78" : s === step ? "#e9f955" : "#E7E0D8",
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <main className="pt-[68px] pb-24 px-4 w-full max-w-2xl mx-auto">

        {/* ── Step 1：喝水 + 計時 ── */}
        {step === 1 && (
          <div className="bg-white rounded-2xl px-5 py-6 shadow-sm mt-3">
            <p className="text-[#8B7D6B] text-xs mb-1.5">Step 1 / 4</p>
            <h2 className="text-lg font-bold text-[#1A1A1A] mb-1">先喝 300ml 水 💧</h2>
            <p className="text-sm text-[#8B7D6B] leading-relaxed mb-7">
              想吃甜的？先喝杯水，等 5 分鐘看看。
              <br />
              渴望常常是假裝的，身體其實想要水。
            </p>

            {/* Timer ring */}
            <div className="flex flex-col items-center mb-7">
              <div className="relative w-36 h-36 mb-5">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50" cy="50" r="44"
                    fill="none" stroke="#F5F0EB" strokeWidth="7"
                  />
                  <circle
                    cx="50" cy="50" r="44"
                    fill="none"
                    stroke={timerDone ? "#6B9E78" : "#e9f955"}
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeDasharray={CIRCUMFERENCE}
                    strokeDashoffset={dashOffset}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  {timerDone ? (
                    <span className="text-4xl text-[#6B9E78]">✓</span>
                  ) : (
                    <span className="font-bold tabular-nums text-[#1a1a1a]" style={{ fontSize: 36 }}>
                      {formatTime(timeLeft)}
                    </span>
                  )}
                </div>
              </div>

              {timerDone ? (
                <button
                  onClick={() => setStep(2)}
                  className="px-8 py-2.5 rounded-full text-sm font-semibold text-[#1a1a1a] bg-[#6B9E78] active:opacity-80 transition-opacity"
                >
                  水喝完了，繼續 →
                </button>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={() => setTimerRunning((v) => !v)}
                    className="px-6 py-2.5 rounded-full text-sm font-semibold text-[#1a1a1a] active:opacity-80 transition-opacity"
                    style={{ backgroundColor: timerRunning ? "#e0e0e0" : "#e9f955" }}
                  >
                    {timerRunning ? "暫停" : timeLeft === TIMER_SECONDS ? "開始計時" : "繼續"}
                  </button>
                  {timeLeft < TIMER_SECONDS && (
                    <button
                      onClick={resetTimer}
                      className="px-4 py-2.5 rounded-full text-sm font-medium text-[#1a1a1a] bg-[#e0e0e0] active:opacity-70 transition-opacity"
                    >
                      重置
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Step 2：蛋白質零食 ── */}
        {step === 2 && (
          <div className="bg-white rounded-2xl px-5 py-6 shadow-sm mt-3">
            <p className="text-[#8B7D6B] text-xs mb-1.5">Step 2 / 4</p>
            <h2 className="text-lg font-bold text-[#1A1A1A] mb-1">補點蛋白質？🥩</h2>
            <p className="text-sm text-[#8B7D6B] leading-relaxed mb-5">
              有時候身體真正需要的是蛋白質，不是糖。
              <br />
              點選你吃了什麼，或直接跳過都 OK。
            </p>

            <div className="grid grid-cols-2 gap-2.5 mb-5">
              {SNACKS.map(({ id, label, emoji, protein }) => {
                const active = selectedSnacks.has(id);
                return (
                  <button
                    key={id}
                    onClick={() => toggleSnack(id)}
                    className="rounded-2xl px-4 py-3 text-left transition-colors border active:scale-[0.98]"
                    style={{
                      backgroundColor: active ? "#EEF6F1" : "#fff",
                      borderColor: active ? "#6B9E78" : "#F0EBE4",
                    }}
                  >
                    <div className="text-2xl mb-1 leading-none">{emoji}</div>
                    <div className={`text-sm font-medium ${active ? "text-[#6B9E78]" : "text-[#1A1A1A]"}`}>
                      {label}
                    </div>
                    <div className="text-[11px] text-[#8B7D6B] mt-0.5">蛋白質 {protein}</div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setStep(3)}
              className="w-full py-2.5 rounded-full text-sm font-semibold text-[#1a1a1a] bg-[#e9f955] active:opacity-80 transition-opacity"
            >
              {selectedSnacks.size > 0 ? "吃了，繼續 →" : "跳過，繼續 →"}
            </button>
          </div>
        )}

        {/* ── Step 3：渴望強度 + 替代方案 ── */}
        {step === 3 && (
          <div className="bg-white rounded-2xl px-5 py-6 shadow-sm mt-3">
            <p className="text-[#8B7D6B] text-xs mb-1.5">Step 3 / 4</p>
            <h2 className="text-lg font-bold text-[#1A1A1A] mb-1">還是想吃嗎？🤔</h2>
            <p className="text-sm text-[#8B7D6B] leading-relaxed mb-5">
              誠實面對自己就好，沒有對錯。
            </p>

            {/* Craving level */}
            <p className="text-sm font-medium text-[#1A1A1A] mb-2.5">渴望強度</p>
            <div className="flex gap-2 mb-5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setCravingLevel(n === cravingLevel ? 0 : n)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors border"
                  style={
                    n <= cravingLevel
                      ? { backgroundColor: "#E8734A", borderColor: "#E8734A", color: "#fff" }
                      : { backgroundColor: "#fff", borderColor: "#F0EBE4", color: "#8B7D6B" }
                  }
                >
                  {n}
                </button>
              ))}
            </div>

            {/* Alternatives */}
            <p className="text-sm font-medium text-[#1A1A1A] mb-2.5">試試這些替代方案？</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {ALTERNATIVES.map(({ id, label }) => {
                const active = selectedAlts.has(id);
                return (
                  <button
                    key={id}
                    onClick={() => toggleAlt(id)}
                    className="text-xs font-medium px-3 py-1.5 rounded-full transition-colors border"
                    style={
                      active
                        ? { backgroundColor: "#6B9E78", borderColor: "#6B9E78", color: "#fff" }
                        : { backgroundColor: "#fff", borderColor: "#F0EBE4", color: "#8B7D6B" }
                    }
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <button
              onClick={finishAndLog}
              className="w-full py-2.5 rounded-full text-sm font-semibold text-[#1a1a1a] bg-[#e9f955] active:opacity-80 transition-opacity"
            >
              完成紀錄 →
            </button>
          </div>
        )}

        {/* ── Step 4：完成 ── */}
        {step === 4 && (
          <div className="bg-white rounded-2xl px-5 py-8 shadow-sm mt-3 text-center">
            <p className="text-[#8B7D6B] text-xs mb-3">Step 4 / 4</p>
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-lg font-bold text-[#1A1A1A] mb-3">紀錄完成</h2>
            <p className="text-sm text-[#8B7D6B] leading-relaxed mb-6 px-2">
              {encouragement}
            </p>

            {/* Summary card */}
            <div className="bg-[#ebebeb] rounded-2xl px-4 py-3 text-left space-y-2 mb-6">
              <div className="flex items-center gap-2 text-xs text-[#8B7D6B]">
                <span>💧</span>
                <span>喝了 300ml 水，等了 5 分鐘</span>
              </div>
              {selectedSnacks.size > 0 && (
                <div className="flex items-center gap-2 text-xs text-[#8B7D6B]">
                  <span>🥩</span>
                  <span>
                    吃了{" "}
                    {SNACKS.filter((s) => selectedSnacks.has(s.id))
                      .map((s) => s.label)
                      .join("、")}
                  </span>
                </div>
              )}
              {cravingLevel > 0 && (
                <div className="flex items-center gap-2 text-xs text-[#8B7D6B]">
                  <span>🍬</span>
                  <span>渴望強度 {cravingLevel} / 5</span>
                </div>
              )}
              {selectedAlts.size > 0 && (
                <div className="flex items-start gap-2 text-xs text-[#8B7D6B]">
                  <span className="shrink-0">✅</span>
                  <span>
                    {ALTERNATIVES.filter((a) => selectedAlts.has(a.id))
                      .map((a) => a.label)
                      .join("、")}
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={resetAll}
              className="text-sm text-[#8B7D6B]/70 underline underline-offset-2"
            >
              再來一次
            </button>
          </div>
        )}

      </main>

      <BottomNav />
    </>
  );
}
