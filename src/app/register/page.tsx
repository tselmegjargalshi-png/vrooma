"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { User as UserIcon, Car, Building2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/hooks";
import { Field, Spinner } from "@/components/ui";
import { Logo } from "@/components/Logo";
import { phoneValid } from "@/lib/format";
import { homeFor } from "@/lib/perms";

type R = "customer" | "seller" | "dealer_owner";
function Inner() {
  const { t } = useT();
  const router = useRouter();
  const sp = useSearchParams();
  const register = useStore((s) => s.register);
  const init = (["customer", "seller", "dealer_owner"].includes(sp.get("role") ?? "") ? sp.get("role") : "customer") as R;
  const [role, setRole] = useState<R>(init);
  const [err, setErr] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const roles: [R, typeof Car, string][] = [["customer", UserIcon, "reg.customer"], ["seller", Car, "reg.seller"], ["dealer_owner", Building2, "reg.dealer"]];
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const d = { name: String(f.get("name")).trim(), email: String(f.get("email")).trim(), phone: String(f.get("phone")), password: String(f.get("password")), dealerName: String(f.get("dealerName") || "").trim() };
    const er: Record<string, string> = {};
    if (d.name.length < 2) er.name = t("common.required");
    if (!/^\S+@\S+\.\S+$/.test(d.email)) er.email = t("val.email");
    if (!phoneValid(d.phone)) er.phone = t("val.phone");
    if (d.password.length < 8) er.password = t("val.password");
    if (role === "dealer_owner" && !d.dealerName) er.dealerName = t("common.required");
    setErr(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    const r = await register({ ...d, role });
    setBusy(false);
    if (!r.ok) { setErr({ email: t(r.error!) }); return; }
    router.push(role === "customer" ? "/account" : role === "seller" ? "/dashboard/listings/new" : homeFor("dealer_owner"));
  };
  return (
    <div className="container py-12 max-w-xl">
      <div className="card p-6 sm:p-8">
        <Logo />
        <h1 className="text-2xl font-extrabold mt-6">{t("nav.register")}</h1>
        <div className="grid grid-cols-3 gap-2 mt-5" role="radiogroup" aria-label={t("reg.type")}>
          {roles.map(([id, Ic, k]) => <button type="button" key={id} role="radio" aria-checked={role === id} onClick={() => setRole(id)} data-testid={"role-" + id} className={`rounded-2xl border-2 p-3 text-center transition-colors ${role === id ? "border-ink-900 bg-ink-900 text-white" : "border-ink-900/10 hover:border-ink-900/30"}`}><Ic size={20} className="mx-auto" /><span className="block text-[13px] font-semibold mt-1.5">{t(k)}</span></button>)}
        </div>
        <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
          {role === "dealer_owner" && <Field label={t("reg.dealername")} error={err.dealerName}><input name="dealerName" className="input" /></Field>}
          <Field label={t("common.name")} error={err.name}><input name="name" className="input" autoComplete="name" /></Field>
          <Field label={t("common.email")} error={err.email}><input name="email" type="email" className="input" autoComplete="email" /></Field>
          <Field label={t("common.phone")} error={err.phone} hint={t("val.phone.hint")}><input name="phone" inputMode="tel" className="input" placeholder="9911 2233" autoComplete="tel" /></Field>
          <Field label={t("common.password")} error={err.password} hint={t("val.password")}><input name="password" type="password" className="input" autoComplete="new-password" /></Field>
          <button className="btn btn-primary w-full" disabled={busy} data-testid="register-submit">{busy ? <Spinner /> : t("nav.register")}</button>
        </form>
        <p className="text-sm text-steel-600 mt-5">{t("auth.haveaccount")} <Link href="/login" className="font-semibold text-ink-900 underline underline-offset-4">{t("nav.login")}</Link></p>
        <p className="text-[11px] text-steel-500 mt-3">{t("auth.demowarn")}</p>
      </div>
    </div>
  );
}
export default function RegisterPage() { return <Suspense><Inner /></Suspense>; }
