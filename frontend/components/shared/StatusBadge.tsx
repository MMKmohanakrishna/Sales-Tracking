import { Badge } from "@/components/ui/Card";
import { statusLabel } from "@/lib/utils";
import type { PaymentStatus } from "@/types";

export function StatusBadge({ status }: { status: PaymentStatus }) {
  const variant = status === "PAID" ? "success" : status === "PARTIALLY_PAID" ? "warning" : "danger";
  return <Badge variant={variant}>{statusLabel(status)}</Badge>;
}
