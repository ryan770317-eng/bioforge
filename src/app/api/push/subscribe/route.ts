import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  const { subscription } = await req.json();
  if (!subscription?.endpoint) {
    return NextResponse.json({ error: "invalid subscription" }, { status: 400 });
  }

  await supabase
    .from("user_settings")
    .upsert({ key: "push_subscription", value: JSON.stringify(subscription) }, { onConflict: "key" });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { endpoint } = await req.json();
  const { data } = await supabase
    .from("user_settings")
    .select("value")
    .eq("key", "push_subscription")
    .single();

  if (data?.value) {
    const sub = JSON.parse(data.value);
    if (sub.endpoint === endpoint) {
      await supabase.from("user_settings").delete().eq("key", "push_subscription");
    }
  }

  return NextResponse.json({ ok: true });
}
