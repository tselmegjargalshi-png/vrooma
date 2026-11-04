"use client";
import { useMemo, useState } from "react";
import { Map as MapIcon, List } from "lucide-react";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/hooks";
import { filterVehicles, isPublic, EMPTY } from "@/lib/search";
import { DemoMap, type Bounds } from "@/components/DemoMap";
import { VehicleCard } from "@/components/VehicleCard";
import { Empty, PageHead } from "@/components/ui";

export default function MapPage() {
  const { t } = useT();
  const vehicles = useStore((s) => s.vehicles), users = useStore((s) => s.users), dealers = useStore((s) => s.dealers), brands = useStore((s) => s.brands);
  const [mode, setMode] = useState<"map" | "list">("map");
  const [bounds, setBounds] = useState<Bounds | null>(null);
  const [areaOnly, setAreaOnly] = useState(true);
  const [q, setQ] = useState(""), [fuel, setFuel] = useState(""), [maxP, setMaxP] = useState("");
  const base = useMemo(() => filterVehicles(vehicles.filter((v) => isPublic(v)), { ...EMPTY, q, fuel: fuel ? [fuel] : [], maxPrice: maxP ? String(Number(maxP) * 1e6) : "" }, { users, dealers, brands }), [vehicles, users, dealers, brands, q, fuel, maxP]);
  const inView = useMemo(() => (bounds && areaOnly ? base.filter((v) => v.lat >= bounds.minLat && v.lat <= bounds.maxLat && v.lng >= bounds.minLng && v.lng <= bounds.maxLng) : base), [base, bounds, areaOnly]);
  return (
    <div className="container py-8">
      <PageHead title={t("map.title")} sub={t("map.sub")} actions={
        <div className="flex rounded-full border border-ink-900/15 bg-white p-0.5" role="group">
          <button onClick={() => setMode("map")} aria-pressed={mode === "map"} className={`h-9 px-4 rounded-full text-sm font-semibold inline-flex items-center gap-1.5 ${mode === "map" ? "bg-ink-900 text-white" : ""}`}><MapIcon size={15} />{t("map.mapview")}</button>
          <button onClick={() => setMode("list")} aria-pressed={mode === "list"} data-testid="map-list-toggle" className={`h-9 px-4 rounded-full text-sm font-semibold inline-flex items-center gap-1.5 ${mode === "list" ? "bg-ink-900 text-white" : ""}`}><List size={15} />{t("map.listview")}</button>
        </div>} />
      <div className="flex flex-wrap gap-2 mb-4">
        <input className="input !w-48 !h-10" placeholder={t("common.search.placeholder")} aria-label={t("common.search")} value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input !w-40 !h-10" aria-label={t("veh.fuel")} value={fuel} onChange={(e) => setFuel(e.target.value)}><option value="">{t("veh.fuel")}</option>{["petrol", "diesel", "hybrid", "phev", "electric", "lpg"].map((f) => <option key={f} value={f}>{t("fuel." + f)}</option>)}</select>
        <select className="input !w-44 !h-10" aria-label={t("home.maxprice")} value={maxP} onChange={(e) => setMaxP(e.target.value)}><option value="">{t("home.maxprice")}</option>{[30, 50, 100, 200].map((n) => <option key={n} value={n}>{n} {t("flt.millions")}</option>)}</select>
        <label className="inline-flex items-center gap-2 text-sm px-2 cursor-pointer"><input type="checkbox" className="h-4 w-4 accent-ink-900" checked={areaOnly} onChange={(e) => setAreaOnly(e.target.checked)} data-testid="area-only" />{t("map.areaonly")}</label>
        <span className="ml-auto self-center text-sm text-steel-500" data-testid="map-count">{t("map.inview", { n: inView.length, total: base.length })}</span>
      </div>
      {mode === "map" ? (
        <div className="grid lg:grid-cols-[1fr_380px] gap-5">
          <DemoMap vehicles={base} onBounds={setBounds} />
          <div className="space-y-3 lg:max-h-[560px] lg:overflow-y-auto pr-1" data-testid="map-side">
            {inView.slice(0, 20).map((v) => <VehicleCard key={v.id} v={v} />)}
            {inView.length === 0 && <div className="card"><Empty title={t("map.nonearea")} /></div>}
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{inView.map((v) => <VehicleCard key={v.id} v={v} />)}</div>
      )}
    </div>
  );
}
