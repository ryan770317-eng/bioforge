import { NextRequest, NextResponse } from "next/server";

const ALLERGY_PROFILE = `
Ryan 的飲食限制（IgG/IgE 過敏原檢測）：
- 完全停食（高風險）：腰果(IgG 6級)、奇異果(IgG 5級)、鮪魚(IgG 3級)、小麥與麩質(IgG 1級，主要發炎來源，含麵包/麵條/可頌/水餃皮)
- 輪替食用（每4天1次上限）：花椰菜、蓮子、蚌、洋蔥、蘋果、花枝
- 需觀察/限量：蔥、葵花籽、蘿蔔(IgE+IgG雙重)、鮭魚(≤2次/週)、杏仁(≤2次/週)、蕎麥(≤2次/週)、大蒜、米飯(IgE微量)
- 安全食物：雞肉、豬肉、雞蛋、地瓜、芋頭、核桃、香蕉、高麗菜、菠菜、南瓜、黃豆、豆漿、椰子油、酪梨、黑咖啡、西瓜、梨等
- 特殊體質：PE-1 胰彈性蛋白酶不足（消化酵素缺乏）、服用美舒鬱（甜食渴望增加）、IgG 慢性發炎體質
`;

export async function POST(req: NextRequest) {
  const { food } = await req.json();
  if (!food?.trim()) {
    return NextResponse.json({ error: "no food" }, { status: 400 });
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 250,
      messages: [{
        role: "user",
        content: `${ALLERGY_PROFILE}

請評估「${food}」對 Ryan 的安全性。考慮：食材成分、加工方式、是否含隱藏過敏原。

只回傳 JSON，格式如下，不要任何額外文字：
{"verdict":"安全"|"小心"|"停食","risk":"低"|"中"|"高","reason":"說明（40字以內）","tip":"具體建議（30字以內，可省略用null）"}`,
      }],
    }),
  });

  const data = await response.json();
  const text: string = data.content?.[0]?.text ?? "{}";

  try {
    const json = JSON.parse(text);
    return NextResponse.json(json);
  } catch {
    // Try extracting JSON from text
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return NextResponse.json(JSON.parse(match[0]));
      } catch {}
    }
    return NextResponse.json({
      verdict: "小心",
      risk: "中",
      reason: "無法分析，建議謹慎食用或諮詢醫師",
      tip: null,
    });
  }
}
