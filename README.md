# 體態計畫

Ryan 的個人減重 PWA。69.8 → 62–64 kg，一天一張照片就好。

以行為科學實證設計：記錄天數是最強預測因子（Hollis 2008）、拍照取代查熱量、
可寬恕 streak（週 5/7 制）、晚餐預決定（implementation intentions）、嘴饞 SOS、
週報問責分享卡（Wing 1999）。規劃書見 `減重計畫_規劃書_handoff.md`。

## 架構

- Next.js 16 App Router + Tailwind 4 + Supabase（`events` 單表 + `user_settings` 鍵值）+ Vercel
- AI 餐點估算：照片 → Claude（`/api/meal`）→ 熱量/蛋白質/紅綠燈/地雷
- 推播：Web Push（VAPID）；GitHub Actions 每 15 分打 `/api/push/dispatch`，Vercel cron 備援
- Apple Watch / 藍牙體重計：iOS 捷徑自動化 → `/api/sync?key=SYNC_SECRET`

## 首次設定

1. `supabase-setup.sql` 貼到 Supabase SQL Editor 執行
2. App 內「更多」→ 開啟推播（iPhone 要先加入主畫面）
3. 「更多」→ 捷徑教學，設定每晚自動同步

## 環境變數

`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `ANTHROPIC_API_KEY` /
`NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `CRON_SECRET` / `SYNC_SECRET`
