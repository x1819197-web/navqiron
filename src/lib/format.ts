export const TASHKENT_TZ = "Asia/Tashkent";
const OFFSET = "+05:00";

export const MONTHS = [
  "yanvar",
  "fevral",
  "mart",
  "aprel",
  "may",
  "iyun",
  "iyul",
  "avgust",
  "sentabr",
  "oktabr",
  "noyabr",
  "dekabr",
];

export const MONTHS_SHORT = [
  "YAN",
  "FEV",
  "MAR",
  "APR",
  "MAY",
  "IYN",
  "IYL",
  "AVG",
  "SEN",
  "OKT",
  "NOY",
  "DEK",
];

export const WEEKDAYS = [
  "yakshanba",
  "dushanba",
  "seshanba",
  "chorshanba",
  "payshanba",
  "juma",
  "shanba",
];

interface TashkentParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: number;
  dateKey: string;
}

const partsFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: TASHKENT_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  weekday: "short",
  hourCycle: "h23",
});

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export function tashkentParts(value: string | number | Date): TashkentParts {
  const date = value instanceof Date ? value : new Date(value);
  const parts = partsFormatter.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "0";
  const year = Number(get("year"));
  const month = Number(get("month"));
  const day = Number(get("day"));
  return {
    year,
    month,
    day,
    hour: Number(get("hour")),
    minute: Number(get("minute")),
    weekday: WEEKDAY_INDEX[get("weekday")] ?? 0,
    dateKey: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
  };
}

export function tashkentMidnight(offsetDays = 0): number {
  const today = tashkentParts(new Date());
  const base = new Date(`${today.dateKey}T00:00:00${OFFSET}`);
  return base.getTime() + offsetDays * 86_400_000;
}

export function dateKeyOf(value: string | number | Date): string {
  return tashkentParts(value).dateKey;
}

export function formatTime(value: string | number | Date): string {
  const p = tashkentParts(value);
  return `${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`;
}

export function formatTimeRange(start: string, end?: string | null): string {
  if (!end) return formatTime(start);
  return `${formatTime(start)} – ${formatTime(end)}`;
}

export function formatDayBadge(value: string): { day: string; month: string } {
  const p = tashkentParts(value);
  return { day: String(p.day).padStart(2, "0"), month: MONTHS_SHORT[p.month - 1] };
}

export function formatDateLong(value: string, withYear = true): string {
  const p = tashkentParts(value);
  const month = MONTHS[p.month - 1];
  const year = withYear ? ` ${p.year}` : "";
  return `${p.day}-${month}${year}, ${WEEKDAYS[p.weekday]}`;
}

export function formatDateShort(value: string): string {
  const p = tashkentParts(value);
  return `${p.day} ${MONTHS[p.month - 1]}`;
}

export function dayLabel(value: string): string {
  const key = dateKeyOf(value);
  const today = dateKeyOf(Date.now());
  const tomorrow = dateKeyOf(tashkentMidnight(1));
  if (key === today) return "Bugun";
  if (key === tomorrow) return "Ertaga";
  return formatDateLong(value, false);
}

export function isToday(value: string): boolean {
  return dateKeyOf(value) === dateKeyOf(Date.now());
}

export function isSameDay(a: string, b: string): boolean {
  return dateKeyOf(a) === dateKeyOf(b);
}

export function isWithinDays(value: string, days: number): boolean {
  const start = tashkentMidnight(0);
  const end = start + days * 86_400_000;
  const ts = new Date(value).getTime();
  return ts >= start && ts < end;
}

export function isUpcoming(value: string): boolean {
  return new Date(value).getTime() >= Date.now() - 3 * 3_600_000;
}

export function formatCount(value: number): string {
  return new Intl.NumberFormat("ru-RU").format(value);
}

export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[ʻʼ‘’`']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function formatEventWhen(start: string, end: string | null): string {
  if (end && !isSameDay(start, end)) {
    return `${formatDateLong(start)}, ${formatTime(start)} — ${formatDateLong(end)}, ${formatTime(end)}`;
  }
  return `${formatDateLong(start)}, ${formatTimeRange(start, end)}`;
}
