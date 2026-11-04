"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bell, Menu, X, GitCompareArrows, Heart, ChevronDown, LogOut, LayoutDashboard, User as UserIcon } from "lucide-react";
import { Logo } from "./Logo";
import { useStore } from "@/lib/store";
import { useT, useUser } from "@/lib/hooks";
import { ago } from "@/lib/format";

const NAV = [
  { href: "/cars", key: "nav.cars" }, { href: "/dealers", key: "nav.dealers" }, { href: "/map", key: "nav.map" },
  { href: "/compare", key: "nav.compare" }, { href: "/calculator", key: "nav.calculator" }, { href: "/news", key: "nav.news" },
];

export function Header() {
  const { t, lang } = useT();
  const user = useUser();
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [bell, setBell] = useState(false);
  const setLang = useStore((s) => s.setLang);
  const usd = useStore((s) => s.showUsd);
  const setUsd = useStore((s) => s.setUsd);
  const compare = useStore((s) => s.compare);
  const notices = useStore((s) => s.notices);
  const logout = useStore((s) => s.logout);
  const markRead = useStore((s) => s.markNoticeRead);
  const mine = user ? notices.filter((n) => n.userId === user.id) : [];
  const unread = mine.filter((n) => !n.read).length;
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setOpen(false); setMenu(false); setBell(false); }, [path]);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (boxRef.current && !boxRef.current.contains(e.target as Node)) { setMenu(false); setBell(false); } };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const home = user ? (user.role === "customer" ? "/account" : "/dashboard") : "/login";
  const sell = user ? (["seller", "dealer_owner", "agent"].includes(user.role) ? "/dashboard/listings/new" : home) : "/register?role=seller";

  return (
    <header className="sticky top-0 z-50">
      <div className="bg-ink-900 text-white/80 text-[11px] sm:text-xs">
        <div className="container py-1.5 flex items-center gap-2">
          <span className="chip bg-brass-500 text-ink-900 !py-0">{t("demo.badge")}</span>
          <span className="truncate">{t("demo.banner")}</span>
        </div>
      </div>
      <div className="bg-bone-100/90 backdrop-blur-xl border-b border-ink-900/[.07]">
        <div className="container h-16 flex items-center gap-4">
          <Link href="/" aria-label="Vrooma" className="shrink-0"><Logo /></Link>
          <nav className="hidden lg:flex items-center gap-1 ml-4" aria-label="main">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className={`px-3 h-9 inline-flex items-center rounded-full text-[13.5px] font-semibold transition-colors ${path.startsWith(n.href) ? "bg-ink-900 text-white" : "text-ink-700 hover:bg-ink-900/5"}`}>
                {t(n.key)}{n.href === "/compare" && compare.length > 0 && <span className="ml-1.5 text-[11px] bg-brass-500 text-ink-900 rounded-full px-1.5">{compare.length}</span>}
              </Link>
            ))}
          </nav>
          <div ref={boxRef} className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <div className="hidden sm:flex rounded-full border border-ink-900/15 bg-white p-0.5 text-xs font-bold" role="group" aria-label={t("common.language")}>
              {(["mn", "en"] as const).map((l) => (
                <button key={l} onClick={() => setLang(l)} aria-pressed={lang === l} className={`px-2.5 h-7 rounded-full ${lang === l ? "bg-ink-900 text-white" : "text-steel-600"}`}>{l === "mn" ? "МН" : "EN"}</button>
              ))}
            </div>
            <button onClick={() => setUsd(!usd)} aria-pressed={usd} title={t("common.usd")} className={`hidden md:inline-flex h-9 px-3 rounded-full text-xs font-bold border ${usd ? "bg-ink-900 text-white border-ink-900" : "border-ink-900/15 bg-white text-steel-600"}`}>$</button>
            {user && (
              <Link href="/account?tab=favorites" aria-label={t("nav.favorites")} className="hidden sm:grid h-9 w-9 place-items-center rounded-full hover:bg-ink-900/5"><Heart size={18} /></Link>
            )}
            <Link href="/compare" aria-label={t("nav.compare")} className="lg:hidden relative h-9 w-9 grid place-items-center rounded-full hover:bg-ink-900/5"><GitCompareArrows size={18} />{compare.length > 0 && <span className="absolute -top-0.5 -right-0.5 text-[10px] bg-brass-500 rounded-full px-1.5">{compare.length}</span>}</Link>
            {user && (
              <div className="relative">
                <button onClick={() => { setBell(!bell); setMenu(false); }} aria-label={t("ntf.center")} data-testid="bell" className="relative h-9 w-9 grid place-items-center rounded-full hover:bg-ink-900/5">
                  <Bell size={18} />{unread > 0 && <span data-testid="bell-count" className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] grid place-items-center text-[10px] font-bold bg-bad text-white rounded-full px-1">{unread}</span>}
                </button>
                {bell && (
                  <div className="absolute right-0 mt-2 w-[min(92vw,360px)] card shadow-lift overflow-hidden animate-fadein">
                    <div className="px-4 py-3 border-b border-ink-900/[.06] font-bold text-sm">{t("ntf.center")}</div>
                    <ul className="max-h-80 overflow-y-auto">
                      {mine.slice(0, 7).map((n) => (
                        <li key={n.id}>
                          <button onClick={() => { markRead(n.id); setBell(false); if (n.link) router.push(n.link); }} className={`w-full text-left px-4 py-3 border-b border-ink-900/[.05] hover:bg-bone-100 ${n.read ? "" : "bg-brass-500/[.07]"}`}>
                            <div className="text-[13px] font-semibold">{t(n.title, { v: n.body })}</div>
                            <div className="text-[11px] text-steel-500 mt-0.5">{ago(n.at, lang)}</div>
                          </button>
                        </li>
                      ))}
                      {mine.length === 0 && <li className="px-4 py-8 text-center text-sm text-steel-500">{t("ntf.empty")}</li>}
                    </ul>
                    <Link href="/notifications" className="block text-center text-[13px] font-semibold py-3 hover:bg-bone-100">{t("ntf.all")}</Link>
                  </div>
                )}
              </div>
            )}
            {user ? (
              <div className="relative hidden sm:block">
                <button onClick={() => { setMenu(!menu); setBell(false); }} data-testid="user-menu" className="h-9 pl-1 pr-2.5 rounded-full border border-ink-900/15 bg-white flex items-center gap-2">
                  <span className="h-7 w-7 rounded-full bg-ink-900 text-white grid place-items-center text-xs font-bold">{user.name.replace(/[^\p{L}]/gu, "").slice(0, 1).toUpperCase()}</span>
                  <ChevronDown size={14} />
                </button>
                {menu && (
                  <div className="absolute right-0 mt-2 w-60 card shadow-lift p-1.5 animate-fadein">
                    <div className="px-3 py-2"><div className="text-sm font-bold truncate">{user.name}</div><div className="text-xs text-steel-500">{t("role." + user.role)}</div></div>
                    <Link href={home} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm hover:bg-bone-100"><LayoutDashboard size={15} />{user.role === "customer" ? t("nav.account") : t("nav.dashboard")}</Link>
                    <Link href={user.role === "customer" ? "/account?tab=profile" : "/dashboard/profile"} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm hover:bg-bone-100"><UserIcon size={15} />{t("dash.profile")}</Link>
                    <button onClick={() => { logout(); router.push("/"); }} data-testid="logout" className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm hover:bg-bone-100 text-bad"><LogOut size={15} />{t("nav.logout")}</button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="hidden sm:inline-flex btn btn-sm btn-ghost">{t("nav.login")}</Link>
            )}
            <Link href={sell} className="hidden md:inline-flex btn btn-sm btn-primary">{t("nav.sell")}</Link>
            <button className="lg:hidden h-9 w-9 grid place-items-center rounded-full hover:bg-ink-900/5" onClick={() => setOpen(!open)} aria-label={t("nav.menu")} aria-expanded={open}>{open ? <X size={20} /> : <Menu size={20} />}</button>
          </div>
        </div>
        {open && (
          <div className="lg:hidden border-t border-ink-900/[.07] bg-bone-100 animate-fadein">
            <div className="container py-3 grid gap-1">
              {NAV.map((n) => <Link key={n.href} href={n.href} className="px-3 py-3 rounded-xl font-semibold hover:bg-ink-900/5">{t(n.key)}</Link>)}
              <div className="h-px bg-ink-900/10 my-1" />
              <div className="flex items-center gap-2 px-1 py-1">
                <div className="flex rounded-full border border-ink-900/15 bg-white p-0.5 text-xs font-bold">
                  {(["mn", "en"] as const).map((l) => <button key={l} onClick={() => setLang(l)} aria-pressed={lang === l} className={`px-3 h-8 rounded-full ${lang === l ? "bg-ink-900 text-white" : "text-steel-600"}`}>{l === "mn" ? "МН" : "EN"}</button>)}
                </div>
                <button onClick={() => setUsd(!usd)} aria-pressed={usd} className={`h-9 px-3 rounded-full text-xs font-bold border ${usd ? "bg-ink-900 text-white" : "bg-white border-ink-900/15"}`}>USD</button>
              </div>
              {user ? (
                <>
                  <Link href={home} className="px-3 py-3 rounded-xl font-semibold hover:bg-ink-900/5">{user.role === "customer" ? t("nav.account") : t("nav.dashboard")}</Link>
                  <button onClick={() => { logout(); router.push("/"); }} className="text-left px-3 py-3 rounded-xl font-semibold text-bad hover:bg-ink-900/5">{t("nav.logout")}</button>
                </>
              ) : (
                <div className="flex gap-2 pt-1"><Link href="/login" className="btn btn-outline flex-1">{t("nav.login")}</Link><Link href="/register" className="btn btn-primary flex-1">{t("nav.register")}</Link></div>
              )}
              <Link href={sell} className="btn btn-accent mt-1">{t("nav.sell")}</Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
