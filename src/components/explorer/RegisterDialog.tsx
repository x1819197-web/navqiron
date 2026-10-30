"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2, Phone, User, X } from "lucide-react";
import { CategoryIcon } from "./CategoryIcon";
import { formatEventWhen } from "@/lib/format";
import type { EventItem } from "@/lib/types";

interface RegisterDialogProps {
  event: EventItem;
  onClose(): void;
  onSuccess(registered: number): void;
}

type Status = "idle" | "loading" | "success";

export function RegisterDialog({ event, onClose, onSuccess }: RegisterDialogProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [registered, setRegistered] = useState(event.registered);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
    const onKey = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key === "Escape" && status !== "loading") onClose();
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose, status]);

  async function handleSubmit(event_: React.FormEvent) {
    event_.preventDefault();
    setFormError(null);

    const nextErrors: Record<string, string> = {};
    if (name.trim().length < 2) nextErrors.name = "Ism-familiyani kiriting";
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 9) nextErrors.phone = "Telefon raqamni to'liq kiriting";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setStatus("loading");
    try {
      const response = await fetch(`/api/events/${event.id}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone }),
      });
      const payload = (await response.json()) as {
        data?: { registered: number };
        error?: { message?: string; details?: Record<string, string> };
      };

      if (!response.ok || !payload.data) {
        setStatus("idle");
        if (payload.error?.details) setErrors(payload.error.details);
        setFormError(payload.error?.message || "Xatolik yuz berdi. Qayta urinib ko'ring.");
        return;
      }

      setRegistered(payload.data.registered);
      setStatus("success");
      onSuccess(payload.data.registered);
    } catch {
      setStatus("idle");
      setFormError("Tarmoq xatosi. Internetni tekshirib qayta urinib ko'ring.");
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Yopish"
        onClick={() => status !== "loading" && onClose()}
        className="absolute inset-0 bg-ink/45 backdrop-blur-[3px]"
      />
      <div className="animate-sheet-up relative w-full max-w-md overflow-hidden rounded-t-[26px] bg-paper shadow-soft sm:animate-pop sm:rounded-[26px]">
        <div
          className="h-1.5 w-full"
          style={{ backgroundColor: event.category.color }}
        />
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span
                className="grid h-10 w-10 place-items-center rounded-xl"
                style={{
                  backgroundColor: `${event.category.color}18`,
                  color: event.category.color,
                }}
              >
                <CategoryIcon name={event.category.icon} size={19} />
              </span>
              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-muted">
                  {status === "success" ? "Tayyor" : "Ro'yxatdan o'tish"}
                </p>
                <h3 className="mt-0.5 max-w-[260px] truncate font-display text-[15px] font-bold leading-tight text-ink">
                  {event.title}
                </h3>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={status === "loading"}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-cream text-muted transition hover:bg-cream-deep hover:text-ink disabled:opacity-40"
              aria-label="Yopish"
            >
              <X size={15} />
            </button>
          </div>

          {status === "success" ? (
            <div className="animate-fade-up py-4 text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-lime text-pine">
                <Check size={30} strokeWidth={2.5} />
              </div>
              <p className="mt-4 font-display text-[18px] font-bold text-ink">
                Siz ro&apos;yxatdan o&apos;tdingiz!
              </p>
              <p className="mx-auto mt-1 max-w-[32ch] text-[12px] leading-relaxed text-muted">
                {event.title} uchun joyingiz band qilindi. Tadbir eslatmasi Telegram
                orqali yuboriladi.
              </p>
              <div className="mt-4 rounded-2xl border border-line/80 bg-cream/60 px-3 py-2.5 text-[11.5px] font-semibold text-ink-soft">
                Ishtirokchilar:{" "}
                <span className="font-extrabold text-ink">{registered}</span>
                {event.capacity ? ` / ${event.capacity}` : ""}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="mt-4 w-full rounded-xl bg-pine px-4 py-3 text-[12.5px] font-extrabold text-paper transition hover:bg-pine-soft"
              >
                Yopish
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-4">
              <p className="text-[11.5px] leading-relaxed text-muted">
                {formatEventWhen(event.startsAt, event.endsAt)} · {event.venue}
              </p>

              <div className="mt-4 space-y-3">
                <div>
                  <label className="field-label" htmlFor="reg-name">
                    Ism va familiya
                  </label>
                  <div className="relative">
                    <User
                      size={14}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                    />
                    <input
                      ref={nameRef}
                      id="reg-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="field pl-9"
                      placeholder="Aziz Karimov"
                      autoComplete="name"
                      disabled={status === "loading"}
                    />
                  </div>
                  {errors.name ? <p className="field-error">{errors.name}</p> : null}
                </div>

                <div>
                  <label className="field-label" htmlFor="reg-phone">
                    Telefon raqam
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-[42px] items-center rounded-xl border border-line bg-cream px-3 text-[12.5px] font-bold text-ink-soft">
                      +998
                    </span>
                    <div className="relative flex-1">
                      <Phone
                        size={14}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                      />
                      <input
                        id="reg-phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="field pl-9"
                        placeholder="90 123 45 67"
                        inputMode="tel"
                        autoComplete="tel"
                        disabled={status === "loading"}
                      />
                    </div>
                  </div>
                  {errors.phone ? <p className="field-error">{errors.phone}</p> : null}
                </div>
              </div>

              {formError ? (
                <p className="mt-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-600">
                  {formError}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={status === "loading"}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-pine px-4 py-3 text-[12.5px] font-extrabold text-paper transition hover:bg-pine-soft disabled:cursor-wait disabled:opacity-70"
              >
                {status === "loading" ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Yuborilmoqda...
                  </>
                ) : (
                  "Ro'yxatdan o'tish"
                )}
              </button>

              <p className="mt-2.5 text-center text-[9.5px] leading-relaxed text-muted">
                Ma&apos;lumotlaringiz faqat tadbir tashkilotchisiga yuboriladi.
                Har bir telefon raqam bir marta ro&apos;yxatdan o&apos;tadi.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
