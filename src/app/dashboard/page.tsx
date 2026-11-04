"use client";
import Link from "next/link";
import { Car, Eye, MessageSquare, CalendarCheck, Plus, Clock, CheckCircle2, Users, Building2, Wallet, ClipboardCheck } from "lucide-react";
import { useStore } from "@/lib/store";
import { useBrandName, useScope, useT, useUser, usePrice } from "@/lib/hooks";
import { Badge, PageHead, Stat, Empty } from "@/components/ui";
import { BarChart, HBars } from "@/components/Charts";
import { fmtDate, fmtMnt } from "@/lib/format";
import { isPublic } from "@/lib/search";
import { isAdmin } from "@/lib/perms";


function AdminHome() {
  const { t, lang } = useT();
  const s = useStore();
  const st = {
    total: s.vehicles.length, active: s.vehicles.filter((v) => isPublic(v)).length, pending: s.vehicles.filter((v) => v.status === "pending").length, sold: s.vehicles.filter((v) => v.status === "sold").length,
    users: s.users.length, sellers: s.users.filter((u) => u.role === "seller").length, dealers: s.dealers.length, inquiries: s.leads.length, appointments: s.appointments.length,
  };
  const ms = new Date(); ms.setDate(1); ms.setHours(0, 0, 0, 0);
  const revenue = s.payments.filter((p) => p.status === "paid_simulated" && new Date(p.at) >= ms).reduce((a, p) => a + p.amount, 0);
  const pending = s.vehicles.filter((v) => v.status === "pending");
  const brandName = useBrandName();
  return (
    <>
      <PageHead title={t("dash.a.title")} sub={t("dash.a.sub")} actions={<Link href="/dashboard/analytics" className="btn btn-sm btn-outline">{t("dash.analytics")}</Link>} />
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3" data-testid="admin-stats">
        <Stat label={t("adm.total")} value={st.total} icon={<Car size={18} />} />
        <Stat label={t("adm.active")} value={st.active} />
        <Stat label={t("adm.pending")} value={<span data-testid="stat-pending">{st.pending}</span>} sub={<Link href="/dashboard/admin/listings" className="underline">{t("adm.review")}</Link>} icon={<Clock size={18} />} />
        <Stat label={t("adm.sold")} value={<span data-testid="stat-sold">{st.sold}</span>} icon={<CheckCircle2 size={18} />} />
        <Stat label={t("adm.users")} value={st.users} icon={<Users size={18} />} />
        <Stat label={t("adm.sellers")} value={st.sellers} />
        <Stat label={t("adm.dealers")} value={st.dealers} icon={<Building2 size={18} />} />
        <Stat label={t("adm.inquiries")} value={st.inquiries} icon={<MessageSquare size={18} />} />
        <Stat label={t("adm.appts")} value={st.appointments} icon={<CalendarCheck size={18} />} />
        <Stat label={t("adm.revenue")} value={<span className="text-xl sm:text-2xl">{fmtMnt(revenue)}</span>} sub={t("pay.simulated")} icon={<Wallet size={18} />} />
      </div>
      <div className="card p-5 mt-6">
        <h2 className="font-bold mb-3">{t("adm.pendingqueue")} ({pending.length})</h2>
        {pending.length === 0 ? <p className="text-sm text-steel-500">{t("adm.nopending")}</p> : (
          <ul className="divide-y divide-ink-900/[.06]">{pending.slice(0, 5).map((v) => <li key={v.id} className="py-3 flex items-center justify-between gap-3"><span className="text-sm font-semibold">{brandName(v.brandId)} {v.modelName} {v.year} <span className="text-steel-500 font-normal">· {fmtDate(v.createdAt, lang)}</span></span><Link href="/dashboard/admin/listings" className="btn btn-xs btn-outline">{t("adm.review")}</Link></li>)}</ul>
        )}
      </div>
    </>
  );
}

function InspectorHome() {
  const { t, lang } = useT();
  const { appts } = useScope();
  const user = useUser()!;
  const reports = useStore((s) => s.reports).filter((r) => r.inspectorId === user.id);
  const upcoming = appts.filter((a) => ["scheduled", "requested"].includes(a.status)).sort((a, b) => +new Date(a.at) - +new Date(b.at));
  return (
    <>
      <PageHead title={t("dash.i.title")} sub={t("dash.i.sub")} actions={<Link href="/dashboard/inspections" className="btn btn-sm btn-primary">{t("dash.inspections")}</Link>} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label={t("insp.upcoming")} value={upcoming.length} icon={<CalendarCheck size={18} />} /><Stat label={t("insp.unassigned")} value={appts.filter((a) => !a.inspectorId && a.status !== "cancelled").length} />
        <Stat label={t("insp.completed")} value={appts.filter((a) => a.status === "completed" && a.inspectorId === user.id).length} icon={<ClipboardCheck size={18} />} /><Stat label={t("insp.reports")} value={reports.length} />
      </div>
      <div className="card p-5 mt-6"><h2 className="font-bold mb-3">{t("insp.upcoming")}</h2>
        {upcoming.length === 0 ? <p className="text-sm text-steel-500">{t("insp.none")}</p> : <ul className="divide-y divide-ink-900/[.06]">{upcoming.slice(0, 6).map((a) => <li key={a.id} className="py-3 text-sm flex justify-between"><span className="font-semibold">{fmtDate(a.at, lang, true)}</span><span className="text-steel-500">{a.place}</span></li>)}</ul>}</div>
    </>
  );
}

function SalesHome() {
  const { t, lang } = useT();
  const user = useUser()!;
  const { vehicles, leads, appts } = useScope();
  const brandName = useBrandName();
  const price = usePrice();
  const views = Array.from({ length: 14 }, (_, i) => ({ label: String(i + 1), value: vehicles.reduce((a, v) => a + (v.viewsDaily[v.viewsDaily.length - 14 + i] ?? 0), 0) }));
  const newLeads = leads.filter((l) => l.status === "new");
  const active = vehicles.filter((v) => v.status === "active").length;
  const sold = vehicles.filter((v) => v.status === "sold");
  return (
    <>
      <PageHead title={t("dash.s.hello", { name: user.name })} sub={t("dash.s.sub")} actions={<Link href="/dashboard/listings/new" className="btn btn-sm btn-primary" data-testid="new-listing"><Plus size={15} />{t("lst.new")}</Link>} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label={t("adm.active")} value={active} icon={<Car size={18} />} /><Stat label={t("adm.pending")} value={vehicles.filter((v) => v.status === "pending").length} icon={<Clock size={18} />} />
        <Stat label={t("lead.new")} value={<span data-testid="stat-newleads">{newLeads.length}</span>} icon={<MessageSquare size={18} />} sub={<Link href="/dashboard/leads" className="underline">{t("dash.crm")}</Link>} />
        <Stat label={t("adm.sold")} value={sold.length} icon={<CheckCircle2 size={18} />} />
        <Stat label={t("perf.views")} value={vehicles.reduce((a, v) => a + v.views, 0).toLocaleString("en-US")} icon={<Eye size={18} />} />
        <Stat label={t("perf.favs")} value={Object.values(useStore.getState().favorites).flat().filter((id) => vehicles.some((v) => v.id === id)).length} />
        <Stat label={t("adm.appts")} value={appts.filter((a) => a.status === "scheduled").length} icon={<CalendarCheck size={18} />} />
        <Stat label={t("perf.revenue")} value={<span className="text-xl sm:text-2xl">{fmtMnt(sold.reduce((a, v) => a + (v.soldPrice ?? 0), 0))}</span>} />
      </div>
      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <div className="card p-5"><h2 className="font-bold mb-4">{t("perf.views14")}</h2><BarChart data={views} /></div>
        <div className="card p-5"><h2 className="font-bold mb-4">{t("perf.top")}</h2>
          {vehicles.length ? <HBars data={[...vehicles].sort((a, b) => b.views - a.views).slice(0, 5).map((v) => ({ label: `${brandName(v.brandId)} ${v.modelName} ${v.year}`, value: v.views }))} /> : <Empty title={t("lst.empty")} />}</div>
      </div>
      <div className="card p-5 mt-6"><div className="flex justify-between items-center mb-3"><h2 className="font-bold">{t("dash.recentleads")}</h2><Link href="/dashboard/leads" className="text-sm font-semibold underline">{t("home.viewall")}</Link></div>
        {leads.length === 0 ? <p className="text-sm text-steel-500">{t("crm.empty")}</p> : <ul className="divide-y divide-ink-900/[.06]">{[...leads].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 5).map((l) => { const v = vehicles.find((x) => x.id === l.vehicleId); return <li key={l.id} className="py-3 flex items-center justify-between gap-3 text-sm"><span><b>{l.name}</b> · {v ? `${brandName(v.brandId)} ${v.modelName}` : ""}</span><span className="flex items-center gap-3"><Badge tone="blue">{t("lead." + l.status)}</Badge><span className="text-xs text-steel-500">{fmtDate(l.createdAt, lang)}</span></span></li>; })}</ul>}</div>
      <p className="sr-only">{price(0).main}</p>
    </>
  );
}

export default function DashHome() {
  const user = useUser()!;
  if (isAdmin(user.role)) return <AdminHome />;
  if (user.role === "inspector") return <InspectorHome />;
  return <SalesHome />;
}
