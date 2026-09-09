"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ImageIcon, PlusCircle, Pencil, Trash2, EyeOff, Eye } from "lucide-react";
import { useFrames, useUpdateFrame, useDeleteFrame } from "@/hooks/useFrames";
import { SearchBar } from "@/components/shared/SearchBar";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card, Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FrameFormModal } from "@/components/shared/FrameFormModal";
import { ImageLightbox } from "@/components/shared/ImageLightbox";
import { Pagination } from "@/components/shared/Pagination";
import { formatMoney, cn } from "@/lib/utils";
import type { Product } from "@/types";

export default function FramesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("active");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingFrame, setEditingFrame] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [previewFrame, setPreviewFrame] = useState<Product | null>(null);

  useEffect(() => {
    if (searchParams.get("add") === "1") {
      setFormOpen(true);
      router.replace("/frames");
    }
  }, [searchParams, router]);

  useEffect(() => {
    setPage(1);
  }, [search, status]);

  const { data, isLoading } = useFrames({ search, status, page });
  const updateFrame = useUpdateFrame();
  const deleteFrame = useDeleteFrame();

  async function confirmDelete() {
    if (!deleteTarget) return;
    await deleteFrame.mutateAsync(deleteTarget._id);
    setDeleteTarget(null);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">God Photo Frames</h1>
          <p className="text-muted mt-0.5">Manage your frame catalog</p>
        </div>
        <Button
          className="hidden sm:inline-flex"
          onClick={() => {
            setEditingFrame(null);
            setFormOpen(true);
          }}
        >
          <PlusCircle className="h-5 w-5" /> Add Frame
        </Button>
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Search by god name or frame name..." />

      <div className="flex gap-2">
        {[
          { key: "active", label: "Active" },
          { key: "inactive", label: "Inactive" },
          { key: "all", label: "All" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setStatus(f.key)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-semibold border",
              status === f.key ? "bg-primary text-white border-primary" : "bg-card border-border text-ink/70"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingState label="Loading frames..." />
      ) : !data?.data.length ? (
        <EmptyState
          icon={ImageIcon}
          title="No frames yet"
          description="Add your first God photo frame to start selling."
          action={
            <Button onClick={() => setFormOpen(true)}>
              <PlusCircle className="h-5 w-5" /> Add Frame
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.data.map((f) => (
            <Card key={f._id} className={cn("flex flex-col gap-3", !f.isActive && "opacity-60")}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => f.images?.length && setPreviewFrame(f)}
                    disabled={!f.images?.length}
                    className={cn(
                      "h-16 w-16 rounded-xl border border-border bg-background overflow-hidden shrink-0 flex items-center justify-center",
                      f.images?.length && "cursor-zoom-in hover:opacity-80"
                    )}
                    aria-label={f.images?.length ? "View photo" : undefined}
                  >
                    {f.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={f.images[0]} alt={f.frameName} className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-muted" />
                    )}
                  </button>
                  <div className="min-w-0">
                    <p className="font-bold text-ink truncate">{f.godName}</p>
                    <p className="text-sm text-muted truncate">{f.frameName}</p>
                    {f.size && <p className="text-xs text-muted mt-0.5">{f.size}</p>}
                  </div>
                </div>
                {!f.isActive && <Badge variant="muted">Inactive</Badge>}
              </div>
              <div>
                <p className="text-xs text-muted">Selling Price</p>
                <p className="text-xl font-extrabold text-ink">{formatMoney(f.sellingPrice)}</p>
              </div>
              <div className="flex gap-2 pt-2 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setEditingFrame(f);
                    setFormOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4" /> Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateFrame.mutate({ id: f._id, input: { isActive: !f.isActive } })}
                  title={f.isActive ? "Deactivate frame" : "Activate frame"}
                >
                  {f.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteTarget(f)}
                  title="Delete frame"
                  className="text-danger hover:bg-danger/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {data?.pagination && (
        <Pagination
          page={data.pagination.page}
          totalPages={data.pagination.totalPages}
          total={data.pagination.total}
          limit={data.pagination.limit}
          onPageChange={setPage}
        />
      )}

      <button
        onClick={() => {
          setEditingFrame(null);
          setFormOpen(true);
        }}
        className="sm:hidden fixed bottom-24 right-4 h-14 w-14 rounded-full bg-primary text-white shadow-lift flex items-center justify-center z-30"
        aria-label="Add Frame"
      >
        <PlusCircle className="h-6 w-6" />
      </button>

      <FrameFormModal open={formOpen} onClose={() => setFormOpen(false)} frame={editingFrame} />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Frame"
        message={
          deleteTarget
            ? `Delete "${deleteTarget.frameName}"? If it has any past sales, it'll be marked inactive instead of deleted so your sales history stays intact.`
            : ""
        }
        confirmLabel="Delete"
        danger
        loading={deleteFrame.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {previewFrame && (
        <ImageLightbox
          images={previewFrame.images}
          title={previewFrame.frameName}
          onClose={() => setPreviewFrame(null)}
        />
      )}
    </div>
  );
}
