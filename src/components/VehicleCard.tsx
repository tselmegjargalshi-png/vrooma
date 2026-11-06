"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, GitCompareArrows, MapPin, BadgeCheck, ShieldCheck, TrendingDown } from "lucide-react";
import type { Vehicle } from "@/lib/types";
import { useStore } from "@/lib/store";
import { useBrandName, usePrice, useT, useUser, photoSrc } from "@/lib/hooks";
import { fmtNum } from "@/lib/format";
import { provName, distName } from "@/lib/geo";
import { Badge } from "./ui";

export function useSellerVerified() {
  const users = useStore((s) => s.users), dealers = useStore((s) => s.dealers);
  return (v: Vehicle) => (v.dealerId ? !!dealers.find((d) => d.id === v.dealerId)?.verified : !!users.find((u) => u.id === v.sellerId)?.verified);
}

export function FavButton({ id, className = "" }: { id: string; className?: string }) {
  const { t } = useT();
  const user = useUser();
  const router = useRouter();
  const favs = useStore((s) => s.favorites);
  const toggle = useStore((s) => s.toggleFavorite);
  const flash = useStore((s) => s.flash);
  const on = !!user && (favs[user.id] ?? []).includes(id);
  return (
    <button type="button" aria-pressed={on} aria-label={t("veh.favorite")} data-testid="fav-btn"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (!toggle(id)) { flash(t("auth.needed"), "err"); router.push("/login?next=" + encodeURIComponent(location.pathname)); } else flash(on ? t("veh.fav.removed") : t("veh.fav.added")); }}
      className={`h-9 w-9 grid place-items-center rounded-full bg-white/90 backdrop-blur hover:bg-white transition-colors shadow-sm ${className}`}>
      <Heart size={17} className={on ? "fill-bad text-bad" : "text-ink-900"} />
    </button>
  );
}
export function CompareButton({ id, className = "" }: { id: string; className?: string }) {
  const { t } = useT();
  const compare = useStore((s) => s.compare);
  const toggle = useStore((s) => s.toggleCompare);
  const flash = useStore((s) => s.flash);
  const on = compare.includes(id);
  return (
    <button type="button" aria-pressed={on} aria-label={t("veh.compare")} data-testid="compare-btn"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); const r = toggle(id); if (r === "full") flash(t("cmp.full"), "err"); }}
      className={`h-9 w-9 grid place-items-center rounded-full transition-colors shadow-sm ${on ? "bg-ink-900 text-white" : "bg-white/90 text-ink-900 hover:bg-white"} backdrop-blur ${className}`}>
      <GitCompareArrows size={17} />
    </button>
  );
}

export function VehicleCard({ v, layout = "grid", priority }: { v: Vehicle; layout?: "grid" | "list"; priority?: boolean }) {
  const { t, lang } = useT();
  const brandName = useBrandName();
  const price = usePrice();
  const verified = useSellerVerified()(v);
  const p = price(v.price, true);
  const loc = v.district ? `${distName(v.district, lang)}, ${provName(v.province, lang)}` : provName(v.province, lang);
  const title = `${brandName(v.brandId)} ${v.modelName}`;
  const list = layout === "list";
  return (
    <Link href={`/cars/view?id=${v.id}`} data-testid="vehicle-card" data-id={v.id} data-brand={v.brandId} data-model={v.modelId} data-category={v.categoryId} data-body={v.body} data-year={v.year} data-import={v.importYear ?? ""} data-price={v.price} data-km={v.mileage} data-cc={v.cc} data-fuel={v.fuel} data-trans={v.trans} data-drive={v.drive} data-steering={v.steering} data-color={v.color} data-doors={v.doors} data-seats={v.seats} data-province={v.province} data-dealer={v.dealerId ?? ""} data-accident={v.accident} data-origin={v.origin} data-tier={v.tier}
      className={`group card overflow-hidden flex ${list ? "flex-col sm:flex-row" : "flex-col"} hover:shadow-lift transition-shadow`}>
      <div className={`relative bg-ink-800 ${list ? "sm:w-72 sm:shrink-0 aspect-[16/10] sm:aspect-auto" : "aspect-[16/10]"}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photoSrc(v, 0)} alt={`${title} ${v.year}`} loading={priority ? "eager" : "lazy"} className="absolute inset-0 h-full w-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {v.tier === "featured" && <Badge tone="brass" className="!bg-brass-500 !text-ink-900">{t("tier.featured")}</Badge>}
          {v.tier === "premium" && <Badge tone="ink">{t("tier.premium")}</Badge>}
          {v.prevPrice && v.prevPrice > v.price && <Badge tone="ok" className="!bg-ok !text-white"><TrendingDown size={11} /> {t("veh.pricedrop")}</Badge>}
        </div>
        <div className="absolute top-3 right-3 flex gap-1.5"><CompareButton id={v.id} /><FavButton id={v.id} /></div>
        {v.status !== "active" && <div className="absolute inset-0 bg-ink-900/60 grid place-items-center"><Badge tone="ink" className="!bg-white !text-ink-900">{t("vstatus." + v.status)}</Badge></div>}
      </div>
      <div className="p-4 flex-1 flex flex-col min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-bold text-[17px] leading-snug truncate">{title}</h3>
            <div className="text-[13px] text-steel-500 mt-0.5">{v.year}{t("veh.yearsuffix")}{v.importYear ? ` · ${t("veh.imported")} ${v.importYear}` : ""}</div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-steel-600">
          <span>{fmtNum(v.mileage)} {t("common.km")}</span><span>{t("fuel." + v.fuel)}</span><span>{t("trans." + v.trans)}</span><span>{v.drive.toUpperCase()}</span><span>{v.steering}</span>
        </div>
        <div className="mt-auto pt-4 flex items-end justify-between gap-2">
          <div>
            <div className="font-display text-xl font-extrabold tracking-tight">{p.main}</div>
            {p.usd && <div className="text-xs text-steel-500">{p.usd}</div>}
            {v.negotiable && <div className="text-[11px] font-semibold text-brass-600 uppercase tracking-wide">{t("veh.negotiable")}</div>}
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end gap-1 text-[12px] text-steel-500"><MapPin size={12} />{loc}</div>
            <div className="flex items-center justify-end gap-2 mt-1">
              {v.reportId && <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-ok"><ShieldCheck size={13} />{t("veh.inspected")}</span>}
              {verified && <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brass-600"><BadgeCheck size={13} />{t("common.verified")}</span>}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function CardSkeleton() {
  return <div className="card overflow-hidden"><div className="aspect-[16/10] animate-pulse bg-ink-900/[.07]" /><div className="p-4 space-y-3"><div className="h-5 w-2/3 rounded bg-ink-900/[.07] animate-pulse" /><div className="h-4 w-full rounded bg-ink-900/[.07] animate-pulse" /><div className="h-6 w-1/3 rounded bg-ink-900/[.07] animate-pulse" /></div></div>;
}
