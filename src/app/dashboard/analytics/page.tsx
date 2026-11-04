"use client";
import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { useBrandName, useScope, useT, useUser } from "@/lib/hooks";
import { PageHead, Stat, Empty } from "@/components/ui";
import { Guard } from "@/components/Guard";
import { BarChart, HBars, LineChart } from "@/components/Charts";
import { fmtDate, fmtMnt } from "@/lib/format";
import { isAdmin } from "@/lib/perms";
import { isPublic } from "@/lib/search";
import { LEAD_STATUSES } from "@/lib/types";

function Platform() {
  const { t } = useT();
  const s = useStore();
  const brandName = useBrandName();
  const byStatus = (["active", "pending", "paused", "sold", "rejected", "expired"] as const).map((x) => ({ label: t("vstatus." + x), value: s.vehicles.filter((v) => v.status === x).length }));
  const views30 = Array.from({ length: 30 }, (_, i) => s.vehicles.reduce((a, v) => a + (v.viewsDaily[i] ?? 0), 0));
  const months = Array.from({ length: 6 }, (_, i) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - (5 - i)); return d; });
  const revenue = months.map((m) => ({ label: String(m.getMonth() + 1), value: s.payments.filter((p) => p.status === "paid_simulated" && new Date(p.at).getMonth() === m.getMonth() && new Date(p.at).getFullYear() === m.getFullYear()).reduce((a, p) => a + p.amount, 0) }));
  const funnel = LEAD_STATUSES.map((x) => ({ label: t("lead." + x), value: s.leads.filter((l) => l.status === x).length }));
  const topBrands = useMemo(() => s.brands.map((b) => ({ label: b.name, value: s.vehicles.filter((v) => v.brandId === b.id && isPublic(v)).length })).sort((a, b) => b.value - a.value).slice(0, 8), [s.brands, s.vehicles]);
  const totalRev = s.payments.filter((p) => p.status === "paid_simulated").reduce((a, p) => a + p.amount, 0);
  const sold = s.vehicles.filter((v) => v.status === "sold");
  const imp = s.ads.reduce((a, x) => a + x.impressions, 0), clk = s.ads.reduce((a, x) => a + x.clicks, 0);
  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" data-testid="platform-analytics">
        <Stat label={t("adm.total")} value={s.vehicles.length} /><Stat label={t("adm.sold")} value={<span data-testid="an-sold">{sold.length}</span>} sub={fmtMnt(sold.reduce((a, v) => a + (v.soldPrice ?? 0), 0))} />
        <Stat label={t("an.revenue")} value={<span className="text-xl">{fmtMnt(totalRev)}</span>} sub={t("pay.simulated")} /><Stat label={t("an.ctr")} value={imp ? ((clk / imp) * 100).toFixed(1) + "%" : "0%"} sub={`${imp.toLocaleString("en-US")} / ${clk.toLocaleString("en-US")}`} />
      </div>
      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <div className="card p-5"><h2 className="font-bold mb-4">{t("an.views30")}</h2><LineChart values={views30} /></div>
        <div className="card p-5"><h2 className="font-bold mb-4">{t("an.revenue6")}</h2><BarChart data={revenue} format={fmtMnt} /></div>
        <div className="card p-5"><h2 className="font-bold mb-4">{t("an.bystatus")}</h2><HBars data={byStatus} /></div>
        <div className="card p-5"><h2 className="font-bold mb-4">{t("an.funnel")}</h2><HBars data={funnel} /></div>
        <div className="card p-5"><h2 className="font-bold mb-4">{t("an.topbrands")}</h2><HBars data={topBrands} /></div>
        <div className="card p-5 overflow-x-auto"><h2 className="font-bold mb-4">{t("an.ads")}</h2><table className="tbl"><thead><tr><th>{t("ad.placement")}</th><th>{t("ad.impressions")}</th><th>{t("ad.clicks")}</th><th>CTR</th></tr></thead><tbody>
          {(["hero", "banner", "spotlight"] as const).map((p) => { const l = s.ads.filter((a) => a.placement === p); const i = l.reduce((a, x) => a + x.impressions, 0), c = l.reduce((a, x) => a + x.clicks, 0); return <tr key={p}><td>{t("ad.p." + p)} ({l.length})</td><td>{i.toLocaleString("en-US")}</td><td>{c.toLocaleString("en-US")}</td><td>{i ? ((c / i) * 100).toFixed(1) : "0.0"}%</td></tr>; })}</tbody></table>
        </div>
      </div>
    </>
  );
}

function Seller() {
  const { t, lang } = useT();
  const brandName = useBrandName();
  const { vehicles, leads } = useScope();
  const favorites = useStore((s) => s.favorites);
  const sold = vehicles.filter((v) => v.status === "sold").sort((a, b) => +new Date(b.soldAt ?? 0) - +new Date(a.soldAt ?? 0));
  const funnel = LEAD_STATUSES.map((x) => ({ label: t("lead." + x), value: leads.filter((l) => l.status === x).length }));
  const views30 = Array.from({ length: 30 }, (_, i) => vehicles.reduce((a, v) => a + (v.viewsDaily[i] ?? 0), 0));
  if (vehicles.length === 0) return <div className="card"><Empty title={t("lst.empty")} /></div>;
  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label={t("perf.views")} value={vehicles.reduce((a, v) => a + v.views, 0).toLocaleString("en-US")} /><Stat label={t("perf.calls")} value={vehicles.reduce((a, v) => a + v.phoneClicks, 0)} />
        <Stat label={t("lst.inq")} value={leads.length} /><Stat label={t("perf.revenue")} value={<span className="text-xl" data-testid="sales-total">{fmtMnt(sold.reduce((a, v) => a + (v.soldPrice ?? 0), 0))}</span>} />
      </div>
      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <div className="card p-5"><h2 className="font-bold mb-4">{t("an.views30")}</h2><LineChart values={views30} /></div>
        <div className="card p-5"><h2 className="font-bold mb-4">{t("an.funnel")}</h2><HBars data={funnel} /></div>
      </div>
      <div className="card p-5 mt-6 overflow-x-auto"><h2 className="font-bold mb-4">{t("perf.table")}</h2>
        <table className="tbl min-w-[640px]"><thead><tr><th>{t("nav.cars")}</th><th>{t("perf.views")}</th><th>{t("perf.favs")}</th><th>{t("perf.calls")}</th><th>{t("lst.inq")}</th><th>{t("perf.conv")}</th></tr></thead>
          <tbody>{vehicles.map((v) => { const n = leads.filter((l) => l.vehicleId === v.id).length; return <tr key={v.id}><td className="font-semibold">{brandName(v.brandId)} {v.modelName} {v.year}</td><td>{v.views}</td><td>{Object.values(favorites).filter((ids) => ids.includes(v.id)).length}</td><td>{v.phoneClicks}</td><td>{n}</td><td>{v.views ? ((n / v.views) * 100).toFixed(1) : "0.0"}%</td></tr>; })}</tbody></table></div>
      <div className="card p-5 mt-6 overflow-x-auto" data-testid="sales-history"><h2 className="font-bold mb-4">{t("sales.history")}</h2>
        {sold.length === 0 ? <p className="text-sm text-steel-500">{t("sales.none")}</p> : <table className="tbl"><thead><tr><th>{t("nav.cars")}</th><th>{t("sales.date")}</th><th>{t("common.price")}</th><th>{t("sales.sold")}</th></tr></thead>
          <tbody>{sold.map((v) => <tr key={v.id}><td className="font-semibold">{brandName(v.brandId)} {v.modelName} {v.year}</td><td>{v.soldAt ? fmtDate(v.soldAt, lang) : "–"}</td><td>{fmtMnt(v.price)}</td><td className="font-semibold">{fmtMnt(v.soldPrice ?? v.price)}</td></tr>)}</tbody></table>}</div>
    </>
  );
}

function Inner() {
  const { t } = useT();
  const user = useUser()!;
  return <><PageHead title={t("dash.analytics")} sub={t(isAdmin(user.role) ? "an.sub.admin" : "an.sub")} />{isAdmin(user.role) ? <Platform /> : <Seller />}</>;
}
export default function AnalyticsPage() { return <Guard perm="sales.view"><Inner /></Guard>; }
