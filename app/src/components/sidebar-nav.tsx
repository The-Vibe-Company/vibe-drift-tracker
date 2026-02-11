"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    isActive: (pathname: string) => pathname === "/dashboard",
  },
  {
    href: "/dashboard/settings",
    label: "Settings",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    isActive: (pathname: string) => pathname.startsWith("/dashboard/settings"),
  },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col items-center gap-2">
      {navItems.map((item) => {
        const active = item.isActive(pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            className="group relative flex items-center justify-center w-10 h-10 rounded-lg transition-colors"
            style={{
              color: active ? "var(--primary)" : "var(--muted-foreground)",
              background: active ? "rgba(250, 204, 21, 0.1)" : "transparent",
              opacity: active ? 1 : 0.7,
            }}
            onMouseEnter={(e) => {
              if (!active) e.currentTarget.style.opacity = "1";
            }}
            onMouseLeave={(e) => {
              if (!active) e.currentTarget.style.opacity = "0.7";
            }}
          >
            {item.icon}
            <span
              className="pointer-events-none absolute left-full ml-2 rounded-md px-2 py-1 text-xs font-medium whitespace-nowrap opacity-0 scale-95 transition-all group-hover:opacity-100 group-hover:scale-100"
              style={{
                background: "var(--popover)",
                color: "var(--popover-foreground)",
                border: "1px solid var(--border)",
              }}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
