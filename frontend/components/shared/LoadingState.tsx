import { Loader2 } from "lucide-react";

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="font-medium">{label}</p>
    </div>
  );
}
