export function LogoMark({ size = 32, tone = "dark" }: { size?: number; tone?: "dark" | "light" }) {
  const bg = tone === "dark" ? "#0B0B0D" : "#F6F5F2";
  const fg = tone === "dark" ? "#F6F5F2" : "#0B0B0D";
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <rect width="40" height="40" rx="11" fill={bg} />
      <path d="M9 11 L20 30 L31 11" fill="none" stroke={fg} strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.5 29.2 H34" stroke="#B8925A" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
export function Logo({ tone = "dark", size = 32 }: { tone?: "dark" | "light"; size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark size={size} tone={tone} />
      <span className={`font-display text-[22px] font-extrabold leading-none tracking-tight ${tone === "dark" ? "text-ink-900" : "text-white"}`}>
        Vrooma
      </span>
    </span>
  );
}
