"use client";
import { useCallback, useSyncExternalStore } from "react";
import { useStore } from "./store";
import { translate } from "./i18n";
import { carArt } from "./carArt";
import { fmtCompact, fmtMnt, fmtUsd } from "./format";
import type { Brand, Vehicle } from "./types";

export function useHydrated(): boolean {
  return useSyncExternalStore(
    (cb) => useStore.persist.onFinishHydration(cb),
    () => useStore.persist.hasHydrated(),
    () => false,
  );
}
export function useT() {
  const lang = useStore((s) => s.lang);
  const t = useCallback((k: string, p?: Record<string, string | number>) => translate(lang, k, p), [lang]);
  return { t, lang };
}
export function useUser() {
  const id = useStore((s) => s.sessionId);
  const users = useStore((s) => s.users);
  return users.find((u) => u.id === id) ?? null;
}
export function useBrandName() {
  const brands = useStore((s) => s.brands);
  return useCallback((id: string) => brands.find((b: Brand) => b.id === id)?.name ?? id, [brands]);
}
export function usePrice() {
  const { lang } = useT();
  const usd = useStore((s) => s.showUsd);
  return useCallback((n: number, compact = false) => ({ main: compact ? fmtCompact(n, lang) : fmtMnt(n), usd: usd ? fmtUsd(n) : null }), [lang, usd]);
}
export const photoSrc = (v: Vehicle, idx: number): string => {
  const p = v.photos[idx];
  if (!p) return carArt({ body: v.body, color: v.color, interiorColor: v.interiorColor, fuel: v.fuel, kind: "exterior", seed: v.id });
  if (p.url) return p.url;
  const variant = v.photos.slice(0, idx).filter((x) => x.kind === "exterior").length;
  return carArt({ body: v.body, color: v.color, interiorColor: v.interiorColor, fuel: v.fuel, kind: p.kind, variant, seed: v.id });
};
export const vehicleTitle = (v: Vehicle, brands: Brand[]) => `${brands.find((b) => b.id === v.brandId)?.name ?? ""} ${v.modelName}`.trim();

import { useMemo } from "react";
import type { Appointment, Lead } from "./types";
/** Data visible to the signed in staff user according to their role. */
export function useScope() {
  const user = useUser();
  const vehicles = useStore((s) => s.vehicles), leads = useStore((s) => s.leads), appts = useStore((s) => s.appointments);
  return useMemo(() => {
    if (!user) return { vehicles: [] as Vehicle[], leads: [] as Lead[], appts: [] as Appointment[] };
    const r = user.role;
    const vs = r === "admin" || r === "super_admin" ? vehicles : r === "seller" ? vehicles.filter((v) => v.sellerId === user.id) : r === "dealer_owner" || r === "agent" ? vehicles.filter((v) => v.dealerId === user.dealerId && !!user.dealerId) : [];
    const ids = new Set(vs.map((v) => v.id));
    const ls = r === "admin" || r === "super_admin" ? leads : r === "agent" ? leads.filter((l) => l.assignedTo === user.id) : leads.filter((l) => ids.has(l.vehicleId));
    const as = r === "inspector" ? appts.filter((a) => a.inspectorId === user.id || (!a.inspectorId && a.status !== "cancelled")) : r === "admin" || r === "super_admin" ? appts : appts.filter((a) => ids.has(a.vehicleId));
    return { vehicles: vs, leads: ls, appts: as };
  }, [user, vehicles, leads, appts]);
}
