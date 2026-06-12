// Ryan 的個人檔案 — 單一使用者 App，所有已知參數直接內建。
// 來源：減重計畫規劃書 handoff（2026-06-12）+ 2026/3 功能醫學檢測報告。

export const PROFILE = {
  heightCm: 168,
  birthYear: 1988, // 2026 年 38 歲
  sex: "male" as const,
  activityFactor: 1.375,
  startWeightKg: 69.8,
  startDate: "2026-06-12",
  targetLow: 62,
  targetHigh: 64,
  proteinPerKg: 1.6, // Morton 2017 meta-analysis 甜蜜點
  deficitKcal: 350, // 溫和赤字
  minKcal: 1500,
  stepsGoal: 6000, // 起步門檻（上限 10000）
  breadQuotaPerWeek: 2, // 計畫內放縱：麵包/甜點每週 2 次（Ryan 拍板）
};

// AI 餐點分析用的健康脈絡（給 Claude 的系統知識）
export const HEALTH_CONTEXT = `
Ryan，38 歲男性，168cm，減重中（目標熱量 ~1800 kcal/天、蛋白質 112g/天，每餐 25–40g）。

過敏與飲食限制（IgG/IgE 檢測，2026/3）：
- 絕對避免：腰果（IgG 6級）、奇異果（IgG 5級）
- 鮪魚（IgG 3級）：停食期已滿，可每 4 天一次，但必須新鮮（組織胺偏高 29.0，避免放久的魚、發酵物）
- 小麥/麵包/麵條（IgG 1級）：採「額度制」每週 2 次計畫內食用，不是禁止；超過額度才提醒
- 蘋果、花椰菜、葵花籽（IgG 1級）：限量輪替（每 4 天一次）
- 特殊體質：PE-1 胰彈性蛋白酶 <100（消化酵素低、蛋白質吸收打折 → 蛋白質要吃到上緣、Digest Gold 跟餐）
- 服用美舒鬱（trazodone）：會放大甜食渴望——嘴饞是藥物+生理現象，不是意志力問題
- 血糖偏高背景：碳水選低 GI；低 HDL 背景：油脂選好油
`;

// 保健品每日勾選項（時序規則來自 handoff）
export const SUPPLEMENT_SLOTS = [
  { id: "morning", label: "早上：療程藥", note: "與鋅間隔 2 小時" },
  { id: "lunch", label: "午餐：Digest Gold", note: "跟餐吃" },
  { id: "dinner", label: "晚餐：Digest Gold", note: "跟餐吃（DAO 餐前 15 分）" },
];

export const SUPPLEMENT_RULES = [
  "Digest Gold 跟餐（PE-1 低，幫助蛋白質吸收）",
  "療程藥與鋅間隔 2 小時",
  "DAO 餐前 15 分鐘",
  "Quercetin 療程期間暫停",
  "5-HTP 禁用（與美舒鬱衝突）",
];

// 晚餐預決定的預設選項（可在 /dinner 修改後存進 settings）
export const DINNER_PRESETS = [
  "自助餐：2 掌心蛋白 + 2 拳蔬菜 + 1 拳飯",
  "超商：雞胸 + 茶葉蛋 + 無糖豆漿 + 地瓜",
  "麵店：湯麵半碗 + 燙青菜 + 滷蛋豆干",
];

// 推播規則（dispatch API 用；enabled 可被 settings 的 push_prefs 覆寫）
export type PushRule = {
  type: string;
  time: string; // HH:mm 台北時間
  dow?: number; // 0=週日；undefined = 每天
  label: string; // 設定頁顯示
  enabled: boolean;
};

export const PUSH_RULES: PushRule[] = [
  { type: "morning", time: "07:30", label: "早上量體重提醒", enabled: true },
  { type: "afternoon", time: "15:00", label: "下午甜食防守", enabled: true },
  { type: "dinner_plan", time: "16:30", label: "晚餐預先決定", enabled: true },
  { type: "dinner", time: "18:30", label: "晚餐 + 酵素提醒", enabled: true },
  { type: "rescue", time: "21:00", label: "兩天沒記錄時挽回", enabled: true },
  { type: "weekly", time: "20:00", dow: 0, label: "週日回顧", enabled: true },
];

// 五階段（handoff 計畫骨架）
export const PHASES = [
  { id: 0, name: "打地基", range: "第 1–2 天", focus: "確認目標數字、備好高飽足不踩雷食物、定好量體重時間" },
  { id: 1, name: "只養記錄習慣", range: "第 1–2 週", focus: "不逼赤字。拍照、量體重、走路變自動就是贏（最多人死在這關）" },
  { id: 2, name: "進入赤字", range: "第 3 週起", focus: "吃 1800 kcal、每餐蛋白質、走路達標、週日看週平均" },
  { id: 3, name: "檢討微調", range: "每 2–3 週", focus: "沒瘦不餓 → 減 200 卡或加步數；掉太快很餓 → 加 150 卡 + 高飽足食物" },
  { id: 4, name: "維持", range: "達標後 ≥3 個月", focus: "回 TDEE、繼續記錄，別因水分波動焦慮跳回赤字" },
];
