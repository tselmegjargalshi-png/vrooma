"use client";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/hooks";
import { COLOR_HEX, COLORS } from "@/lib/catalog";
import { PROVINCES } from "@/lib/geo";
import type { Filters } from "@/lib/search";
import type { Fuel, Trans, Drive } from "@/lib/types";

const FUELS: Fuel[] = ["petrol", "diesel", "hybrid", "phev", "electric", "lpg"];
const TRANS: Trans[] = ["automatic", "manual", "cvt", "other"];
const DRIVES: Drive[] = ["2wd", "awd", "4wd", "fwd", "rwd"];

export function NumInput({ value, onCommit, placeholder, scale = 1, name, label }: { value: string; onCommit: (v: string) => void; placeholder?: string; scale?: number; name?: string; label: string }) {
  const show = value === "" ? "" : String(Number(value) / scale);
  const [local, setLocal] = useState(show);
  useEffect(() => setLocal(show), [show]);
  const commit = (raw: string) => {
    const n = raw.trim() === "" ? "" : String(Math.max(0, Math.round(Number(raw) * scale)));
    if (n !== value && (n === "" || !Number.isNaN(Number(n)))) onCommit(n);
  };
  useEffect(() => {
    if (local === show) return;
    const id = setTimeout(() => commit(local), 450);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local]);
  return <input aria-label={label} name={name} className="input !h-10" inputMode="decimal" type="number" min={0} step="any" placeholder={placeholder} value={local} onChange={(e) => setLocal(e.target.value)} onBlur={() => commit(local)} onKeyDown={(e) => e.key === "Enter" && commit(local)} />;
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return <fieldset className="py-4 border-b border-ink-900/[.07] last:border-0"><legend className="text-[11px] font-bold uppercase tracking-[.14em] text-steel-500 mb-2.5 float-left w-full">{title}</legend><div className="clear-both">{children}</div></fieldset>;
}
function Chips({ options, value, onChange }: { options: { id: string; label: string }[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = value.includes(o.id);
        return <button key={o.id} type="button" aria-pressed={on} onClick={() => onChange(on ? value.filter((x) => x !== o.id) : [...value, o.id])} className={`h-8 px-3 rounded-full text-xs font-semibold border transition-colors ${on ? "bg-ink-900 text-white border-ink-900" : "bg-white border-ink-900/15 hover:border-ink-900/40"}`}>{o.label}</button>;
      })}
    </div>
  );
}

export function FilterPanel({ f, set }: { f: Filters; set: (p: Partial<Filters>) => void }) {
  const { t, lang } = useT();
  const brands = useStore((s) => s.brands), models = useStore((s) => s.models), cats = useStore((s) => s.categories);
  const brandModels = models.filter((m) => m.brandId === f.brand);
  const years = Array.from({ length: 2026 - 2004 + 1 }, (_, i) => String(2026 - i));
  const Range = ({ a, b, scale, unit, ph }: { a: keyof Filters; b: keyof Filters; scale?: number; unit?: string; ph?: [string, string] }) => (
    <div className="grid grid-cols-2 gap-2">
      <NumInput label={`${t("common.min")} ${unit ?? ""}`} name={String(a)} value={f[a] as string} scale={scale} placeholder={ph?.[0] ?? t("common.min")} onCommit={(v) => set({ [a]: v })} />
      <NumInput label={`${t("common.max")} ${unit ?? ""}`} name={String(b)} value={f[b] as string} scale={scale} placeholder={ph?.[1] ?? t("common.max")} onCommit={(v) => set({ [b]: v })} />
    </div>
  );
  const YearSel = ({ k, label }: { k: keyof Filters; label: string }) => (
    <select aria-label={label} name={String(k)} className="input !h-10" value={f[k] as string} onChange={(e) => set({ [k]: e.target.value })}>
      <option value="">{label}</option>{years.map((y) => <option key={y} value={y}>{y}</option>)}
    </select>
  );
  return (
    <div>
      <Group title={t("flt.vehicle")}>
        <div className="grid gap-2">
          <select aria-label={t("flt.brand")} name="brand" className="input !h-10" value={f.brand} onChange={(e) => set({ brand: e.target.value, model: "" })}>
            <option value="">{t("flt.brand")}</option>{[...brands].sort((a, b) => a.name.localeCompare(b.name)).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <select aria-label={t("flt.model")} name="model" className="input !h-10" value={f.model} disabled={!f.brand} onChange={(e) => set({ model: e.target.value })}>
            <option value="">{t("flt.model")}</option>{brandModels.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <select aria-label={t("flt.category")} name="category" className="input !h-10" value={f.category[0] ?? ""} onChange={(e) => set({ category: e.target.value ? [e.target.value] : [] })}>
            <option value="">{t("flt.category")}</option>{cats.map((c) => <option key={c.id} value={c.id}>{c[lang]}</option>)}
          </select>
        </div>
      </Group>
      <Group title={`${t("common.price")} (${t("flt.millions")})`}><Range a="minPrice" b="maxPrice" scale={1_000_000} unit="₮" ph={["20", "100"]} /></Group>
      <Group title={t("flt.year")}><div className="grid grid-cols-2 gap-2"><YearSel k="minYear" label={t("flt.yearfrom")} /><YearSel k="maxYear" label={t("flt.yearto")} /></div></Group>
      <Group title={t("flt.importyear")}><div className="grid grid-cols-2 gap-2"><YearSel k="minImport" label={t("flt.yearfrom")} /><YearSel k="maxImport" label={t("flt.yearto")} /></div></Group>
      <Group title={`${t("veh.mileage")} (${t("common.km")})`}><Range a="minKm" b="maxKm" unit={t("common.km")} /></Group>
      <Group title={`${t("veh.engine")} (cc)`}><Range a="minCc" b="maxCc" unit="cc" /></Group>
      <Group title={t("veh.fuel")}><Chips value={f.fuel} onChange={(v) => set({ fuel: v })} options={FUELS.map((x) => ({ id: x, label: t("fuel." + x) }))} /></Group>
      <Group title={t("veh.trans")}><Chips value={f.trans} onChange={(v) => set({ trans: v })} options={TRANS.map((x) => ({ id: x, label: t("trans." + x) }))} /></Group>
      <Group title={t("veh.drive")}><Chips value={f.drive} onChange={(v) => set({ drive: v })} options={DRIVES.map((x) => ({ id: x, label: x.toUpperCase() }))} /></Group>
      <Group title={t("veh.steering")}>
        <Chips value={f.steering ? [f.steering] : []} onChange={(v) => set({ steering: v.length ? v[v.length - 1] : "" })} options={[{ id: "LHD", label: t("steer.LHD") }, { id: "RHD", label: t("steer.RHD") }]} />
      </Group>
      <Group title={t("veh.color")}>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => {
            const on = f.color.includes(c);
            return <button key={c} type="button" title={t("color." + c)} aria-label={t("color." + c)} aria-pressed={on} onClick={() => set({ color: on ? f.color.filter((x) => x !== c) : [...f.color, c] })} className={`h-8 w-8 rounded-full border-2 ${on ? "border-brass-500 ring-2 ring-brass-500/30" : "border-ink-900/15"}`} style={{ background: COLOR_HEX[c] }} />;
          })}
        </div>
      </Group>
      <Group title={t("flt.doorsseats")}>
        <div className="grid grid-cols-2 gap-2">
          <select aria-label={t("veh.doors")} name="doors" className="input !h-10" value={f.doors} onChange={(e) => set({ doors: e.target.value })}><option value="">{t("veh.doors")}</option>{[2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}</select>
          <select aria-label={t("veh.seats")} name="seats" className="input !h-10" value={f.seats} onChange={(e) => set({ seats: e.target.value })}><option value="">{t("veh.seats")}</option>{[2, 4, 5, 7].map((n) => <option key={n} value={n}>{n === 7 ? "7+" : n}</option>)}</select>
        </div>
      </Group>
      <Group title={t("veh.location")}>
        <select aria-label={t("veh.location")} name="province" className="input !h-10" value={f.province[0] ?? ""} onChange={(e) => set({ province: e.target.value ? [e.target.value] : [] })}>
          <option value="">{t("flt.allprov")}</option>{PROVINCES.map((p) => <option key={p.id} value={p.id}>{p[lang]}</option>)}
        </select>
      </Group>
      <Group title={t("flt.seller")}>
        <Chips value={f.seller ? [f.seller] : []} onChange={(v) => set({ seller: v.length ? v[v.length - 1] : "" })} options={[{ id: "individual", label: t("common.individual") }, { id: "dealer", label: t("common.dealer") }]} />
        <label className="flex items-center gap-2 mt-3 text-sm cursor-pointer"><input type="checkbox" className="h-4 w-4 accent-ink-900" checked={f.verified === "1"} onChange={(e) => set({ verified: e.target.checked ? "1" : "" })} />{t("flt.verified")}</label>
      </Group>
      <Group title={t("veh.accident")}>
        <Chips value={f.accident ? [f.accident] : []} onChange={(v) => set({ accident: v.length ? v[v.length - 1] : "" })} options={[{ id: "none", label: t("acc.none") }, { id: "any", label: t("flt.hasaccident") }]} />
      </Group>
      <Group title={t("flt.origin")}>
        <Chips value={f.origin ? [f.origin] : []} onChange={(v) => set({ origin: v.length ? v[v.length - 1] : "" })} options={[{ id: "imported", label: t("origin.imported") }, { id: "local", label: t("origin.local") }]} />
      </Group>
      <Group title={t("flt.eco")}>
        <Chips value={f.eco ? [f.eco] : []} onChange={(v) => set({ eco: v.length ? v[v.length - 1] : "" })} options={[{ id: "ev", label: t("fuel.electric") }, { id: "hybrid", label: t("fuel.hybrid") }, { id: "any", label: t("flt.evhybrid") }]} />
      </Group>
    </div>
  );
}
