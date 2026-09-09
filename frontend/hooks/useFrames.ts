import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "@/lib/api";
import type { Product } from "@/types";

export function useFrames(params: {
  search?: string;
  status?: string;
  includeQuickEntries?: boolean;
  page?: number;
}) {
  return useQuery({
    queryKey: ["frames", params],
    queryFn: async () => {
      const res = await api.get("/frames", { params });
      return { data: res.data.data as Product[], pagination: res.data.pagination };
    },
  });
}

export function useFrame(id: string | undefined) {
  return useQuery({
    queryKey: ["frame", id],
    queryFn: () => unwrap<Product>(api.get(`/frames/${id}`)),
    enabled: !!id,
  });
}

export interface FrameInput {
  godName: string;
  frameName?: string;
  size?: string;
  sellingPrice: number;
  costPrice?: number;
  images?: string[];
  description?: string;
  isQuickEntry?: boolean;
}

export function useCreateFrame() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: FrameInput) => unwrap<Product>(api.post("/frames", input)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["frames"] }),
  });
}

export function useUpdateFrame() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<FrameInput> & { isActive?: boolean } }) =>
      unwrap<Product>(api.put(`/frames/${id}`, input)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["frames"] }),
  });
}

export function useDeleteFrame() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/frames/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["frames"] }),
  });
}
