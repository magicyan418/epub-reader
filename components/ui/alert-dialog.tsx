"use client";

import { createPortal } from "react-dom";
import { useEffect, useRef } from "react";

export function AlertDialog({ open, title, description, confirmLabel = "确认", cancelLabel = "取消", onConfirm, onCancel }: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onCancel]);

  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <div className="alert-dialog-layer">
      <button className="alert-dialog-overlay" aria-label="关闭确认弹窗" onClick={onCancel} />
      <section className="alert-dialog-content" role="alertdialog" aria-modal="true" aria-labelledby="alert-dialog-title" aria-describedby="alert-dialog-description">
        <h2 id="alert-dialog-title">{title}</h2>
        <p id="alert-dialog-description">{description}</p>
        <div className="alert-dialog-actions">
          <button ref={cancelRef} className="dialog-button secondary" onClick={onCancel}>{cancelLabel}</button>
          <button className="dialog-button destructive" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
