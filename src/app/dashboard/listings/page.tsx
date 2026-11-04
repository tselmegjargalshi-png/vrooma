"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Plus, Pencil, Pause, Play, BadgeDollarSign, Trash2, Megaphone, RefreshCw, Eye } from "lucide-react";
import { useStore } from "@/lib/store";
import { useBrandName, useScope, useT, usePrice, photoSrc } from "@/lib/hooks";
import { Badge, Empty, Field, Modal, PageHead, Tabs, statusTone } from "@/components/ui";
import { Guard } from "@/components/Guard";
import { fmtDate, fmtMnt } from "@/lib/format";
import type { Vehicle, VStatus } from "@/lib/types";

function Inner() {
  const { t, lang } = useT();
  const sp = useSearchParams();
  const brandName = useBrandName();
  const price = usePrice();
  const { vehicles, leads } = useScope();
  const favorites = useStore((s) => s.favorites);
  const setStatus = useStore((s) => s.setVehicleStatus), markSold = useStore((s) => s.markSold), del = useStore((s) => s.deleteVehicle), renew = useStore((s) => s.renewVehicle), flash = useStore((s) => s.flash);
  const [tab, setTab] = useState<"all" | VStatus>("all");
  const [sold, setSold] = useState<Vehicle | null>(null);
  const [rm, setRm] = useState<Vehicle | null>(null);
  const rows = vehicles.filter((v) => tab === "all" || v.status === tab).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  const count = (s: VStatus) => vehicles.filter((v) => v.status === s).length;
  const created = sp.get("created");
  return (
    <>
      <PageHead title={t("dash.listings")} sub={t("lst.sub")} actions={<Link href="/dashboard/listings/new" className="btn btn-sm btn-primary" data-testid="new-listing"><Plus size={15} />{t("lst.new")}</Link>} />
      {created && <div className="mb-5 rounded-2xl bg-ok/10 text-ok px-5 py-3.5 text-sm font-semibold" data-testid="created-banner">{t("lst.created.banner")}</div>}
      <Tabs value={tab} onChange={setTab} tabs={[{ id: "all", label: t("common.all"), count: vehicles.length }, ...(["active", "pending", "paused", "sold", "rejected", "expired"] as VStatus[]).map((s) => ({ id: s, label: t("vstatus." + s), count: count(s) }))]} />
      <div className="card mt-4 overflow-x-auto">
        {rows.length === 0 ? <Empty title={t("lst.empty")} body={t("lst.empty.body")} action={<Link href="/dashboard/listings/new" className="btn btn-primary">{t("lst.new")}</Link>} /> : (
          <table className="tbl min-w-[860px]" data-testid="listing-table">
            <thead><tr><th>{t("nav.cars")}</th><th>{t("common.price")}</th><th>{t("common.status")}</th><th>{t("lst.perf")}</th><th>{t("lst.expires")}</th><th /></tr></thead>
            <tbody>{rows.map((v) => {
              const inq = leads.filter((l) => l.vehicleId === v.id).length;
              const favs = Object.values(favorites).filter((ids) => ids.includes(v.id)).length;
              const soon = v.status === "active" && (+new Date(v.expiresAt) - Date.now()) / 86400000 < 10;
              return (
                <tr key={v.id} data-testid="listing-row" data-id={v.id}>
                  <td><div className="flex items-center gap-3 min-w-0">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={photoSrc(v, 0)} alt="" className="h-12 w-[72px] rounded-lg object-cover shrink-0" /><div className="min-w-0"><Link href={`/cars/${v.id}`} className="font-bold hover:underline block truncate">{brandName(v.brandId)} {v.modelName}</Link><div className="text-xs text-steel-500">{v.year} · {v.demo ? t("demo.data") : t("lst.yours")}</div></div></div></td>
                  <td className="whitespace-nowrap font-semibold">{price(v.price, true).main}</td>
                  <td><div className="flex flex-col gap-1 items-start"><Badge tone={statusTone(v.status) as "ok"}>{t("vstatus." + v.status)}</Badge>{v.tier !== "free" && <Badge tone="brass">{t("tier." + v.tier)}</Badge>}{v.status === "rejected" && v.rejectReason && <span className="text-[11px] text-bad">{t("reject." + v.rejectReason)}</span>}</div></td>
                  <td className="text-xs text-steel-600 whitespace-nowrap"><span className="inline-flex items-center gap-1"><Eye size={12} />{v.views}</span> · {favs} ♥ · {inq} {t("lst.inq")} · {v.phoneClicks} {t("lst.calls")}</td>
                  <td className={`text-xs whitespace-nowrap ${soon ? "text-warn font-semibold" : "text-steel-600"}`}>{fmtDate(v.expiresAt, lang)}</td>
                  <td><div className="flex gap-1 justify-end">
                    <Link href={`/dashboard/listings/${v.id}`} aria-label={t("common.edit")} title={t("common.edit")} className="h-8 w-8 grid place-items-center rounded-lg hover:bg-ink-900/5" data-testid="edit-listing"><Pencil size={15} /></Link>
                    {v.status === "active" && <button aria-label={t("lst.pause")} title={t("lst.pause")} onClick={() => setStatus(v.id, "paused")} className="h-8 w-8 grid place-items-center rounded-lg hover:bg-ink-900/5" data-testid="pause"><Pause size={15} /></button>}
                    {v.status === "paused" && <button aria-label={t("lst.resume")} title={t("lst.resume")} onClick={() => setStatus(v.id, "active")} className="h-8 w-8 grid place-items-center rounded-lg hover:bg-ink-900/5" data-testid="resume"><Play size={15} /></button>}
                    {["active", "paused"].includes(v.status) && <button aria-label={t("lst.marksold")} title={t("lst.marksold")} onClick={() => setSold(v)} className="h-8 w-8 grid place-items-center rounded-lg hover:bg-ink-900/5 text-ok" data-testid="mark-sold"><BadgeDollarSign size={16} /></button>}
                    {(soon || v.status === "expired") && <button aria-label={t("lst.renew")} title={t("lst.renew")} onClick={() => { renew(v.id); flash(t("common.updated")); }} className="h-8 w-8 grid place-items-center rounded-lg hover:bg-ink-900/5"><RefreshCw size={15} /></button>}
                    {v.status === "active" && <Link href={`/dashboard/promote?vehicle=${v.id}`} aria-label={t("dash.promote")} title={t("dash.promote")} className="h-8 w-8 grid place-items-center rounded-lg hover:bg-ink-900/5 text-brass-600"><Megaphone size={15} /></Link>}
                    <button aria-label={t("common.delete")} title={t("common.delete")} onClick={() => setRm(v)} className="h-8 w-8 grid place-items-center rounded-lg hover:bg-ink-900/5 text-bad" data-testid="delete-listing"><Trash2 size={15} /></button></div></td>
                </tr>);
            })}</tbody>
          </table>
        )}
      </div>
      <Modal open={!!sold} onClose={() => setSold(null)} title={t("lst.marksold")}>
        {sold && <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); const p = Number(new FormData(e.currentTarget).get("price")) || sold.price; markSold(sold.id, p); setSold(null); flash(t("lst.sold.done")); }}>
          <p className="text-sm text-steel-600">{t("lst.sold.hint")}</p>
          <Field label={`${t("lst.soldprice")} (₮)`}><input name="price" type="number" min={0} className="input" defaultValue={sold.price} data-testid="sold-price" /></Field>
          <button className="btn btn-primary w-full" data-testid="confirm-sold">{t("common.confirm")}</button></form>}
      </Modal>
      <Modal open={!!rm} onClose={() => setRm(null)} title={t("common.delete")}>
        {rm && <div className="space-y-4"><p className="text-sm">{t("lst.delete.confirm", { name: `${brandName(rm.brandId)} ${rm.modelName}` })}</p><div className="flex gap-2"><button className="btn btn-danger flex-1" onClick={() => { del(rm.id); setRm(null); flash(t("common.deleted")); }} data-testid="confirm-delete">{t("common.delete")}</button><button className="btn btn-outline flex-1" onClick={() => setRm(null)}>{t("common.cancel")}</button></div></div>}
      </Modal>
      <p className="sr-only">{fmtMnt(0)}</p>
    </>
  );
}
export default function ListingsPage() { return <Guard perm="listing.create"><Suspense><Inner /></Suspense></Guard>; }
