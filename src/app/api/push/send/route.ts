import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Vercel cron calls this with ?type=breakfast or ?type=dinner
// Protect with a shared secret: CRON_SECRET env var
export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization");
  if (process.env.CRON_SECRET && secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const type = req.nextUrl.searchParams.get("type") ?? "breakfast";

  webpush.setVapidDetails(
    "mailto:biohacking@example.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );

  const payload = type === "dinner"
    ? { title: "晚餐時間！SpectraZyme 餐前吃", body: "BioHACKING 提醒", url: "/today" }
    : { title: "早餐時間！記得吃保健品 💊", body: "BioHACKING 提醒", url: "/today" };

  const { data } = await supabase
    .from("user_settings")
    .select("value")
    .eq("key", "push_subscription")
    .single();

  if (!data?.value) {
    return NextResponse.json({ sent: 0 });
  }

  try {
    const subscription = JSON.parse(data.value);
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return NextResponse.json({ sent: 1 });
  } catch (err: unknown) {
    const e = err as { statusCode?: number };
    // Subscription expired or invalid — remove it
    if (e.statusCode === 410 || e.statusCode === 404) {
      await supabase.from("user_settings").delete().eq("key", "push_subscription");
    }
    return NextResponse.json({ sent: 0, error: String(err) }, { status: 500 });
  }
}
