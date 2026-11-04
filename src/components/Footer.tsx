"use client";
import Link from "next/link";
import { Logo } from "./Logo";
import { useT } from "@/lib/hooks";
import { useStore } from "@/lib/store";

export function Footer() {
  const { t } = useT();
  const reset = useStore((s) => s.resetDemo);
  const flash = useStore((s) => s.flash);
  return (
    <footer className="bg-ink-900 text-white/70 mt-20 pb-24">
      <div className="container py-14 grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo tone="light" />
          <p className="mt-4 text-sm leading-relaxed max-w-sm">{t("footer.about")}</p>
          <p className="mt-4 text-xs text-white/50 max-w-sm">{t("footer.disclaimer")}</p>
        </div>
        <div>
          <h4 className="text-white font-bold text-sm mb-3">{t("footer.market")}</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/cars" className="hover:text-white">{t("nav.cars")}</Link></li>
            <li><Link href="/dealers" className="hover:text-white">{t("nav.dealers")}</Link></li>
            <li><Link href="/map" className="hover:text-white">{t("nav.map")}</Link></li>
            <li><Link href="/compare" className="hover:text-white">{t("nav.compare")}</Link></li>
            <li><Link href="/calculator" className="hover:text-white">{t("nav.calculator")}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-bold text-sm mb-3">{t("footer.company")}</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/news" className="hover:text-white">{t("nav.news")}</Link></li>
            <li><Link href="/register?role=seller" className="hover:text-white">{t("nav.sell")}</Link></li>
            <li><Link href="/register?role=dealer_owner" className="hover:text-white">{t("home.dealerjoin")}</Link></li>
            <li><Link href="/login" className="hover:text-white">{t("nav.login")}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-bold text-sm mb-3">{t("footer.support")}</h4>
          <ul className="space-y-2 text-sm">
            <li>Vrooma Demo LLC</li>
            <li>{t("footer.address")}</li>
            <li>+976 7700 0000 ({t("demo.data")})</li>
            <li>hello@vrooma.demo</li>
            <li>{t("footer.hours")}</li>
          </ul>
        </div>
      </div>
      <div className="container border-t border-white/10 py-5 flex flex-wrap items-center justify-between gap-3 text-xs text-white/50">
        <span>© 2026 Vrooma. {t("footer.rights")}</span>
        <button onClick={() => { if (confirm(t("demo.reset.confirm"))) { reset(); flash(t("demo.reset.done")); } }} className="hover:text-white underline underline-offset-4">{t("demo.reset")}</button>
      </div>
    </footer>
  );
}
