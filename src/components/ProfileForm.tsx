"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { useT, useUser } from "@/lib/hooks";
import { Field } from "./ui";
import { phoneValid, fmtPhone } from "@/lib/format";
import { PROVINCES } from "@/lib/geo";

export function ProfileForm() {
  const { t, lang } = useT();
  const user = useUser()!;
  const update = useStore((s) => s.updateProfile), flash = useStore((s) => s.flash), changePw = useStore((s) => s.changePassword);
  const [err, setErr] = useState<Record<string, string>>({});
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <form className="card p-6 space-y-4" noValidate onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const name = String(f.get("name")).trim(), phone = String(f.get("phone"));
        const er: Record<string, string> = {};
        if (name.length < 2) er.name = t("common.required");
        if (!phoneValid(phone)) er.phone = t("val.phone");
        setErr(er);
        if (Object.keys(er).length) return;
        update({ name, phone: phone.replace(/\D/g, "").replace(/^976/, ""), province: String(f.get("province")), bio: String(f.get("bio") || "") });
        flash(t("common.saved"));
      }}>
        <h2 className="font-bold text-lg">{t("dash.profile")}</h2>
        <Field label={t("common.name")} error={err.name}><input name="name" className="input" defaultValue={user.name} /></Field>
        <Field label={t("common.email")}><input className="input" value={user.email} readOnly disabled /></Field>
        <Field label={t("common.phone")} error={err.phone} hint={t("val.phone.hint")}><input name="phone" className="input" defaultValue={fmtPhone(user.phone)} /></Field>
        <Field label={t("veh.location")}><select name="province" className="input" defaultValue={user.province}>{PROVINCES.map((p) => <option key={p.id} value={p.id}>{p[lang]}</option>)}</select></Field>
        {user.role !== "customer" && <Field label={t("prof.bio")}><textarea name="bio" rows={3} className="input" defaultValue={user.bio} /></Field>}
        <button className="btn btn-primary" data-testid="save-profile">{t("common.save")}</button>
      </form>
      <div className="space-y-6">
        <form className="card p-6 space-y-4" onSubmit={async (e) => {
          e.preventDefault();
          const pw = String(new FormData(e.currentTarget).get("pw"));
          if (pw.length < 8) { setErr({ pw: t("val.password") }); return; }
          await changePw(pw); setErr({}); (e.target as HTMLFormElement).reset(); flash(t("common.saved"));
        }}>
          <h2 className="font-bold text-lg">{t("prof.password")}</h2>
          <Field label={t("prof.newpw")} error={err.pw}><input name="pw" type="password" className="input" autoComplete="new-password" /></Field>
          <button className="btn btn-outline">{t("common.save")}</button>
        </form>
        <div className="card p-6 space-y-3">
          <h2 className="font-bold text-lg">{t("ntf.prefs")}</h2>
          {(["priceDrop", "newListing", "inquiry", "reminders", "expiry"] as const).map((k) => (
            <label key={k} className="flex items-center justify-between gap-3 text-sm cursor-pointer"><span>{t("ntf.pref." + k)}</span>
              <input type="checkbox" className="h-5 w-5 accent-ink-900" checked={user.prefs[k]} onChange={(e) => update({ prefs: { ...user.prefs, [k]: e.target.checked } })} /></label>
          ))}
        </div>
      </div>
    </div>
  );
}
