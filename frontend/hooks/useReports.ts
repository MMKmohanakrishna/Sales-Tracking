import { useQuery } from "@tanstack/react-query";
import { api, unwrap } from "@/lib/api";

export function useDashboardReport() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: () => unwrap<any>(api.get("/reports/dashboard")),
    refetchInterval: 60_000,
  });
}

export function useSalesReport(range: string) {
  return useQuery({
    queryKey: ["reports", "sales", range],
    queryFn: () => unwrap<any>(api.get("/reports/sales", { params: { range } })),
  });
}

export function usePaymentsReport() {
  return useQuery({
    queryKey: ["reports", "payments"],
    queryFn: () => unwrap<any>(api.get("/reports/payments")),
  });
}

export function useTopFramesReport(from?: string, to?: string) {
  return useQuery({
    queryKey: ["reports", "top-frames", from, to],
    queryFn: () => unwrap<any[]>(api.get("/reports/top-frames", { params: { from, to } })),
  });
}
