"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Lock, Mail } from "lucide-react";
import { api, type ApiError } from "./client";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      router.replace("/admin");
      router.refresh();
    } catch (err) {
      setError((err as ApiError).message);
      setPending(false);
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-cream px-4 py-10">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-5xl border border-white/10 bg-paper shadow-soft lg:grid-cols-[1fr_1.1fr]">
        <div className="relative hidden flex-col justify-between overflow-hidden bg-[linear-gradient(150deg,#4c1d95_0%,#2a1060_52%,#160c2e_100%)] p-10 text-white lg:flex">
          <div className="dot-grid pointer-events-none absolute inset-0 opacity-20" />
          <div className="relative flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-lime text-lg font-black text-[#150d24]">
              N
            </span>
            <span className="font-display text-xl font-bold tracking-tight">Navqiron</span>
          </div>
          <div className="relative">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-lime">
              Boshqaruv paneli
            </p>
            <h1 className="mt-4 font-display text-4xl leading-tight font-bold text-balance">
              Yunusobod yoshlari uchun platforma
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">
              Tadbirlar, musobaqalar va foydali joylarni bitta joydan boshqaring. Har bir
              o&apos;zgarish xaritada bir zumda ko&apos;rinadi.
            </p>
          </div>
          <p className="relative text-xs text-white/45">
            © {new Date().getFullYear()} Navqiron · Yunusobod tumani
          </p>
        </div>

        <div className="p-8 sm:p-12">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-sm font-black text-white">
              N
            </span>
            <span className="font-display text-lg font-bold">Navqiron</span>
          </div>
          <h2 className="font-display text-2xl font-bold">Xush kelibsiz</h2>
          <p className="mt-2 text-sm text-muted">
            Davom etish uchun administrator hisobingizga kiring.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <label className="block">
              <span className="field-label">Email</span>
              <div className="relative">
                <Mail className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
                <input
                  type="email"
                  required
                  autoComplete="username"
                  className="field pl-10!"
                  placeholder="admin@navqiron.uz"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </label>
            <label className="block">
              <span className="field-label">Parol</span>
              <div className="relative">
                <Lock className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  className="field pl-10!"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </label>

            {error ? (
              <p className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-300">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={pending}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 py-3 text-sm font-bold text-white shadow-[0_16px_36px_-20px_rgba(139,92,246,1)] transition hover:brightness-110 disabled:opacity-60"
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              {pending ? "Kirilmoqda…" : "Kirish"}
              {!pending ? <ArrowRight className="size-4" /> : null}
            </button>
          </form>

          <p className="mt-6 rounded-xl border border-white/8 bg-white/[0.04] px-4 py-3 text-xs leading-relaxed text-muted">
            Demo hisob: <strong className="text-ink">admin@navqiron.uz</strong> · parol:{" "}
            <strong className="text-ink">navqiron2026</strong>
          </p>
        </div>
      </div>
    </main>
  );
}
