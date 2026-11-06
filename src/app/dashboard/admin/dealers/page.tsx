"use client";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/hooks";
import { Badge, PageHead } from "@/components/ui";
import { Guard } from "@/components/Guard";
import { DealerLogo } from "@/components/DealerLogo";
import { fmtDate } from "@/lib/format";

function Inner() {
  const { t, lang } = useT();
  const st = useStore();
  return (
    <>
      <PageHead title={t("dash.a.dealers")} />
      <div className="card overflow-x-auto"><table className="tbl min-w-[760px]" data-testid="dealer-table"><thead><tr><th>{t("nav.dealers")}</th><th>{t("adm.owner")}</th><th>{t("adm.plan")}</th><th>{t("nav.cars")}</th><th>{t("common.status")}</th><th /></tr></thead>
        <tbody>{st.dealers.map((d) => (
          <tr key={d.id}><td><div className="flex items-center gap-3"><DealerLogo d={d} size={40} /><Link href={`/dealers/view?id=${d.id}`} className="font-bold hover:underline">{d.name}</Link></div></td>
            <td className="text-sm">{st.users.find((u) => u.id === d.ownerId)?.name}</td>
            <td><select aria-label={t("adm.plan")} className="input !h-8 !text-xs !w-36" value={d.plan} onChange={(e) => { st.updateDealer(d.id, { plan: e.target.value as typeof d.plan, planExpires: e.target.value === "none" ? undefined : d.planExpires ?? new Date(Date.now() + 30 * 86400000).toISOString() }); }}>{["none", "silver", "gold", "platinum"].map((p) => <option key={p} value={p}>{t("plan." + p)}</option>)}</select>{d.planExpires && d.plan !== "none" && <div className="text-[11px] text-steel-500 mt-1">{fmtDate(d.planExpires, lang)}</div>}</td>
            <td>{st.vehicles.filter((v) => v.dealerId === d.id).length}</td><td>{d.verified ? <Badge tone="ok">{t("common.verified")}</Badge> : <Badge tone="warn">{t("adm.unverified")}</Badge>}</td>
            <td className="text-right"><button className="btn btn-xs btn-outline" onClick={() => st.updateDealer(d.id, { verified: !d.verified })} data-testid="verify-dealer">{d.verified ? t("adm.unverify") : t("adm.verify")}</button></td></tr>))}</tbody></table></div>
    </>
  );
}
export default function AdminDealers() { return <Guard perm="dealers.manage"><Inner /></Guard>; }
