"use client";
import Link from "next/link";
import { BadgeCheck, MapPin } from "lucide-react";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/hooks";
import { isPublic } from "@/lib/search";
import { PageHead } from "@/components/ui";
import { Badge } from "@/components/ui";
import { DealerLogo } from "@/components/DealerLogo";

export default function Dealers() {
  const { t } = useT();
  const dealers = useStore((s) => s.dealers), vehicles = useStore((s) => s.vehicles);
  return (
    <div className="container py-8">
      <PageHead title={t("nav.dealers")} sub={t("dealer.sub")} />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {dealers.map((d) => (
          <Link key={d.id} href={`/dealers/${d.id}`} className="card p-6 hover:shadow-lift transition-shadow">
            <div className="flex items-center gap-4"><DealerLogo d={d} />
              <div className="min-w-0"><h2 className="font-bold text-lg flex items-center gap-1.5 truncate">{d.name}{d.verified && <BadgeCheck size={16} className="text-brass-600 shrink-0" />}</h2><Badge tone="brass">{t("plan." + d.plan)}</Badge></div></div>
            <p className="text-sm text-steel-600 mt-4 line-clamp-3">{d.description}</p>
            <div className="mt-4 flex items-center justify-between text-xs text-steel-500"><span className="flex items-center gap-1"><MapPin size={13} />{d.locations.length} {t("dealer.locations")}</span><span className="font-semibold text-ink-900">{t("dealer.cars", { n: vehicles.filter((v) => v.dealerId === d.id && isPublic(v)).length })}</span></div>
          </Link>
        ))}
      </div>
    </div>
  );
}
