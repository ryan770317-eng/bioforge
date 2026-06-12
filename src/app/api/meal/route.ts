import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { HEALTH_CONTEXT, PROFILE } from "@/lib/profile";
import { taipeiNow } from "@/lib/calc";

export const maxDuration = 60;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function mealSlot(hour: number): string {
  if (hour < 11) return "早餐";
  if (hour < 16) return "午餐";
  if (hour < 22) return "晚餐";
  return "宵夜";
}

export async function POST(req: NextRequest) {
  const { image, thumb, note } = await req.json();
  if (!image) {
    return NextResponse.json({ error: "no image" }, { status: 400 });
  }

  const now = taipeiNow();
  const slot = mealSlot(now.hour);

  // 本週已用的麵包額度（給 AI 脈絡）
  const monday = new Date(now.date + "T12:00:00");
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const monStr = monday.toISOString().slice(0, 10);
  const { data: weekMeals } = await supabase
    .from("events")
    .select("data")
    .in("type", ["meal", "bread"])
    .gte("date", monStr)
    .lte("date", now.date);
  const breadUsed = (weekMeals ?? []).filter(
    (m) => (m.data as { has_bread?: boolean })?.has_bread || (m.data as { manual?: boolean })?.manual
  ).length;

  const prompt = `${HEALTH_CONTEXT}

這是 Ryan 的${slot}照片${note ? `（他補充：${note}）` : ""}。本週麵包額度已用 ${breadUsed}/${PROFILE.breadQuotaPerWeek} 次。

請分析照片並只回傳 JSON（不要任何其他文字）：
{
  "items": ["食物名稱（份量）", ...],
  "kcal": 整數（最佳估計）,
  "kcal_range": [低估, 高估],
  "protein_g": 整數,
  "rating": "green" | "yellow" | "red",
  "has_bread": true/false（含任何小麥製品：麵包/麵條/水餃/甜點）,
  "has_sweet": true/false,
  "flags": ["命中的過敏地雷或注意事項", ...]（沒有就空陣列）,
  "tip": "一句話建議（30字內，平視語氣不說教，重點放下一餐怎麼補蛋白質或熱量空間）"
}

rating 標準：green=原型食物為主+蛋白質足；yellow=普通外食；red=超加工/高糖油（代謝病房研究顯示這類每天會讓人多吃500kcal）。
估算寧可給區間，不用假裝精準。`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 600,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: "image/jpeg", data: image },
            },
            { type: "text", text: prompt },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    return NextResponse.json({ error: `AI 分析失敗：${err.slice(0, 200)}` }, { status: 502 });
  }

  const data = await response.json();
  const text: string = data.content?.[0]?.text ?? "{}";

  let analysis;
  try {
    analysis = JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return NextResponse.json({ error: "AI 回傳格式異常" }, { status: 502 });
    try {
      analysis = JSON.parse(match[0]);
    } catch {
      return NextResponse.json({ error: "AI 回傳格式異常" }, { status: 502 });
    }
  }

  const eventData = { ...analysis, slot, thumb: thumb ?? null, note: note ?? null };
  const { data: row, error } = await supabase
    .from("events")
    .insert({ type: "meal", date: now.date, data: eventData })
    .select()
    .single();

  if (error) {
    // 表還沒建：分析照樣回給前端，但標記未儲存
    return NextResponse.json({ ...eventData, saved: false, dbError: error.message });
  }
  return NextResponse.json({ ...eventData, saved: true, id: row.id });
}
