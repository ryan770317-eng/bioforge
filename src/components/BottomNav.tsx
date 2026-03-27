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
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-stone-100 flex">
      {NAV_ITEMS.map(({ href, icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className="flex-1 flex items-center justify-center py-3 transition-transform active:scale-90"
          >
            <span
              className="transition-all duration-150 leading-none"
              style={{ fontSize: active ? 26 : 20 }}
            >
              {icon}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
