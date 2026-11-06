"use client";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { useBrandName, useT } from "@/lib/hooks";
import { Badge, Empty, PageHead } from "@/components/ui";
import { Guard } from "@/components/Guard";
import { fmtDate } from "@/lib/format";

function Inner() {
  const { t, lang } = useT();
  const st = useStore();
  const brandName = useBrandName();
  return (
    <>
      <PageHead title={t("dash.a.reports")} sub={t("adm.reports.sub")} />
      <div className="card overflow-x-auto">{st.flags.length === 0 ? <Empty title={t("adm.noflags")} /> : (
        <table className="tbl min-w-[720px]" data-testid="flag-table"><thead><tr><th>{t("nav.cars")}</th><th>{t("common.reason")}</th><th>{t("adm.reporter")}</th><th>{t("common.date")}</th><th>{t("common.status")}</th><th /></tr></thead>
          <tbody>{st.flags.map((f) => { const v = st.vehicles.find((x) => x.id === f.vehicleId); return (
            <tr key={f.id}><td>{v ? <Link href={`/cars/view?id=${v.id}`} className="font-semibold hover:underline">{brandName(v.brandId)} {v.modelName} {v.year}</Link> : "–"}</td><td>{t("flag." + f.reason)}</td><td>{st.users.find((u) => u.id === f.reporterId)?.name ?? t("common.unknown")}</td><td>{fmtDate(f.at, lang)}</td>
              <td><Badge tone={f.status === "open" ? "warn" : f.status === "resolved" ? "ok" : "gray"}>{t("flag.s." + f.status)}</Badge></td>
              <td className="text-right whitespace-nowrap">{f.status === "open" && <><button className="btn btn-xs btn-primary mr-1" onClick={() => st.resolveFlag(f.id, "resolved")}>{t("adm.resolve")}</button><button className="btn btn-xs btn-ghost" onClick={() => st.resolveFlag(f.id, "dismissed")}>{t("adm.dismiss")}</button></>}</td></tr>); })}</tbody></table>)}</div>
    </>
  );
}
export default function AdminReports() { return <Guard perm="reports.manage"><Inner /></Guard>; }
