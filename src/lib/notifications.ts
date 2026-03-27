export async function requestPermission(): Promise<void> {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "granted") {
    scheduleReminders();
    return;
  }
  if (Notification.permission !== "denied") {
    const result = await Notification.requestPermission();
    if (result === "granted") scheduleReminders();
  }
}

function msUntilNext(hour: number, minute: number): number {
  const now = new Date();
  const next = new Date();
  next.setHours(hour, minute, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next.getTime() - now.getTime();
}

function getNotifPref(key: string, defaultVal: boolean): boolean {
  try {
    const v = localStorage.getItem(key);
    return v === null ? defaultVal : v === "true";
  } catch {
    return defaultVal;
  }
}

function getTimePref(key: string, defaultTime: string): { hour: number; minute: number } {
  try {
    const v = localStorage.getItem(key) ?? defaultTime;
    const [h, m] = v.split(":").map(Number);
    return { hour: h, minute: m };
  } catch {
    const [h, m] = defaultTime.split(":").map(Number);
    return { hour: h, minute: m };
  }
}

let breakfastTimer: ReturnType<typeof setTimeout> | null = null;
let dinnerTimer:    ReturnType<typeof setTimeout> | null = null;

export function scheduleReminders(): void {
  if (typeof window === "undefined") return;

  if (breakfastTimer) clearTimeout(breakfastTimer);
  if (dinnerTimer)    clearTimeout(dinnerTimer);

  const breakfastOn = getNotifPref("notif_breakfast", true);
  const dinnerOn    = getNotifPref("notif_dinner",    true);
  const bt          = getTimePref("notif_breakfast_time", "08:00");
  const dt          = getTimePref("notif_dinner_time",    "18:30");

  function fire(title: string, body: string, repeatHour: number, repeatMin: number, prefKey: string, timeKey: string) {
    if (!getNotifPref(prefKey, true)) return;
    if (Notification.permission === "granted") {
      new Notification(title, { body, icon: "/icon-192.png" });
    }
    const { hour, minute } = getTimePref(timeKey, `${repeatHour}:${String(repeatMin).padStart(2,"0")}`);
    const next = setTimeout(() => fire(title, body, repeatHour, repeatMin, prefKey, timeKey), msUntilNext(hour, minute));
    if (prefKey === "notif_breakfast") breakfastTimer = next;
    else dinnerTimer = next;
  }

  if (breakfastOn) {
    breakfastTimer = setTimeout(
      () => fire("🌅 早餐時間！記得吃保健品 💊", "BioForge 提醒", bt.hour, bt.minute, "notif_breakfast", "notif_breakfast_time"),
      msUntilNext(bt.hour, bt.minute)
    );
  }

  if (dinnerOn) {
    dinnerTimer = setTimeout(
      () => fire("🌙 晚餐時間！SpectraZyme 記得餐前吃", "BioForge 提醒", dt.hour, dt.minute, "notif_dinner", "notif_dinner_time"),
      msUntilNext(dt.hour, dt.minute)
    );
  }
}
