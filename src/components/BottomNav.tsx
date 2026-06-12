"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  {
    href: "/",
    label: "今天",
    icon: (
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4M12 8a4 4 0 100 8 4 4 0 000-8z" />
    ),
  },
  {
    href: "/numbers",
    label: "數字",
    icon: <path d="M4 19L9 12l4 3 7-9M4 19h16" />,
  },
  {
    href: "/plan",
    label: "計畫",
    icon: <path d="M6 21V4m0 0s2-1.5 6-1.5S18 4 18 4v9s-2-1.5-6-1.5S6 13 6 13" />,
  },
  {
    href: "/more",
    label: "更多",
    icon: (
      <path d="M5 12h.01M12 12h.01M19 12h.01M5 12a1 1 0 110-2 1 1 0 010 2zm7 0a1 1 0 110-2 1 1 0 010 2zm7 0a1 1 0 110-2 1 1 0 010 2z" />
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-line bg-[#0a0f0d]/90 backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-md">
        {TABS.map((t) => {
          const active =
            t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] tracking-widest transition-colors ${
                active ? "text-green font-bold" : "text-muted"
              }`}
            >
              {active && (
                <span className="absolute top-0 h-0.5 w-8 rounded-full bg-green shadow-[0_0_8px_rgba(43,255,168,0.8)]" />
              )}
              <svg
                viewBox="0 0 24 24"
                className={`h-6 w-6 ${active ? "drop-shadow-[0_0_6px_rgba(43,255,168,0.7)]" : ""}`}
                fill="none"
                stroke="currentColor"
                strokeWidth={active ? 2.4 : 1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {t.icon}
              </svg>
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
