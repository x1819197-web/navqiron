"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import type { UserAccount } from "@/lib/types";

type Mode = "login" | "register";

interface WelcomeScreenProps {
  onAuthenticated(user: UserAccount): void;
  onGuest(): void;
}

export function WelcomeScreen({ onAuthenticated, onGuest }: WelcomeScreenProps) {
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function switchMode(next: Mode) {
    setMode(next);
    setErrors({});
    setFormError(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);

    const nextErrors: Record<string, string> = {};
    if (mode === "register" && name.trim().length < 2) {
      nextErrors.name = "Ism-familiyani kiriting";
    }
    if (phone.replace(/\D/g, "").length < 9) {
      nextErrors.phone = "Telefon raqamni to'liq kiriting";
    }
    if (mode === "register" && password.length < 6) {
      nextErrors.password = "Parol kamida 6 ta belgidan bo'lishi kerak";
    }
    if (mode === "login" && !password) {
      nextErrors.password = "Parolni kiriting";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setPending(true);
    try {
      const response = await fetch(`/api/user/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "register"
            ? { name: name.trim(), phone, password }
            : { phone, password },
        ),
      });
      const payload = (await response.json()) as {
        data?: { user?: UserAccount };
        error?: { message?: string; details?: Record<string, string> };
      };

      if (!response.ok || !payload.data?.user) {
        if (payload.error?.details) setErrors(payload.error.details);
        setFormError(payload.error?.message || "Xatolik yuz berdi. Qayta urinib ko'ring.");
        setPending(false);
        return;
      }

      onAuthenticated(payload.data.user);
    } catch {
      setFormError("Tarmoq xatosi. Internetni tekshirib qayta urinib ko'ring.");
      setPending(false);
    }
  }

  return (
    <main className="app-bg relative flex min-h-dvh flex-col overflow-hidden px-5 pb-8 pt-10">
      <div className="pointer-events-none absolute -top-24 -right-20 h-72 w-72 rounded-full bg-violet-600/30 blur-3xl" />
      <div className="pointer-events-none absolute top-40 -left-24 h-64 w-64 rounded-full bg-fuchsia-500/15 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.16] [background-image:radial-gradient(rgba(255,255,255,0.5)_1px,transparent_1px)] [background-size:22px_22px]" />

      <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-[0_0_28px_-6px_rgba(139,92,246,0.9)]">
              <Sparkles size={19} />
            </span>
            <div>
              <p className="font-display text-[17px] font-bold leading-none tracking-[-0.02em]">
                Navqiron
              </p>
              <p className="mt-1 text-[8.5px] font-extrabold uppercase leading-none tracking-[0.2em] text-muted">
                Yunusobod · Toshkent
              </p>
            </div>
          </div>
          <Link
            href="/admin"
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold text-ink-soft backdrop-blur transition hover:border-violet-400/40 hover:text-ink"
          >
            Admin
          </Link>
        </div>

        <div className="mt-12">
          <p className="flex items-center gap-2 text-[9.5px] font-extrabold uppercase tracking-[0.24em] text-lime/90">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime/60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-lime" />
            </span>
            Yosh shahar ilovasi
          </p>
          <h1 className="mt-3 font-display text-[34px] font-bold leading-[1.03] tracking-[-0.045em]">
            Shahar hayoti
            <br />
            <span className="neon-text">cho&apos;ntagingizda</span>
          </h1>
          <p className="mt-3 max-w-[34ch] text-[13px] font-medium leading-relaxed text-ink-soft/80">
            Tadbirlar, bepul mashg&apos;ulotlar va yoshlar uchun foydali manzillar —
            bitta jonli xaritada.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <Pill icon={<MapPin size={11} />} text="Yunusobod xaritasi" />
            <Pill icon={<Sparkles size={11} />} text="Har hafta yangi tadbirlar" />
          </div>
        </div>

        <div className="mt-8 rounded-[26px] border border-white/10 bg-white/[0.045] p-1.5 shadow-[0_30px_70px_-40px_rgba(0,0,0,1)] backdrop-blur-xl">
          <div className="grid grid-cols-2 gap-1 rounded-[20px] bg-black/25 p-1">
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`rounded-[16px] py-2.5 text-[12px] font-extrabold transition ${
                mode === "login"
                  ? "bg-gradient-to-br from-violet-500 to-violet-700 text-white shadow-[0_10px_24px_-12px_rgba(124,58,237,0.9)]"
                  : "text-muted hover:text-ink"
              }`}
            >
              Kirish
            </button>
            <button
              type="button"
              onClick={() => switchMode("register")}
              className={`rounded-[16px] py-2.5 text-[12px] font-extrabold transition ${
                mode === "register"
                  ? "bg-gradient-to-br from-violet-500 to-violet-700 text-white shadow-[0_10px_24px_-12px_rgba(124,58,237,0.9)]"
                  : "text-muted hover:text-ink"
              }`}
            >
              Ro&apos;yxatdan o&apos;tish
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 p-3 pt-4">
            {mode === "register" ? (
              <Field
                id="auth-name"
                label="Ism va familiya"
                icon={<User size={14} />}
                error={errors.name}
              >
                <input
                  id="auth-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="field-bare pl-9 pr-2"
                  placeholder="Aziz Karimov"
                  autoComplete="name"
                  disabled={pending}
                />
              </Field>
            ) : null}

            <Field
              id="auth-phone"
              label="Telefon raqam"
              icon={<Phone size={14} />}
              error={errors.phone}
              prefix="+998"
            >
              <input
                id="auth-phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="field-bare pl-9 pr-2"
                placeholder="90 123 45 67"
                inputMode="tel"
                autoComplete="tel"
                disabled={pending}
              />
            </Field>

            <Field
              id="auth-password"
              label="Parol"
              icon={<Lock size={14} />}
              error={errors.password}
              action={
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="grid h-7 w-7 place-items-center rounded-full text-muted transition hover:text-ink"
                  aria-label={showPassword ? "Parolni yashirish" : "Parolni ko'rsatish"}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              }
            >
              <input
                id="auth-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="field-bare pl-9 pr-9"
                placeholder={mode === "register" ? "Kamida 6 belgi" : "••••••••"}
                autoComplete={mode === "register" ? "new-password" : "current-password"}
                disabled={pending}
              />
            </Field>

            {formError ? (
              <p className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-[11px] font-semibold text-rose-300">
                {formError}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={pending}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 via-violet-500 to-fuchsia-500 px-4 py-3.5 text-[13px] font-extrabold text-white shadow-[0_18px_40px_-18px_rgba(139,92,246,0.95)] transition active:scale-[0.99] disabled:cursor-wait disabled:opacity-70"
            >
              {pending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {mode === "register" ? "Hisob yaratilmoqda..." : "Kirilmoqda..."}
                </>
              ) : (
                <>
                  {mode === "register" ? "Hisob yaratish" : "Davom etish"}
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            <p className="flex items-center justify-center gap-1.5 pt-1 text-[9.5px] font-medium text-muted">
              <ShieldCheck size={11} className="text-lime/70" />
              Ma&apos;lumotlaringiz himoyalangan va faqat platformada ishlatiladi
            </p>
          </form>
        </div>

        <div className="mt-6">
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-white/10" />
            <span className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-muted">
              yoki
            </span>
            <span className="h-px flex-1 bg-white/10" />
          </div>
          <button
            type="button"
            onClick={onGuest}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/[0.045] px-4 py-3 text-[12.5px] font-extrabold text-ink backdrop-blur-xl transition hover:border-violet-400/40 hover:bg-white/[0.07]"
          >
            <MapPin size={15} className="text-lime" />
            Mehmon sifatida ko&apos;rish
          </button>
        </div>

        <p className="mt-auto pt-8 text-center text-[9px] font-medium leading-relaxed text-muted/80">
          © 2026 Navqiron · Yunusobod yoshlar platformasi
        </p>
      </div>
    </main>
  );
}

function Pill({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold text-ink-soft backdrop-blur">
      <span className="text-lime">{icon}</span>
      {text}
    </span>
  );
}

function Field({
  id,
  label,
  icon,
  error,
  prefix,
  action,
  children,
}: {
  id: string;
  label: string;
  icon: React.ReactNode;
  error?: string;
  prefix?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="field-label text-[10.5px] text-muted">
        {label}
      </label>
      <div className="flex items-center gap-1 rounded-2xl border border-white/10 bg-black/20 px-1 transition focus-within:border-violet-400/60">
        {prefix ? (
          <span className="pl-2 text-[12.5px] font-bold text-ink-soft">{prefix}</span>
        ) : null}
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            {icon}
          </span>
          {children}
        </div>
        {action ? <span className="pr-2">{action}</span> : null}
      </div>
      {error ? <p className="field-error">{error}</p> : null}
    </div>
  );
}
