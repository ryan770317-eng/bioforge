import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const today = req.nextUrl.searchParams.get("date") ?? "";
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not set" }, { status: 500 });
  }

  const prompt = `你是一個腸道健康專家，Ryan 有 IgG 慢性發炎體質、PE-1 胰彈性蛋白酶不足、服用美舒鬱（會增加甜食渴望）。請給他一條今天的健康小知識，繁體中文，50字以內，口語化，不說教，像朋友提醒。今天日期：${today}，請根據日期給不同的知識。`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 150,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: err }, { status: res.status });
  }

  const data = await res.json();
  const tip: string = data.content?.[0]?.text ?? "";
  return NextResponse.json({ tip });
}
