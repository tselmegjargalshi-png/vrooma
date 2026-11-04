"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, Crown, Sparkles, Home as HomeIcon } from "lucide-react";
import { useStore } from "@/lib/store";
import { useBrandName, useScope, useT, useUser } from "@/lib/hooks";
import { Badge, Empty, Field, PageHead } from "@/components/ui";
import { Guard } from "@/components/Guard";
import { PayModal } from "@/components/PayModal";
import { PACKAGES } from "@/lib/seed";
import { fmtDate, fmtMnt } from "@/lib/format";

function Inner() {
  const { t, lang } = useT();
  const user = useUser()!;
  const sp = useSearchParams();
  const brandName = useBrandName();
  const { vehicles } = useScope();
  const st = useStore();
  const active = vehicles.filter((v) => v.status === "active");
  const [vehicleId, setVehicleId] = useState(sp.get("vehicle") ?? active[0]?.id ?? "");
  const [pk, setPk] = useState<string | null>(null);
  const dealer = st.dealers.find((d) => d.id === user.dealerId);
  const pays = st.payments.filter((p) => p.userId === user.id || (user.dealerId && st.users.find((u) => u.id === p.userId)?.dealerId === user.dealerId)).sort((a, b) => +new Date(b.at) - +new Date(a.at));
  const subs = st.subs.filter((s) => s.userId === user.id || (user.dealerId && s.dealerId === user.dealerId)).filter((s) => new Date(s.endAt) > new Date());
  const isDealer = user.role === "dealer_owner";
  const list = PACKAGES.filter((p) => (p.kind === "dealer" ? isDealer : p.kind === "seller" ? !isDealer : true));
  const promoted = vehicles.filter((v) => v.tier !== "free");
  const needsVehicle = (id: string) => PACKAGES.find((p) => p.id === id)!.kind === "listing" || PACKAGES.find((p) => p.id === id)!.kind === "homepage";
  const ads = st.ads.filter((a) => a.vehicleId && vehicles.some((v) => v.id === a.vehicleId));
  return (
    <>
      <PageHead title={t("dash.promote")} sub={t("promo.sub")} />
      <div className="rounded-2xl bg-warn/10 text-warn px-4 py-3 text-xs font-semibold mb-6" role="note">{t("pay.simulated.note")}</div>
      {isDealer && dealer && <div className="card p-5 mb-6 flex items-center justify-between flex-wrap gap-3"><div><div className="text-xs uppercase tracking-wide text-steel-500 font-bold">{t("promo.currentplan")}</div><div className="font-display text-xl font-extrabold flex items-center gap-2"><Crown size={18} className="text-brass-600" />{t("plan." + dealer.plan)}</div></div>{dealer.planExpires && <div className="text-sm text-steel-600">{t("lst.expires")}: <b>{fmtDate(dealer.planExpires, lang)}</b></div>}</div>}
      {!isDealer && active.length > 0 && (
        <div className="max-w-md mb-6"><Field label={t("promo.vehicle")}><select name="vehicle" className="input" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} data-testid="promo-vehicle">{active.map((v) => <option key={v.id} value={v.id}>{brandName(v.brandId)} {v.modelName} {v.year}</option>)}</select></Field></div>
      )}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4" data-testid="packages">
        {list.map((p) => {
          const needV = needsVehicle(p.id);
          const dis = needV && !vehicleId;
          const Ic = p.kind === "homepage" ? HomeIcon : p.kind === "dealer" ? Crown : Sparkles;
          return (
            <div key={p.id} className="card p-5 flex flex-col" data-testid={"pkg-" + p.id}>
              <div className="flex items-center gap-2"><span className="h-9 w-9 rounded-xl bg-ink-900 text-brass-300 grid place-items-center"><Ic size={17} /></span><h3 className="font-bold">{t("pk." + p.id)}</h3></div>
              <div className="font-display text-2xl font-extrabold mt-4">{fmtMnt(p.priceMnt)}<span className="text-sm text-steel-500 font-medium"> / {p.days} {t("pay.days")}</span></div>
              <ul className="mt-3 space-y-1.5 text-sm text-steel-600 flex-1">{[1, 2, 3].map((n) => <li key={n} className="flex gap-2"><Check size={15} className="text-ok shrink-0 mt-0.5" />{t(`pk.${p.id}.f${n}`)}</li>)}</ul>
              <button className="btn btn-primary mt-5" disabled={dis} onClick={() => setPk(p.id)} data-testid={"buy-" + p.id}>{t("promo.buy")}</button>
            </div>);
        })}
      </div>
      {needsVehicle("pk_premium30") && active.length === 0 && !isDealer && <p className="text-sm text-steel-500 mt-3">{t("promo.noactive")}</p>}

      <div className="grid lg:grid-cols-2 gap-6 mt-8">
        <div className="card p-5"><h2 className="font-bold mb-3">{t("promo.active")}</h2>
          {promoted.length === 0 && subs.length === 0 ? <p className="text-sm text-steel-500">{t("promo.none")}</p> : <ul className="space-y-2 text-sm">
            {promoted.map((v) => <li key={v.id} className="flex justify-between gap-3"><span className="font-semibold">{brandName(v.brandId)} {v.modelName}</span><span className="flex items-center gap-2"><Badge tone="brass">{t("tier." + v.tier)}</Badge><span className="text-xs text-steel-500">{fmtDate((v.featuredUntil ?? v.premiumUntil)!, lang)}</span></span></li>)}
            {subs.map((s) => <li key={s.id} className="flex justify-between gap-3"><span className="font-semibold">{t("pk." + s.packageId)}</span><span className="text-xs text-steel-500">{fmtDate(s.endAt, lang)}</span></li>)}</ul>}
          {ads.length > 0 && <div className="mt-4 pt-4 border-t border-ink-900/[.07]"><h3 className="text-sm font-bold mb-2">{t("promo.adperf")}</h3><table className="tbl"><thead><tr><th>{t("nav.cars")}</th><th>{t("ad.impressions")}</th><th>{t("ad.clicks")}</th><th>CTR</th></tr></thead><tbody>{ads.map((a) => { const v = vehicles.find((x) => x.id === a.vehicleId)!; return <tr key={a.id}><td>{brandName(v.brandId)} {v.modelName}</td><td>{a.impressions}</td><td>{a.clicks}</td><td>{a.impressions ? ((a.clicks / a.impressions) * 100).toFixed(1) : "0.0"}%</td></tr>; })}</tbody></table></div>}
        </div>
        <div className="card p-5 overflow-x-auto"><h2 className="font-bold mb-3">{t("pay.history")}</h2>
          {pays.length === 0 ? <Empty title={t("pay.none")} /> : <table className="tbl" data-testid="payment-history"><thead><tr><th>{t("common.date")}</th><th>{t("pay.item")}</th><th>{t("pay.method")}</th><th>{t("common.total")}</th><th>{t("common.status")}</th></tr></thead>
            <tbody>{pays.slice(0, 12).map((p) => <tr key={p.id}><td className="whitespace-nowrap">{fmtDate(p.at, lang)}</td><td>{t("pk." + p.packageId)}</td><td>{t("pay." + p.method)}</td><td className="whitespace-nowrap">{fmtMnt(p.amount)}</td><td><Badge tone={p.status === "paid_simulated" ? "ok" : p.status === "pending" ? "warn" : "bad"}>{t("pay.status." + p.status)}</Badge></td></tr>)}</tbody></table>}
        </div>
      </div>
      <PayModal packageId={pk} vehicleId={pk && needsVehicle(pk) ? vehicleId : undefined} onClose={() => setPk(null)} />
    </>
  );
}
export default function PromotePage() { return <Guard perm="promote"><Suspense><Inner /></Suspense></Guard>; }
