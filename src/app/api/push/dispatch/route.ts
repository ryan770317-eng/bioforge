import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";
import { taipeiNow } from "@/lib/calc";
import { PUSH_RULES, type PushRule } from "@/lib/profile";

export const maxDuration = 60;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Payload = { title: string; body: string; url: string };

const WINDOW_MIN = 25; // GitHub Actions 每 15 分打一次，25 分窗口保證至少命中一次

async function getSetting(key: string): Promise<string | null> {
  const { data } = await supabase.from("user_settings").select("value").eq("key", key).single();
  return data?.value ?? null;
}

async function setSetting(key: string, value: string) {
  await supabase.from("user_settings").upsert({ key, value }, { onConflict: "key" });
}

async function countEvents(type: string, date: string): Promise<number> {
  const { count } = await supabase
    .from("events")
    .select("id", { count: "exact", head: true })
    .eq("type", type)
    .eq("date", date);
  return count ?? 0;
}

async function buildPayload(type: string, date: string): Promise<Payload | null> {
  switch (type) {
    case "morning":
      return {
        title: "早安，先量體重",
        body: "空腹、上完廁所再站上去。一個數字，3 秒。",
        url: "/",
      };
    case "afternoon":
      return {
        title: "下午想吃甜的？",
        body: "美舒鬱會放大渴望——先走 10 分鐘 + 喝水，再決定。",
        url: "/sos",
      };
    case "dinner_plan":
      return {
        title: "今晚晚餐吃什麼？",
        body: "趁現在不餓，花 10 秒先決定。晚上就不用靠意志力。",
        url: "/dinner",
      };
    case "dinner": {
      const { data } = await supabase
        .from("events")
        .select("data")
        .eq("type", "dinner_plan")
        .eq("date", date)
        .limit(1);
      const choice = (data?.[0]?.data as { choice?: string })?.choice;
      return {
        title: choice ? `晚餐照計畫：${choice}` : "晚餐時間",
        body: "Digest Gold 跟餐。拍張照就完成今天的記錄。",
        url: "/",
      };
    }
    case "rescue": {
      // 今天和昨天都沒有任何餐點記錄才發
      const yesterday = new Date(date + "T12:00:00");
      yesterday.setDate(yesterday.getDate() - 1);
      const yStr = yesterday.toISOString().slice(0, 10);
      const todayCount = await countEvents("meal", date);
      const yCount = await countEvents("meal", yStr);
      if (todayCount > 0 || yCount > 0) return null;
      return {
        title: "兩天沒記錄了",
        body: "不用補昨天的，拍今天這餐就好。30 秒，記了就算贏。",
        url: "/",
      };
    }
    case "weekly":
      return {
        title: "本週回顧出爐",
        body: "看週均體重、記錄天數，和下週的微調建議。",
        url: "/week",
      };
    default:
      return null;
  }
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const subRaw = await getSetting("push_subscription");
  if (!subRaw) return NextResponse.json({ sent: [], reason: "no subscription" });

  webpush.setVapidDetails(
    "mailto:ryan770317@gmail.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );

  const now = taipeiNow();
  const nowMin = now.hour * 60 + now.minute;
  const force = req.nextUrl.searchParams.get("force"); // 測試用：?force=morning 忽略時間窗

  // settings 可覆寫 enabled / time
  let prefs: Record<string, { enabled?: boolean; time?: string }> = {};
  try {
    prefs = JSON.parse((await getSetting("push_prefs")) ?? "{}");
  } catch {}

  const rules: PushRule[] = PUSH_RULES.map((r) => ({
    ...r,
    enabled: prefs[r.type]?.enabled ?? r.enabled,
    time: prefs[r.type]?.time ?? r.time,
  }));

  const sent: string[] = [];
  const subscription = JSON.parse(subRaw);

  for (const rule of rules) {
    if (force && rule.type !== force) continue;
    if (!force) {
      if (!rule.enabled) continue;
      if (rule.dow !== undefined && rule.dow !== now.dow) continue;
      const [h, m] = rule.time.split(":").map(Number);
      const schedMin = h * 60 + m;
      if (nowMin < schedMin || nowMin >= schedMin + WINDOW_MIN) continue;
      if ((await getSetting(`push_last:${rule.type}`)) === now.date) continue; // 今天發過
    }

    const payload = await buildPayload(rule.type, now.date);
    if (!payload) continue;

    try {
      await webpush.sendNotification(subscription, JSON.stringify(payload));
      await setSetting(`push_last:${rule.type}`, now.date);
      sent.push(rule.type);
    } catch (err: unknown) {
      const e = err as { statusCode?: number };
      if (e.statusCode === 410 || e.statusCode === 404) {
        await supabase.from("user_settings").delete().eq("key", "push_subscription");
        return NextResponse.json({ sent, reason: "subscription expired, removed" });
      }
      return NextResponse.json({ sent, error: String(err) }, { status: 500 });
    }
  }

  return NextResponse.json({ sent, at: `${now.date} ${now.hour}:${String(now.minute).padStart(2, "0")}` });
}
