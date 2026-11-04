"use client";
import Link from "next/link";
import { X } from "lucide-react";
import { useStore } from "@/lib/store";
import { useBrandName, useT, photoSrc } from "@/lib/hooks";
import { usePathname } from "next/navigation";

export function CompareTray() {
  const { t } = useT();
  const compare = useStore((s) => s.compare);
  const vehicles = useStore((s) => s.vehicles);
  const toggle = useStore((s) => s.toggleCompare);
  const clear = useStore((s) => s.clearCompare);
  const brandName = useBrandName();
  const path = usePathname();
  if (!compare.length || path.startsWith("/compare") || path.startsWith("/dashboard")) return null;
  const items = compare.map((id) => vehicles.find((v) => v.id === id)).filter(Boolean) as typeof vehicles;
  return (
    <div className="fixed bottom-0 inset-x-0 z-40 p-3 pointer-events-none" data-testid="compare-tray">
      <div className="container pointer-events-auto">
        <div className="bg-ink-900 text-white rounded-2xl shadow-lift p-3 flex items-center gap-3 flex-wrap">
          <div className="flex gap-2 flex-1 min-w-0 overflow-x-auto scrollbar-none">
            {items.map((v) => (
              <div key={v.id} className="relative shrink-0 flex items-center gap-2 bg-white/10 rounded-xl pr-8 pl-1.5 py-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoSrc(v, 0)} alt="" className="h-9 w-14 rounded-md object-cover" />
                <span className="text-xs font-semibold max-w-[110px] truncate">{brandName(v.brandId)} {v.modelName}</span>
                <button onClick={() => toggle(v.id)} aria-label={t("common.delete")} className="absolute right-1.5 top-1/2 -translate-y-1/2 h-5 w-5 grid place-items-center rounded-full hover:bg-white/20"><X size={12} /></button>
              </div>
            ))}
          </div>
          <span className="text-xs text-white/60 hidden sm:block">{compare.length}/4</span>
          <button onClick={clear} className="btn btn-xs btn-ghost !text-white/80 hover:!bg-white/10">{t("cmp.clear")}</button>
          <Link href="/compare" className={`btn btn-sm btn-accent ${compare.length < 2 ? "opacity-60" : ""}`}>{t("cmp.open")}</Link>
        </div>
      </div>
    </div>
  );
}
