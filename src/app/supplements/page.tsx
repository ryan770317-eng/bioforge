"use client";
import { useState, useEffect } from "react";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";

interface SupplementItem {
  id: string;
  name: string;
  dose: string;
  note: string;
}

interface SupplementGroup {
  icon: string;
  label: string;
  items: SupplementItem[];
}

const SUPPLEMENT_GROUPS: SupplementGroup[] = [
  {
    icon: "🌅",
    label: "早餐",
    items: [
      { id: "breakfast-mvm",       name: "Garden of Life mykind Organics Men's Once Daily", dose: "1 顆",     note: "MVM 主軸，植化素來源" },
      { id: "breakfast-adrenal",   name: "Thorne Adrenal Complex",                          dose: "1 顆",     note: "腎上腺調節（第一顆）" },
      { id: "breakfast-glutamine", name: "L-Glutamine Powder（Doctor's Best）",              dose: "5g 入水",  note: "腸黏膜修復，勿空腹" },
    ],
  },
  {
    icon: "🌙",
    label: "晚餐",
    items: [
      { id: "dinner-spectrazyme", name: "SpectraZyme Complete",                      dose: "1 顆（餐前）", note: "廣效消化酵素" },
      { id: "dinner-zinc",        name: "Zinc Carnosine / PepZin GI",                dose: "1 顆",         note: "腸壁定向修復" },
      { id: "dinner-adrenal",     name: "Thorne Adrenal Complex",                   dose: "1 顆",         note: "腎上腺調節（第二顆）" },
      { id: "dinner-vitc",        name: "Life Extension Vit C + Bio-Quercetin",     dose: "1 顆",         note: "抗炎＋腸道緊密連結修復" },
    ],
  },
];

function todayDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function todayLabel(): string {
  const d = new Date();
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function SupplementsPage() {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  // Load today's taken supplements on mount
  useEffect(() => {
    supabase
      .from("supplement_logs")
      .select("supplement_name")
      .eq("date", todayDate())
      .eq("taken", true)
      .then(({ data }) => {
        if (data) setChecked(new Set(data.map((r) => r.supplement_name)));
      });
  }, []);

  async function toggle(id: string) {
    const nextTaken = !checked.has(id);
    // Optimistic update
    setChecked((prev) => {
      const next = new Set(prev);
      nextTaken ? next.add(id) : next.delete(id);
      return next;
    });
    await supabase
      .from("supplement_logs")
      .upsert(
        { date: todayDate(), supplement_name: id, taken: nextTaken },
        { onConflict: "date,supplement_name" }
      );
  }

  return (
    <>
      {/* Fixed header */}
      <div className="fixed top-0 left-0 right-0 md:left-[200px] z-10 bg-[#FFF8F0] px-4 pt-4 pb-3 border-b border-stone-100">
        <div className="flex items-baseline justify-between">
          <h1 className="text-xl font-bold text-[#D4A24E]">保健品</h1>
          <span className="text-xs text-[#8B7D6B]">{todayLabel()}</span>
        </div>
      </div>

      <main className="pt-[68px] pb-24 px-4 w-full max-w-2xl mx-auto space-y-5">
        {SUPPLEMENT_GROUPS.map((group) => {
          const doneCount = group.items.filter((i) => checked.has(i.id)).length;
          return (
            <section key={group.label}>
              <div className="flex items-center justify-between mb-2 px-1">
                <h2 className="text-sm font-semibold text-[#1A1A1A]">
                  {group.icon} {group.label}
                  <span className="ml-1.5 text-[#8B7D6B] font-normal">（配餐）</span>
                </h2>
                <span className="text-xs text-[#8B7D6B]">{doneCount}/{group.items.length}</span>
              </div>
              {doneCount === group.items.length && (
                <p className="text-xs text-[#6B9E78] font-medium px-1 mb-2">✅ 全部完成！</p>
              )}
              <ul className="space-y-2">
                {group.items.map((item) => {
                  const done = checked.has(item.id);
                  return (
                    <li
                      key={item.id}
                      className={`rounded-2xl px-4 py-3 shadow-sm flex items-start gap-3 transition-colors ${done ? "bg-[#6B9E7814]" : "bg-white"}`}
                    >
                      <button
                        onClick={() => toggle(item.id)}
                        aria-label={done ? "取消勾選" : "勾選"}
                        className={`mt-0.5 shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${done ? "bg-[#D4A24E] border-[#D4A24E]" : "border-stone-200 bg-white"}`}
                      >
                        {done && (
                          <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                            <path d="M1 5l3.5 3.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium leading-snug ${done ? "text-[#8B7D6B] line-through decoration-[#8B7D6B]/50" : "text-[#1A1A1A]"}`}>
                          {item.name}
                        </p>
                        <p className={`text-xs mt-0.5 ${done ? "text-[#8B7D6B]/60" : "text-[#D4A24E]"}`}>{item.dose}</p>
                        <p className={`text-xs mt-0.5 ${done ? "text-[#8B7D6B]/60" : "text-[#8B7D6B]"}`}>{item.note}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </main>

      <BottomNav />
    </>
  );
}
