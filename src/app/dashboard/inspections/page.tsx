"use client";
import { useState } from "react";
import Link from "next/link";
import { Plus, FileText } from "lucide-react";
import { useStore } from "@/lib/store";
import { useBrandName, useScope, useT, useUser } from "@/lib/hooks";
import { Badge, Empty, Field, Modal, PageHead } from "@/components/ui";
import { Guard } from "@/components/Guard";
import { fmtDate, toLocalInput } from "@/lib/format";
import { can, isAdmin } from "@/lib/perms";

function Inner() {
  const { t, lang } = useT();
  const user = useUser()!;
  const brandName = useBrandName();
  const st = useStore();
  const { appts, vehicles } = useScope();
  const [open, setOpen] = useState(false);
  const inspector = user.role === "inspector";
  const seller = ["seller", "dealer_owner", "agent"].includes(user.role);
  const vname = (id: string) => { const v = st.vehicles.find((x) => x.id === id); return v ? `${brandName(v.brandId)} ${v.modelName} ${v.year}` : "?"; };
  const rows = [...appts].sort((a, b) => +new Date(a.at) - +new Date(b.at));
  const tone = (s: string) => (s === "completed" ? "ok" : s === "cancelled" ? "bad" : s === "requested" ? "warn" : "blue");
  const reports = isAdmin(user.role) ? st.reports : st.reports.filter((r) => r.inspectorId === user.id);
  return (
    <>
      <PageHead title={t("dash.inspections")} sub={t(inspector ? "insp.sub.inspector" : "insp.sub")} actions={seller && <button className="btn btn-sm btn-primary" onClick={() => setOpen(true)} data-testid="new-appt"><Plus size={15} />{t("appt.schedule")}</button>} />
      <div className="card overflow-x-auto">
        {rows.length === 0 ? <Empty title={t("insp.none")} /> : (
          <table className="tbl min-w-[780px]" data-testid="appt-table"><thead><tr><th>{t("nav.cars")}</th><th>{t("common.date")}</th><th>{t("appt.place")}</th><th>{t("insp.inspector")}</th><th>{t("common.status")}</th><th /></tr></thead>
            <tbody>{rows.map((a) => (
              <tr key={a.id} data-testid="appt-row" data-id={a.id} data-vehicle={a.vehicleId}>
                <td><Link href={`/cars/view?id=${a.vehicleId}`} className="font-semibold hover:underline">{vname(a.vehicleId)}</Link></td>
                <td className="whitespace-nowrap">{fmtDate(a.at, lang, true)}</td><td>{a.place}</td>
                <td>{st.users.find((u) => u.id === a.inspectorId)?.name ?? <span className="text-steel-400">{t("insp.unassigned")}</span>}</td>
                <td><Badge tone={tone(a.status) as "ok"}>{t("appt.status." + a.status)}</Badge></td>
                <td className="text-right whitespace-nowrap">
                  {inspector && !a.inspectorId && a.status !== "cancelled" && <button className="btn btn-xs btn-outline mr-1" onClick={() => st.updateAppointment(a.id, { inspectorId: user.id, status: "scheduled" })} data-testid="claim">{t("insp.claim")}</button>}
                  {inspector && a.inspectorId === user.id && a.status !== "cancelled" && <Link href={`/dashboard/inspections/edit?id=${a.id}`} className="btn btn-xs btn-primary" data-testid="write-report"><FileText size={13} />{a.reportId ? t("insp.editreport") : t("insp.writereport")}</Link>}
                  {a.reportId && !inspector && <Link href={`/reports/view?id=${a.reportId}`} className="btn btn-xs btn-outline">{t("insp.openreport")}</Link>}
                  {seller && a.status === "requested" && <button className="btn btn-xs btn-primary mr-1" onClick={() => st.updateAppointment(a.id, { status: "scheduled" })} data-testid="accept-appt">{t("appt.accept")}</button>}
                  {(seller || isAdmin(user.role)) && ["requested", "scheduled"].includes(a.status) && <button className="btn btn-xs btn-ghost" onClick={() => st.updateAppointment(a.id, { status: "cancelled" })}>{t("common.cancel")}</button>}
                </td>
              </tr>))}</tbody></table>
        )}
      </div>
      {(inspector || can(user.role, "inspection.manage")) && (
        <div className="mt-8"><h2 className="font-bold text-lg mb-3">{t("insp.reports")}</h2>
          <div className="card overflow-x-auto">{reports.length === 0 ? <Empty title={t("insp.noreports")} /> : (
            <table className="tbl" data-testid="report-table"><thead><tr><th>{t("nav.cars")}</th><th>{t("insp.date")}</th><th>{t("insp.inspector")}</th><th>{t("common.status")}</th><th /></tr></thead>
              <tbody>{reports.map((r) => <tr key={r.id}><td className="font-semibold">{vname(r.vehicleId)}</td><td>{fmtDate(r.date, lang)}</td><td>{st.users.find((u) => u.id === r.inspectorId)?.name}</td><td><Badge tone={r.status === "published" ? "ok" : "warn"}>{r.status === "published" ? t("insp.published") : t("insp.draft")}</Badge></td>
                <td className="text-right whitespace-nowrap"><Link href={`/reports/view?id=${r.id}`} className="btn btn-xs btn-outline mr-1">{t("common.view")}</Link>{isAdmin(user.role) && <button className="btn btn-xs btn-ghost text-bad" onClick={() => { if (confirm(t("insp.deleteconfirm"))) st.deleteReport(r.id); }}>{t("common.delete")}</button>}</td></tr>)}</tbody></table>)}</div></div>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title={t("appt.schedule")}>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); const d = new Date(String(f.get("at"))); if (isNaN(+d)) return; st.requestAppointment({ vehicleId: String(f.get("vehicle")), at: d.toISOString(), place: String(f.get("place")), inspectorId: String(f.get("insp")) || undefined, scheduled: true }); setOpen(false); st.flash(t("appt.scheduled")); }}>
          <Field label={t("nav.cars")}><select name="vehicle" className="input" required>{vehicles.filter((v) => v.status === "active").map((v) => <option key={v.id} value={v.id}>{brandName(v.brandId)} {v.modelName} {v.year}</option>)}</select></Field>
          <Field label={t("common.date")}><input name="at" type="datetime-local" className="input" defaultValue={toLocalInput(new Date(Date.now() + 2 * 86400000).toISOString().replace(/T\d\d/, "T11"))} required /></Field>
          <Field label={t("appt.place")}><select name="place" className="input">{["place1", "place2", "place3"].map((p) => <option key={p} value={t("appt." + p)}>{t("appt." + p)}</option>)}</select></Field>
          <Field label={t("insp.inspector")}><select name="insp" className="input"><option value="">{t("insp.anyinspector")}</option>{st.users.filter((u) => u.role === "inspector").map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></Field>
          <button className="btn btn-primary w-full">{t("appt.schedule")}</button>
        </form>
      </Modal>
    </>
  );
}
export default function InspectionsPage() { return <Guard><Inner /></Guard>; }
