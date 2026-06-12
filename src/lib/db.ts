import { supabase } from "./supabase";

export type Ev<T = Record<string, unknown>> = {
  id: number;
  type: string;
  date: string;
  ts: string;
  data: T;
};

/** Supabase 的 PostgrestError 是普通物件，包成 Error 才不會顯示成 [object Object] */
function wrap(error: { message?: string } | null): Error {
  return new Error(error?.message ?? "資料庫錯誤");
}

export async function addEvent(type: string, date: string, data: Record<string, unknown>) {
  const { data: row, error } = await supabase
    .from("events")
    .insert({ type, date, data })
    .select()
    .single();
  if (error) throw wrap(error);
  return row as Ev;
}

/** steps / weight / sleep / dinner_plan：每天一筆，存在就更新 */
export async function upsertDaily(type: string, date: string, data: Record<string, unknown>) {
  const { data: existing } = await supabase
    .from("events")
    .select("id")
    .eq("type", type)
    .eq("date", date)
    .limit(1);
  if (existing?.length) {
    const { error } = await supabase.from("events").update({ data }).eq("id", existing[0].id);
    if (error) throw wrap(error);
    return existing[0].id as number;
  }
  const row = await addEvent(type, date, data);
  return row.id;
}

export async function listEvents(type: string | string[], from: string, to: string) {
  const q = supabase
    .from("events")
    .select("*")
    .gte("date", from)
    .lte("date", to)
    .order("ts", { ascending: true });
  const { data, error } = Array.isArray(type)
    ? await q.in("type", type)
    : await q.eq("type", type);
  if (error) throw wrap(error);
  return (data ?? []) as Ev[];
}

export async function deleteEvent(id: number) {
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw wrap(error);
}

// ── user_settings 鍵值（沿用舊表）───────────────────────────

export async function getSetting<T>(key: string): Promise<T | null> {
  const { data } = await supabase.from("user_settings").select("value").eq("key", key).single();
  if (!data?.value) return null;
  try {
    return JSON.parse(data.value) as T;
  } catch {
    return data.value as T;
  }
}

export async function setSetting(key: string, value: unknown) {
  const { error } = await supabase
    .from("user_settings")
    .upsert({ key, value: typeof value === "string" ? value : JSON.stringify(value) }, { onConflict: "key" });
  if (error) throw wrap(error);
}

/** events 表還沒建好時給頁面顯示提示用 */
export function isMissingTable(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return msg.includes("events") && (msg.includes("does not exist") || msg.includes("schema cache"));
}
