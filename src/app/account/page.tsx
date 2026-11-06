"use client";
import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Trash2, Bell, BellOff } from "lucide-react";
import { useStore } from "@/lib/store";
import { useBrandName, useT, useUser } from "@/lib/hooks";
import { Guard } from "@/components/Guard";
import { Badge, Empty, PageHead, Tabs } from "@/components/ui";
import { VehicleCard } from "@/components/VehicleCard";
import { ProfileForm } from "@/components/ProfileForm";
import { fmtDate } from "@/lib/format";
import { isPublic } from "@/lib/search";
import { redirectHome } from "@/components/redirect";

type Tab = "favorites" | "searches" | "recent" | "inquiries" | "appointments" | "messages" | "profile";
function Inner() {
  const { t, lang } = useT();
  const user = useUser()!;
  const router = useRouter();
  const sp = useSearchParams();
  const brandName = useBrandName();
  const tab = (sp.get("tab") as Tab) || "favorites";
  const s = useStore();
  redirectHome(user.role, router, "customer");
  const favs = (s.favorites[user.id] ?? []).map((id) => s.vehicles.find((v) => v.id === id)).filter(Boolean) as typeof s.vehicles;
  const recent = (s.recent[user.id] ?? []).map((id) => s.vehicles.find((v) => v.id === id)).filter((v) => v && isPublic(v)) as typeof s.vehicles;
  const searches = s.savedSearches.filter((x) => x.userId === user.id);
  const leads = s.leads.filter((l) => l.customerId === user.id);
  const appts = s.appointments.filter((a) => a.customerId === user.id || a.requestedBy === user.id);
  const threads = s.threads.filter((th) => th.participants.includes(user.id));
  const vname = (id: string) => { const v = s.vehicles.find((x) => x.id === id); return v ? `${brandName(v.brandId)} ${v.modelName} ${v.year}` : "?"; };
  const go = (x: Tab) => router.replace("/account?tab=" + x);
  return (
    <div className="container py-8">
      <PageHead title={t("acc.hello", { name: user.name })} sub={t("acc.sub")} />
      <Tabs<Tab> value={tab} onChange={go} tabs={[
        { id: "favorites", label: t("acc.favorites"), count: favs.length }, { id: "searches", label: t("acc.searches"), count: searches.length }, { id: "recent", label: t("acc.recent"), count: recent.length },
        { id: "inquiries", label: t("acc.inquiries"), count: leads.length }, { id: "appointments", label: t("acc.appointments"), count: appts.length }, { id: "messages", label: t("dash.messages"), count: threads.length }, { id: "profile", label: t("dash.profile") }]} />
      <div className="mt-6">
        {tab === "favorites" && (favs.length ? <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5" data-testid="favorites">{favs.map((v) => <VehicleCard key={v.id} v={v} />)}</div> : <div className="card"><Empty title={t("acc.favorites.empty")} action={<Link href="/cars" className="btn btn-primary">{t("nav.cars")}</Link>} /></div>)}
        {tab === "recent" && (recent.length ? <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">{recent.map((v) => <VehicleCard key={v.id} v={v} />)}</div> : <div className="card"><Empty title={t("acc.recent.empty")} /></div>)}
        {tab === "searches" && (searches.length ? (
          <div className="card divide-y divide-ink-900/[.06]" data-testid="saved-searches">{searches.map((x) => (
            <div key={x.id} className="p-4 flex items-center gap-3 flex-wrap"><div className="min-w-0 flex-1"><div className="font-bold">{x.name}</div><div className="text-xs text-steel-500">{fmtDate(x.createdAt, lang)}</div></div>
              <Link href={`/cars?${x.query}`} className="btn btn-sm btn-outline">{t("acc.runsearch")}</Link>
              <button onClick={() => s.toggleSearchNotify(x.id)} aria-pressed={x.notify} className="btn btn-sm btn-ghost">{x.notify ? <Bell size={15} /> : <BellOff size={15} />}{x.notify ? t("acc.notifyon") : t("acc.notifyoff")}</button>
              <button onClick={() => s.removeSearch(x.id)} aria-label={t("common.delete")} className="h-9 w-9 grid place-items-center rounded-full hover:bg-ink-900/5"><Trash2 size={15} /></button></div>))}</div>
        ) : <div className="card"><Empty title={t("acc.searches.empty")} body={t("acc.searches.empty.body")} action={<Link href="/cars" className="btn btn-primary">{t("nav.cars")}</Link>} /></div>)}
        {tab === "inquiries" && (leads.length ? (
          <div className="card overflow-x-auto"><table className="tbl" data-testid="my-inquiries"><thead><tr><th>{t("nav.cars")}</th><th>{t("common.message")}</th><th>{t("common.date")}</th><th>{t("common.status")}</th></tr></thead>
            <tbody>{leads.map((l) => <tr key={l.id}><td><Link href={`/cars/view?id=${l.vehicleId}`} className="font-semibold hover:underline">{vname(l.vehicleId)}</Link></td><td className="max-w-xs truncate text-steel-600">{l.message}</td><td>{fmtDate(l.createdAt, lang)}</td><td><Badge tone="blue">{t("lead." + l.status)}</Badge></td></tr>)}</tbody></table></div>
        ) : <div className="card"><Empty title={t("acc.inquiries.empty")} /></div>)}
        {tab === "appointments" && (appts.length ? (
          <div className="card overflow-x-auto"><table className="tbl" data-testid="my-appointments"><thead><tr><th>{t("nav.cars")}</th><th>{t("common.date")}</th><th>{t("appt.place")}</th><th>{t("common.status")}</th><th /></tr></thead>
            <tbody>{appts.map((a) => { const rep = a.reportId; return <tr key={a.id}><td><Link href={`/cars/view?id=${a.vehicleId}`} className="font-semibold hover:underline">{vname(a.vehicleId)}</Link></td><td>{fmtDate(a.at, lang, true)}</td><td>{a.place}</td><td><Badge tone={a.status === "completed" ? "ok" : a.status === "cancelled" ? "bad" : "warn"}>{t("appt.status." + a.status)}</Badge></td>
              <td className="text-right whitespace-nowrap">{rep && <Link href={`/reports/view?id=${rep}`} className="btn btn-xs btn-outline mr-2">{t("insp.openreport")}</Link>}{["requested", "scheduled"].includes(a.status) && <button className="btn btn-xs btn-ghost" onClick={() => s.updateAppointment(a.id, { status: "cancelled" })}>{t("common.cancel")}</button>}</td></tr>; })}</tbody></table></div>
        ) : <div className="card"><Empty title={t("acc.appts.empty")} /></div>)}
        {tab === "messages" && <div className="card p-8 text-center"><p className="text-steel-600">{t("acc.messages.body", { n: threads.length })}</p><Link href="/messages" className="btn btn-primary mt-4">{t("dash.messages")}</Link></div>}
        {tab === "profile" && <ProfileForm />}
      </div>
    </div>
  );
}
export default function AccountPage() { return <Guard><Suspense><Inner /></Suspense></Guard>; }
