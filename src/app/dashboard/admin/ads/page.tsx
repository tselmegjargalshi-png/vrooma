"use client";
import { useState } from "react";
import { Plus, Trash2, Star } from "lucide-react";
import { useStore } from "@/lib/store";
import { useBrandName, useT } from "@/lib/hooks";
import { Badge, Field, Modal, PageHead, Tabs } from "@/components/ui";
import { Guard } from "@/components/Guard";
import { addDays, fmtDate, fmtMnt, toLocalInput } from "@/lib/format";
import { isPublic } from "@/lib/search";

function Inner() {
  const { t, lang } = useT();
  const brandName = useBrandName();
  const st = useStore();
  const [tab, setTab] = useState<"ads" | "featured" | "campaigns">("ads");
  const [adOpen, setAdOpen] = useState(false), [cOpen, setCOpen] = useState(false);
  const pub = st.vehicles.filter((v) => isPublic(v));
  const featured = st.vehicles.filter((v) => v.tier === "featured" && v.status === "active");
  const target = (a: typeof st.ads[number]) => { const v = st.vehicles.find((x) => x.id === a.vehicleId); return v ? `${brandName(v.brandId)} ${v.modelName} ${v.year}` : st.dealers.find((d) => d.id === a.dealerId)?.name ?? "–"; };
  return (
    <>
      <PageHead title={t("dash.a.ads")} sub={t("adm.ads.sub")} actions={tab === "ads" ? <button className="btn btn-sm btn-primary" onClick={() => setAdOpen(true)} data-testid="new-ad"><Plus size={15} />{t("ad.new")}</button> : tab === "campaigns" ? <button className="btn btn-sm btn-primary" onClick={() => setCOpen(true)} data-testid="new-campaign"><Plus size={15} />{t("camp.new")}</button> : undefined} />
      <Tabs value={tab} onChange={setTab} tabs={[{ id: "ads", label: t("ad.ads"), count: st.ads.length }, { id: "featured", label: t("ad.featured"), count: featured.length }, { id: "campaigns", label: t("ad.campaigns"), count: st.campaigns.length }]} />
      <div className="card mt-4 overflow-x-auto">
        {tab === "ads" && <table className="tbl min-w-[820px]" data-testid="ad-table"><thead><tr><th>{t("ad.placement")}</th><th>{t("ad.target")}</th><th>{t("ad.period")}</th><th>{t("ad.impressions")}</th><th>{t("ad.clicks")}</th><th>{t("ad.paid")}</th><th>{t("common.status")}</th><th /></tr></thead>
          <tbody>{st.ads.map((a) => <tr key={a.id}><td>{t("ad.p." + a.placement)}</td><td className="font-semibold">{target(a)}</td><td className="text-xs whitespace-nowrap">{fmtDate(a.startAt, lang)} → {fmtDate(a.endAt, lang)}</td><td>{a.impressions.toLocaleString("en-US")}</td><td>{a.clicks}</td><td>{fmtMnt(a.paid)}</td>
            <td><button onClick={() => st.upsertAd({ id: a.id, active: !a.active })} aria-pressed={a.active}><Badge tone={a.active ? "ok" : "gray"}>{a.active ? t("ad.active") : t("ad.paused")}</Badge></button></td>
            <td><button aria-label={t("common.delete")} className="h-8 w-8 grid place-items-center rounded-lg hover:bg-ink-900/5 text-bad" onClick={() => st.deleteAd(a.id)}><Trash2 size={14} /></button></td></tr>)}</tbody></table>}
        {tab === "featured" && <table className="tbl"><thead><tr><th>{t("nav.cars")}</th><th>{t("ad.until")}</th><th /></tr></thead><tbody>
          {featured.map((v) => <tr key={v.id}><td className="font-semibold">{brandName(v.brandId)} {v.modelName} {v.year}</td><td>{v.featuredUntil ? fmtDate(v.featuredUntil, lang) : "–"}</td><td className="text-right"><button className="btn btn-xs btn-outline" onClick={() => st.updateVehicle(v.id, { tier: "free", featuredUntil: undefined })}>{t("ad.unfeature")}</button></td></tr>)}
          <tr><td colSpan={3} className="bg-bone-100"><form className="flex gap-2 items-center" onSubmit={(e) => { e.preventDefault(); const id = String(new FormData(e.currentTarget).get("vehicle")); if (id) { st.updateVehicle(id, { tier: "featured", featuredUntil: addDays(new Date(), 14) }); st.flash(t("common.updated")); } }}>
            <select name="vehicle" aria-label={t("nav.cars")} className="input !h-9 flex-1">{pub.filter((v) => v.tier !== "featured").map((v) => <option key={v.id} value={v.id}>{brandName(v.brandId)} {v.modelName} {v.year}</option>)}</select><button className="btn btn-sm btn-primary"><Star size={14} />{t("ad.addfeatured")}</button></form></td></tr></tbody></table>}
        {tab === "campaigns" && <table className="tbl"><thead><tr><th>{t("common.name")}</th><th>{t("pay.promocode")}</th><th>{t("camp.discount")}</th><th>{t("ad.period")}</th><th>{t("common.status")}</th><th /></tr></thead><tbody>
          {st.campaigns.map((c) => <tr key={c.id}><td className="font-semibold">{c.name}</td><td><code className="bg-ink-900/5 px-1.5 py-0.5 rounded">{c.code}</code></td><td>{c.discount}%</td><td className="text-xs whitespace-nowrap">{fmtDate(c.startAt, lang)} → {fmtDate(c.endAt, lang)}</td>
            <td><button onClick={() => st.upsertCampaign({ id: c.id, active: !c.active })}><Badge tone={c.active ? "ok" : "gray"}>{c.active ? t("ad.active") : t("ad.paused")}</Badge></button></td><td><button aria-label={t("common.delete")} className="h-8 w-8 grid place-items-center rounded-lg hover:bg-ink-900/5 text-bad" onClick={() => st.deleteCampaign(c.id)}><Trash2 size={14} /></button></td></tr>)}</tbody></table>}
      </div>
      <Modal open={adOpen} onClose={() => setAdOpen(false)} title={t("ad.new")}>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); const placement = String(f.get("placement")) as "hero" | "banner" | "spotlight"; const veh = String(f.get("vehicle")); const dealer = String(f.get("dealer")); const days = Number(f.get("days")) || 14; st.upsertAd({ placement, vehicleId: placement === "spotlight" ? undefined : veh || undefined, dealerId: placement === "spotlight" ? dealer : st.vehicles.find((v) => v.id === veh)?.dealerId, endAt: addDays(new Date(), days), paid: Number(f.get("paid")) || 0 }); setAdOpen(false); st.flash(t("common.saved")); }}>
          <Field label={t("ad.placement")}><select name="placement" className="input">{["hero", "banner", "spotlight"].map((p) => <option key={p} value={p}>{t("ad.p." + p)}</option>)}</select></Field>
          <Field label={t("nav.cars")}><select name="vehicle" className="input">{pub.map((v) => <option key={v.id} value={v.id}>{brandName(v.brandId)} {v.modelName} {v.year}</option>)}</select></Field>
          <Field label={t("nav.dealers")}><select name="dealer" className="input">{st.dealers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></Field>
          <div className="grid grid-cols-2 gap-3"><Field label={t("ad.days")}><input name="days" type="number" min={1} defaultValue={14} className="input" /></Field><Field label={`${t("ad.paid")} (₮)`}><input name="paid" type="number" min={0} defaultValue={150000} className="input" /></Field></div>
          <button className="btn btn-primary w-full">{t("common.create")}</button></form>
      </Modal>
      <Modal open={cOpen} onClose={() => setCOpen(false)} title={t("camp.new")}>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); const code = String(f.get("code")).trim().toUpperCase(); if (!code || !String(f.get("name")).trim()) return; st.upsertCampaign({ name: String(f.get("name")).trim(), code, discount: Math.min(90, Math.max(1, Number(f.get("discount")) || 10)), startAt: new Date().toISOString(), endAt: new Date(String(f.get("end"))).toISOString() }); setCOpen(false); st.flash(t("common.saved")); }}>
          <Field label={t("common.name")}><input name="name" className="input" /></Field><Field label={t("pay.promocode")}><input name="code" className="input uppercase" /></Field>
          <div className="grid grid-cols-2 gap-3"><Field label={`${t("camp.discount")} %`}><input name="discount" type="number" min={1} max={90} defaultValue={10} className="input" /></Field><Field label={t("ad.until")}><input name="end" type="datetime-local" className="input" defaultValue={toLocalInput(addDays(new Date(), 30))} /></Field></div>
          <button className="btn btn-primary w-full">{t("common.create")}</button></form>
      </Modal>
    </>
  );
}
export default function AdminAds() { return <Guard perm="ads.manage"><Inner /></Guard>; }
