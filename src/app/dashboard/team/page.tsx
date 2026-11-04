"use client";
import { useRef, useState } from "react";
import { Plus, Trash2, Upload } from "lucide-react";
import { useStore } from "@/lib/store";
import { useT, useUser } from "@/lib/hooks";
import { Empty, Field, PageHead } from "@/components/ui";
import { Guard } from "@/components/Guard";
import { DealerLogo } from "@/components/DealerLogo";
import { DISTRICTS, PROVINCES, provCenter } from "@/lib/geo";
import { fmtPhone, phoneValid } from "@/lib/format";

async function logoData(file: File): Promise<string> {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, 256 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas"); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  return c.toDataURL("image/png");
}

function Inner() {
  const { t, lang } = useT();
  const user = useUser()!;
  const st = useStore();
  const d = st.dealers.find((x) => x.id === user.dealerId);
  const fileRef = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState<Record<string, string>>({});
  const [loc, setLoc] = useState({ name: "", province: "ub", district: "bayangol", address: "" });
  const [ag, setAg] = useState({ name: "", email: "", phone: "" });
  if (!d) return <Empty title={t("team.nodealer")} />;
  const agents = st.users.filter((u) => u.role === "agent" && u.dealerId === d.id);
  const stats = (id: string) => { const ls = st.leads.filter((l) => l.assignedTo === id); return { n: ls.length, sold: ls.filter((l) => l.status === "sold").length, open: ls.filter((l) => !["sold", "lost"].includes(l.status)).length }; };
  return (
    <>
      <PageHead title={t("dash.team")} sub={t("team.sub")} />
      <div className="grid lg:grid-cols-2 gap-6">
        <form className="card p-6 space-y-4" noValidate onSubmit={(e) => {
          e.preventDefault(); const f = new FormData(e.currentTarget);
          const er: Record<string, string> = {}; const phone = String(f.get("phone"));
          if (!String(f.get("name")).trim()) er.name = t("common.required"); if (!phoneValid(phone)) er.phone = t("val.phone");
          setErr(er); if (Object.keys(er).length) return;
          st.updateDealer(d.id, { name: String(f.get("name")).trim(), description: String(f.get("description")), phone: phone.replace(/\D/g, "").replace(/^976/, ""), email: String(f.get("email")), website: String(f.get("website") || "") });
          st.flash(t("common.saved"));
        }}>
          <h2 className="font-bold text-lg">{t("team.profile")}</h2>
          <div className="flex items-center gap-4"><DealerLogo d={d} size={72} />
            <div><button type="button" className="btn btn-sm btn-outline" onClick={() => fileRef.current?.click()} data-testid="upload-logo"><Upload size={14} />{t("team.logo")}</button><input ref={fileRef} type="file" accept="image/*" className="sr-only" aria-label={t("team.logo")} data-testid="logo-input" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { try { st.updateDealer(d.id, { logo: await logoData(f) }); st.flash(t("common.saved")); } catch { st.flash(t("lst.photo.fail"), "err"); } } }} />
              {d.logo && <button type="button" className="btn btn-xs btn-ghost ml-2" onClick={() => st.updateDealer(d.id, { logo: undefined })}>{t("common.delete")}</button>}</div></div>
          <Field label={t("team.dealername")} error={err.name}><input name="name" className="input" defaultValue={d.name} /></Field>
          <Field label={t("team.description")}><textarea name="description" rows={4} className="input" defaultValue={d.description} /></Field>
          <div className="grid sm:grid-cols-2 gap-4"><Field label={t("common.phone")} error={err.phone}><input name="phone" className="input" defaultValue={fmtPhone(d.phone)} /></Field><Field label={t("common.email")}><input name="email" type="email" className="input" defaultValue={d.email} /></Field></div>
          <Field label={t("team.website")}><input name="website" className="input" defaultValue={d.website} placeholder="https://" /></Field>
          <button className="btn btn-primary" data-testid="save-dealer">{t("common.save")}</button>
        </form>

        <div className="space-y-6">
          <div className="card p-6"><h2 className="font-bold text-lg mb-4">{t("team.locations")}</h2>
            <ul className="space-y-2 mb-4" data-testid="locations">{d.locations.map((l) => <li key={l.id} className="flex items-center justify-between gap-3 bg-bone-100 rounded-xl px-3 py-2.5 text-sm"><span><b>{l.name}</b><span className="block text-xs text-steel-500">{l.address}</span></span><button aria-label={t("common.delete")} onClick={() => st.removeLocation(d.id, l.id)} className="h-8 w-8 grid place-items-center rounded-lg hover:bg-white text-bad"><Trash2 size={14} /></button></li>)}{d.locations.length === 0 && <li className="text-sm text-steel-500">{t("team.nolocations")}</li>}</ul>
            <form className="grid grid-cols-2 gap-2" onSubmit={(e) => { e.preventDefault(); if (!loc.name.trim()) return; const c = loc.province === "ub" ? DISTRICTS.find((x) => x.id === loc.district)! : provCenter(loc.province); st.addLocation(d.id, { name: loc.name.trim(), province: loc.province, district: loc.province === "ub" ? loc.district : "", address: loc.address, lat: c.lat, lng: c.lng }); setLoc({ ...loc, name: "", address: "" }); }}>
              <input className="input !h-10 col-span-2" name="locName" aria-label={t("common.name")} placeholder={t("team.locname")} value={loc.name} onChange={(e) => setLoc({ ...loc, name: e.target.value })} />
              <select className="input !h-10" name="locProv" aria-label={t("veh.location")} value={loc.province} onChange={(e) => setLoc({ ...loc, province: e.target.value })}>{PROVINCES.map((p) => <option key={p.id} value={p.id}>{p[lang]}</option>)}</select>
              {loc.province === "ub" ? <select className="input !h-10" name="locDist" aria-label={t("veh.district")} value={loc.district} onChange={(e) => setLoc({ ...loc, district: e.target.value })}>{DISTRICTS.map((p) => <option key={p.id} value={p.id}>{p[lang]}</option>)}</select> : <span />}
              <input className="input !h-10 col-span-2" name="locAddr" aria-label={t("team.address")} placeholder={t("team.address")} value={loc.address} onChange={(e) => setLoc({ ...loc, address: e.target.value })} />
              <button className="btn btn-sm btn-outline col-span-2"><Plus size={15} />{t("team.addlocation")}</button></form></div>

          <div className="card p-6"><h2 className="font-bold text-lg mb-4">{t("team.agents")}</h2>
            <ul className="space-y-2 mb-4" data-testid="agents">{agents.map((a) => { const s = stats(a.id); return <li key={a.id} className="flex items-center justify-between gap-3 bg-bone-100 rounded-xl px-3 py-2.5 text-sm"><span><b>{a.name}</b><span className="block text-xs text-steel-500">{a.email} · {t("team.leads", { n: s.n })} · {t("team.open", { n: s.open })} · {t("lead.sold")} {s.sold}</span></span><button aria-label={t("common.delete")} onClick={() => { if (confirm(t("team.removeconfirm"))) st.removeAgent(a.id); }} className="h-8 w-8 grid place-items-center rounded-lg hover:bg-white text-bad"><Trash2 size={14} /></button></li>; })}{agents.length === 0 && <li className="text-sm text-steel-500">{t("team.noagents")}</li>}</ul>
            <form className="space-y-2" onSubmit={async (e) => { e.preventDefault(); if (!ag.name.trim() || !/^\S+@\S+\.\S+$/.test(ag.email) || !phoneValid(ag.phone)) { st.flash(t("val.fix"), "err"); return; } const r = await st.addAgent(d.id, ag); if (!r.ok) st.flash(t(r.error!), "err"); else { st.flash(t("team.agentadded")); setAg({ name: "", email: "", phone: "" }); } }}>
              <input className="input !h-10" name="agentName" aria-label={t("common.name")} placeholder={t("common.name")} value={ag.name} onChange={(e) => setAg({ ...ag, name: e.target.value })} />
              <div className="grid grid-cols-2 gap-2"><input className="input !h-10" name="agentEmail" type="email" aria-label={t("common.email")} placeholder={t("common.email")} value={ag.email} onChange={(e) => setAg({ ...ag, email: e.target.value })} /><input className="input !h-10" name="agentPhone" aria-label={t("common.phone")} placeholder="9911 2233" value={ag.phone} onChange={(e) => setAg({ ...ag, phone: e.target.value })} /></div>
              <button className="btn btn-sm btn-outline w-full" data-testid="add-agent"><Plus size={15} />{t("team.addagent")}</button><p className="text-[11px] text-steel-500">{t("team.agentpw")}</p></form></div>
        </div>
      </div>
    </>
  );
}
export default function TeamPage() { return <Guard perm="team.manage"><Inner /></Guard>; }
