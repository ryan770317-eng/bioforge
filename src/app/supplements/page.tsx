"use client";
import { useState, useEffect } from "react";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";

interface SupplementItem {
  id: string;
  name: string;
  dose: string;
  note: string;
  custom?: boolean;
}

interface SupplementGroup {
  icon: string;
  label: string;
  items: SupplementItem[];
}

const FIXED_GROUPS: SupplementGroup[] = [
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

type GroupLabel = "早餐" | "晚餐";

interface CustomSupplement {
  id: string;
  group: GroupLabel;
  name: string;
  dose: string;
  note: string;
}

const CUSTOM_KEY = "custom_supplements_v1";

function loadCustom(): CustomSupplement[] {
  try {
    const s = localStorage.getItem(CUSTOM_KEY);
    return s ? JSON.parse(s) : [];
  } catch { return []; }
}

function saveCustom(items: CustomSupplement[]) {
  try { localStorage.setItem(CUSTOM_KEY, JSON.stringify(items)); } catch {}
}

function todayDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function todayLabel(): string {
  const d = new Date();
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function SupplementsPage() {
  const [checked,    setChecked]    = useState<Set<string>>(new Set());
  const [customs,    setCustoms]    = useState<CustomSupplement[]>([]);
  const [addOpen,    setAddOpen]    = useState(false);
  const [newName,    setNewName]    = useState("");
  const [newDose,    setNewDose]    = useState("");
  const [newNote,    setNewNote]    = useState("");
  const [newGroup,   setNewGroup]   = useState<GroupLabel>("早餐");

  useEffect(() => {
    setCustoms(loadCustom());
    supabase
      .from("supplement_logs")
      .select("supplement_name")
      .eq("date", todayDate())
      .eq("taken", true)
      .then(({ data }) => {
        if (data) setChecked(new Set(data.map((r) => r.supplement_name)));
      });
  }, []);

  // Merge fixed + custom groups
  const groups: SupplementGroup[] = FIXED_GROUPS.map((g) => ({
    ...g,
    items: [
      ...g.items,
      ...customs.filter((c) => c.group === g.label).map((c) => ({
        id: c.id, name: c.name, dose: c.dose, note: c.note, custom: true,
      })),
    ],
  }));

  async function toggle(id: string) {
    const nextTaken = !checked.has(id);
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

  function addCustom() {
    const name = newName.trim();
    if (!name) return;
    const item: CustomSupplement = {
      id: `custom-${Date.now()}`,
      group: newGroup,
      name,
      dose: newDose.trim() || "依標示",
      note: newNote.trim(),
    };
    const next = [...customs, item];
    saveCustom(next);
    setCustoms(next);
    setNewName(""); setNewDose(""); setNewNote("");
    setAddOpen(false);
  }

  function removeCustom(id: string) {
    const next = customs.filter((c) => c.id !== id);
    saveCustom(next);
    setCustoms(next);
  }

  return (
    <>
      {/* Fixed header */}
      <div className="fixed top-0 left-0 right-0 md:left-[200px] z-10 bg-[#ebebeb] px-4 pt-4 pb-3 border-b border-stone-100">
        <div className="max-w-2xl mx-auto flex items-baseline justify-between">
          <h1 className="text-xl font-bold text-[#1a1a1a]">保健品</h1>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#8B7D6B]">{todayLabel()}</span>
            <button
              onClick={() => setAddOpen((v) => !v)}
              className="text-xs font-semibold px-3 py-1.5 rounded-full transition-opacity active:opacity-70"
              style={{ backgroundColor: "#e9f955", color: "#1a1a1a" }}
            >{addOpen ? "取消" : "+ 新增"}</button>
          </div>
        </div>
      </div>

      <main className="pt-[68px] pb-24 px-4 w-full max-w-2xl mx-auto space-y-5">

        {/* Add form */}
        {addOpen && (
          <section className="bg-white rounded-2xl shadow-sm px-4 py-4 space-y-3">
            <h3 className="text-sm font-semibold text-[#1A1A1A]">新增保健品</h3>
            <div className="flex gap-2">
              {(["早餐", "晚餐"] as GroupLabel[]).map((g) => (
                <button
                  key={g}
                  onClick={() => setNewGroup(g)}
                  className="flex-1 py-1.5 rounded-full text-xs font-semibold transition-colors"
                  style={newGroup === g
                    ? { backgroundColor: "#e9f955", color: "#1a1a1a" }
                    : { backgroundColor: "#f5f5f5", color: "#8B7D6B" }}
                >{g}</button>
              ))}
            </div>
            <input
              type="text"
              placeholder="品名（必填）"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full text-sm border border-stone-200 rounded-xl px-3 py-2.5 outline-none focus:border-[#e9f955] transition-colors"
            />
            <input
              type="text"
              placeholder="劑量（如：1 顆）"
              value={newDose}
              onChange={(e) => setNewDose(e.target.value)}
              className="w-full text-sm border border-stone-200 rounded-xl px-3 py-2.5 outline-none focus:border-[#e9f955] transition-colors"
            />
            <input
              type="text"
              placeholder="備注（可空白）"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCustom()}
              className="w-full text-sm border border-stone-200 rounded-xl px-3 py-2.5 outline-none focus:border-[#e9f955] transition-colors"
            />
            <button
              onClick={addCustom}
              disabled={!newName.trim()}
              className="w-full py-2.5 rounded-full text-sm font-semibold transition-opacity"
              style={{ backgroundColor: "#e9f955", color: "#1a1a1a", opacity: newName.trim() ? 1 : 0.4 }}
            >加入清單</button>
          </section>
        )}

        {groups.map((group) => {
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
                        className={`mt-0.5 shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${done ? "bg-[#e9f955] border-[#e9f955]" : "border-stone-200 bg-white"}`}
                      >
                        {done && (
                          <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                            <path d="M1 5l3.5 3.5L11 1" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium leading-snug ${done ? "text-[#8B7D6B] line-through decoration-[#8B7D6B]/50" : "text-[#1A1A1A]"}`}>
                          {item.name}
                        </p>
                        <p className={`text-xs mt-0.5 ${done ? "text-[#8B7D6B]/60" : "text-[#1a1a1a]"}`}>{item.dose}</p>
                        {item.note && <p className={`text-xs mt-0.5 ${done ? "text-[#8B7D6B]/60" : "text-[#8B7D6B]"}`}>{item.note}</p>}
                      </div>
                      {item.custom && (
                        <button
                          onClick={() => removeCustom(item.id)}
                          className="shrink-0 text-[#C4B8AC] hover:text-[#E8734A] transition-colors text-base leading-none mt-0.5"
                          aria-label="刪除"
                        >×</button>
                      )}
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
