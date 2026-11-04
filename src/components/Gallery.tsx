"use client";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2, X, Play, Pause } from "lucide-react";
import type { Vehicle, PhotoKind } from "@/lib/types";
import { photoSrc, useT } from "@/lib/hooks";
import { carArt } from "@/lib/carArt";

type Tab = PhotoKind | "all" | "video";
export function Gallery({ v, title }: { v: Vehicle; title: string }) {
  const { t } = useT();
  const [tab, setTab] = useState<Tab>("all");
  const [idx, setIdx] = useState(0);
  const [full, setFull] = useState(false);
  const [playing, setPlaying] = useState(false);
  const all = v.photos.map((p, i) => ({ ...p, i, src: photoSrc(v, i) }));
  const list = tab === "all" || tab === "video" ? all : all.filter((p) => p.kind === tab);
  const kinds = (["exterior", "interior", "engine", "dashboard"] as PhotoKind[]).filter((k) => all.some((p) => p.kind === k));
  const cur = list[Math.min(idx, Math.max(0, list.length - 1))];
  const go = (d: number) => setIdx((i) => (i + d + list.length) % list.length);

  useEffect(() => {
    if (!full) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") setFull(false); if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); };
    document.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", h); document.body.style.overflow = ""; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [full, list.length]);

  const tabs: { id: Tab; label: string }[] = [{ id: "all", label: t("gal.all") }, ...kinds.map((k) => ({ id: k as Tab, label: t("gal." + k) })), { id: "video", label: t("gal.video") }];
  const videoUrl = v.videoUrl;
  const isFile = videoUrl && /\.(mp4|webm)(\?|$)/i.test(videoUrl);
  const yt = videoUrl && videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w]{6,})/);

  return (
    <div data-testid="gallery">
      <div className="relative rounded-3xl overflow-hidden bg-ink-800 aspect-[16/10] group">
        {tab === "video" ? (
          videoUrl ? (
            isFile ? <video src={videoUrl} controls className="absolute inset-0 w-full h-full bg-black" />
              : yt ? <iframe className="absolute inset-0 w-full h-full" src={`https://www.youtube-nocookie.com/embed/${yt[1]}`} title={title} allowFullScreen />
              : <div className="absolute inset-0 grid place-items-center text-white p-6 text-center"><a href={videoUrl} target="_blank" rel="noopener noreferrer" className="btn btn-accent">{t("gal.openvideo")}</a></div>
          ) : v.hasVideo ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={carArt({ body: v.body, color: v.color, interiorColor: v.interiorColor, fuel: v.fuel, kind: "exterior", variant: 1, seed: v.id })} alt="" className={`absolute inset-0 w-full h-full object-cover ${playing ? "animate-[pan_8s_ease-in-out_infinite_alternate]" : ""}`} style={playing ? { transform: "scale(1.12)" } : undefined} />
              <button onClick={() => setPlaying(!playing)} aria-label={playing ? "Pause" : "Play"} className="absolute inset-0 grid place-items-center"><span className="h-16 w-16 rounded-full bg-white/90 grid place-items-center">{playing ? <Pause size={24} /> : <Play size={24} className="ml-1" />}</span></button>
              <span className="absolute left-4 bottom-4 chip bg-ink-900/80 text-white">{t("gal.demovideo")}</span>
            </>
          ) : <div className="absolute inset-0 grid place-items-center text-white/70 text-sm">{t("gal.novideo")}</div>
        ) : cur ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cur.src} alt={`${title} ${t("gal." + cur.kind)}`} className="absolute inset-0 w-full h-full object-cover" />
            <button onClick={() => setFull(true)} aria-label={t("gal.fullscreen")} data-testid="fullscreen" className="absolute right-3 top-3 h-10 w-10 rounded-full bg-white/90 grid place-items-center hover:bg-white"><Maximize2 size={17} /></button>
            {list.length > 1 && (<>
              <button onClick={() => go(-1)} aria-label={t("common.prev")} className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 grid place-items-center hover:bg-white"><ChevronLeft size={18} /></button>
              <button onClick={() => go(1)} aria-label={t("common.next")} className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 grid place-items-center hover:bg-white"><ChevronRight size={18} /></button>
            </>)}
            <span className="absolute left-4 bottom-4 chip bg-ink-900/80 text-white">{Math.min(idx, list.length - 1) + 1} / {list.length}</span>
          </>
        ) : null}
      </div>
      <div className="flex gap-1.5 mt-3 overflow-x-auto scrollbar-none">
        {tabs.map((x) => <button key={x.id} onClick={() => { setTab(x.id); setIdx(0); }} aria-pressed={tab === x.id} className={`h-8 px-3.5 rounded-full text-xs font-semibold whitespace-nowrap border ${tab === x.id ? "bg-ink-900 text-white border-ink-900" : "bg-white border-ink-900/15"}`}>{x.label}</button>)}
      </div>
      {tab !== "video" && list.length > 1 && (
        <div className="grid grid-cols-5 sm:grid-cols-7 gap-2 mt-3">
          {list.map((p, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <button key={p.i} onClick={() => setIdx(i)} aria-label={`${i + 1}`} className={`relative aspect-[4/3] rounded-xl overflow-hidden border-2 ${i === idx ? "border-brass-500" : "border-transparent opacity-80 hover:opacity-100"}`}><img src={p.src} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" /></button>
          ))}
        </div>
      )}
      {full && cur && (
        <div className="fixed inset-0 z-[80] bg-black/95 flex items-center justify-center" role="dialog" aria-modal="true" aria-label={t("gal.fullscreen")} data-testid="lightbox">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cur.src} alt={title} className="max-h-[88vh] max-w-[96vw] object-contain rounded-xl" />
          <button onClick={() => setFull(false)} aria-label={t("common.close")} className="absolute right-4 top-4 h-11 w-11 rounded-full bg-white/15 text-white grid place-items-center hover:bg-white/25"><X size={20} /></button>
          {list.length > 1 && (<>
            <button onClick={() => go(-1)} aria-label={t("common.prev")} className="absolute left-4 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-white/15 text-white grid place-items-center hover:bg-white/25"><ChevronLeft size={22} /></button>
            <button onClick={() => go(1)} aria-label={t("common.next")} className="absolute right-4 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-white/15 text-white grid place-items-center hover:bg-white/25"><ChevronRight size={22} /></button>
          </>)}
        </div>
      )}
    </div>
  );
}
