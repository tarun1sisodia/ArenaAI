export type Clock = {
  now(): Date;
};

export const systemClock: Clock = {
  now: () => new Date(),
};

export function toIso(date: Date): string {
  return date.toISOString();
}

export function formatIstYmd(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function hourInIst(isoDatetime: string): number {
  const date = new Date(isoDatetime);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid datetime");
  }
  const hour = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date).find((part) => part.type === "hour")?.value;
  return Number(hour ?? "0");
}

export function calendarDaysInclusiveIst(startIso: string, endIso?: string): number {
  if (!endIso) return 1;
  const start = ymdParts(startIso);
  const end = ymdParts(endIso);
  const startUtc = Date.UTC(start.year, start.month - 1, start.day);
  const endUtc = Date.UTC(end.year, end.month - 1, end.day);
  const diff = Math.floor((endUtc - startUtc) / 86_400_000);
  return Math.max(1, diff + 1);
}

function ymdParts(iso: string): { year: number; month: number; day: number } {
  const formatted = formatIstYmd(new Date(iso));
  const [year, month, day] = formatted.split("-").map(Number);
  return { year: year ?? 1970, month: month ?? 1, day: day ?? 1 };
}
