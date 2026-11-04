"use client";
import { fmtNum } from "@/lib/format";

const BRASS = "#B8925A", INK = "#0B0B0D", MUTE = "#C9C6BE";

export function BarChart({ data, height = 160, color = BRASS, format = fmtNum }: { data: { label: string; value: number }[]; height?: number; color?: string; format?: (n: number) => string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div role="img" aria-label={data.map((d) => `${d.label} ${format(d.value)}`).join(", ")}>
      <div className="flex items-end gap-1.5 sm:gap-2" style={{ height }}>
        {data.map((d) => (
          <div key={d.label} className="flex-1 flex flex-col items-center justify-end h-full min-w-0 group">
            <div className="text-[10px] font-semibold text-steel-500 mb-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{format(d.value)}</div>
            <div className="w-full rounded-t-md transition-all" style={{ height: `${Math.max(2, (d.value / max) * 100)}%`, background: color }} title={`${d.label}: ${format(d.value)}`} />
          </div>
        ))}
      </div>
      <div className="flex gap-1.5 sm:gap-2 mt-2">{data.map((d) => <div key={d.label} className="flex-1 text-center text-[10px] text-steel-500 truncate">{d.label}</div>)}</div>
    </div>
  );
}

export function LineChart({ values, height = 120, color = INK }: { values: number[]; height?: number; color?: string }) {
  const w = 600, max = Math.max(1, ...values), step = w / Math.max(1, values.length - 1);
  const pts = values.map((v, i) => `${i * step},${height - 8 - (v / max) * (height - 20)}`);
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" preserveAspectRatio="none" role="img" aria-label="trend">
      <polyline points={`0,${height} ${pts.join(" ")} ${w},${height}`} fill={BRASS} opacity=".12" />
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function HBars({ data, format = fmtNum }: { data: { label: string; value: number; tone?: string }[]; format?: (n: number) => string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <ul className="space-y-2.5">
      {data.map((d) => (
        <li key={d.label}>
          <div className="flex justify-between text-xs mb-1"><span className="font-medium truncate pr-2">{d.label}</span><span className="text-steel-500 tabular-nums">{format(d.value)}</span></div>
          <div className="h-2 rounded-full bg-ink-900/[.06] overflow-hidden"><div className="h-full rounded-full" style={{ width: `${(d.value / max) * 100}%`, background: d.tone ?? BRASS }} /></div>
        </li>
      ))}
    </ul>
  );
}
export const CHART_MUTE = MUTE;
