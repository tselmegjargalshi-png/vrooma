"use client";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/hooks";
import { fmtDate } from "@/lib/format";
import { PageHead } from "@/components/ui";

export default function News() {
  const { t, lang } = useT();
  const articles = useStore((s) => s.articles);
  return (
    <div className="container py-8">
      <PageHead title={t("nav.news")} sub={t("news.sub")} />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {articles.map((a) => (
          <Link key={a.id} href={`/news/view?id=${a.id}`} className="card overflow-hidden hover:shadow-lift transition-shadow group">
            <div className="h-44 relative" style={{ background: `linear-gradient(135deg, ${a.tone}, #0B0B0D)` }}><span className="absolute left-4 bottom-4 chip bg-white/90 text-ink-900">{lang === "mn" ? a.tagMn : a.tagEn}</span></div>
            <div className="p-5"><h2 className="font-bold text-lg leading-snug group-hover:underline">{lang === "mn" ? a.mn : a.en}</h2><p className="text-sm text-steel-600 mt-2 line-clamp-2">{lang === "mn" ? a.bodyMn : a.bodyEn}</p><div className="text-xs text-steel-500 mt-3">{fmtDate(a.at, lang)}</div></div>
          </Link>
        ))}
      </div>
    </div>
  );
}
