import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 150,
      messages: [{
        role: 'user',
        content: `你是一個腸道健康專家，Ryan 有 IgG 慢性發炎體質、PE-1 胰彈性蛋白酶不足、服用美舒鬱（會增加甜食渴望）。請給他一條今天的健康小知識，繁體中文，50字以內，口語化，不說教，像朋友提醒。今天日期：${date}，請根據日期給不同的知識。只輸出知識內容本身，不要加任何前綴。`
      }]
    })
  })

  const data = await response.json()
  const tip = data.content?.[0]?.text || '今天記得多喝水、先吃菜再吃肉！'

  return NextResponse.json({ tip })
}
