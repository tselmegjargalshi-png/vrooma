import type { Vehicle, User, Dealer, Brand } from "./types";

export const MULTI = ["fuel", "trans", "drive", "color", "category", "province"] as const;
export interface Filters {
  q: string; brand: string; model: string; category: string[]; minPrice: string; maxPrice: string; minYear: string; maxYear: string;
  minImport: string; maxImport: string; minKm: string; maxKm: string; minCc: string; maxCc: string; fuel: string[]; trans: string[]; drive: string[];
  steering: string; color: string[]; doors: string; seats: string; province: string[]; seller: string; verified: string; accident: string; origin: string; eco: string;
  sort: string; view: string; page: string;
}
export const EMPTY: Filters = {
  q: "", brand: "", model: "", category: [], minPrice: "", maxPrice: "", minYear: "", maxYear: "", minImport: "", maxImport: "", minKm: "", maxKm: "", minCc: "", maxCc: "",
  fuel: [], trans: [], drive: [], steering: "", color: [], doors: "", seats: "", province: [], seller: "", verified: "", accident: "", origin: "", eco: "", sort: "recommended", view: "grid", page: "1",
};
export function parseFilters(sp: URLSearchParams): Filters {
  const f: Filters = { ...EMPTY, category: [], fuel: [], trans: [], drive: [], color: [], province: [] };
  (Object.keys(EMPTY) as (keyof Filters)[]).forEach((k) => {
    const v = sp.get(k);
    if (v == null || v === "") return;
    if (Array.isArray(EMPTY[k])) (f[k] as string[]) = v.split(",").filter(Boolean);
    else (f[k] as string) = v;
  });
  return f;
}
export function toParams(f: Partial<Filters>, keepView = true): string {
  const sp = new URLSearchParams();
  (Object.keys(EMPTY) as (keyof Filters)[]).forEach((k) => {
    const v = f[k];
    if (v == null) return;
    if (Array.isArray(v)) { if (v.length) sp.set(k, v.join(",")); }
    else if (v !== "" && v !== EMPTY[k]) sp.set(k, v);
  });
  if (!keepView) { sp.delete("view"); sp.delete("page"); sp.delete("sort"); }
  return sp.toString();
}
export const activeFilterCount = (f: Filters) =>
  (Object.keys(EMPTY) as (keyof Filters)[]).filter((k) => !["sort", "view", "page"].includes(k) && (Array.isArray(f[k]) ? (f[k] as string[]).length > 0 : f[k] !== "")).length;

export interface Ctx { users: User[]; dealers: Dealer[]; brands: Brand[] }
const num = (s: string) => (s === "" ? null : Number(s));
const tierRank = (v: Vehicle) => (v.tier === "featured" ? 2 : v.tier === "premium" ? 1 : 0);

export function isPublic(v: Vehicle, now = Date.now()): boolean {
  return v.status === "active" && new Date(v.expiresAt).getTime() > now;
}

export function filterVehicles(list: Vehicle[], f: Filters, ctx: Ctx): Vehicle[] {
  const q = f.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const nums = {
    minPrice: num(f.minPrice), maxPrice: num(f.maxPrice), minYear: num(f.minYear), maxYear: num(f.maxYear), minImport: num(f.minImport), maxImport: num(f.maxImport),
    minKm: num(f.minKm), maxKm: num(f.maxKm), minCc: num(f.minCc), maxCc: num(f.maxCc), doors: num(f.doors), seats: num(f.seats),
  };
  const out = list.filter((v) => {
    if (q.length) {
      const brand = ctx.brands.find((b) => b.id === v.brandId)?.name ?? "";
      const hay = `${brand} ${v.modelName} ${v.year} ${v.color}`.toLowerCase().replace(/[^\p{L}\p{N} ]/gu, " ");
      if (!q.every((t) => hay.includes(t))) return false;
    }
    if (f.brand && v.brandId !== f.brand) return false;
    if (f.model && v.modelId !== f.model) return false;
    if (f.category.length && !f.category.includes(v.categoryId) && !f.category.includes(v.body)) return false;
    if (nums.minPrice != null && v.price < nums.minPrice) return false;
    if (nums.maxPrice != null && v.price > nums.maxPrice) return false;
    if (nums.minYear != null && v.year < nums.minYear) return false;
    if (nums.maxYear != null && v.year > nums.maxYear) return false;
    if (nums.minImport != null && (v.importYear ?? 0) < nums.minImport) return false;
    if (nums.maxImport != null && (v.importYear ?? 9999) > nums.maxImport) return false;
    if (nums.minKm != null && v.mileage < nums.minKm) return false;
    if (nums.maxKm != null && v.mileage > nums.maxKm) return false;
    if (nums.minCc != null && v.cc < nums.minCc) return false;
    if (nums.maxCc != null && v.cc > nums.maxCc) return false;
    if (f.fuel.length && !f.fuel.includes(v.fuel)) return false;
    if (f.trans.length && !f.trans.includes(v.trans)) return false;
    if (f.drive.length && !f.drive.includes(v.drive)) return false;
    if (f.steering && v.steering !== f.steering) return false;
    if (f.color.length && !f.color.includes(v.color)) return false;
    if (nums.doors != null && v.doors !== nums.doors) return false;
    if (nums.seats != null && (nums.seats >= 7 ? v.seats < 7 : v.seats !== nums.seats)) return false;
    if (f.province.length && !f.province.includes(v.province)) return false;
    if (f.seller === "dealer" && !v.dealerId) return false;
    if (f.seller === "individual" && v.dealerId) return false;
    if (f.verified === "1") {
      const ok = v.dealerId ? ctx.dealers.find((d) => d.id === v.dealerId)?.verified : ctx.users.find((u) => u.id === v.sellerId)?.verified;
      if (!ok) return false;
    }
    if (f.accident === "none" && v.accident !== "none") return false;
    if (f.accident === "any" && v.accident === "none") return false;
    if (f.origin && v.origin !== f.origin) return false;
    if (f.eco === "ev" && v.fuel !== "electric") return false;
    if (f.eco === "hybrid" && !["hybrid", "phev"].includes(v.fuel)) return false;
    if (f.eco === "any" && !["hybrid", "phev", "electric"].includes(v.fuel)) return false;
    return true;
  });
  const t = (v: Vehicle) => new Date(v.createdAt).getTime();
  const s = f.sort;
  out.sort((a, b) => {
    switch (s) {
      case "newest": return t(b) - t(a);
      case "price_asc": return a.price - b.price;
      case "price_desc": return b.price - a.price;
      case "km_asc": return a.mileage - b.mileage;
      case "km_desc": return b.mileage - a.mileage;
      case "year_desc": return b.year - a.year || t(b) - t(a);
      case "year_asc": return a.year - b.year;
      default: return tierRank(b) - tierRank(a) || t(b) - t(a);
    }
  });
  return out;
}

export const PAGE_SIZE = 24;
export function matchesSaved(v: Vehicle, query: string, ctx: Ctx): boolean {
  return filterVehicles([v], parseFilters(new URLSearchParams(query)), ctx).length === 1;
}
