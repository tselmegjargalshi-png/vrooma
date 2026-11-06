"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/hooks";
import { fmtDate } from "@/lib/format";
import { Empty } from "@/components/ui";

function ArticleInner({ id }: { id: string }) {
  const { t, lang } = useT();
  const a = useStore((s) => s.articles).find((x) => x.id === id);
  if (!a) return <div className="container py-16"><Empty title={t("err.notfound")} action={<Link href="/news" className="btn btn-primary">{t("nav.news")}</Link>} /></div>;
  return (
    <article className="container max-w-3xl py-10">
      <Link href="/news" className="text-sm font-semibold text-steel-500 hover:text-ink-900">← {t("nav.news")}</Link>
      <div className="h-56 rounded-3xl mt-5" style={{ background: `linear-gradient(135deg, ${a.tone}, #0B0B0D)` }} />
      <div className="eyebrow mt-8">{lang === "mn" ? a.tagMn : a.tagEn} · {fmtDate(a.at, lang)}</div>
      <h1 className="text-3xl sm:text-4xl font-extrabold mt-3 text-balance">{lang === "mn" ? a.mn : a.en}</h1>
      <p className="text-lg leading-relaxed text-ink-700 mt-6">{lang === "mn" ? a.bodyMn : a.bodyEn}</p>
      <div className="mt-8 flex gap-3"><Link href="/compare" className="btn btn-outline">{t("nav.compare")}</Link><Link href="/calculator" className="btn btn-outline">{t("nav.calculator")}</Link></div>
    </article>
  );
}

function ArticleQuery() { const id = useSearchParams().get("id") ?? ""; return <ArticleInner key={id} id={id} />; }
export default function Article() { return <Suspense fallback={null}><ArticleQuery /></Suspense>; }
