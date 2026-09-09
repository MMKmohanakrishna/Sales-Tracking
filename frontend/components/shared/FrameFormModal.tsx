"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { useCreateFrame, useUpdateFrame, FrameInput } from "@/hooks/useFrames";
import type { Product } from "@/types";

const schema = z.object({
  godName: z.string().min(1, "God name is required"),
  frameName: z.string().optional(),
  size: z.string().optional(),
  sellingPrice: z.coerce.number().min(0, "Selling price cannot be negative"),
  description: z.string().optional(),
});

export function FrameFormModal({
  open,
  onClose,
  frame,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  frame?: Product | null;
  onCreated?: (product: Product) => void;
}) {
  const createFrame = useCreateFrame();
  const updateFrame = useUpdateFrame();
  const isEdit = !!frame;
  const [images, setImages] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FrameInput>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (open) {
      reset(
        frame
          ? {
              godName: frame.godName,
              frameName: frame.frameName,
              size: frame.size,
              sellingPrice: frame.sellingPrice,
              description: frame.description,
            }
          : { godName: "", frameName: "", size: "", sellingPrice: 0 }
      );
      setImages(frame?.images || []);
    }
  }, [open, frame, reset]);

  const mutation = isEdit ? updateFrame : createFrame;

  async function onSubmit(values: FrameInput) {
    const payload = { ...values, images };
    if (isEdit && frame) {
      await updateFrame.mutateAsync({ id: frame._id, input: payload });
    } else {
      const created = await createFrame.mutateAsync(payload);
      onCreated?.(created);
    }
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit Photo Frame" : "Add Photo Frame"}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <ImageUpload value={images} onChange={setImages} label="Frame Photos" />
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
          error={errors.sellingPrice?.message}
          onKeyDown={(e) => {
            if (e.key === "-" || e.key === "e") e.preventDefault();
          }}
          {...register("sellingPrice")}
        />

        <Textarea label="Description" placeholder="Optional" {...register("description")} />

        {mutation.isError && <p className="text-sm text-danger font-medium">{(mutation.error as Error).message}</p>}

        <Button type="submit" size="lg" loading={mutation.isPending}>
          {mutation.isPending ? "Saving..." : "Save Frame"}
        </Button>
      </form>
    </Modal>
  );
}
