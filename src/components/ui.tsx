"use client";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { X, Inbox } from "lucide-react";
import { useT } from "@/lib/hooks";
import { useStore } from "@/lib/store";

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  const { t } = useT();
  const ref = useRef<HTMLDivElement>(null);
  const tid = useId();
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; prev?.focus(); };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-labelledby={tid}>
      <div className="absolute inset-0 bg-ink-900/60 backdrop-blur-sm" onClick={onClose} />
      <div ref={ref} tabIndex={-1} className={`relative bg-white w-full ${wide ? "sm:max-w-3xl" : "sm:max-w-lg"} max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-lift animate-fadein focus:outline-none`}>
        <div className="sticky top-0 bg-white/95 backdrop-blur flex items-center justify-between px-5 py-4 border-b border-ink-900/[.06] z-10">
          <h2 id={tid} className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="h-9 w-9 grid place-items-center rounded-full hover:bg-ink-900/5" aria-label={t("common.close")}><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Empty({ title, body, action, icon }: { title: string; body?: string; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="text-center py-14 px-4">
      <div className="mx-auto h-14 w-14 rounded-2xl bg-ink-900/5 grid place-items-center text-steel-500 mb-4">{icon ?? <Inbox size={24} />}</div>
      <h3 className="text-lg font-bold">{title}</h3>
      {body && <p className="text-sm text-steel-500 mt-1.5 max-w-sm mx-auto">{body}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-ink-900/[.07] ${className}`} />;
}

export function Field({ label, children, hint, error }: { label: string; children: ReactNode; hint?: string; error?: string }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {hint && !error && <span className="block text-xs text-steel-500 mt-1">{hint}</span>}
      {error && <span className="block text-xs text-bad mt-1" role="alert">{error}</span>}
    </label>
  );
}

const TONES: Record<string, string> = {
  ok: "bg-ok/10 text-ok", warn: "bg-warn/10 text-warn", bad: "bg-bad/10 text-bad", ink: "bg-ink-900 text-white", brass: "bg-brass-500/15 text-brass-700", gray: "bg-ink-900/[.06] text-steel-600", blue: "bg-[#2C4A7A]/10 text-[#2C4A7A]",
};
export function Badge({ tone = "gray", children, className = "" }: { tone?: keyof typeof TONES; children: ReactNode; className?: string }) {
  return <span className={`chip ${TONES[tone]} ${className}`}>{children}</span>;
}
export const statusTone = (s: string) => ({ active: "ok", pending: "warn", paused: "gray", sold: "blue", rejected: "bad", expired: "bad" } as Record<string, string>)[s] ?? "gray";

export function Stat({ label, value, sub, icon }: { label: string; value: ReactNode; sub?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-steel-500">{label}</div>
        {icon && <div className="text-brass-600">{icon}</div>}
      </div>
      <div className="mt-2 font-display text-2xl sm:text-[28px] font-extrabold tracking-tight">{value}</div>
      {sub && <div className="text-xs text-steel-500 mt-1">{sub}</div>}
    </div>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string; count?: number }[]; value: T; onChange: (t: T) => void }) {
  return (
    <div className="flex gap-1 overflow-x-auto scrollbar-none -mx-1 px-1" role="tablist">
      {tabs.map((x) => (
        <button key={x.id} role="tab" aria-selected={value === x.id} onClick={() => onChange(x.id)}
          className={`h-9 px-4 rounded-full text-[13px] font-semibold whitespace-nowrap transition-colors ${value === x.id ? "bg-ink-900 text-white" : "text-steel-600 hover:bg-ink-900/5"}`}>
          {x.label}{x.count != null && <span className={`ml-1.5 ${value === x.id ? "text-white/60" : "text-steel-400"}`}>{x.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Toast() {
  const toast = useStore((s) => s.toast);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => useStore.setState({ toast: null }), 3200);
    return () => clearTimeout(id);
  }, [toast]);
  if (!toast) return null;
  return (
    <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-[90] animate-fadein" role="status" aria-live="polite">
      <div className={`px-5 py-3 rounded-full text-sm font-semibold shadow-lift ${toast.tone === "ok" ? "bg-ink-900 text-white" : "bg-bad text-white"}`}>{toast.text}</div>
    </div>
  );
}

export function PageHead({ title, sub, actions }: { title: string; sub?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
      <div><h1 className="text-2xl sm:text-3xl font-extrabold">{title}</h1>{sub && <p className="text-sm text-steel-500 mt-1">{sub}</p>}</div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Spinner() {
  return <div className="h-5 w-5 rounded-full border-2 border-ink-900/15 border-t-ink-900 animate-spin" />;
}
