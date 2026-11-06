"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Phone, CalendarPlus, MessageSquare, Plus, Check } from "lucide-react";
import { useStore } from "@/lib/store";
import { useBrandName, useScope, useT, useUser, usePrice } from "@/lib/hooks";
import { Badge, Empty, Field, Modal, PageHead, Tabs } from "@/components/ui";
import { Guard } from "@/components/Guard";
import { ago, fmtDate, fmtMnt, fmtPhoneFull, telHref, toLocalInput } from "@/lib/format";
import { LEAD_STATUSES, type Lead, type LeadStatus } from "@/lib/types";

const TONE: Record<LeadStatus, string> = { new: "bg-brass-500", contacted: "bg-[#2C4A7A]", interested: "bg-[#5a6bb0]", inspection: "bg-[#7A5E36]", negotiation: "bg-warn", deposit: "bg-ok", sold: "bg-ink-900", lost: "bg-steel-400" };

function Inner() {
  const { t, lang } = useT();
  const user = useUser()!;
  const router = useRouter();
  const brandName = useBrandName();
  const price = usePrice();
  const { leads, vehicles } = useScope();
  const users = useStore((s) => s.users);
  const st = useStore();
  const [tab, setTab] = useState<"pipeline" | "list" | "customers" | "reminders">("pipeline");
  const [q, setQ] = useState(""), [src, setSrc] = useState(""), [asg, setAsg] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const team = users.filter((u) => (u.dealerId && u.dealerId === user.dealerId) || u.id === user.id);
  const canAssign = user.role === "dealer_owner" || user.role === "admin" || user.role === "super_admin";
  const vname = (id: string) => { const v = vehicles.find((x) => x.id === id) ?? st.vehicles.find((x) => x.id === id); return v ? `${brandName(v.brandId)} ${v.modelName} ${v.year}` : "?"; };
  const filtered = useMemo(() => leads.filter((l) => (!src || l.source === src) && (!asg || l.assignedTo === asg) && (!q || `${l.name} ${l.phone} ${l.message}`.toLowerCase().includes(q.toLowerCase()))).sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)), [leads, q, src, asg]);
  const lead = st.leads.find((l) => l.id === openId) ?? null;

  const customers = useMemo(() => {
    const m = new Map<string, { name: string; phone: string; email?: string; leads: Lead[] }>();
    leads.forEach((l) => { const k = l.phone; const e = m.get(k) ?? { name: l.name, phone: l.phone, email: l.email, leads: [] }; e.leads.push(l); m.set(k, e); });
    return [...m.values()].sort((a, b) => b.leads.length - a.leads.length);
  }, [leads]);
  const reminders = leads.flatMap((l) => l.reminders.map((r) => ({ ...r, lead: l }))).sort((a, b) => +new Date(a.at) - +new Date(b.at));
  const money = (n?: number) => (n ? price(n, true).main : "–");

  return (
    <>
      <PageHead title={t("dash.crm")} sub={t("crm.sub")} />
      <div className="flex flex-wrap gap-3 items-center justify-between mb-4">
        <Tabs value={tab} onChange={setTab} tabs={[{ id: "pipeline", label: t("crm.pipeline"), count: leads.length }, { id: "list", label: t("crm.list") }, { id: "customers", label: t("crm.customers"), count: customers.length }, { id: "reminders", label: t("crm.reminders"), count: reminders.filter((r) => !r.done).length }]} />
        <div className="flex gap-2 flex-wrap">
          <input className="input !h-9 !w-44" placeholder={t("common.search")} aria-label={t("common.search")} value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="input !h-9 !w-36" aria-label={t("crm.source")} value={src} onChange={(e) => setSrc(e.target.value)}><option value="">{t("crm.source")}</option>{["website", "phone", "map", "dealer_page", "referral", "social"].map((s) => <option key={s} value={s}>{t("src." + s)}</option>)}</select>
          {team.length > 1 && <select className="input !h-9 !w-40" aria-label={t("crm.assignee")} value={asg} onChange={(e) => setAsg(e.target.value)}><option value="">{t("crm.assignee")}</option>{team.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select>}
        </div>
      </div>

      {leads.length === 0 && <div className="card"><Empty title={t("crm.empty")} body={t("crm.empty.body")} /></div>}

      {leads.length > 0 && tab === "pipeline" && (
        <div className="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1" data-testid="pipeline">
          {LEAD_STATUSES.map((s) => {
            const col = filtered.filter((l) => l.status === s);
            return (
              <div key={s} className="w-[270px] shrink-0 bg-ink-900/[.04] rounded-2xl p-2.5" data-status={s}>
                <div className="flex items-center gap-2 px-1.5 py-1.5 mb-1"><span className={`h-2.5 w-2.5 rounded-full ${TONE[s]}`} /><span className="text-xs font-bold uppercase tracking-wide">{t("lead." + s)}</span><span className="ml-auto text-xs text-steel-500">{col.length}</span></div>
                <div className="space-y-2 min-h-[60px]">
                  {col.map((l) => (
                    <button key={l.id} onClick={() => setOpenId(l.id)} className="w-full text-left card p-3 hover:shadow-lift transition-shadow" data-testid="lead-card" data-id={l.id}>
                      <div className="flex justify-between gap-2"><span className="font-bold text-sm truncate">{l.name}</span><span className="text-[10px] text-steel-500 shrink-0">{ago(l.updatedAt, lang)}</span></div>
                      <div className="text-xs text-brass-700 font-semibold truncate mt-0.5">{vname(l.vehicleId)}</div>
                      <div className="text-xs text-steel-600 line-clamp-2 mt-1">{l.message}</div>
                      <div className="flex items-center gap-1.5 mt-2"><Badge tone="gray">{t("src." + l.source)}</Badge>{l.offer && <Badge tone="brass">{money(l.offer)}</Badge>}{l.reminders.some((r) => !r.done) && <span title={t("crm.reminders")} className="h-2 w-2 rounded-full bg-bad" />}</div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {leads.length > 0 && tab === "list" && (
        <div className="card overflow-x-auto"><table className="tbl min-w-[800px]" data-testid="lead-table"><thead><tr><th>{t("common.name")}</th><th>{t("nav.cars")}</th><th>{t("crm.source")}</th><th>{t("crm.assignee")}</th><th>{t("common.status")}</th><th>{t("common.date")}</th></tr></thead>
          <tbody>{filtered.map((l) => <tr key={l.id} className="cursor-pointer hover:bg-bone-100" onClick={() => setOpenId(l.id)}><td className="font-semibold">{l.name}<div className="text-xs text-steel-500 font-normal">{fmtPhoneFull(l.phone)}</div></td><td>{vname(l.vehicleId)}</td><td>{t("src." + l.source)}</td><td>{users.find((u) => u.id === l.assignedTo)?.name ?? "–"}</td><td><Badge tone="blue">{t("lead." + l.status)}</Badge></td><td className="whitespace-nowrap">{fmtDate(l.createdAt, lang)}</td></tr>)}</tbody></table></div>
      )}

      {leads.length > 0 && tab === "customers" && (
        <div className="card overflow-x-auto"><table className="tbl min-w-[640px]" data-testid="customer-table"><thead><tr><th>{t("common.name")}</th><th>{t("common.phone")}</th><th>{t("crm.inqcount")}</th><th>{t("crm.lastcontact")}</th><th>{t("crm.history")}</th></tr></thead>
          <tbody>{customers.map((c) => <tr key={c.phone}><td className="font-semibold">{c.name}</td><td><a href={telHref(c.phone)} className="hover:underline">{fmtPhoneFull(c.phone)}</a></td><td>{c.leads.length}</td><td>{fmtDate(c.leads.map((l) => l.updatedAt).sort().at(-1)!, lang)}</td><td className="text-xs text-steel-600">{c.leads.map((l) => t("lead." + l.status)).join(", ")}</td></tr>)}</tbody></table></div>
      )}

      {leads.length > 0 && tab === "reminders" && (
        <div className="card divide-y divide-ink-900/[.06]" data-testid="reminders">
          {reminders.length === 0 ? <Empty title={t("crm.reminders.empty")} /> : reminders.map((r) => (
            <div key={r.id} className="p-4 flex items-center gap-3"><button onClick={() => st.toggleReminder(r.lead.id, r.id)} aria-label={t("crm.done")} className={`h-6 w-6 rounded-full border-2 grid place-items-center ${r.done ? "bg-ok border-ok text-white" : "border-ink-900/25"}`}>{r.done && <Check size={13} />}</button>
              <div className="flex-1 min-w-0"><div className={`text-sm font-semibold ${r.done ? "line-through text-steel-400" : ""}`}>{r.text}</div><button className="text-xs text-brass-700 hover:underline" onClick={() => setOpenId(r.lead.id)}>{r.lead.name} · {vname(r.lead.vehicleId)}</button></div>
              <span className={`text-xs ${!r.done && new Date(r.at) < new Date() ? "text-bad font-semibold" : "text-steel-500"}`}>{fmtDate(r.at, lang, true)}</span></div>
          ))}
        </div>
      )}

      <LeadModal lead={lead} onClose={() => setOpenId(null)} team={team} canAssign={canAssign} vname={vname} onMessage={(l) => { if (l.customerId) { const tid = st.openThread(l.vehicleId, l.customerId); router.push("/messages?thread=" + tid); } }} />
      <span className="sr-only">{fmtMnt(0)}</span>
    </>
  );
}

function LeadModal({ lead, onClose, team, canAssign, vname, onMessage }: { lead: Lead | null; onClose: () => void; team: { id: string; name: string }[]; canAssign: boolean; vname: (id: string) => string; onMessage: (l: Lead) => void }) {
  const { t, lang } = useT();
  const st = useStore();
  const users = st.users;
  const [note, setNote] = useState(""), [rText, setRText] = useState(""), [rAt, setRAt] = useState(toLocalInput(new Date(Date.now() + 86400000).toISOString()));
  const [apAt, setApAt] = useState(toLocalInput(new Date(Date.now() + 2 * 86400000).toISOString().replace(/T\d\d/, "T11"))), [apPlace, setApPlace] = useState("");
  const [sched, setSched] = useState(false);
  const inspectors = users.filter((u) => u.role === "inspector");
  const [insp, setInsp] = useState("");
  if (!lead) return <Modal open={false} onClose={onClose} title="" children={null} />;
  const appts = st.appointments.filter((a) => a.leadId === lead.id);
  const place1 = t("appt.place1");
  return (
    <Modal open onClose={onClose} title={lead.name} wide>
      <div className="grid md:grid-cols-2 gap-6" data-testid="lead-modal">
        <div className="space-y-4">
          <div className="text-sm"><a href={telHref(lead.phone)} className="inline-flex items-center gap-1.5 font-semibold hover:underline"><Phone size={14} />{fmtPhoneFull(lead.phone)}</a>{lead.email && <div className="text-steel-500 mt-1">{lead.email}</div>}
            <div className="mt-2"><Link href={`/cars/view?id=${lead.vehicleId}`} className="font-semibold text-brass-700 hover:underline">{vname(lead.vehicleId)}</Link></div>
            <p className="mt-2 bg-bone-100 rounded-xl p-3 text-steel-700">{lead.message}</p>
            <div className="text-xs text-steel-500 mt-2">{t("crm.source")}: {t("src." + lead.source)} · {fmtDate(lead.createdAt, lang, true)}</div></div>
          <Field label={t("common.status")}><select className="input" name="status" value={lead.status} onChange={(e) => st.setLeadStatus(lead.id, e.target.value as LeadStatus)} data-testid="lead-status">{LEAD_STATUSES.map((s) => <option key={s} value={s}>{t("lead." + s)}</option>)}</select></Field>
          {canAssign && team.length > 1 && <Field label={t("crm.assignee")}><select className="input" name="assignee" value={lead.assignedTo ?? ""} onChange={(e) => st.assignLead(lead.id, e.target.value)} data-testid="lead-assign">{team.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></Field>}
          <div className="grid grid-cols-2 gap-3">
            <Field label={`${t("crm.offer")} (₮)`}><input type="number" min={0} className="input" name="offer" defaultValue={lead.offer ?? ""} onBlur={(e) => st.updateLead(lead.id, { offer: Number(e.target.value) || undefined })} /></Field>
            <Field label={`${t("crm.deposit")} (₮)`}><input type="number" min={0} className="input" name="deposit" defaultValue={lead.deposit ?? ""} onBlur={(e) => st.updateLead(lead.id, { deposit: Number(e.target.value) || undefined })} /></Field>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button className="btn btn-sm btn-outline" onClick={() => setSched(!sched)} data-testid="lead-schedule"><CalendarPlus size={15} />{t("crm.scheduleinsp")}</button>
            {lead.customerId && <button className="btn btn-sm btn-outline" onClick={() => onMessage(lead)}><MessageSquare size={15} />{t("crm.message")}</button>}
          </div>
          {sched && (
            <form className="rounded-2xl bg-bone-100 p-4 space-y-3" onSubmit={(e) => { e.preventDefault(); const d = new Date(apAt); if (isNaN(+d)) return; st.requestAppointment({ vehicleId: lead.vehicleId, leadId: lead.id, at: d.toISOString(), place: apPlace || place1, inspectorId: insp || undefined, scheduled: true }); st.flash(t("appt.scheduled")); setSched(false); }}>
              <Field label={t("common.date")}><input type="datetime-local" className="input" name="apAt" value={apAt} onChange={(e) => setApAt(e.target.value)} data-testid="appt-at" /></Field>
              <Field label={t("appt.place")}><select className="input" name="apPlace" value={apPlace || place1} onChange={(e) => setApPlace(e.target.value)}>{["place1", "place2", "place3"].map((p) => <option key={p} value={t("appt." + p)}>{t("appt." + p)}</option>)}</select></Field>
              <Field label={t("insp.inspector")}><select className="input" name="insp" value={insp} onChange={(e) => setInsp(e.target.value)}><option value="">{t("insp.anyinspector")}</option>{inspectors.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></Field>
              <button className="btn btn-primary w-full" data-testid="appt-save">{t("appt.schedule")}</button>
            </form>
          )}
          {appts.length > 0 && <ul className="text-sm space-y-1">{appts.map((a) => <li key={a.id} className="flex justify-between"><span>{fmtDate(a.at, lang, true)}</span><Badge tone="warn">{t("appt.status." + a.status)}</Badge></li>)}</ul>}
        </div>
        <div className="space-y-4">
          <div><h3 className="text-sm font-bold mb-2">{t("common.notes")}</h3>
            <ul className="space-y-2 max-h-40 overflow-y-auto">{lead.notes.map((n) => <li key={n.id} className="text-sm bg-bone-100 rounded-xl p-2.5"><div>{n.text}</div><div className="text-[10px] text-steel-500 mt-1">{users.find((u) => u.id === n.by)?.name ?? ""} · {fmtDate(n.at, lang, true)}</div></li>)}{lead.notes.length === 0 && <li className="text-xs text-steel-500">{t("crm.nonotes")}</li>}</ul>
            <form className="flex gap-2 mt-2" onSubmit={(e) => { e.preventDefault(); if (note.trim()) { st.addNote(lead.id, note.trim()); setNote(""); } }}><input className="input !h-10" name="note" aria-label={t("common.notes")} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("crm.addnote")} data-testid="note-input" /><button className="btn btn-sm btn-primary" data-testid="note-add"><Plus size={15} /></button></form></div>
          <div><h3 className="text-sm font-bold mb-2">{t("crm.reminders")}</h3>
            <ul className="space-y-1.5">{lead.reminders.map((r) => <li key={r.id} className="flex items-center gap-2 text-sm"><button onClick={() => st.toggleReminder(lead.id, r.id)} aria-label={t("crm.done")} className={`h-5 w-5 rounded-full border-2 grid place-items-center shrink-0 ${r.done ? "bg-ok border-ok text-white" : "border-ink-900/25"}`}>{r.done && <Check size={11} />}</button><span className={r.done ? "line-through text-steel-400" : ""}>{r.text}</span><span className="ml-auto text-xs text-steel-500">{fmtDate(r.at, lang, true)}</span></li>)}</ul>
            <form className="grid grid-cols-[1fr_auto] gap-2 mt-2" onSubmit={(e) => { e.preventDefault(); if (rText.trim()) { st.addReminder(lead.id, new Date(rAt).toISOString(), rText.trim()); setRText(""); } }}>
              <input className="input !h-10" name="rtext" aria-label={t("crm.reminder")} value={rText} onChange={(e) => setRText(e.target.value)} placeholder={t("crm.reminder")} /><button className="btn btn-sm btn-outline"><Plus size={15} /></button>
              <input type="datetime-local" className="input !h-10 col-span-2" name="rat" aria-label={t("common.date")} value={rAt} onChange={(e) => setRAt(e.target.value)} /></form></div>
          <div><h3 className="text-sm font-bold mb-2">{t("crm.history")}</h3>
            <ol className="text-xs text-steel-600 space-y-1 max-h-32 overflow-y-auto">{[...lead.history].reverse().map((h, i) => <li key={i}><span className="text-steel-400">{fmtDate(h.at, lang, true)}</span> · {h.text === "created" ? t("crm.h.created") : h.text === "note" ? t("crm.h.note") : h.text.startsWith("status:") ? `${t("common.status")}: ${t("lead." + h.text.slice(7))}` : h.text.startsWith("assigned:") ? `${t("crm.assignee")}: ${users.find((u) => u.id === h.text.slice(9))?.name ?? ""}` : h.text}</li>)}</ol></div>
        </div>
      </div>
    </Modal>
  );
}
export default function LeadsPage() { return <Guard perm="crm.use"><Inner /></Guard>; }
