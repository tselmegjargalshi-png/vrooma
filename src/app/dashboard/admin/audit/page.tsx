"use client";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/hooks";
import { PageHead } from "@/components/ui";
import { Guard } from "@/components/Guard";
import { fmtDate } from "@/lib/format";

function Inner() {
  const { t, lang } = useT();
  const audits = useStore((s) => s.audits);
  return (
    <>
      <PageHead title={t("dash.a.audit")} sub={t("adm.audit.sub")} />
      <div className="card overflow-x-auto"><table className="tbl min-w-[640px]" data-testid="audit-table"><thead><tr><th>{t("common.date")}</th><th>{t("adm.actor")}</th><th>{t("adm.action")}</th><th>{t("adm.entity")}</th></tr></thead>
        <tbody>{audits.slice(0, 150).map((a) => <tr key={a.id}><td className="whitespace-nowrap text-xs">{fmtDate(a.at, lang, true)}</td><td>{a.actor}</td><td><code className="text-xs bg-ink-900/5 px-1.5 py-0.5 rounded">{a.action}</code></td><td className="text-xs text-steel-600">{a.entity} {a.entityId}{a.detail ? ` · ${a.detail}` : ""}</td></tr>)}</tbody></table></div>
    </>
  );
}
export default function AdminAudit() { return <Guard perm="audit.view"><Inner /></Guard>; }
