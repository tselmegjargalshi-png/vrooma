"use client";
import { useMemo, useRef, useState } from "react";
import { Plus, Minus, Locate } from "lucide-react";
import Link from "next/link";
import type { Vehicle } from "@/lib/types";
import { DISTRICTS, OUTLINE, PROVINCES } from "@/lib/geo";
import { useBrandName, useT, usePrice, photoSrc } from "@/lib/hooks";
import { fmtNum } from "@/lib/format";

const W = 600, H = 300;
const KX = 16.8, KY = 24;
export const project = (lng: number, lat: number) => ({ x: (lng - 86.5) * KX, y: (53 - lat) * KY });
export const unproject = (x: number, y: number) => ({ lng: x / KX + 86.5, lat: 53 - y / KY });

export interface Bounds { minLat: number; maxLat: number; minLng: number; maxLng: number }
export function DemoMap({ vehicles, onBounds, height = 560 }: { vehicles: Vehicle[]; onBounds?: (b: Bounds) => void; height?: number }) {
  const { t, lang } = useT();
  const brandName = useBrandName();
  const price = usePrice();
  const [view, setView] = useState({ cx: W / 2, cy: H / 2 + 5, k: 1 });
  const [sel, setSel] = useState<string | null>(null);
  const drag = useRef<{ x: number; y: number; cx: number; cy: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const bounds = useMemo<Bounds>(() => {
    const a = unproject(view.cx - W / 2 / view.k, view.cy - H / 2 / view.k), b = unproject(view.cx + W / 2 / view.k, view.cy + H / 2 / view.k);
    return { minLat: b.lat, maxLat: a.lat, minLng: a.lng, maxLng: b.lng };
  }, [view]);
  const lastB = useRef("");
  const key = JSON.stringify(bounds);
  if (onBounds && lastB.current !== key) { lastB.current = key; queueMicrotask(() => onBounds(bounds)); }

  const clamp = (v: { cx: number; cy: number; k: number }) => ({ k: Math.min(140, Math.max(1, v.k)), cx: Math.min(W, Math.max(0, v.cx)), cy: Math.min(H, Math.max(0, v.cy)) });
  const zoomAt = (f: number, px = 0.5, py = 0.5) => setView((v) => {
    const k = Math.min(140, Math.max(1, v.k * f));
    const mx = v.cx - W / 2 / v.k + (W * px) / v.k, my = v.cy - H / 2 / v.k + (H * py) / v.k;
    return clamp({ k, cx: mx - (W * px) / k + W / 2 / k, cy: my - (H * py) / k + H / 2 / k });
  });
  const goUB = () => { const p = project(106.92, 47.92); setView({ cx: p.x, cy: p.y, k: 60 }); };
  const goAll = () => setView({ cx: W / 2, cy: H / 2 + 5, k: 1 });
  const vb = `${view.cx - W / 2 / view.k} ${view.cy - H / 2 / view.k} ${W / view.k} ${H / view.k}`;
  const inv = 1 / view.k;
  const clusters = view.k < 3.5;
  const outline = OUTLINE.map(([lng, lat]) => { const p = project(lng, lat); return `${p.x},${p.y}`; }).join(" ");
  const selV = vehicles.find((v) => v.id === sel);

  const groups = useMemo(() => {
    if (!clusters) return [];
    const m = new Map<string, Vehicle[]>();
    vehicles.forEach((v) => m.set(v.province, [...(m.get(v.province) ?? []), v]));
    return [...m.entries()].map(([id, list]) => ({ id, list, ...project(PROVINCES.find((p) => p.id === id)!.lng, PROVINCES.find((p) => p.id === id)!.lat) }));
  }, [vehicles, clusters]);

  return (
    <div className="relative rounded-3xl overflow-hidden border border-ink-900/10 bg-[#E9E7E1]" style={{ height }} data-testid="demo-map">
      <svg ref={svgRef} viewBox={vb} className="w-full h-full touch-none select-none cursor-grab active:cursor-grabbing" role="application" aria-label={t("map.title")}
        onPointerDown={(e) => { (e.target as Element).setPointerCapture?.(e.pointerId); drag.current = { x: e.clientX, y: e.clientY, cx: view.cx, cy: view.cy }; }}
        onPointerMove={(e) => { if (!drag.current || !svgRef.current) return; const r = svgRef.current.getBoundingClientRect(); const s = Math.max(W / view.k / r.width, H / view.k / r.height); setView((v) => clamp({ ...v, cx: drag.current!.cx - (e.clientX - drag.current!.x) * s, cy: drag.current!.cy - (e.clientY - drag.current!.y) * s })); }}
        onPointerUp={() => (drag.current = null)} onWheel={(e) => { const r = svgRef.current!.getBoundingClientRect(); zoomAt(e.deltaY < 0 ? 1.25 : 0.8, (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height); }}>
        <defs><pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="#0B0B0D" strokeOpacity=".05" strokeWidth=".5" /></pattern></defs>
        <rect x="-200" y="-200" width="1000" height="700" fill="url(#grid)" />
        <polygon points={outline} fill="#F6F5F2" stroke="#0B0B0D" strokeOpacity=".35" strokeWidth={1.2 * inv} strokeLinejoin="round" />
        {view.k < 2.2 && PROVINCES.slice(1).map((p) => { const q = project(p.lng, p.lat); return <text key={p.id} x={q.x} y={q.y + 3} fontSize={5} textAnchor="middle" fill="#6B7078" style={{ pointerEvents: "none" }}>{p[lang]}</text>; })}
        {view.k > 25 && DISTRICTS.map((d) => { const q = project(d.lng, d.lat); return <g key={d.id} style={{ pointerEvents: "none" }}><circle cx={q.x} cy={q.y} r={14 * inv} fill="#B8925A" opacity=".12" /><text x={q.x} y={q.y + 30 * inv} fontSize={9 * inv} textAnchor="middle" fill="#6B7078">{d[lang]}</text></g>; })}
        {clusters ? groups.map((g) => (
          <g key={g.id} transform={`translate(${g.x} ${g.y})`} className="cursor-pointer" onClick={() => setView({ cx: g.x, cy: g.y, k: g.id === "ub" ? 30 : 8 })} data-testid="cluster">
            <circle r={(g.id === "ub" ? 11 : 6.5) * inv} fill="#0B0B0D" /><text y={3.5 * inv} fontSize={(g.id === "ub" ? 10 : 8) * inv} fill="#fff" textAnchor="middle" fontWeight="700" style={{ pointerEvents: "none" }}>{g.list.length}</text>
          </g>
        )) : vehicles.map((v) => {
          const p = project(v.lng, v.lat);
          if (p.x < view.cx - W / 2 / view.k - 5 || p.x > view.cx + W / 2 / view.k + 5 || p.y < view.cy - H / 2 / view.k - 5 || p.y > view.cy + H / 2 / view.k + 5) return null;
          const label = price(v.price, true).main;
          const w = label.length * 6.2 + 12;
          return (
            <g key={v.id} transform={`translate(${p.x} ${p.y}) scale(${inv})`} className="cursor-pointer" onClick={(e) => { e.stopPropagation(); setSel(v.id); }} data-testid="marker" data-id={v.id}>
              <rect x={-w / 2} y={-26} width={w} height={20} rx={10} fill={sel === v.id ? "#B8925A" : "#0B0B0D"} stroke="#fff" strokeWidth="1.5" />
              <path d="M-4 -6 L0 0 L4 -6Z" fill={sel === v.id ? "#B8925A" : "#0B0B0D"} />
              <text y={-12} fontSize="10.5" fill={sel === v.id ? "#0B0B0D" : "#fff"} textAnchor="middle" fontWeight="700" style={{ pointerEvents: "none" }}>{label}</text>
            </g>
          );
        })}
      </svg>
      <div className="absolute left-3 top-3 chip bg-white/90 text-ink-900 shadow-sm">{t("map.demolabel")}</div>
      <div className="absolute right-3 top-3 flex flex-col gap-1.5">
        <button onClick={() => zoomAt(1.6)} aria-label="Zoom in" className="h-10 w-10 rounded-xl bg-white shadow grid place-items-center hover:bg-bone-100" data-testid="zoom-in"><Plus size={18} /></button>
        <button onClick={() => zoomAt(0.62)} aria-label="Zoom out" className="h-10 w-10 rounded-xl bg-white shadow grid place-items-center hover:bg-bone-100"><Minus size={18} /></button>
        <button onClick={goUB} aria-label={t("map.gotoub")} title={t("map.gotoub")} className="h-10 w-10 rounded-xl bg-white shadow grid place-items-center hover:bg-bone-100" data-testid="goto-ub"><Locate size={18} /></button>
        <button onClick={goAll} className="h-10 px-2 rounded-xl bg-white shadow text-[11px] font-bold hover:bg-bone-100">{t("map.all")}</button>
      </div>
      {selV && (
        <div className="absolute left-3 right-3 bottom-3 sm:right-auto sm:w-80 card shadow-lift overflow-hidden flex animate-fadein" data-testid="map-preview">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photoSrc(selV, 0)} alt="" className="w-28 object-cover" />
          <div className="p-3 min-w-0 flex-1">
            <div className="font-bold text-sm truncate">{brandName(selV.brandId)} {selV.modelName}</div>
            <div className="text-xs text-steel-500">{selV.year} · {fmtNum(selV.mileage)} {t("common.km")}</div>
            <div className="font-display font-extrabold mt-1">{price(selV.price, true).main}</div>
            <Link href={`/cars/view?id=${selV.id}`} className="text-xs font-semibold text-brass-600 hover:underline">{t("common.details")} →</Link>
          </div>
          <button onClick={() => setSel(null)} aria-label={t("common.close")} className="absolute right-1.5 top-1.5 h-6 w-6 rounded-full bg-white/80 text-xs">×</button>
        </div>
      )}
    </div>
  );
}
