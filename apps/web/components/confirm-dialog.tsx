"use client";

import { useId, type ReactNode } from "react";
import { TriangleAlert } from "lucide-react";
import { Button } from "@protectedshare/ui";
import ModalDialog from "./modal-dialog";

export type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: ReactNode;
  /** Default "Confirm". */
  confirmLabel?: string;
  /** Default "Cancel". */
  cancelLabel?: string;
  /** danger: red confirm button and warning icon. */
  tone?: "default" | "danger";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
};

/** Small modal for confirming an action. Escape, backdrop and Cancel all call onCancel. */
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "default",
  loading,
  onConfirm,
  onCancel,
  children,
}: ConfirmDialogProps) {
  const id = useId();
  if (!open) return null;
  const titleId = `${id}-title`;
  const descriptionId = description ? `${id}-desc` : undefined;

  return (
    <ModalDialog
      titleId={titleId}
      descriptionId={descriptionId}
      onClose={() => {
        if (!loading) onCancel();
      }}
      panelClassName="relative w-full max-w-[420px] animate-rise rounded-panel border border-line bg-surface shadow-float"
    >
      <div className="flex gap-3.5 p-5">
        {tone === "danger" ? (
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-danger-soft text-danger">
            <TriangleAlert aria-hidden="true" className="size-[18px]" strokeWidth={1.75} />
          </span>
        ) : null}
        <div className="min-w-0 pt-1">
          <h2 id={titleId} className="text-[16px] font-semibold leading-6 tracking-[-0.01em] text-ink">
            {title}
          </h2>
          {description ? (
            <div id={descriptionId} className="mt-1.5 text-small text-ink-3">
              {description}
            </div>
          ) : null}
          {children ? <div className="mt-3">{children}</div> : null}
        </div>
      </div>
      <div className="flex justify-end gap-2 rounded-b-panel border-t border-line bg-surface-2/40 px-5 py-3">
        <Button variant="secondary" size="sm" onClick={onCancel} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          variant={tone === "danger" ? "danger" : "primary"}
          size="sm"
          onClick={onConfirm}
          loading={loading}
        >
          {confirmLabel}
        </Button>
      </div>
    </ModalDialog>
  );
}
