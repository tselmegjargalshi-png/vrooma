"use client";
import { use } from "react";
import Link from "next/link";
import { BadgeCheck, MapPin, Phone, Mail } from "lucide-react";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/hooks";
import { isPublic } from "@/lib/search";
import { VehicleCard } from "@/components/VehicleCard";
import { Empty, Badge } from "@/components/ui";
import { DealerLogo } from "@/components/DealerLogo";
import { fmtPhoneFull, telHref } from "@/lib/format";
import { distName, provName } from "@/lib/geo";

export default function DealerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t, lang } = useT();
  const d = useStore((s) => s.dealers).find((x) => x.id === id);
  const vehicles = useStore((s) => s.vehicles);
  if (!d) return <div className="container py-16"><Empty title={t("err.notfound")} action={<Link href="/dealers" className="btn btn-primary">{t("nav.dealers")}</Link>} /></div>;
  const list = vehicles.filter((v) => v.dealerId === d.id && isPublic(v));
  return (
    <div className="container py-8">
      <div className="card p-6 sm:p-8 flex flex-col md:flex-row gap-6 md:items-center">
        <DealerLogo d={d} size={80} />
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-extrabold flex items-center gap-2 flex-wrap">{d.name}{d.verified && <Badge tone="ok"><BadgeCheck size={12} />{t("common.verified")}</Badge>}<Badge tone="brass">{t("plan." + d.plan)}</Badge></h1>
          <p className="text-steel-600 mt-2 max-w-2xl">{d.description || t("dealer.nodesc")}</p>
          <div className="flex flex-wrap gap-4 mt-4 text-sm"><a href={telHref(d.phone)} className="inline-flex items-center gap-1.5 font-semibold"><Phone size={15} />{fmtPhoneFull(d.phone)}</a><span className="inline-flex items-center gap-1.5 text-steel-600"><Mail size={15} />{d.email}</span></div>
        </div>
      </div>
      {d.locations.length > 0 && <div className="grid sm:grid-cols-2 gap-4 mt-5">{d.locations.map((l) => <div key={l.id} className="card p-4 flex gap-3"><MapPin className="text-brass-600 shrink-0" size={18} /><div><div className="font-bold text-sm">{l.name}</div><div className="text-xs text-steel-500">{l.address} · {l.district ? distName(l.district, lang) + ", " : ""}{provName(l.province, lang)}</div></div></div>)}</div>}
      <h2 className="text-2xl font-extrabold mt-10 mb-5">{t("dealer.inventory")} ({list.length})</h2>
      {list.length === 0 ? <div className="card"><Empty title={t("srch.empty")} /></div> : <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">{list.map((v) => <VehicleCard key={v.id} v={v} />)}</div>}
    </div>
  );
}
