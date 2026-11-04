"use client";
import { Suspense, useMemo, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LayoutGrid, List, SlidersHorizontal, X, BookmarkPlus } from "lucide-react";
import { useStore } from "@/lib/store";
import { useT, useUser } from "@/lib/hooks";
import { PAGE_SIZE, activeFilterCount, filterVehicles, isPublic, parseFilters, toParams, type Filters } from "@/lib/search";
import { VehicleCard, CardSkeleton } from "@/components/VehicleCard";
import { FilterPanel } from "@/components/FilterPanel";
import { Empty, Modal, Field } from "@/components/ui";

const SORTS = ["recommended", "newest", "price_asc", "price_desc", "km_asc", "year_desc", "year_asc"];

function CarsInner() {
  const { t, lang } = useT();
  const router = useRouter();
  const sp = useSearchParams();
  const user = useUser();
  const vehicles = useStore((s) => s.vehicles), users = useStore((s) => s.users), dealers = useStore((s) => s.dealers), brands = useStore((s) => s.brands), cats = useStore((s) => s.categories), models = useStore((s) => s.models);
  const saveSearch = useStore((s) => s.saveSearch), flash = useStore((s) => s.flash);
  const [drawer, setDrawer] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [name, setName] = useState("");
  const f = useMemo(() => parseFilters(new URLSearchParams(sp.toString())), [sp]);
  const query = sp.toString();

  const apply = useCallback((p: Partial<Filters>) => {
    const next = { ...f, ...p };
    if (!("page" in p)) next.page = "1";
    router.replace("/cars" + (toParams(next) ? "?" + toParams(next) : ""), { scroll: false });
  }, [f, router]);

  const result = useMemo(() => filterVehicles(vehicles.filter((v) => isPublic(v)), f, { users, dealers, brands }), [vehicles, f, users, dealers, brands]);
  const page = Math.max(1, Number(f.page) || 1);
  const pages = Math.max(1, Math.ceil(result.length / PAGE_SIZE));
  const slice = result.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const count = activeFilterCount(f);
  const list = f.view === "list";

  const chips: { label: string; clear: Partial<Filters> }[] = [];
  if (f.q) chips.push({ label: `"${f.q}"`, clear: { q: "" } });
  if (f.brand) chips.push({ label: brands.find((b) => b.id === f.brand)?.name ?? f.brand, clear: { brand: "", model: "" } });
  if (f.model) chips.push({ label: models.find((m) => m.id === f.model)?.name ?? f.model, clear: { model: "" } });
  f.category.forEach((c) => chips.push({ label: cats.find((x) => x.id === c)?.[lang] ?? c, clear: { category: f.category.filter((x) => x !== c) } }));
  if (f.minPrice || f.maxPrice) chips.push({ label: `${f.minPrice ? Number(f.minPrice) / 1e6 : 0} ${t("flt.to")} ${f.maxPrice ? Number(f.maxPrice) / 1e6 + " " : ""}${t("flt.millions")}`, clear: { minPrice: "", maxPrice: "" } });
  if (f.minYear || f.maxYear) chips.push({ label: `${f.minYear || "…"} ${t("flt.to")} ${f.maxYear || "…"}`, clear: { minYear: "", maxYear: "" } });
  f.fuel.forEach((x) => chips.push({ label: t("fuel." + x), clear: { fuel: f.fuel.filter((y) => y !== x) } }));
  if (f.steering) chips.push({ label: t("steer." + f.steering), clear: { steering: "" } });
  if (f.eco) chips.push({ label: t("flt.eco"), clear: { eco: "" } });

  const doSave = () => {
    if (!user) { flash(t("auth.needed"), "err"); router.push("/login?next=" + encodeURIComponent("/cars?" + query)); return; }
    if (!name.trim()) return;
    saveSearch(name.trim(), query);
    flash(t("srch.saved"));
    setSaveOpen(false); setName("");
  };

  const panel = <FilterPanel f={f} set={apply} />;
  return (
    <div className="container py-8">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold">{t("nav.cars")}</h1>
          <p className="text-sm text-steel-500 mt-1" data-testid="result-count" aria-live="polite">{t("srch.found", { n: result.length })}</p>
        </div>
        <form className="flex-1 min-w-[220px] max-w-md" onSubmit={(e) => e.preventDefault()} role="search">
          <input name="q" className="input" aria-label={t("common.search.placeholder")} placeholder={t("common.search.placeholder")} defaultValue={f.q} key={f.q}
            onChange={(e) => { const v = e.target.value; clearTimeout((window as unknown as { __qt?: number }).__qt); (window as unknown as { __qt?: number }).__qt = window.setTimeout(() => apply({ q: v }), 350); }} />
        </form>
      </div>
      <div className="grid lg:grid-cols-[290px_1fr] gap-8 items-start">
        <aside className="hidden lg:block card p-5 sticky top-32 max-h-[calc(100vh-9rem)] overflow-y-auto" aria-label={t("flt.title")}>
          <div className="flex items-center justify-between mb-1"><h2 className="font-bold">{t("flt.title")}</h2>{count > 0 && <button onClick={() => router.replace("/cars")} className="text-xs font-semibold text-brass-600 hover:underline">{t("flt.clear")}</button>}</div>
          {panel}
        </aside>
        <section>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <button onClick={() => setDrawer(true)} className="lg:hidden btn btn-sm btn-outline"><SlidersHorizontal size={15} />{t("flt.title")}{count > 0 && <span className="bg-ink-900 text-white rounded-full px-1.5 text-[11px]">{count}</span>}</button>
            <select aria-label={t("srch.sort")} className="input !h-9 !w-auto !text-[13px] !rounded-full" value={f.sort} onChange={(e) => apply({ sort: e.target.value })}>
              {SORTS.map((s) => <option key={s} value={s}>{t("sort." + s)}</option>)}
            </select>
            <div className="flex rounded-full border border-ink-900/15 bg-white p-0.5" role="group" aria-label={t("srch.view")}>
              <button aria-label={t("srch.grid")} aria-pressed={!list} onClick={() => apply({ view: "grid" })} className={`h-8 w-9 grid place-items-center rounded-full ${!list ? "bg-ink-900 text-white" : ""}`}><LayoutGrid size={15} /></button>
              <button aria-label={t("srch.list")} aria-pressed={list} onClick={() => apply({ view: "list" })} className={`h-8 w-9 grid place-items-center rounded-full ${list ? "bg-ink-900 text-white" : ""}`}><List size={15} /></button>
            </div>
            <button onClick={() => setSaveOpen(true)} className="btn btn-sm btn-outline ml-auto" data-testid="save-search"><BookmarkPlus size={15} />{t("srch.save")}</button>
            {count > 0 && <button onClick={() => router.replace("/cars")} className="btn btn-sm btn-ghost hidden sm:inline-flex" data-testid="clear-filters">{t("flt.clear")}</button>}
          </div>
          {chips.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {chips.map((c, i) => <button key={i} onClick={() => apply(c.clear)} className="inline-flex items-center gap-1 h-7 pl-3 pr-2 rounded-full bg-ink-900/[.07] text-xs font-semibold hover:bg-ink-900/10">{c.label}<X size={12} /></button>)}
            </div>
          )}
          {result.length === 0 ? (
            <div className="card"><Empty title={t("srch.empty")} body={t("srch.empty.body")} action={<button onClick={() => router.replace("/cars")} className="btn btn-primary">{t("flt.clear")}</button>} /></div>
          ) : (
            <>
              <div className={list ? "grid gap-4" : "grid sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5"} data-testid="results">
                {slice.map((v, i) => <VehicleCard key={v.id} v={v} layout={list ? "list" : "grid"} priority={i < 3} />)}
              </div>
              {pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button className="btn btn-sm btn-outline" disabled={page <= 1} onClick={() => { apply({ page: String(page - 1) }); window.scrollTo({ top: 0 }); }}>{t("common.prev")}</button>
                  <span className="text-sm text-steel-600 px-2">{page} / {pages}</span>
                  <button className="btn btn-sm btn-outline" disabled={page >= pages} onClick={() => { apply({ page: String(page + 1) }); window.scrollTo({ top: 0 }); }}>{t("common.next")}</button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
      {drawer && (
        <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-ink-900/60" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 left-0 w-[88%] max-w-sm bg-white overflow-y-auto p-5 animate-fadein">
            <div className="flex items-center justify-between mb-2"><h2 className="font-bold text-lg">{t("flt.title")}</h2><button onClick={() => setDrawer(false)} aria-label={t("common.close")} className="h-9 w-9 grid place-items-center rounded-full hover:bg-ink-900/5"><X size={18} /></button></div>
            {panel}
            <div className="sticky bottom-0 -mx-5 px-5 py-3 bg-white border-t border-ink-900/10 flex gap-2">
              <button onClick={() => { router.replace("/cars"); }} className="btn btn-outline flex-1">{t("flt.clear")}</button>
              <button onClick={() => setDrawer(false)} className="btn btn-primary flex-1">{t("srch.show", { n: result.length })}</button>
            </div>
          </div>
        </div>
      )}
      <Modal open={saveOpen} onClose={() => setSaveOpen(false)} title={t("srch.save")}>
        <form onSubmit={(e) => { e.preventDefault(); doSave(); }} className="space-y-4">
          <p className="text-sm text-steel-600">{t("srch.save.hint")}</p>
          <Field label={t("common.name")}><input autoFocus className="input" name="searchName" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("srch.save.ph")} /></Field>
          <button className="btn btn-primary w-full" type="submit">{t("common.save")}</button>
        </form>
      </Modal>
    </div>
  );
}

export default function CarsPage() {
  return <Suspense fallback={<div className="container py-8 grid sm:grid-cols-2 xl:grid-cols-3 gap-5">{Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}</div>}><CarsInner /></Suspense>;
}
