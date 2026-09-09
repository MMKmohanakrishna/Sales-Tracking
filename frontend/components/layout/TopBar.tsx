"use client";

export function TopBar({ title }: { title: string }) {
  return (
    <header className="lg:hidden sticky top-0 z-30 bg-card border-b border-border px-4 h-14 flex items-center">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm">
          DF
        </div>
        <span className="font-bold text-ink">{title}</span>
      </div>
    </header>
  );
}
