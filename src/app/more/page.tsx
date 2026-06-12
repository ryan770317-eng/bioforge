"use client";

import { useEffect, useState } from "react";
import { getSetting, setSetting } from "@/lib/db";
import { isPushSubscribed, subscribePush, unsubscribePush } from "@/lib/push-client";
import { PUSH_RULES, SUPPLEMENT_RULES } from "@/lib/profile";

const SETUP_SQL = `create table if not exists events (
  id   bigint generated always as identity primary key,
  type text not null,
  date date not null,
  ts   timestamptz not null default now(),
  data jsonb not null default '{}'::jsonb
);
create index if not exists events_type_date_idx on events (type, date);
alter table events enable row level security;
drop policy if exists "events open" on events;
create policy "events open" on events for all using (true) with check (true);`;

type Prefs = Record<string, { enabled?: boolean; time?: string }>;

function Section({
  id, title, open, onToggle, children,
}: {
  id: string; title: string; open: string | null;
  onToggle: (id: string) => void; children: React.ReactNode;
}) {
  return (
    <section className="card overflow-hidden">
      <button onClick={() => onToggle(id)} className="flex w-full items-center justify-between p-4 text-left">
        <span className="text-sm font-bold">{title}</span>
        <span className={`text-muted transition-transform ${open === id ? "rotate-90" : ""}`}>›</span>
      </button>
      {open === id && <div className="border-t border-[#eee5d2] p-4 pt-3">{children}</div>}
    </section>
  );
}

export default function MorePage() {
  const [subscribed, setSubscribed] = useState<boolean | null>(null);
  const [pushMsg, setPushMsg] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<Prefs>({});
  const [syncUrl, setSyncUrl] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    isPushSubscribed().then(setSubscribed);
    getSetting<Prefs>("push_prefs").then((p) => p && setPrefs(p)).catch(() => {});
    fetch("/api/sync").then((r) => r.json()).then((d) => setSyncUrl(d.url)).catch(() => {});
  }, []);

  async function togglePush() {
    setPushMsg(null);
    if (subscribed) {
      await unsubscribePush();
      setSubscribed(false);
    } else {
      const res = await subscribePush();
      if (res.ok) setSubscribed(true);
      else setPushMsg(res.reason ?? "失敗");
    }
  }

  async function updateRule(type: string, patch: { enabled?: boolean; time?: string }) {
    const next = { ...prefs, [type]: { ...prefs[type], ...patch } };
    setPrefs(next);
    try { await setSetting("push_prefs", next); } catch {}
  }

  function copy(text: string, tag: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(tag);
      setTimeout(() => setCopied(null), 1500);
    });
  }

  return (
    <main className="space-y-4">
      <header className="pt-2">
        <h1 className="font-display text-2xl font-bold text-green">更多</h1>
      </header>

      {/* 推播 */}
      <section className="card p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold">推播提醒</h2>
            <p className="text-[11px] text-muted">
              {subscribed === null ? "檢查中…" : subscribed ? "已開啟" : "iPhone：先「加入主畫面」，從 App 圖示打開再按"}
            </p>
          </div>
          <button
            onClick={togglePush}
            className={`rounded-xl px-4 py-2 text-sm font-bold ${subscribed ? "bg-card-soft text-muted" : "bg-green text-card"}`}
          >
            {subscribed ? "關閉" : "開啟"}
          </button>
        </div>
        {pushMsg && <p className="mt-2 text-[11px] text-bad">{pushMsg}</p>}

        <div className="mt-3 space-y-2 border-t border-[#eee5d2] pt-3">
          {PUSH_RULES.map((r) => {
            const enabled = prefs[r.type]?.enabled ?? r.enabled;
            const time = prefs[r.type]?.time ?? r.time;
            return (
              <div key={r.type} className="flex items-center gap-2 text-sm">
                <button
                  onClick={() => updateRule(r.type, { enabled: !enabled })}
                  className={`h-6 w-11 rounded-full p-0.5 transition-colors ${enabled ? "bg-green" : "bg-card-soft"}`}
                >
                  <div className={`h-5 w-5 rounded-full bg-card transition-transform ${enabled ? "translate-x-5" : ""}`} />
                </button>
                <span className={enabled ? "" : "text-muted"}>{r.label}</span>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => updateRule(r.type, { time: e.target.value })}
                  className="ml-auto rounded-lg bg-bg px-2 py-1 text-xs text-muted"
                  disabled={r.type === "weekly" && false}
                />
              </div>
            );
          })}
          <p className="text-[10px] text-muted">提醒每 15 分鐘檢查一次，實際送達會在設定時間後 0–15 分內。</p>
        </div>
      </section>

      {/* 初始設定 */}
      <Section open={open} onToggle={(id) => setOpen(open === id ? null : id)} id="setup" title="🛠 初始設定（第一次用做一次）">
        <ol className="list-decimal space-y-2 pl-4 text-sm leading-relaxed">
          <li>
            開 <a href="https://supabase.com/dashboard/project/afmikjdenoibkhjixlqj/sql/new" target="_blank" className="font-bold text-green underline">Supabase SQL Editor</a>
          </li>
          <li>
            貼上 SQL 按 Run：
            <button onClick={() => copy(SETUP_SQL, "sql")} className="ml-2 rounded-lg bg-card-soft px-3 py-1 text-xs font-bold">
              {copied === "sql" ? "已複製 ✓" : "複製 SQL"}
            </button>
          </li>
          <li>回來重新整理，黃色提示消失就完成了</li>
        </ol>
      </Section>

      {/* 捷徑教學 */}
      <Section open={open} onToggle={(id) => setOpen(open === id ? null : id)} id="shortcut" title="⌚️ Apple Watch 自動同步（捷徑設定）">
        <div className="space-y-2 text-sm leading-relaxed">
          <p className="text-xs text-muted">設定一次，之後步數/睡眠/體重每晚自動進來，零手動。</p>
          <ol className="list-decimal space-y-2 pl-4">
            <li>iPhone 開「捷徑」App → 新增捷徑</li>
            <li>加入動作「尋找健康樣本」：類型=步數、今天、合併=總和</li>
            <li>再加「尋找健康樣本」：類型=體重、最新 1 筆（買了藍牙體重計後會自動有值）</li>
            <li>加入動作「取得 URL 內容」：方法 POST、JSON，內容：<code className="rounded bg-bg px-1 text-xs">steps</code>=步數結果、<code className="rounded bg-bg px-1 text-xs">weightKg</code>=體重結果</li>
            <li>
              URL 填：
              {syncUrl ? (
                <button onClick={() => copy(syncUrl, "url")} className="mt-1 block w-full truncate rounded-lg bg-bg p-2 text-left text-[11px]">
                  {copied === "url" ? "已複製 ✓" : syncUrl}
                </button>
              ) : (
                <span className="text-muted">（部署版才會顯示）</span>
              )}
            </li>
            <li>自動化 → 新增 → 特定時間 21:30 每天 → 執行這個捷徑 → 關閉「執行前先詢問」</li>
          </ol>
        </div>
      </Section>

      {/* 保健品時序 */}
      <Section open={open} onToggle={(id) => setOpen(open === id ? null : id)} id="supp" title="💊 保健品時序規則">
        <ul className="list-disc space-y-1.5 pl-4 text-sm leading-relaxed">
          {SUPPLEMENT_RULES.map((r) => <li key={r}>{r}</li>)}
        </ul>
        <p className="mt-2 text-[11px] text-muted">療程變動（換 Vital-Zymes / Seeking Health DAO）時叫 Claude 更新清單。</p>
      </Section>

      {/* 依據 */}
      <Section open={open} onToggle={(id) => setOpen(open === id ? null : id)} id="why" title="📚 這個 App 的設計依據">
        <ul className="list-disc space-y-1.5 pl-4 text-xs leading-relaxed text-muted">
          <li>記錄天數是減重最強預測因子（Hollis 2008，n=1,685）——所以一切圍繞「今天有沒有記錄」</li>
          <li>每日量體重有效且心理安全，但要看七日均線（Zheng 2015 系統性回顧）</li>
          <li>超加工食品讓人每天多吃 ~500 kcal（Hall 2019 NIH 代謝病房 RCT）——紅綠燈評級的由來</li>
          <li>「若X則Y」計畫 d≈0.65（Gollwitzer 2006）——晚餐預決定的由來</li>
          <li>連續紀錄斷掉是放棄高危點——所以用週 5/7 制，永不歸零</li>
          <li>有問責夥伴維持率 66% vs 單獨 24%（Wing 1999）——週報分享卡的由來</li>
        </ul>
      </Section>
    </main>
  );
}
