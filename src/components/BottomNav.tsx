"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/scan", label: "掃描", icon: "🔍" },
  { href: "/sos", label: "急救", icon: "🆘" },
  { href: "/today", label: "打卡", icon: "✅" },
  { href: "/report", label: "週報", icon: "📊" },
  { href: "/supplements", label: "保健品", icon: "💊" },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-stone-100 flex">
      {NAV_ITEMS.map(({ href, label, icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link key={href} href={href} className="flex-1 flex flex-col items-center py-3 gap-0.5">
            <span className="text-xl">{icon}</span>
            <span className={`text-[10px] font-medium ${active ? "text-[#D4A24E]" : "text-[#8B7D6B]"}`}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
