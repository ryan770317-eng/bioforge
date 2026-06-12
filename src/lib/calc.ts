import { PROFILE } from "./profile";

// ── 日期（台北）────────────────────────────────────────────
// 客戶端：裝置就在台北，直接用本地時間。伺服器端（Vercel UTC）必須用 taipeiNow。

export function fmtDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayStr(): string {
  return fmtDate(new Date());
}

export function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + n);
  return fmtDate(d);
}

/** 伺服器端取台北當下：{date, hour, minute, dow} */
export function taipeiNow() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "short",
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const dowMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    hour: parseInt(get("hour"), 10) % 24,
    minute: parseInt(get("minute"), 10),
    dow: dowMap[get("weekday")] ?? 0,
  };
}

/** 該日期所屬的「週一起算」一週日期陣列 */
export function weekOf(dateStr: string): string[] {
  const d = new Date(dateStr + "T12:00:00");
  const offset = (d.getDay() + 6) % 7; // Mon=0
  const mon = addDays(dateStr, -offset);
  return Array.from({ length: 7 }, (_, i) => addDays(mon, i));
}

export function dayN(dateStr: string): number {
  const a = new Date(PROFILE.startDate + "T12:00:00").getTime();
  const b = new Date(dateStr + "T12:00:00").getTime();
  return Math.round((b - a) / 86400000) + 1; // 起始日 = 第 1 天
}

// ── 能量計算（Mifflin-St Jeor，隨 7 日均重自動重算）──────────

export function age(): number {
  return new Date().getFullYear() - PROFILE.birthYear;
}

export function bmr(weightKg: number): number {
  return Math.round(10 * weightKg + 6.25 * PROFILE.heightCm - 5 * age() + 5);
}

export function tdee(weightKg: number): number {
  return Math.round(bmr(weightKg) * PROFILE.activityFactor);
}

export function targetKcal(weightKg: number): number {
  return Math.max(PROFILE.minKcal, tdee(weightKg) - PROFILE.deficitKcal);
}

export function proteinTarget(weightKg: number): number {
  return Math.round(weightKg * PROFILE.proteinPerKg);
}

// ── 體重序列 ────────────────────────────────────────────────

export type WeightPoint = { date: string; kg: number };

/** 七日滾動均線（往前取最多 7 個實測點平均） */
export function ma7(points: WeightPoint[]): WeightPoint[] {
  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
  return sorted.map((p, i) => {
    const window = sorted.slice(Math.max(0, i - 6), i + 1);
    const kg = window.reduce((s, w) => s + w.kg, 0) / window.length;
    return { date: p.date, kg: Math.round(kg * 100) / 100 };
  });
}

/** 指定日期區間內的體重平均；無資料回 null */
export function avgWeight(points: WeightPoint[], dates: string[]): number | null {
  const inRange = points.filter((p) => dates.includes(p.date));
  if (!inRange.length) return null;
  return Math.round((inRange.reduce((s, p) => s + p.kg, 0) / inRange.length) * 100) / 100;
}

/** 最近 7 日均重；完全沒資料時用起始體重 */
export function currentWeight(points: WeightPoint[]): number {
  if (!points.length) return PROFILE.startWeightKg;
  const last7 = [...points].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7);
  return Math.round((last7.reduce((s, p) => s + p.kg, 0) / last7.length) * 100) / 100;
}

// ── 階段 ────────────────────────────────────────────────────

export function currentPhase(dateStr: string, weight7d: number): number {
  if (weight7d <= PROFILE.targetHigh) return 4;
  const n = dayN(dateStr);
  if (n <= 2) return 0;
  if (n <= 16) return 1; // 前兩週：只養習慣
  return 2; // 階段 3（檢討微調）由週報執行，主階段停在 2
}

// ── Streak（可寬恕版：永不歸零）────────────────────────────

export function weekProgress(loggedDates: Set<string>, dateStr: string) {
  const week = weekOf(dateStr);
  const done = week.filter((d) => d <= dateStr && loggedDates.has(d)).length;
  return { done, target: 5, week }; // 週 5/7 達成制
}

export function monthCount(loggedDates: Set<string>, dateStr: string): number {
  const prefix = dateStr.slice(0, 7);
  return [...loggedDates].filter((d) => d.startsWith(prefix)).length;
}
