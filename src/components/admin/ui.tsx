"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

export function Modal({
  title,
  subtitle,
  onClose,
  children,
  width = "max-w-2xl",
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  width?: string;
}) {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`animate-sheet-up flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-4xl border border-line bg-paper shadow-soft sm:rounded-4xl ${width}`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
          <div>
            <h2 className="font-display text-lg font-bold">{title}</h2>
            {subtitle ? <p className="mt-0.5 text-xs text-muted">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 shrink-0 place-items-center rounded-xl bg-cream text-ink-soft transition hover:bg-cream-deep"
            aria-label="Yopish"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="scroll-area overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: "published" | "draft" }) {
  return status === "published" ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-lime/15 px-2.5 py-0.5 text-[11px] font-bold text-lime">
      <span className="size-1.5 rounded-full bg-lime" />
      Nashr etilgan
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2.5 py-0.5 text-[11px] font-bold text-amber-300">
      <span className="size-1.5 rounded-full bg-amber-500" />
      Qoralama
    </span>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 rounded-3xl border border-line bg-paper p-6 sm:flex-row sm:items-end sm:justify-between lg:p-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted">{eyebrow}</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">{description}</p>
      </div>
      {action}
    </header>
  );
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "O'chirish",
  pending,
  onConfirm,
  onClose,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  pending?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal title={title} onClose={onClose} width="max-w-md">
      <p className="text-sm leading-relaxed text-ink-soft">{message}</p>
      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl bg-cream px-4 py-2.5 text-sm font-bold text-ink-soft transition hover:bg-cream-deep"
        >
          Bekor qilish
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={pending}
          className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-60"
        >
          {pending ? "O'chirilmoqda…" : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
