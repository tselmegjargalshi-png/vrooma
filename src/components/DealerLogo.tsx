import type { Dealer } from "@/lib/types";
export function DealerLogo({ d, size = 56 }: { d: Pick<Dealer, "name" | "tone" | "logo">; size?: number }) {
  const style = { width: size, height: size, borderRadius: size * 0.28 };
  // eslint-disable-next-line @next/next/no-img-element
  if (d.logo) return <img src={d.logo} alt={d.name} style={style} className="object-cover shrink-0 bg-white border border-ink-900/10" />;
  return <div style={{ ...style, background: d.tone, fontSize: size * 0.4 }} className="grid place-items-center text-white font-extrabold shrink-0">{d.name.slice(0, 1)}</div>;
}
