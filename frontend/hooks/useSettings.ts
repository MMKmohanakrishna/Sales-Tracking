import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "@/lib/api";
import type { BusinessSettings } from "@/types";

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: () => unwrap<BusinessSettings>(api.get("/settings")),
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<BusinessSettings>) =>
      unwrap<BusinessSettings>(api.put("/settings", input)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  });
}
