"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/hooks";
import { Field, Spinner } from "@/components/ui";
import { Logo } from "@/components/Logo";
import { homeFor } from "@/lib/perms";

const DEMOS: [string, string][] = [
  ["superadmin@vrooma.demo", "role.super_admin"], ["admin@vrooma.demo", "role.admin"], ["dealer1@vrooma.demo", "role.dealer_owner"], ["agent11@vrooma.demo", "role.agent"],
  ["seller01@vrooma.demo", "role.seller"], ["inspector1@vrooma.demo", "role.inspector"], ["customer01@vrooma.demo", "role.customer"],
];

function Inner() {
  const { t } = useT();
  const router = useRouter();
  const sp = useSearchParams();
  const login = useStore((s) => s.login);
  const [email, setEmail] = useState(""), [pw, setPw] = useState("");
  const [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  const submit = async (e?: React.FormEvent, em = email, p = pw) => {
    e?.preventDefault();
    setBusy(true); setErr("");
    const r = await login(em, p);
    setBusy(false);
    if (!r.ok) { setErr(t(r.error!)); return; }
    const next = sp.get("next");
    router.push(next && next.startsWith("/") ? next : homeFor(r.user!.role));
  };
  return (
    <div className="container py-12 grid lg:grid-cols-2 gap-10 items-start max-w-5xl">
      <div className="card p-6 sm:p-8">
        <Logo />
        <h1 className="text-2xl font-extrabold mt-6">{t("nav.login")}</h1>
        <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
          <Field label={t("common.email")}><input name="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required /></Field>
          <Field label={t("common.password")} error={err}><input name="password" type="password" className="input" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" required /></Field>
          <button className="btn btn-primary w-full" disabled={busy} data-testid="login-submit">{busy ? <Spinner /> : t("nav.login")}</button>
        </form>
        <p className="text-sm text-steel-600 mt-5">{t("auth.noaccount")} <Link href="/register" className="font-semibold text-ink-900 underline underline-offset-4">{t("nav.register")}</Link></p>
      </div>
      <div className="card p-6 sm:p-8 bg-bone-50">
        <span className="chip bg-brass-500/15 text-brass-700">{t("demo.badge")}</span>
        <h2 className="text-lg font-bold mt-3">{t("auth.demoaccounts")}</h2>
        <p className="text-sm text-steel-600 mt-1">{t("auth.demohint")}: <code className="font-mono bg-ink-900/5 px-1.5 py-0.5 rounded">demo1234</code></p>
        <div className="mt-4 grid gap-2">
          {DEMOS.map(([em, k]) => (
            <button key={em} onClick={() => { setEmail(em); setPw("demo1234"); submit(undefined, em, "demo1234"); }} className="flex items-center justify-between text-left px-4 py-3 rounded-xl bg-white border border-ink-900/10 hover:border-ink-900/40" data-testid={"demo-" + em.split("@")[0]}>
              <span className="font-semibold text-sm">{t(k)}</span><span className="text-xs text-steel-500">{em}</span>
            </button>
          ))}
        </div>
        <p className="text-[11px] text-steel-500 mt-4">{t("auth.demowarn")}</p>
      </div>
    </div>
  );
}
export default function LoginPage() { return <Suspense><Inner /></Suspense>; }
