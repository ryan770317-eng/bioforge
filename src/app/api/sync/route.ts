import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { taipeiNow } from "@/lib/calc";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function upsertDaily(type: string, date: string, data: Record<string, unknown>) {
  const { data: existing } = await supabase
    .from("events")
    .select("id")
    .eq("type", type)
    .eq("date", date)
    .limit(1);
  if (existing?.length) {
    await supabase.from("events").update({ data }).eq("id", existing[0].id);
  } else {
    await supabase.from("events").insert({ type, date, data });
  }
}

/**
 * iOS 捷徑自動化每晚呼叫：
 * POST /api/sync?key=SYNC_SECRET
 * body: { steps?: number, sleepMin?: number, weightKg?: number, date?: "YYYY-MM-DD" }
 * 體重也可由藍牙體重計 → 健康App → 捷徑自動帶上來。
 */
/** 給「更多」頁顯示捷徑要用的完整網址（App 本身無登入，anon key 已在前端，不構成額外暴露） */
export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  if (!process.env.SYNC_SECRET) return NextResponse.json({ url: null });
  return NextResponse.json({ url: `${origin}/api/sync?key=${process.env.SYNC_SECRET}` });
}

export async function POST(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (!process.env.SYNC_SECRET || key !== process.env.SYNC_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const date: string = body.date || taipeiNow().date;
  const saved: string[] = [];

  const steps = Number(body.steps);
  if (Number.isFinite(steps) && steps > 0) {
    await upsertDaily("steps", date, { steps: Math.round(steps), source: "shortcut" });
    saved.push("steps");
  }

  const sleepMin = Number(body.sleepMin);
  if (Number.isFinite(sleepMin) && sleepMin > 0) {
    await upsertDaily("sleep", date, { minutes: Math.round(sleepMin), source: "shortcut" });
    saved.push("sleep");
  }

  const weightKg = Number(body.weightKg);
  if (Number.isFinite(weightKg) && weightKg > 30 && weightKg < 150) {
    await upsertDaily("weight", date, { kg: Math.round(weightKg * 10) / 10, source: "shortcut" });
    saved.push("weight");
  }

  return NextResponse.json({ ok: true, date, saved });
}
