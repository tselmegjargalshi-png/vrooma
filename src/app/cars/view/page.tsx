"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Phone, MessageSquare, CalendarCheck, Share2, Flag, BadgeCheck, ShieldCheck, ShieldAlert, FileText, Check, MapPin } from "lucide-react";
import { useStore } from "@/lib/store";
import { useBrandName, usePrice, useT, useUser, photoSrc } from "@/lib/hooks";
import { Gallery } from "@/components/Gallery";
import { FavButton, CompareButton, VehicleCard, useSellerVerified } from "@/components/VehicleCard";
import { LoanCalculator } from "@/components/Calculator";
import { Badge, Empty, Field, Modal, statusTone } from "@/components/ui";
import { fmtDate, fmtNum, fmtPhoneFull, phoneValid, telHref, toLocalInput } from "@/lib/format";
import { provName, distName } from "@/lib/geo";
import { isPublic } from "@/lib/search";
import { CHECKS } from "@/lib/types";
import { can } from "@/lib/perms";

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return <div className="flex justify-between gap-4 py-2.5 border-b border-ink-900/[.06] text-sm"><dt className="text-steel-500">{k}</dt><dd className="font-semibold text-right">{v}</dd></div>;
}

function VehiclePageInner({ id }: { id: string }) {
  const { t, lang } = useT();
  const router = useRouter();
  const user = useUser();
  const brandName = useBrandName();
  const price = usePrice();
  const verifiedOf = useSellerVerified();
  const vehicles = useStore((s) => s.vehicles), users = useStore((s) => s.users), dealers = useStore((s) => s.dealers), reports = useStore((s) => s.reports);
  const v = vehicles.find((x) => x.id === id);
  const viewVehicle = useStore((s) => s.viewVehicle), phoneClick = useStore((s) => s.phoneClick), flash = useStore((s) => s.flash);
  const submitInquiry = useStore((s) => s.submitInquiry), requestAppointment = useStore((s) => s.requestAppointment), openThread = useStore((s) => s.openThread), reportListing = useStore((s) => s.reportListing);
  const [showPhone, setShowPhone] = useState(false);
  const [inq, setInq] = useState(false), [appt, setAppt] = useState(false), [rep, setRep] = useState(false), [sent, setSent] = useState(false);
  const viewed = useRef<string | null>(null);

  const visible = !!v && (isPublic(v) || v.sellerId === user?.id || (v.dealerId && user?.dealerId === v.dealerId) || can(user?.role, "listing.all") || user?.role === "inspector");
  useEffect(() => { if (v && visible && viewed.current !== v.id && isPublic(v)) { viewed.current = v.id; viewVehicle(v.id); } }, [v, visible, viewVehicle]);

  const similar = useMemo(() => (v ? vehicles.filter((x) => x.id !== v.id && isPublic(x) && (x.brandId === v.brandId || x.categoryId === v.categoryId) && Math.abs(x.price - v.price) < v.price * 0.5).sort((a, b) => Math.abs(a.price - v.price) - Math.abs(b.price - v.price)).slice(0, 4) : []), [vehicles, v]);

  if (!v || !visible) return <div className="container py-20"><Empty title={t("err.notfound")} body={v ? t("veh.unavailable") : t("err.notfound.body")} action={<Link href="/cars" className="btn btn-primary">{t("nav.cars")}</Link>} /></div>;

  const title = `${brandName(v.brandId)} ${v.modelName}`;
  const seller = users.find((u) => u.id === v.sellerId);
  const dealer = dealers.find((d) => d.id === v.dealerId);
  const report = reports.find((r) => r.id === v.reportId && r.status === "published");
  const p = price(v.price);
  const verified = verifiedOf(v);
  const contactPhone = dealer?.phone ?? seller?.phone ?? "";
  const loc = v.district ? `${distName(v.district, lang)}, ${provName(v.province, lang)}` : provName(v.province, lang);
  const maskedPlate = v.plate.replace(/^(\d{2})\d{2}/, "$1**");
  const desc = lang === "mn" ? v.descMn : v.descEn;
  const isOwner = v.sellerId === user?.id;

  const message = () => {
    if (!user) { flash(t("auth.needed"), "err"); router.push("/login?next=" + encodeURIComponent("/cars/view?id=" + v.id)); return; }
    if (isOwner) { flash(t("veh.ownlisting"), "err"); return; }
    const to = dealer ? (users.find((u) => u.role === "agent" && u.dealerId === dealer.id)?.id ?? dealer.ownerId) : v.sellerId;
    const tid = openThread(v.id, to);
    router.push("/messages?thread=" + tid);
  };
  const share = async () => {
    const url = location.href;
    try { if (navigator.share) await navigator.share({ title, url }); else { await navigator.clipboard.writeText(url); flash(t("common.copied")); } } catch { /* cancelled */ }
  };

  return (
    <div className="container py-6 sm:py-8">
      <nav className="text-xs text-steel-500 mb-4 flex gap-1.5 flex-wrap" aria-label="breadcrumb">
        <Link href="/" className="hover:text-ink-900">{t("nav.home")}</Link><span>/</span><Link href="/cars" className="hover:text-ink-900">{t("nav.cars")}</Link><span>/</span><Link href={`/cars?brand=${v.brandId}`} className="hover:text-ink-900">{brandName(v.brandId)}</Link><span>/</span><span className="text-ink-900 font-semibold">{v.modelName}</span>
      </nav>
      {v.status !== "active" && <div className="mb-4 rounded-2xl bg-warn/10 text-warn px-4 py-3 text-sm font-semibold flex items-center gap-2" data-testid="status-banner"><Badge tone={statusTone(v.status) as "ok"}>{t("vstatus." + v.status)}</Badge>{v.status === "rejected" && v.rejectReason ? t("reject." + v.rejectReason) : t("veh.notpublic")}</div>}
      <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">
        <div className="min-w-0 space-y-8">
          <Gallery v={v} title={title} />

          <section className="card p-5 sm:p-7">
            <h2 className="text-xl font-bold mb-1">{t("veh.specs")}</h2>
            <dl className="grid sm:grid-cols-2 gap-x-10">
              <div>
                <Row k={t("veh.brand")} v={brandName(v.brandId)} /><Row k={t("veh.model")} v={v.modelName} /><Row k={t("veh.year")} v={v.year} />
                <Row k={t("veh.importyear")} v={v.importYear ?? t("common.unknown")} /><Row k={t("veh.mileage")} v={`${fmtNum(v.mileage)} ${t("common.km")}`} />
                <Row k={t("veh.engine")} v={v.cc ? `${fmtNum(v.cc)} cc` : t("veh.noengine")} /><Row k={t("veh.fuel")} v={t("fuel." + v.fuel)} /><Row k={t("veh.hp")} v={`${v.hp} ${t("veh.hpunit")}`} />
              </div>
              <div>
                <Row k={t("veh.trans")} v={t("trans." + v.trans)} /><Row k={t("veh.drive")} v={t("drive." + v.drive)} /><Row k={t("veh.steering")} v={t("steer." + v.steering)} />
                <Row k={t("veh.extcolor")} v={t("color." + v.color)} /><Row k={t("veh.intcolor")} v={t("color." + v.interiorColor)} /><Row k={t("veh.seats")} v={v.seats} /><Row k={t("veh.doors")} v={v.doors} />
                <Row k={t("veh.condition")} v={t("cond." + v.condition)} />
              </div>
            </dl>
          </section>

          <section className="card p-5 sm:p-7">
            <h2 className="text-xl font-bold mb-3">{t("veh.description")}</h2>
            <p className="text-[15px] leading-relaxed text-ink-700">{desc}</p>
            {(v.equipment.length > 0 || v.safety.length > 0) && (
              <div className="grid sm:grid-cols-2 gap-6 mt-6">
                {v.equipment.length > 0 && <div><h3 className="text-sm font-bold mb-2">{t("veh.equipment")}</h3><ul className="grid gap-1.5">{v.equipment.map((e) => <li key={e} className="text-sm flex gap-2"><Check size={15} className="text-ok mt-0.5 shrink-0" />{t("equip." + e)}</li>)}</ul></div>}
                {v.safety.length > 0 && <div><h3 className="text-sm font-bold mb-2">{t("veh.safety")}</h3><ul className="grid gap-1.5">{v.safety.map((e) => <li key={e} className="text-sm flex gap-2"><Check size={15} className="text-ok mt-0.5 shrink-0" />{t("safety." + e)}</li>)}</ul></div>}
              </div>
            )}
          </section>

          <section className="grid md:grid-cols-2 gap-5" aria-label={t("veh.history")}>
            <div className="card p-5 sm:p-6">
              <Badge tone="gray">{t("veh.sellerdeclared")}</Badge>
              <h2 className="text-lg font-bold mt-3 mb-1">{t("veh.history")}</h2>
              <dl>
                <Row k={t("veh.accident")} v={<span className={v.accident === "none" ? "text-ok" : "text-bad"}>{t("acc." + v.accident)}{v.accidentNote ? ` (${t("accnote." + v.accidentNote)})` : ""}</span>} />
                <Row k={t("veh.origin")} v={t("origin." + v.origin)} /><Row k={t("veh.owners")} v={v.owners} /><Row k={t("veh.customs")} v={v.customsCleared ? t("common.yes") : t("common.no")} />
                <Row k={t("veh.plate")} v={<span title={t("veh.plate.hint")}>{maskedPlate}</span>} />
              </dl>
              <h3 className="text-sm font-bold mt-4 mb-2">{t("veh.service")}</h3>
              {v.service.length === 0 ? <p className="text-sm text-steel-500">{t("veh.service.none")}</p> : (
                <ul className="space-y-1.5">{v.service.map((s, i) => { const [k, d, km] = s.split("|"); return <li key={i} className="text-sm flex justify-between gap-3"><span>{t("svc." + k)}</span><span className="text-steel-500">{d} · {fmtNum(Number(km))} {t("common.km")}</span></li>; })}</ul>
              )}
              <p className="text-[11px] text-steel-500 mt-4 leading-relaxed">{t("veh.nogov")}</p>
            </div>
            <div className="card p-5 sm:p-6" data-testid="inspection-block">
              <Badge tone={report ? "ok" : "gray"}>{t("veh.verified")}</Badge>
              <h2 className="text-lg font-bold mt-3 mb-1">{t("veh.inspection")}</h2>
              {report ? (
                <>
                  <p className="text-xs text-steel-500 mb-3">{fmtDate(report.date, lang)} · {users.find((u) => u.id === report.inspectorId)?.name}</p>
                  <ul className="space-y-2">
                    {CHECKS.map((k) => <li key={k} className="flex items-center justify-between text-sm"><span>{t("check." + k)}</span><span className="flex gap-0.5" aria-label={`${report.checks[k].score}/5`}>{[1, 2, 3, 4, 5].map((n) => <span key={n} className={`h-2 w-5 rounded-full ${n <= report.checks[k].score ? "bg-ok" : "bg-ink-900/10"}`} />)}</span></li>)}
                  </ul>
                  <div className={`mt-4 flex items-center gap-2 text-sm font-semibold ${report.accidentFound ? "text-warn" : "text-ok"}`}>{report.accidentFound ? <ShieldAlert size={16} /> : <ShieldCheck size={16} />}{report.accidentFound ? t("insp.accfound") : t("insp.accnone")}</div>
                  <Link href={`/reports/view?id=${report.id}`} className="btn btn-sm btn-outline mt-4" data-testid="open-report"><FileText size={15} />{t("insp.openreport")}</Link>
                </>
              ) : <p className="text-sm text-steel-500 py-4">{t("veh.noinspection")}</p>}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">{t("veh.financing")}</h2>
            <LoanCalculator initialPrice={v.price} compact />
          </section>
        </div>

        <aside className="lg:sticky lg:top-28 space-y-4">
          <div className="card p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div><h1 className="text-2xl font-extrabold leading-tight" data-testid="veh-title">{title}</h1><p className="text-sm text-steel-500 mt-1">{v.year}{t("veh.yearsuffix")} · {fmtNum(v.mileage)} {t("common.km")}</p></div>
              <div className="flex gap-1.5"><CompareButton id={v.id} className="!bg-ink-900/5" /><FavButton id={v.id} className="!bg-ink-900/5" /></div>
            </div>
            <div className="mt-4">
              {v.prevPrice && v.prevPrice > v.price && <div className="text-sm text-steel-500 line-through">{price(v.prevPrice).main}</div>}
              <div className="font-display text-3xl font-extrabold tracking-tight" data-testid="veh-price">{p.main}</div>
              {p.usd && <div className="text-sm text-steel-500">{p.usd} <span className="text-xs">({t("veh.usdref")})</span></div>}
              <div className="mt-2 flex gap-1.5 flex-wrap">
                {v.negotiable && <Badge tone="brass">{t("veh.negotiable")}</Badge>}
                {v.tier !== "free" && <Badge tone="ink">{t("tier." + v.tier)}</Badge>}
                <Badge tone="gray">{v.steering}</Badge>
              </div>
            </div>
            <div className="mt-5 grid gap-2.5">
              <button onClick={() => setInq(true)} className="btn btn-primary w-full" data-testid="open-inquiry"><MessageSquare size={17} />{t("veh.inquiry")}</button>
              {showPhone ? (
                <a href={telHref(contactPhone)} className="btn btn-outline w-full" data-testid="phone-link"><Phone size={17} />{fmtPhoneFull(contactPhone)}</a>
              ) : (
                <button onClick={() => { setShowPhone(true); phoneClick(v.id); }} className="btn btn-outline w-full" data-testid="show-phone"><Phone size={17} />{t("veh.showphone")}</button>
              )}
              <div className="grid grid-cols-2 gap-2.5">
                <button onClick={message} className="btn btn-sm btn-outline" data-testid="contact-seller">{t("veh.contact")}</button>
                <button onClick={() => { if (!user) { flash(t("auth.needed"), "err"); router.push("/login?next=" + encodeURIComponent("/cars/view?id=" + v.id)); } else setAppt(true); }} className="btn btn-sm btn-outline" data-testid="open-appt"><CalendarCheck size={15} />{t("veh.schedule")}</button>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-ink-900/[.07] flex items-center justify-between text-xs text-steel-500">
              <button onClick={share} className="inline-flex items-center gap-1.5 hover:text-ink-900 font-semibold" data-testid="share"><Share2 size={14} />{t("common.share")}</button>
              <button onClick={() => setRep(true)} className="inline-flex items-center gap-1.5 hover:text-ink-900 font-semibold"><Flag size={14} />{t("veh.report")}</button>
            </div>
          </div>

          <div className="card p-5">
            <h2 className="text-xs font-bold uppercase tracking-[.14em] text-steel-500 mb-3">{t("veh.seller")}</h2>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl grid place-items-center text-white font-extrabold text-lg" style={{ background: dealer?.tone ?? "#0B0B0D" }}>{(dealer?.name ?? seller?.name ?? "?").replace(/[^\p{L}]/gu, "").slice(0, 1).toUpperCase()}</div>
              <div className="min-w-0">
                {dealer ? <Link href={`/dealers/view?id=${dealer.id}`} className="font-bold hover:underline block truncate">{dealer.name}</Link> : <div className="font-bold truncate">{seller?.name}</div>}
                <div className="text-xs text-steel-500">{dealer ? t("common.dealer") : t("common.individual")}</div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {verified ? <Badge tone="ok"><BadgeCheck size={12} />{t("veh.sellerverified")}</Badge> : <Badge tone="gray">{t("veh.sellerunverified")}</Badge>}
              <Badge tone="gray"><MapPin size={11} />{loc}</Badge>
            </div>
            <div className="text-xs text-steel-500 mt-3">{t("veh.listed")} {fmtDate(v.createdAt, lang)} · {t("veh.views", { n: v.views })}</div>
          </div>
          {v.demo && <p className="text-[11px] text-steel-500 px-1">{t("veh.demonote")}</p>}
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="mt-14">
          <h2 className="text-2xl font-extrabold mb-5">{t("veh.similar")}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">{similar.map((x) => <VehicleCard key={x.id} v={x} />)}</div>
        </section>
      )}

      <InquiryModal open={inq} onClose={() => { setInq(false); setSent(false); }} sent={sent} onSend={(d) => { submitInquiry({ vehicleId: v.id, ...d }); setSent(true); }} />
      <ApptModal open={appt} onClose={() => setAppt(false)} onSave={(at, place, note) => { requestAppointment({ vehicleId: v.id, at, place, note }); setAppt(false); flash(t("appt.requested")); }} />
      <Modal open={rep} onClose={() => setRep(false)} title={t("veh.report")}>
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); const r = new FormData(e.currentTarget).get("reason") as string; reportListing(v.id, r); setRep(false); flash(t("veh.reported")); }}>
          <Field label={t("common.reason")}><select name="reason" className="input">{["price", "sold", "photos", "scam", "other"].map((r) => <option key={r} value={r}>{t("flag." + r)}</option>)}</select></Field>
          <button className="btn btn-primary w-full">{t("common.send")}</button>
        </form>
      </Modal>
    </div>
  );
}

function InquiryModal({ open, onClose, sent, onSend }: { open: boolean; onClose: () => void; sent: boolean; onSend: (d: { name: string; phone: string; email?: string; message: string }) => void }) {
  const { t } = useT();
  const user = useUser();
  const [err, setErr] = useState<Record<string, string>>({});
  return (
    <Modal open={open} onClose={onClose} title={t("veh.inquiry")}>
      {sent ? (
        <div className="text-center py-6" data-testid="inquiry-sent"><div className="mx-auto h-14 w-14 rounded-full bg-ok/10 text-ok grid place-items-center mb-3"><Check size={28} /></div><h3 className="font-bold text-lg">{t("inq.sent")}</h3><p className="text-sm text-steel-500 mt-1">{t("inq.sent.body")}</p><button onClick={onClose} className="btn btn-primary mt-5">{t("common.close")}</button></div>
      ) : (
        <form noValidate className="space-y-4" onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          const d = { name: String(f.get("name")).trim(), phone: String(f.get("phone")), email: String(f.get("email") || "") || undefined, message: String(f.get("message")).trim() };
          const er: Record<string, string> = {};
          if (!d.name) er.name = t("common.required");
          if (!phoneValid(d.phone)) er.phone = t("val.phone");
          if (!d.message) er.message = t("common.required");
          setErr(er);
          if (!Object.keys(er).length) onSend(d);
        }}>
          <Field label={t("common.name")} error={err.name}><input name="name" className="input" defaultValue={user?.name ?? ""} autoComplete="name" /></Field>
          <Field label={t("common.phone")} error={err.phone} hint={t("val.phone.hint")}><input name="phone" className="input" inputMode="tel" defaultValue={user?.phone ?? ""} placeholder="9911 2233" autoComplete="tel" /></Field>
          <Field label={`${t("common.email")} (${t("common.optional")})`}><input name="email" type="email" className="input" defaultValue={user?.email ?? ""} autoComplete="email" /></Field>
          <Field label={t("common.message")} error={err.message}><textarea name="message" rows={4} className="input" defaultValue={t("inq.default")} /></Field>
          <button className="btn btn-primary w-full" data-testid="send-inquiry">{t("common.send")}</button>
        </form>
      )}
    </Modal>
  );
}

function ApptModal({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (at: string, place: string, note?: string) => void }) {
  const { t } = useT();
  const def = toLocalInput(new Date(Date.now() + 2 * 86400000).toISOString().replace(/T\d\d/, "T11"));
  const [err, setErr] = useState("");
  return (
    <Modal open={open} onClose={onClose} title={t("veh.schedule")}>
      <form className="space-y-4" onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const at = new Date(String(f.get("at")));
        if (isNaN(at.getTime()) || at.getTime() < Date.now()) { setErr(t("appt.past")); return; }
        onSave(at.toISOString(), String(f.get("place")), String(f.get("note") || ""));
      }}>
        <p className="text-sm text-steel-600">{t("appt.hint")}</p>
        <Field label={t("common.date")} error={err}><input name="at" type="datetime-local" className="input" defaultValue={def} required /></Field>
        <Field label={t("appt.place")}><select name="place" className="input">{["place1", "place2", "place3"].map((p) => <option key={p} value={t("appt." + p)}>{t("appt." + p)}</option>)}</select></Field>
        <Field label={t("common.notes")}><textarea name="note" className="input" rows={2} /></Field>
        <button className="btn btn-primary w-full" data-testid="confirm-appt">{t("appt.request")}</button>
      </form>
    </Modal>
  );
}
void photoSrc;

function VehiclePageQuery() { const id = useSearchParams().get("id") ?? ""; return <VehiclePageInner key={id} id={id} />; }
export default function VehiclePage() { return <Suspense fallback={null}><VehiclePageQuery /></Suspense>; }
