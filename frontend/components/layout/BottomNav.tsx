"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Menu } from "lucide-react";
import { bottomNavItems, moreNavItems } from "./nav";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/hooks/useAuth";
import { LogOut } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const { logout } = useAuth();
  const router = useRouter();

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-5 h-16">
          {bottomNavItems.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            if (item.primary) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-center -mt-6"
                >
                  <span className="h-14 w-14 rounded-full bg-primary text-white flex items-center justify-center shadow-lift">
                    <Icon className="h-7 w-7" />
                  </span>
                </Link>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold",
                  active ? "text-primary" : "text-muted"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
          <button
            onClick={() => setMoreOpen(true)}
            className="flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold text-muted"
          >
            <Menu className="h-5 w-5" />
            More
          </button>
        </div>
      </nav>

      <Modal open={moreOpen} onClose={() => setMoreOpen(false)} title="More" maxWidth="max-w-sm">
        <div className="grid grid-cols-2 gap-3">
          {moreNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.href}
                onClick={() => {
                  setMoreOpen(false);
                  router.push(item.href);
                }}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:bg-black/5"
              >
                <Icon className="h-6 w-6 text-primary" />
                <span className="text-sm font-semibold">{item.label}</span>
              </button>
            );
          })}
          <button
            onClick={() => {
              setMoreOpen(false);
              logout();
            }}
            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:bg-danger/5 text-danger col-span-2"
          >
            <LogOut className="h-6 w-6" />
            <span className="text-sm font-semibold">Logout</span>
          </button>
        </div>
      </Modal>
    </>
  );
}
