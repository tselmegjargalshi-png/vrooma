"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Printer } from "lucide-react";
import { useStore } from "@/lib/store";
import { useBrandName, useT, photoSrc } from "@/lib/hooks";
import { Empty, Badge } from "@/components/ui";
import { fmtDate, fmtNum } from "@/lib/format";
import { CHECKS } from "@/lib/types";
import { Logo } from "@/components/Logo";

function ReportPageInner({ id }: { id: string }) {
  const { t, lang } = useT();
  const brandName = useBrandName();
  const r = useStore((s) => s.reports).find((x) => x.id === id);
  const users = useStore((s) => s.users), vehicles = useStore((s) => s.vehicles), sessionId = useStore((s) => s.sessionId);
  const me = users.find((u) => u.id === sessionId);
  if (!r || (r.status !== "published" && !(me && (me.role === "inspector" || me.role === "admin" || me.role === "super_admin")))) return <div className="container py-16"><Empty title={t("err.notfound")} action={<Link href="/" className="btn btn-primary">{t("nav.home")}</Link>} /></div>;
  const v = vehicles.find((x) => x.id === r.vehicleId);
  const insp = users.find((u) => u.id === r.inspectorId);
  const avg = CHECKS.reduce((a, k) => a + r.checks[k].score, 0) / CHECKS.length;
  return (
    <div className="container max-w-4xl py-8">
      <div className="flex justify-between items-center mb-5 no-print">
        <Link href={v ? `/cars/view?id=${v.id}` : "/"} className="text-sm font-semibold text-steel-500 hover:text-ink-900">← {t("common.back")}</Link>
        <button onClick={() => window.print()} className="btn btn-sm btn-primary" data-testid="print-report"><Printer size={15} />{t("insp.pdf")}</button>
      </div>
      <article className="card p-6 sm:p-10" data-testid="report">
        <div className="flex justify-between items-start gap-4 border-b border-ink-900/10 pb-6">
          <div><Logo /><h1 className="text-2xl font-extrabold mt-5">{t("insp.reporttitle")}</h1><p className="text-sm text-steel-500 mt-1">{v ? `${brandName(v.brandId)} ${v.modelName} ${v.year}` : ""} · {t("insp.date")}: {fmtDate(r.date, lang)}</p></div>
          <div className="text-right"><Badge tone={r.status === "published" ? "ok" : "warn"}>{r.status === "published" ? t("insp.published") : t("insp.draft")}</Badge><div className="font-display text-4xl font-extrabold mt-3">{avg.toFixed(1)}<span className="text-lg text-steel-400">/5</span></div></div>
        </div>
        {v && <div className="grid sm:grid-cols-[220px_1fr] gap-6 mt-6">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={photoSrc(v, 0)} alt="" className="rounded-2xl w-full" />
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm content-start">
            <div><dt className="text-steel-500 text-xs">{t("insp.inspector")}</dt><dd className="font-semibold">{insp?.name}</dd></div>
            <div><dt className="text-steel-500 text-xs">{t("insp.odometer")}</dt><dd className="font-semibold">{fmtNum(r.odometer)} {t("common.km")}</dd></div>
            <div><dt className="text-steel-500 text-xs">{t("veh.mileage")} ({t("veh.sellerdeclared")})</dt><dd className="font-semibold">{fmtNum(v.mileage)} {t("common.km")}</dd></div>
            <div><dt className="text-steel-500 text-xs">{t("veh.year")}</dt><dd className="font-semibold">{v.year}</dd></div></dl></div>}
        <h2 className="font-bold text-lg mt-8 mb-3">{t("insp.checks")}</h2>
        <table className="tbl"><tbody>{CHECKS.map((k) => <tr key={k}><td className="font-semibold w-48">{t("check." + k)}</td><td className="w-40"><span className="flex gap-0.5">{[1, 2, 3, 4, 5].map((n) => <span key={n} className={`h-2 w-6 rounded-full ${n <= r.checks[k].score ? "bg-ok" : "bg-ink-900/10"}`} />)}</span></td><td className="text-steel-600">{r.checks[k].note || "·"}</td></tr>)}</tbody></table>
        <div className="grid sm:grid-cols-2 gap-6 mt-8">
          <div><h3 className="font-bold mb-1">{t("veh.accident")}</h3><p className={`text-sm font-semibold ${r.accidentFound ? "text-warn" : "text-ok"}`}>{r.accidentFound ? t("insp.accfound") : t("insp.accnone")}</p>{r.accidentNote && <p className="text-sm text-steel-600 mt-1">{r.accidentNote}</p>}</div>
          <div><h3 className="font-bold mb-1">{t("insp.maintenance")}</h3><p className="text-sm text-steel-600">{r.maintenance || "·"}</p></div>
        </div>
        <div className="mt-6"><h3 className="font-bold mb-1">{t("insp.notes")}</h3><p className="text-sm text-steel-600 whitespace-pre-wrap">{r.notes || "·"}</p></div>
        {r.photos.length > 0 && <div className="mt-6"><h3 className="font-bold mb-2">{t("insp.photos")}</h3><div className="grid grid-cols-3 sm:grid-cols-4 gap-2">{/* eslint-disable-next-line @next/next/no-img-element */}{r.photos.map((p, i) => <img key={i} src={p} alt="" className="rounded-xl aspect-[4/3] object-cover w-full" />)}</div></div>}
        <p className="text-[11px] text-steel-500 mt-8 pt-4 border-t border-ink-900/10">{t("insp.disclaimer")}{r.demo ? ` ${t("insp.demo")}` : ""}</p>
      </article>
    </div>
  );
}

function ReportPageQuery() { const id = useSearchParams().get("id") ?? ""; return <ReportPageInner key={id} id={id} />; }
export default function ReportPage() { return <Suspense fallback={null}><ReportPageQuery /></Suspense>; }
