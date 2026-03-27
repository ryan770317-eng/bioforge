let breakfastTimer: ReturnType<typeof setTimeout> | null = null;
let dinnerTimer:    ReturnType<typeof setTimeout> | null = null;

export function registerSW(): void {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}

export async function requestPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

function msUntilNext(hour: number, minute: number): number {
  const now  = new Date();
  const next = new Date();
  next.setHours(hour, minute, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next.getTime() - now.getTime();
}

function parseTime(time: string): { hour: number; minute: number } {
  const [h, m] = time.split(":").map(Number);
  return { hour: isNaN(h) ? 0 : h, minute: isNaN(m) ? 0 : m };
}

function fireAndReschedule(
  title: string,
  body: string,
  hour: number,
  minute: number,
  setTimer: (t: ReturnType<typeof setTimeout>) => void
): void {
  if (typeof window === "undefined") return;
  if (Notification.permission === "granted") {
    new Notification(title, { body, icon: "/icon-192.png" });
  }
  const t = setTimeout(
    () => fireAndReschedule(title, body, hour, minute, setTimer),
    msUntilNext(hour, minute)
  );
  setTimer(t);
}

export function scheduleBreakfast(time = "08:00"): void {
  if (typeof window === "undefined") return;
  if (breakfastTimer) { clearTimeout(breakfastTimer); breakfastTimer = null; }
  const { hour, minute } = parseTime(time);
  breakfastTimer = setTimeout(
    () => fireAndReschedule(
      "🌅 早餐時間！記得吃保健品 💊", "BioForge 提醒",
      hour, minute,
      (t) => { breakfastTimer = t; }
    ),
    msUntilNext(hour, minute)
  );
}

export function scheduleDinner(time = "18:30"): void {
  if (typeof window === "undefined") return;
  if (dinnerTimer) { clearTimeout(dinnerTimer); dinnerTimer = null; }
  const { hour, minute } = parseTime(time);
  dinnerTimer = setTimeout(
    () => fireAndReschedule(
      "🌙 晚餐時間！SpectraZyme 記得餐前吃", "BioForge 提醒",
      hour, minute,
      (t) => { dinnerTimer = t; }
    ),
    msUntilNext(hour, minute)
  );
}

/** Re-reads localStorage and reschedules both reminders. */
export function scheduleReminders(): void {
  if (typeof window === "undefined") return;
  try {
    const bfOn = localStorage.getItem("notif_breakfast") !== "false";
    const dnOn = localStorage.getItem("notif_dinner")    !== "false";
    const bfT  = localStorage.getItem("notif_breakfast_time") ?? "08:00";
    const dnT  = localStorage.getItem("notif_dinner_time")    ?? "18:30";
    if (breakfastTimer) { clearTimeout(breakfastTimer); breakfastTimer = null; }
    if (dinnerTimer)    { clearTimeout(dinnerTimer);    dinnerTimer    = null; }
    if (bfOn) scheduleBreakfast(bfT);
    if (dnOn) scheduleDinner(dnT);
  } catch {}
}
