"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/scan",        icon: "🔍" },
  { href: "/sos",         icon: "🆘" },
  { href: "/today",       icon: "✅" },
  { href: "/report",      icon: "📊" },
  { href: "/supplements", icon: "💊" },
  { href: "/settings",    icon: "⚙️" },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-stone-100 flex"
      style={{ height: 60 }}>
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
            {/* Active indicator dot */}
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
  );
}
