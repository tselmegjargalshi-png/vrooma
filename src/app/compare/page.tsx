"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { X, Plus } from "lucide-react";
import { useStore } from "@/lib/store";
import { useBrandName, useT, usePrice, photoSrc } from "@/lib/hooks";
import { fmtNum } from "@/lib/format";
import { provName } from "@/lib/geo";
import { Empty, PageHead } from "@/components/ui";
import type { Vehicle } from "@/lib/types";

interface Row { key: string; label: string; val: (v: Vehicle) => string; num?: (v: Vehicle) => number; best?: "min" | "max" }

export default function ComparePage() {
  const { t, lang } = useT();
  const brandName = useBrandName();
  const price = usePrice();
  const compare = useStore((s) => s.compare), vehicles = useStore((s) => s.vehicles), toggle = useStore((s) => s.toggleCompare), clear = useStore((s) => s.clearCompare);
  const [onlyDiff, setOnlyDiff] = useState(false);
  const items = compare.map((id) => vehicles.find((v) => v.id === id)).filter(Boolean) as Vehicle[];

  const rows: { group: string; rows: Row[] }[] = useMemo(() => [
    { group: "cmp.g.basic", rows: [
      { key: "price", label: t("common.price"), val: (v) => price(v.price).main, num: (v) => v.price, best: "min" },
      { key: "brand", label: t("veh.brand"), val: (v) => brandName(v.brandId) }, { key: "model", label: t("veh.model"), val: (v) => v.modelName },
      { key: "year", label: t("veh.year"), val: (v) => String(v.year), num: (v) => v.year, best: "max" }, { key: "imp", label: t("veh.importyear"), val: (v) => String(v.importYear ?? "") },
      { key: "km", label: t("veh.mileage"), val: (v) => `${fmtNum(v.mileage)} ${t("common.km")}`, num: (v) => v.mileage, best: "min" },
      { key: "cond", label: t("veh.condition"), val: (v) => t("cond." + v.condition) }, { key: "loc", label: t("veh.location"), val: (v) => provName(v.province, lang) },
    ] },
    { group: "cmp.g.engine", rows: [
      { key: "cc", label: t("veh.engine"), val: (v) => (v.cc ? `${fmtNum(v.cc)} cc` : t("veh.noengine")) }, { key: "fuel", label: t("veh.fuel"), val: (v) => t("fuel." + v.fuel) },
      { key: "cons", label: t("cmp.cons"), val: (v) => `${v.cons} ${v.fuel === "electric" ? "kWh" : "L"}/100${t("common.km")}` },
      { key: "hp", label: t("veh.hp"), val: (v) => `${v.hp} ${t("veh.hpunit")}`, num: (v) => v.hp, best: "max" },
      { key: "trans", label: t("veh.trans"), val: (v) => t("trans." + v.trans) }, { key: "drive", label: t("veh.drive"), val: (v) => v.drive.toUpperCase() }, { key: "steer", label: t("veh.steering"), val: (v) => t("steer." + v.steering) },
    ] },
    { group: "cmp.g.body", rows: [
      { key: "dim", label: t("cmp.dimensions"), val: (v) => `${fmtNum(v.len)} × ${fmtNum(v.wid)} × ${fmtNum(v.hei)} mm` },
      { key: "seats", label: t("veh.seats"), val: (v) => String(v.seats), num: (v) => v.seats, best: "max" }, { key: "doors", label: t("veh.doors"), val: (v) => String(v.doors) },
      { key: "ext", label: t("veh.extcolor"), val: (v) => t("color." + v.color) },
    ] },
    { group: "cmp.g.features", rows: [
      { key: "safety", label: t("veh.safety"), val: (v) => (v.safety.length ? v.safety.map((s) => t("safety." + s)).join(", ") : "–"), num: (v) => v.safety.length, best: "max" },
      { key: "equip", label: t("veh.equipment"), val: (v) => (v.equipment.length ? v.equipment.map((s) => t("equip." + s)).join(", ") : "–"), num: (v) => v.equipment.length, best: "max" },
      { key: "acc", label: t("veh.accident"), val: (v) => t("acc." + v.accident) },
    ] },
  ], [t, lang, price, brandName]);

  if (items.length === 0) return <div className="container py-16"><Empty title={t("cmp.empty")} body={t("cmp.empty.body")} action={<Link href="/cars" className="btn btn-primary">{t("nav.cars")}</Link>} /></div>;
  const cols = `minmax(130px,170px) repeat(${items.length}, minmax(190px,1fr))${items.length < 4 ? " 56px" : ""}`;
  return (
    <div className="container py-8">
      <PageHead title={t("nav.compare")} sub={t("cmp.sub", { n: items.length })} actions={<>
        <label className="inline-flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" className="h-4 w-4 accent-ink-900" checked={onlyDiff} onChange={(e) => setOnlyDiff(e.target.checked)} data-testid="only-diff" />{t("cmp.onlydiff")}</label>
        <button className="btn btn-sm btn-outline" onClick={clear}>{t("cmp.clear")}</button></>} />
      {items.length < 2 && <p className="mb-4 text-sm bg-warn/10 text-warn rounded-xl px-4 py-3 font-semibold">{t("cmp.needtwo")}</p>}
      <div className="card overflow-x-auto">
        <div className="min-w-max">
          <div className="grid" style={{ gridTemplateColumns: cols }} data-testid="compare-table">
            <div className="p-4" />
            {items.map((v) => (
              <div key={v.id} className="p-4 relative">
                <button onClick={() => toggle(v.id)} aria-label={t("common.delete")} className="absolute right-3 top-3 z-10 h-7 w-7 rounded-full bg-white shadow grid place-items-center"><X size={14} /></button>
                <Link href={`/cars/${v.id}`}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={photoSrc(v, 0)} alt="" className="w-full aspect-[16/10] object-cover rounded-xl" /></Link>
                <Link href={`/cars/${v.id}`} className="font-bold mt-3 block hover:underline">{brandName(v.brandId)} {v.modelName}</Link>
                <div className="text-sm text-steel-500">{v.year}</div>
              </div>
            ))}
            {items.length < 4 && <Link href="/cars" className="m-4 rounded-xl border-2 border-dashed border-ink-900/15 grid place-items-center text-steel-400 hover:text-ink-900 hover:border-ink-900/40" aria-label={t("cmp.add")}><Plus /></Link>}
          </div>
          {rows.map((g) => (
            <div key={g.group}>
              <div className="px-4 py-2.5 bg-ink-900 text-white text-[11px] font-bold uppercase tracking-[.16em]">{t(g.group)}</div>
              {g.rows.map((r) => {
                const vals = items.map((v) => r.val(v));
                const diff = new Set(vals).size > 1;
                if (onlyDiff && !diff) return null;
                const nums = r.num ? items.map(r.num) : [];
                const bestN = r.best && diff && nums.length ? (r.best === "min" ? Math.min(...nums) : Math.max(...nums)) : null;
                return (
                  <div key={r.key} className={`grid border-b border-ink-900/[.06] ${diff ? "bg-brass-500/[.07]" : ""}`} style={{ gridTemplateColumns: cols }} data-diff={diff ? "1" : "0"} data-row={r.key}>
                    <div className="p-3.5 pl-4 text-xs font-semibold text-steel-500 uppercase tracking-wide flex items-center">{r.label}{diff && <span className="ml-1.5 h-1.5 w-1.5 rounded-full bg-brass-500" title={t("cmp.differs")} />}</div>
                    {items.map((v, i) => (
                      <div key={v.id} className={`p-3.5 text-sm ${bestN != null && nums[i] === bestN ? "font-extrabold text-ok" : "font-medium"}`}>{vals[i]}{bestN != null && nums[i] === bestN && <span className="ml-1.5 chip bg-ok/15 text-ok">{t("cmp.best")}</span>}</div>
                    ))}
                    {items.length < 4 && <div />}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <p className="text-xs text-steel-500 mt-3">{t("cmp.legend")}</p>
    </div>
  );
}
