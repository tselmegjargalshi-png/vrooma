"use client";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/hooks";
import { Badge, PageHead, Stat } from "@/components/ui";
import { Guard } from "@/components/Guard";
import { fmtDate, fmtMnt } from "@/lib/format";

function Inner() {
  const { t, lang } = useT();
  const st = useStore();
  const paid = st.payments.filter((p) => p.status === "paid_simulated");
  const pending = st.payments.filter((p) => p.status === "pending");
  const ms = new Date(); ms.setDate(1); ms.setHours(0, 0, 0, 0);
  return (
    <>
      <PageHead title={t("dash.a.payments")} sub={t("pay.simulated.note")} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Stat label={t("adm.revenue")} value={<span className="text-xl">{fmtMnt(paid.filter((p) => new Date(p.at) >= ms).reduce((a, p) => a + p.amount, 0))}</span>} sub={t("pay.simulated")} />
        <Stat label={t("an.revenue")} value={<span className="text-xl">{fmtMnt(paid.reduce((a, p) => a + p.amount, 0))}</span>} /><Stat label={t("pay.pending")} value={<span data-testid="pending-pay">{pending.length}</span>} /><Stat label={t("adm.subs")} value={st.subs.filter((s) => s.active && new Date(s.endAt) > new Date()).length} />
      </div>
      <div className="card overflow-x-auto"><table className="tbl min-w-[860px]" data-testid="pay-table"><thead><tr><th>{t("pay.ref")}</th><th>{t("common.date")}</th><th>{t("adm.user")}</th><th>{t("pay.item")}</th><th>{t("pay.method")}</th><th>{t("common.total")}</th><th>{t("common.status")}</th><th /></tr></thead>
        <tbody>{[...st.payments].sort((a, b) => +new Date(b.at) - +new Date(a.at)).slice(0, 60).map((p) => (
          <tr key={p.id}><td className="font-mono text-xs">{p.ref}</td><td className="whitespace-nowrap">{fmtDate(p.at, lang)}</td><td>{st.users.find((u) => u.id === p.userId)?.name}</td><td>{t("pk." + p.packageId)}</td><td>{t("pay." + p.method)}</td><td className="whitespace-nowrap">{fmtMnt(p.amount)}</td>
            <td><Badge tone={p.status === "paid_simulated" ? "ok" : p.status === "pending" ? "warn" : "bad"}>{t("pay.status." + p.status)}</Badge></td>
            <td className="text-right whitespace-nowrap">{p.status === "pending" && <><button className="btn btn-xs btn-primary mr-1" onClick={() => st.confirmPayment(p.id)} data-testid="confirm-pay">{t("common.confirm")}</button><button className="btn btn-xs btn-ghost" onClick={() => st.rejectPayment(p.id)}>{t("common.reject")}</button></>}</td></tr>))}</tbody></table></div>
    </>
  );
}
export default function AdminPayments() { return <Guard perm="payments.manage"><Inner /></Guard>; }
