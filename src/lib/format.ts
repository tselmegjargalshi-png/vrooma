import type { Lang } from "./types";

export const USD_RATE = Number(process.env.NEXT_PUBLIC_USD_RATE || 3450);

export function fmtMnt(n: number): string {
  return Math.round(n).toLocaleString("en-US") + "₮";
}
export function fmtCompact(n: number, lang: Lang): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2).replace(/\.?0+$/, "") + (lang === "mn" ? " тэрбум₮" : "B₮");
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + (lang === "mn" ? " сая₮" : "M₮");
  if (n >= 1_000) return Math.round(n / 1_000) + (lang === "mn" ? " мянга₮" : "K₮");
  return Math.round(n) + "₮";
}
export function fmtUsd(n: number): string {
  return "≈ $" + Math.round(n / USD_RATE).toLocaleString("en-US");
}
export function fmtNum(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}
export function fmtKm(n: number): string {
  return fmtNum(n) + " км";
}
/** Mongolian numbers are 8 digits, mobile numbers start with 8 or 9. Output: +976 9911 2233 */
export function fmtPhone(raw: string): string {
  const d = raw.replace(/\D/g, "").replace(/^976/, "").slice(0, 8);
  if (d.length <= 4) return d;
  return d.slice(0, 4) + " " + d.slice(4);
}
export function phoneValid(raw: string): boolean {
  const d = raw.replace(/\D/g, "").replace(/^976/, "");
  return /^[6-9]\d{7}$/.test(d) || /^[1-5]\d{7}$/.test(d);
}
export function telHref(raw: string): string {
  return "tel:+976" + raw.replace(/\D/g, "").replace(/^976/, "");
}
export function fmtPhoneFull(raw: string): string {
  return "+976 " + fmtPhone(raw);
}
export function fmtDate(iso: string, lang: Lang, withTime = false): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  const base = lang === "mn" ? `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}` : `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`;
  return withTime ? `${base} ${p(d.getHours())}:${p(d.getMinutes())}` : base;
}
export function ago(iso: string, lang: Lang): string {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  const units: [number, string, string][] = [[86400, "өдрийн өмнө", "d ago"], [3600, "цагийн өмнө", "h ago"], [60, "минутын өмнө", "min ago"]];
  for (const [sec, mn, en] of units) if (s >= sec) return Math.floor(s / sec) + (lang === "mn" ? " " + mn : en.startsWith("min") ? " " + en : en);
  return lang === "mn" ? "саяхан" : "just now";
}
export function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
export const uid = (p: string) => p + Math.random().toString(36).slice(2, 9);
export const addDays = (iso: string | Date, days: number) => new Date(new Date(iso).getTime() + days * 86400000).toISOString();
export const nowIso = () => new Date().toISOString();
