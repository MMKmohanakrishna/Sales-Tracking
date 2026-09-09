import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Pagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between gap-3 flex-wrap py-2">
      <p className="text-sm text-muted">
        Showing <span className="font-semibold text-ink">{start}–{end}</span> of{" "}
        <span className="font-semibold text-ink">{total}</span>
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
          className={cn(
            "h-9 w-9 rounded-lg border border-border flex items-center justify-center",
            page <= 1 ? "opacity-40 cursor-not-allowed" : "hover:bg-black/5"
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-ink px-1">
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
          className={cn(
            "h-9 w-9 rounded-lg border border-border flex items-center justify-center",
            page >= totalPages ? "opacity-40 cursor-not-allowed" : "hover:bg-black/5"
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
