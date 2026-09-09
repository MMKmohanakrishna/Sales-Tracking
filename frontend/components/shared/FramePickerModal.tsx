"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { SearchBar } from "./SearchBar";
import { ImageUpload } from "./ImageUpload";
import { useFrames, useCreateFrame } from "@/hooks/useFrames";
import { formatMoney, cn } from "@/lib/utils";
import type { Product } from "@/types";

const formSchema = z.object({
  godName: z.string().min(1, "God name is required"),
  frameName: z.string().optional(),
  size: z.string().optional(),
  sellingPrice: z.coerce.number().min(0, "Selling price cannot be negative"),
  description: z.string().optional(),
  quantityForSale: z.coerce.number().int().min(1, "Enter at least 1"),
  paidAmount: z.coerce.number().min(0).optional(),
});
type FormValues = z.infer<typeof formSchema>;

export function FramePickerModal({
  open,
  onClose,
  onAdd,
  currentPaidAmount = 0,
  onPaidAmountChange,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (product: Product, quantity: number, lineTotal?: number) => void;
  currentPaidAmount?: number;
  onPaidAmountChange?: (amount: number) => void;
}) {
  const [mode, setMode] = useState<"form" | "search">("form");

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "form" ? "Add Photo Frame" : "Select Existing Frame"}
    >
      {mode === "form" ? (
        <NewFrameForm
          currentPaidAmount={currentPaidAmount}
          onAdd={onAdd}
          onPaidAmountChange={onPaidAmountChange}
          onClose={onClose}
          onSwitchToSearch={() => setMode("search")}
        />
      ) : (
        <ExistingFramePicker
          currentPaidAmount={currentPaidAmount}
          onAdd={onAdd}
          onPaidAmountChange={onPaidAmountChange}
          onClose={onClose}
          onSwitchToForm={() => setMode("form")}
        />
      )}
    </Modal>
  );
}

/** Default view: fill in the frame's details directly (with photo), plus
 * quantity and how much the customer has paid — all in one form. */
function NewFrameForm({
  currentPaidAmount,
  onAdd,
  onPaidAmountChange,
  onClose,
  onSwitchToSearch,
}: {
  currentPaidAmount: number;
  onAdd: (product: Product, quantity: number, lineTotal?: number) => void;
  onPaidAmountChange?: (amount: number) => void;
  onClose: () => void;
  onSwitchToSearch: () => void;
}) {
  const [images, setImages] = useState<string[]>([]);
  const createFrame = useCreateFrame();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { quantityForSale: 1, paidAmount: currentPaidAmount, sellingPrice: 0 },
  });

  const sellingPrice = watch("sellingPrice") || 0;
  const quantityForSale = watch("quantityForSale") || 0;
  // "Selling Price" here is the TOTAL for this line, not a per-unit price —
  // it does not multiply as quantity changes.
  const subtotal = sellingPrice;

  async function onSubmit(values: FormValues) {
    const quantity = Math.max(1, values.quantityForSale);
    // Stored per-unit price on the catalog record is a best-effort average
    // (used if this frame gets reused later) — but the SALE itself gets the
    // exact typed total via lineTotal below, so there's no rounding drift
    // on today's transaction even if the total doesn't divide evenly.
    const unitPrice = Math.round((values.sellingPrice / quantity) * 100) / 100;
    const product = await createFrame.mutateAsync({
      godName: values.godName,
      frameName: values.frameName,
      size: values.size,
      sellingPrice: unitPrice,
      description: values.description,
      images,
      isQuickEntry: true, // added inline from New Sale — kept out of the Photo Frames catalog, stock isn't tracked
    });
    onAdd(product, quantity, values.sellingPrice);
    if (values.paidAmount !== undefined) onPaidAmountChange?.(values.paidAmount);
    onClose();
  }
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <ImageUpload value={images} onChange={setImages} label="Photos" />

      <Input label="God Name" required placeholder="Lord Venkateswara" error={errors.godName?.message} {...register("godName")} />
      <Input
        label="Frame Name"
        placeholder="Venkateswara Golden Frame"
        hint="Optional — uses the God Name if left blank"
        error={errors.frameName?.message}
        {...register("frameName")}
      />
      <Input label="Size" placeholder="12 × 18 inch" {...register("size")} />

      <Input
        label="Selling Price (₹)"
        type="number"
        step="0.01"
        min={0}
        required
        hint="Total price for this line — doesn't change if you increase the quantity below"
        error={errors.sellingPrice?.message}
        onKeyDown={(e) => {
          if (e.key === "-" || e.key === "e") e.preventDefault();
        }}
        {...register("sellingPrice")}
      />

      <Textarea label="Description" placeholder="Optional" {...register("description")} />

      <div className="pt-3 border-t border-border" />

      <Input
        label="Quantity for This Sale"
        type="number"
        min={1}
        required
        error={errors.quantityForSale?.message}
        {...register("quantityForSale")}
      />

      <div className="bg-primary/5 rounded-xl p-4 flex items-center justify-between">
        <span className="text-sm font-medium text-muted">Subtotal</span>
        <span className="text-xl font-extrabold text-primary">{formatMoney(subtotal)}</span>
      </div>

      <Input
        label="Amount Paid (₹)"
        type="number"
        step="0.01"
        min={0}
        hint="How much the customer has given so far, for the whole sale"
        error={errors.paidAmount?.message}
        {...register("paidAmount")}
      />

      {createFrame.isError && (
        <p className="text-sm text-danger font-medium">{(createFrame.error as Error).message}</p>
      )}

      <Button type="submit" size="lg" loading={createFrame.isPending}>
        {createFrame.isPending ? "Adding..." : "Add to Sale"}
      </Button>

    </form>
  );
}

/** Fallback view: reuse a frame that's already in the catalog, so repeat
 * sales of the same frame don't create duplicate catalog entries. */
function ExistingFramePicker({
  currentPaidAmount,
  onAdd,
  onPaidAmountChange,
  onClose,
  onSwitchToForm,
}: {
  currentPaidAmount: number;
  onAdd: (product: Product, quantity: number, lineTotal?: number) => void;
  onPaidAmountChange?: (amount: number) => void;
  onClose: () => void;
  onSwitchToForm: () => void;
}) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [paidAmount, setPaidAmount] = useState(currentPaidAmount);
  const [error, setError] = useState("");

  // Includes quick entries from past sales too, so a custom frame you typed
  // in once can be reused without retyping it — even though it stays out
  // of the main Photo Frames catalog page.
  const { data } = useFrames({ search, status: "active", includeQuickEntries: true });

  useEffect(() => {
    setPaidAmount(currentPaidAmount);
  }, [currentPaidAmount, selected]);

  function handleAdd() {
    if (!selected) return;
    if (quantity <= 0) {
      setError("Quantity must be at least 1");
      return;
    }
    onAdd(selected, quantity);
    onPaidAmountChange?.(paidAmount);
    onClose();
  }

  if (!selected) {
    return (
      <div className="flex flex-col gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search god name or frame name..." />
        <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
          {data?.data.map((p) => (
            <button
              key={p._id}
              onClick={() => setSelected(p)}
              className="flex items-center gap-3 text-left px-4 py-3 rounded-xl border border-border hover:bg-black/5"
            >
              <div className="h-11 w-11 rounded-lg bg-background border border-border overflow-hidden shrink-0 flex items-center justify-center">
                {p.images?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.images[0]} alt={p.frameName} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-[10px] text-muted">No photo</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-ink truncate">{p.frameName}</p>
                <p className="text-xs text-muted truncate">
                  {p.godName} {p.size ? `· ${p.size}` : ""}
                </p>
              </div>
              <p className="font-bold text-ink shrink-0">{formatMoney(p.sellingPrice)}</p>
            </button>
          ))}
          {data?.data.length === 0 && (
            <p className="text-sm text-muted text-center py-4">No frames found.</p>
          )}
        </div>
        <button type="button" onClick={onSwitchToForm} className="text-primary text-sm font-semibold text-center">
          Or fill in a new frame instead
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-background rounded-xl p-4 flex items-center gap-3">
        <div className="h-14 w-14 rounded-lg border border-border overflow-hidden shrink-0 flex items-center justify-center bg-card">
          {selected.images?.[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={selected.images[0]} alt={selected.frameName} className="h-full w-full object-cover" />
          ) : (
            <span className="text-[10px] text-muted text-center">No photo</span>
          )}
        </div>
        <div>
          <p className="font-bold text-ink">{selected.frameName}</p>
          <p className="text-sm text-muted">
            {selected.godName} · {formatMoney(selected.sellingPrice)} each
          </p>
        </div>
      </div>

      <Input
        label="Quantity"
        type="number"
        min={1}
        value={quantity}
        onChange={(e) => {
          setQuantity(parseInt(e.target.value) || 0);
          setError("");
        }}
      />

      <div className="bg-primary/5 rounded-xl p-4 flex items-center justify-between">
        <span className="text-sm font-medium text-muted">Subtotal</span>
        <span className="text-xl font-extrabold text-primary">{formatMoney(selected.sellingPrice * (quantity || 0))}</span>
      </div>

      <Input
        label="Amount Paid (₹)"
        type="number"
        step="0.01"
        min={0}
        hint="How much the customer has given so far, for the whole sale"
        value={paidAmount}
        onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
      />

      {error && <p className="text-sm text-danger font-medium">{error}</p>}

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={() => setSelected(null)}>
          Back
        </Button>
        <Button className="flex-1" onClick={handleAdd}>
          Add to Sale
        </Button>
      </div>
    </div>
  );
}
