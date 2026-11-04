"use client";
import { useState } from "react";
import Link from "next/link";
import { Check, X, Star, Trash2, Pencil } from "lucide-react";
import { useStore } from "@/lib/store";
import { useBrandName, useT, usePrice, photoSrc } from "@/lib/hooks";
import { Badge, Empty, Field, Modal, PageHead, Tabs, statusTone } from "@/components/ui";
import { Guard } from "@/components/Guard";
import { addDays, fmtDate } from "@/lib/format";
import type { Vehicle, VStatus } from "@/lib/types";

function Inner() {
  const { t, lang } = useT();
  const brandName = useBrandName();
  const price = usePrice();
  const st = useStore();
  const [tab, setTab] = useState<"all" | VStatus>("pending");
  const [q, setQ] = useState("");
  const [rej, setRej] = useState<Vehicle | null>(null);
  const [del, setDel] = useState<Vehicle | null>(null);
  const rows = st.vehicles.filter((v) => (tab === "all" || v.status === tab) && (!q || `${brandName(v.brandId)} ${v.modelName} ${v.year}`.toLowerCase().includes(q.toLowerCase()))).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  const count = (s: VStatus) => st.vehicles.filter((v) => v.status === s).length;
  const seller = (v: Vehicle) => (v.dealerId ? st.dealers.find((d) => d.id === v.dealerId)?.name : st.users.find((u) => u.id === v.sellerId)?.name) ?? "?";
  return (
    <>
      <PageHead title={t("dash.a.listings")} sub={t("adm.listings.sub")} />
      <div className="flex flex-wrap gap-3 items-center justify-between mb-4">
        <Tabs value={tab} onChange={setTab} tabs={[{ id: "pending", label: t("vstatus.pending"), count: count("pending") }, { id: "active", label: t("vstatus.active"), count: count("active") }, { id: "rejected", label: t("vstatus.rejected"), count: count("rejected") }, { id: "sold", label: t("vstatus.sold"), count: count("sold") }, { id: "paused", label: t("vstatus.paused"), count: count("paused") }, { id: "expired", label: t("vstatus.expired"), count: count("expired") }, { id: "all", label: t("common.all"), count: st.vehicles.length }]} />
        <input className="input !h-9 !w-52" aria-label={t("common.search")} placeholder={t("common.search")} value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="card overflow-x-auto">
        {rows.length === 0 ? <Empty title={t("adm.nopending")} /> : (
          <table className="tbl min-w-[860px]" data-testid="admin-listings"><thead><tr><th>{t("nav.cars")}</th><th>{t("veh.seller")}</th><th>{t("common.price")}</th><th>{t("common.status")}</th><th>{t("common.date")}</th><th /></tr></thead>
            <tbody>{rows.map((v) => (
              <tr key={v.id} data-testid="admin-row" data-id={v.id}>
                <td><div className="flex items-center gap-3">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={photoSrc(v, 0)} alt="" className="h-12 w-[72px] rounded-lg object-cover" /><div><Link href={`/cars/${v.id}`} className="font-bold hover:underline">{brandName(v.brandId)} {v.modelName}</Link><div className="text-xs text-steel-500">{v.year} · {v.photos.length} {t("lst.photos")}{v.demo ? ` · ${t("demo.data")}` : ""}</div></div></div></td>
                <td className="text-sm">{seller(v)}</td><td className="font-semibold whitespace-nowrap">{price(v.price, true).main}</td>
                <td><div className="flex flex-col gap-1 items-start"><Badge tone={statusTone(v.status) as "ok"}>{t("vstatus." + v.status)}</Badge>{v.tier !== "free" && <Badge tone="brass">{t("tier." + v.tier)}</Badge>}</div></td>
                <td className="text-xs text-steel-600 whitespace-nowrap">{fmtDate(v.createdAt, lang)}</td>
                <td><div className="flex gap-1 justify-end">
                  {v.status === "pending" && <><button className="btn btn-xs btn-primary" onClick={() => { st.approveVehicle(v.id); st.flash(t("adm.approved")); }} data-testid="approve"><Check size={13} />{t("common.approve")}</button><button className="btn btn-xs btn-outline" onClick={() => setRej(v)} data-testid="reject"><X size={13} />{t("common.reject")}</button></>}
                  {v.status === "rejected" && <button className="btn btn-xs btn-outline" onClick={() => st.approveVehicle(v.id)}>{t("common.approve")}</button>}
                  {v.status === "active" && <button className="btn btn-xs btn-ghost" title={t("adm.togglefeatured")} aria-pressed={v.tier === "featured"} onClick={() => st.updateVehicle(v.id, v.tier === "featured" ? { tier: "free", featuredUntil: undefined } : { tier: "featured", featuredUntil: addDays(new Date(), 14) })}><Star size={14} className={v.tier === "featured" ? "fill-brass-500 text-brass-500" : ""} /></button>}
                  {["active", "paused"].includes(v.status) && <button className="btn btn-xs btn-ghost" onClick={() => st.setVehicleStatus(v.id, v.status === "active" ? "paused" : "active")}>{v.status === "active" ? t("lst.pause") : t("lst.resume")}</button>}
                  <Link href={`/dashboard/listings/${v.id}`} aria-label={t("common.edit")} className="h-8 w-8 grid place-items-center rounded-lg hover:bg-ink-900/5"><Pencil size={14} /></Link>
                  <button aria-label={t("common.delete")} onClick={() => setDel(v)} className="h-8 w-8 grid place-items-center rounded-lg hover:bg-ink-900/5 text-bad"><Trash2 size={14} /></button></div></td>
              </tr>))}</tbody></table>
        )}
      </div>
      <Modal open={!!rej} onClose={() => setRej(null)} title={t("adm.rejecttitle")}>
        {rej && <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); st.rejectVehicle(rej.id, String(new FormData(e.currentTarget).get("reason"))); setRej(null); st.flash(t("adm.rejected")); }}>
          <Field label={t("common.reason")}><select name="reason" className="input">{["photos", "price", "info", "duplicate"].map((r) => <option key={r} value={r}>{t("reject." + r)}</option>)}</select></Field>
          <button className="btn btn-danger w-full" data-testid="confirm-reject">{t("common.reject")}</button></form>}
      </Modal>
      <Modal open={!!del} onClose={() => setDel(null)} title={t("common.delete")}>
        {del && <div className="space-y-4"><p className="text-sm">{t("lst.delete.confirm", { name: `${brandName(del.brandId)} ${del.modelName}` })}</p><button className="btn btn-danger w-full" onClick={() => { st.deleteVehicle(del.id); setDel(null); }}>{t("common.delete")}</button></div>}
      </Modal>
    </>
  );
}
export default function AdminListings() { return <Guard perm="listing.approve"><Inner /></Guard>; }
