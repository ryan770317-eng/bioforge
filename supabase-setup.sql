-- 體態計畫 schema（2026-06-12）
-- 使用方式：Supabase Dashboard → SQL Editor → 貼上 → Run（執行一次即可）
-- 沿用既有的 user_settings 表（key/value），不需動它。

create table if not exists events (
  id   bigint generated always as identity primary key,
  type text not null,          -- meal | weight | steps | sleep | craving | dinner_plan | supplement | bread
  date date not null,          -- 台北當日
  ts   timestamptz not null default now(),
  data jsonb not null default '{}'::jsonb
);

create index if not exists events_type_date_idx on events (type, date);

-- 單人個人 App，沿用舊表的開放模式（anon key 可讀寫）
alter table events enable row level security;
drop policy if exists "events open" on events;
create policy "events open" on events
  for all using (true) with check (true);
