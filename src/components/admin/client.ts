export interface ApiError extends Error {
  status: number;
  details?: Record<string, string>;
}

export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const body = (await res.json().catch(() => null)) as
    | { data?: unknown; error?: { message?: string; details?: Record<string, string> } }
    | null;

  if (!res.ok) {
    const error = new Error(body?.error?.message ?? "Xatolik yuz berdi") as ApiError;
    error.status = res.status;
    error.details = body?.error?.details;
    throw error;
  }

  return body as T;
}

export function isoToLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const shifted = new Date(date.getTime() + 5 * 3_600_000);
  return shifted.toISOString().slice(0, 16);
}

export function localInputToIso(value: string): string | null {
  if (!value) return null;
  const date = new Date(`${value}:00+05:00`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("998")) {
    return `+998 ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10)}`;
  }
  return phone;
}
