"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Zap, CheckSquare, BarChart2, Pill, Settings } from "lucide-react";

const NAV_ITEMS = [
  { href: "/scan",        Icon: Search,       label: "食物掃描" },
  { href: "/sos",         Icon: Zap,          label: "渴望急救" },
  { href: "/today",       Icon: CheckSquare,  label: "今日打卡" },
  { href: "/report",      Icon: BarChart2,    label: "週報" },
  { href: "/supplements", Icon: Pill,         label: "保健品" },
  { href: "/settings",    Icon: Settings,     label: "設定" },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <>
      {/* ── Mobile bottom nav (hidden md+) ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 flex z-50"
        style={{ height: 60 }}
      >
        {NAV_ITEMS.map(({ href, Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-1 transition-transform active:scale-90"
            >
              <Icon
                size={active ? 24 : 20}
                strokeWidth={active ? 2.5 : 1.8}
                color={active ? "#1a1a1a" : "#9a9a9a"}
                className="transition-all duration-150"
              />
              <span
                className="rounded-full transition-all duration-150"
                style={{
                  width:           active ? 5 : 0,
                  height:          active ? 5 : 0,
                  backgroundColor: "#e9f955",
                  opacity:         active ? 1 : 0,
                }}
              />
            </Link>
          );
        })}
      </nav>

      {/* ── Desktop side nav (hidden below md) ── */}
      <nav className="hidden md:flex fixed top-0 left-0 h-full w-[200px] bg-white border-r border-stone-200 flex-col pt-6 pb-8 z-50">
        {/* Logo */}
        <div className="px-5 mb-8 flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="BioHACKING" className="h-9 w-auto" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
        </div>

        {/* Nav items */}
        <div className="flex flex-col gap-1 flex-1 px-3">
          {NAV_ITEMS.map(({ href, Icon, label }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors"
                style={
                  active
                    ? { backgroundColor: "#e9f955", color: "#1a1a1a" }
                    : { color: "#6b6b6b" }
                }
              >
                <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
                <span className="text-sm font-medium">{label}</span>
                {active && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#1a1a1a]" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
