"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BadgeCheck, ShieldCheck, Car, Truck, Gem, Wallet, Users } from "lucide-react";
import { useStore } from "@/lib/store";
import { useBrandName, usePrice, useT, photoSrc } from "@/lib/hooks";
import { isPublic } from "@/lib/search";
import { VehicleCard } from "@/components/VehicleCard";
import { LoanCalculator } from "@/components/Calculator";
import { fmtDate } from "@/lib/format";
import { PROVINCES } from "@/lib/geo";
import type { Vehicle } from "@/lib/types";

function Section({ eyebrow, title, href, children, dark }: { eyebrow?: string; title: string; href?: string; children: React.ReactNode; dark?: boolean }) {
  const { t } = useT();
  return (
    <section className={dark ? "bg-ink-900 text-white py-16 mt-16" : "mt-16"}>
      <div className="container">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>{eyebrow && <div className="eyebrow mb-2">{eyebrow}</div>}<h2 className="text-2xl sm:text-3xl font-extrabold">{title}</h2></div>
          {href && <Link href={href} className={`inline-flex items-center gap-1.5 text-sm font-semibold ${dark ? "text-brass-300" : "text-ink-900"} hover:underline shrink-0`}>{t("home.viewall")}<ArrowRight size={15} /></Link>}
        </div>
        {children}
      </div>
    </section>
  );
}
const Grid = ({ items, n = 4 }: { items: Vehicle[]; n?: number }) => (
  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">{items.slice(0, n).map((v) => <VehicleCard key={v.id} v={v} />)}</div>
);

export default function Home() {
  const { t, lang } = useT();
  const router = useRouter();
  const price = usePrice();
  const brandName = useBrandName();
  const vehicles = useStore((s) => s.vehicles), brands = useStore((s) => s.brands), models = useStore((s) => s.models), cats = useStore((s) => s.categories);
  const dealers = useStore((s) => s.dealers), users = useStore((s) => s.users), ads = useStore((s) => s.ads), articles = useStore((s) => s.articles);
  const adImpression = useStore((s) => s.adImpression), adClick = useStore((s) => s.adClick);
  const [q, setQ] = useState({ brand: "", model: "", maxPrice: "", fuel: "" });
  const [slide, setSlide] = useState(0);

  const pub = useMemo(() => vehicles.filter((v) => isPublic(v)), [vehicles]);
  const now = Date.now();
  const heroAds = ads.filter((a) => a.placement === "hero" && a.active && a.vehicleId && new Date(a.endAt).getTime() > now && pub.some((v) => v.id === a.vehicleId));
  const hero = heroAds.map((a) => ({ ad: a, v: pub.find((v) => v.id === a.vehicleId)! }));
  const spot = ads.filter((a) => a.placement === "spotlight" && a.active && a.dealerId);
  useEffect(() => { const h = hero[slide % Math.max(1, hero.length)]; if (h) adImpression(h.ad.id); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [slide, hero.length]);
  useEffect(() => { if (hero.length < 2) return; const id = setInterval(() => setSlide((s) => s + 1), 7000); return () => clearInterval(id); }, [hero.length]);

  const sort = (a: Vehicle, b: Vehicle) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  const featured = pub.filter((v) => v.tier === "featured").sort(sort);
  const recent = [...pub].sort(sort);
  const ev = pub.filter((v) => v.fuel === "electric" || v.fuel === "phev").sort(sort);
  const suv = pub.filter((v) => v.body === "suv" || v.body === "crossover").sort(sort);
  const family = pub.filter((v) => v.seats >= 7 || v.body === "minivan" || (v.body === "crossover" && v.seats >= 5 && v.accident === "none")).sort(sort);
  const lux = pub.filter((v) => v.categoryId === "luxury").sort(sort);
  const cheap = pub.filter((v) => v.price <= 30_000_000).sort((a, b) => a.price - b.price);
  const verifiedSellers = [
    ...dealers.filter((d) => d.verified).map((d) => ({ id: d.id, name: d.name, kind: "dealer", n: pub.filter((v) => v.dealerId === d.id).length, href: `/dealers/${d.id}`, tone: d.tone })),
    ...users.filter((u) => u.role === "seller" && u.verified).slice(0, 4).map((u) => ({ id: u.id, name: u.name, kind: "individual", n: pub.filter((v) => v.sellerId === u.id).length, href: `/cars?verified=1&seller=individual`, tone: "#0B0B0D" })),
  ];
  const topBrands = brands.map((b) => ({ b, n: pub.filter((v) => v.brandId === b.id).length })).sort((a, b) => b.n - a.n).slice(0, 12);
  const catList = cats.slice(0, 15).map((c) => ({ c, n: pub.filter((v) => v.categoryId === c.id || v.body === c.body).length }));
  const cur = hero.length ? hero[slide % hero.length] : null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const sp = new URLSearchParams();
    if (q.brand) sp.set("brand", q.brand);
    if (q.model) sp.set("model", q.model);
    if (q.maxPrice) sp.set("maxPrice", String(Number(q.maxPrice) * 1_000_000));
    if (q.fuel) sp.set("fuel", q.fuel);
    router.push("/cars" + (sp.toString() ? "?" + sp : ""));
  };

  return (
    <>
      <section className="relative bg-ink-900 text-white overflow-hidden">
        {cur && (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={cur.v.id} src={photoSrc(cur.v, 0)} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60 animate-fadein" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-ink-900 via-ink-900/70 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink-900 to-transparent" />
        <div className="container relative pt-16 sm:pt-24 pb-28 sm:pb-36">
          <div className="max-w-2xl">
            <div className="eyebrow !text-brass-300 mb-4">{t("home.eyebrow")}</div>
            <h1 className="text-4xl sm:text-6xl font-extrabold leading-[1.05] text-balance">{t("home.title")}</h1>
            <p className="mt-5 text-white/70 text-lg max-w-xl">{t("home.sub")}</p>
            {cur && (
              <Link href={`/cars/${cur.v.id}`} onClick={() => adClick(cur.ad.id)} data-testid="hero-ad" className="mt-8 inline-flex items-center gap-3 rounded-full bg-white/10 backdrop-blur border border-white/15 pl-4 pr-2 py-2 hover:bg-white/15">
                <span className="chip bg-brass-500 text-ink-900">{t("home.ad")}</span>
                <span className="text-sm font-semibold">{brandName(cur.v.brandId)} {cur.v.modelName} {cur.v.year}</span>
                <span className="text-sm text-white/70 hidden sm:inline">{price(cur.v.price, true).main}</span>
                <span className="h-8 w-8 rounded-full bg-white text-ink-900 grid place-items-center"><ArrowRight size={15} /></span>
              </Link>
            )}
          </div>
        </div>
      </section>

      <div className="container relative -mt-20 sm:-mt-24 z-10">
        <form onSubmit={submit} className="card shadow-lift p-4 sm:p-6" role="search" aria-label={t("home.search")}>
          <div className="grid sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-3 items-end">
            <label><span className="label">{t("flt.brand")}</span>
              <select className="input" name="brand" value={q.brand} onChange={(e) => setQ({ ...q, brand: e.target.value, model: "" })}><option value="">{t("common.any")}</option>{[...brands].sort((a, b) => a.name.localeCompare(b.name)).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
            <label><span className="label">{t("flt.model")}</span>
              <select className="input" name="model" disabled={!q.brand} value={q.model} onChange={(e) => setQ({ ...q, model: e.target.value })}><option value="">{t("common.any")}</option>{models.filter((m) => m.brandId === q.brand).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></label>
            <label><span className="label">{t("home.maxprice")}</span>
              <select className="input" name="maxPrice" value={q.maxPrice} onChange={(e) => setQ({ ...q, maxPrice: e.target.value })}><option value="">{t("common.any")}</option>{[20, 30, 50, 80, 120, 200, 400].map((n) => <option key={n} value={n}>{n} {t("flt.millions")}</option>)}</select></label>
            <label><span className="label">{t("veh.fuel")}</span>
              <select className="input" name="fuel" value={q.fuel} onChange={(e) => setQ({ ...q, fuel: e.target.value })}><option value="">{t("common.any")}</option>{["petrol", "diesel", "hybrid", "phev", "electric", "lpg"].map((f) => <option key={f} value={f}>{t("fuel." + f)}</option>)}</select></label>
            <button className="btn btn-primary h-11 px-8" data-testid="home-search">{t("common.search")}</button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs"><span className="text-steel-500 py-1">{t("home.popular")}:</span>
            {[["Prius", "toyota"], ["Land Cruiser", "toyota"], ["Tucson", "hyundai"], ["Forester", "subaru"]].map(([n]) => <Link key={n} href={`/cars?q=${encodeURIComponent(n)}`} className="px-3 py-1 rounded-full bg-ink-900/5 hover:bg-ink-900/10 font-semibold">{n}</Link>)}
            <Link href="/cars?steering=RHD" className="px-3 py-1 rounded-full bg-ink-900/5 hover:bg-ink-900/10 font-semibold">{t("steer.RHD")}</Link>
            <Link href="/cars?eco=any" className="px-3 py-1 rounded-full bg-ink-900/5 hover:bg-ink-900/10 font-semibold">{t("flt.evhybrid")}</Link>
          </div>
        </form>
      </div>

      <div className="container mt-10 grid sm:grid-cols-3 gap-4">
        {[[ShieldCheck, "home.trust1"], [BadgeCheck, "home.trust2"], [Wallet, "home.trust3"]].map(([Ic, k], i) => {
          const I = Ic as typeof ShieldCheck;
          return <div key={i} className="flex gap-4 items-start p-5 rounded-2xl bg-white border border-ink-900/[.06]"><span className="h-11 w-11 rounded-xl bg-ink-900 text-brass-300 grid place-items-center shrink-0"><I size={20} /></span><div><div className="font-bold">{t(k as string)}</div><div className="text-sm text-steel-500 mt-1">{t((k as string) + ".b")}</div></div></div>;
        })}
      </div>

      <Section eyebrow={t("tier.featured")} title={t("home.featured")} href="/cars?sort=recommended"><Grid items={featured.length ? featured : recent} /></Section>
      <Section title={t("home.recent")} href="/cars?sort=newest"><Grid items={recent} n={8} /></Section>

      <Section dark eyebrow={t("home.premiumdealers.eyebrow")} title={t("home.premiumdealers")} href="/dealers">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(spot.length ? spot.map((a) => dealers.find((d) => d.id === a.dealerId)!).filter(Boolean) : dealers).slice(0, 6).map((d) => (
            <Link key={d.id} href={`/dealers/${d.id}`} className="rounded-2xl bg-white/[.06] border border-white/10 p-5 hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-3"><div className="h-12 w-12 rounded-xl grid place-items-center font-extrabold text-lg text-white" style={{ background: d.tone }}>{d.name.slice(0, 1)}</div>
                <div className="min-w-0"><div className="font-bold truncate flex items-center gap-1.5">{d.name}{d.verified && <BadgeCheck size={15} className="text-brass-300 shrink-0" />}</div><div className="text-xs text-white/50">{t("plan." + d.plan)}</div></div></div>
              <p className="text-sm text-white/65 mt-3 line-clamp-2">{d.description}</p>
              <div className="text-xs text-brass-300 mt-3 font-semibold">{t("dealer.cars", { n: pub.filter((v) => v.dealerId === d.id).length })}</div>
            </Link>
          ))}
        </div>
      </Section>

      <Section title={t("home.brands")} href="/cars">
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {topBrands.map(({ b, n }) => (
            <Link key={b.id} href={`/cars?brand=${b.id}`} className="card p-4 text-center hover:shadow-lift transition-shadow">
              <div className="font-display font-extrabold text-lg">{b.name}</div><div className="text-xs text-steel-500 mt-0.5">{n} {t("home.listings")}</div>
            </Link>
          ))}
        </div>
      </Section>

      <Section title={t("home.categories")} href="/cars">
        <div className="flex flex-wrap gap-2.5">
          {catList.map(({ c, n }) => <Link key={c.id} href={`/cars?category=${c.id}`} className="h-11 px-5 inline-flex items-center gap-2 rounded-full bg-white border border-ink-900/10 hover:border-ink-900/40 text-sm font-semibold">{c[lang]}<span className="text-steel-400 text-xs">{n}</span></Link>)}
        </div>
      </Section>

      <Section eyebrow={t("home.ev.eyebrow")} title={t("home.ev")} href="/cars?eco=any"><Grid items={ev} /></Section>
      <Section title={t("home.suv")} href="/cars?category=suv"><Grid items={suv} /></Section>
      <Section title={t("home.family")} href="/cars?seats=7"><Grid items={family} /></Section>
      <Section title={t("home.luxury")} href="/cars?category=luxury"><Grid items={lux} /></Section>
      <Section title={t("home.affordable")} href="/cars?maxPrice=30000000&sort=price_asc"><Grid items={cheap} /></Section>

      <Section title={t("home.verified")} href="/dealers">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {verifiedSellers.slice(0, 8).map((s) => (
            <Link key={s.id} href={s.href} className="card p-4 flex items-center gap-3 hover:shadow-lift transition-shadow">
              <div className="h-11 w-11 rounded-xl grid place-items-center text-white font-extrabold" style={{ background: s.tone }}>{s.name.replace(/[^\p{L}]/gu, "").slice(0, 1)}</div>
              <div className="min-w-0"><div className="font-bold text-sm truncate flex items-center gap-1">{s.name}<BadgeCheck size={14} className="text-brass-600 shrink-0" /></div><div className="text-xs text-steel-500">{s.kind === "dealer" ? t("common.dealer") : t("common.individual")} · {s.n} {t("home.listings")}</div></div>
            </Link>
          ))}
        </div>
      </Section>

      <Section title={t("nav.news")} href="/news">
        <div className="grid md:grid-cols-3 gap-5">
          {articles.slice(0, 3).map((a) => (
            <Link key={a.id} href={`/news/${a.id}`} className="card overflow-hidden hover:shadow-lift transition-shadow group">
              <div className="h-36 relative" style={{ background: `linear-gradient(135deg, ${a.tone}, #0B0B0D)` }}><span className="absolute left-4 bottom-4 chip bg-white/90 text-ink-900">{lang === "mn" ? a.tagMn : a.tagEn}</span></div>
              <div className="p-5"><h3 className="font-bold leading-snug group-hover:underline">{lang === "mn" ? a.mn : a.en}</h3><div className="text-xs text-steel-500 mt-2">{fmtDate(a.at, lang)}</div></div>
            </Link>
          ))}
        </div>
      </Section>

      <Section eyebrow={t("common.estimate")} title={t("nav.calculator")} href="/calculator"><LoanCalculator initialPrice={60_000_000} compact /></Section>

      <section className="container mt-16">
        <div className="rounded-3xl bg-ink-900 text-white p-8 sm:p-12 grid md:grid-cols-[1.4fr_1fr] gap-8 items-center overflow-hidden relative">
          <div><h2 className="text-3xl font-extrabold">{t("home.cta.title")}</h2><p className="text-white/65 mt-3 max-w-lg">{t("home.cta.body")}</p>
            <div className="flex flex-wrap gap-3 mt-6"><Link href="/register?role=seller" className="btn btn-accent">{t("nav.sell")}</Link><Link href="/register?role=dealer_owner" className="btn btn-outline !bg-transparent !text-white !border-white/30">{t("home.dealerjoin")}</Link></div></div>
          <div className="hidden md:flex justify-end gap-6 text-center text-white/80">
            {[[Car, pub.length, "home.stat.cars"], [Users, dealers.length, "home.stat.dealers"], [Truck, PROVINCES.length, "home.stat.regions"], [Gem, models.length, "home.stat.models"]].slice(0, 3).map(([Ic, n, k], i) => { const I = Ic as typeof Car; return <div key={i}><I className="mx-auto text-brass-300" size={22} /><div className="font-display text-3xl font-extrabold mt-2">{n as number}</div><div className="text-xs text-white/50">{t(k as string)}</div></div>; })}
          </div>
        </div>
      </section>
    </>
  );
}
