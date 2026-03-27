"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/scan",        icon: "🔍", label: "食物掃描" },
  { href: "/sos",         icon: "🆘", label: "渴望急救" },
  { href: "/today",       icon: "✅", label: "今日打卡" },
  { href: "/report",      icon: "📊", label: "週報" },
  { href: "/supplements", icon: "💊", label: "保健品" },
  { href: "/settings",    icon: "⚙️", label: "設定" },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <>
      {/* ── Mobile bottom nav (hidden md+) ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-100 flex z-50"
        style={{ height: 60 }}
      >
        {NAV_ITEMS.map(({ href, icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-1 transition-transform active:scale-90"
            >
              <span
                className="transition-all duration-150 leading-none"
                style={{ fontSize: active ? 24 : 20 }}
              >
                {icon}
              </span>
              <span
                className="rounded-full transition-all duration-150"
                style={{
                  width:           active ? 4 : 0,
                  height:          active ? 4 : 0,
                  backgroundColor: "#D4A24E",
                  opacity:         active ? 1 : 0,
                }}
              />
            </Link>
          );
        })}
      </nav>

      {/* ── Desktop side nav (hidden below md) ── */}
      <nav className="hidden md:flex fixed top-0 left-0 h-full w-[200px] bg-white border-r border-stone-100 flex-col pt-6 pb-8 z-50">
        <div className="px-5 mb-8">
          <span className="text-lg font-bold text-[#D4A24E]">BioForge</span>
        </div>
        <div className="flex flex-col gap-1 flex-1 px-3">
          {NAV_ITEMS.map(({ href, icon, label }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors"
                style={
                  active
                    ? { backgroundColor: "#FFF3E0", color: "#D4A24E" }
                    : { color: "#8B7D6B" }
                }
              >
                <span className="text-xl leading-none">{icon}</span>
                <span className="text-sm font-medium">{label}</span>
                {active && (
                  <span
                    className="ml-auto w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: "#D4A24E" }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
