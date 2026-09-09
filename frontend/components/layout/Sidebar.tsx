"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { navItems } from "./nav";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 h-screen sticky top-0 border-r border-border bg-card">
      <div className="px-6 py-6 border-b border-border">
        <div className="flex items-center gap-2">
          <div>
            <p className="font-extrabold text-ink leading-tight">AbhiReka</p>
            <p className="text-xs text-muted leading-tight">Lightings and Photo Frames</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-colors",
                item.primary
                  ? "bg-primary text-white hover:bg-primary-dark"
                  : active
                  ? "bg-primary/10 text-primary"
                  : "text-ink/70 hover:bg-black/5"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border">
        <div className="px-3 py-2 mb-1">
          <p className="text-sm font-semibold text-ink truncate">{user?.name}</p>
          <p className="text-xs text-muted truncate">{user?.email}</p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-danger hover:bg-danger/10 w-full"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}
