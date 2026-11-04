"use client";
import { useMemo, useState } from "react";
import { Trash2, Plus, Info } from "lucide-react";
import { calcLoan, TERMS } from "@/lib/finance";
import { fmtMnt, fmtUsd } from "@/lib/format";
import { useT } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { Field } from "./ui";

interface Scenario { id: number; price: number; down: number; rate: number; months: number; monthly: number; interest: number; total: number }

export function LoanCalculator({ initialPrice = 60_000_000, compact = false }: { initialPrice?: number; compact?: boolean }) {
  const { t } = useT();
  const usd = useStore((s) => s.showUsd);
  const [price, setPrice] = useState(String(initialPrice));
  const [downPct, setDownPct] = useState(30);
  const [downAmt, setDownAmt] = useState(String(Math.round(initialPrice * 0.3)));
  const [rate, setRate] = useState("18");
  const [months, setMonths] = useState(36);
  const [list, setList] = useState<Scenario[]>([]);

  const priceN = Number(price) || 0;
  const downN = Math.min(priceN, Number(downAmt) || 0);
  const r = useMemo(() => calcLoan({ price: priceN, down: downN, annualRate: Number(rate) || 0, months }), [priceN, downN, rate, months]);
  const money = (n: number) => fmtMnt(n) + (usd ? ` (${fmtUsd(n)})` : "");

  const setP = (v: string) => { setPrice(v); setDownAmt(String(Math.round((Number(v) || 0) * downPct / 100))); };
  const setPct = (p: number) => { setDownPct(p); setDownAmt(String(Math.round(priceN * p / 100))); };
  const setAmt = (v: string) => { setDownAmt(v); setDownPct(priceN ? Math.min(100, Math.round(((Number(v) || 0) / priceN) * 100)) : 0); };

  return (
    <div className="card overflow-hidden" data-testid="calculator">
      <div className={`grid ${compact ? "" : "lg:grid-cols-2"}`}>
        <div className="p-5 sm:p-7 space-y-5">
          <Field label={`${t("calc.price")} (₮)`}><input name="price" className="input" type="number" min={0} inputMode="numeric" value={price} onChange={(e) => setP(e.target.value)} data-testid="calc-price" /></Field>
          <div>
            <div className="flex items-center justify-between"><span className="label !mb-0">{t("calc.down")}</span><span className="text-sm font-bold" data-testid="calc-downpct">{downPct}%</span></div>
            <input aria-label={t("calc.down")} type="range" min={0} max={90} step={5} value={downPct} onChange={(e) => setPct(Number(e.target.value))} className="w-full accent-ink-900 mt-2" />
            <input aria-label={t("calc.downamount")} name="down" className="input mt-2" type="number" min={0} value={downAmt} onChange={(e) => setAmt(e.target.value)} data-testid="calc-down" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("calc.rate")}><input name="rate" className="input" type="number" min={0} max={80} step="0.1" value={rate} onChange={(e) => setRate(e.target.value)} data-testid="calc-rate" /></Field>
            <Field label={t("calc.term")}>
              <select name="months" className="input" value={months} onChange={(e) => setMonths(Number(e.target.value))} data-testid="calc-term">{TERMS.map((m) => <option key={m} value={m}>{m} {t("calc.months")}</option>)}</select>
            </Field>
          </div>
          <div className="flex gap-2 flex-wrap">
            {TERMS.map((m) => <button key={m} onClick={() => setMonths(m)} aria-pressed={months === m} className={`h-8 px-3 rounded-full text-xs font-semibold border ${months === m ? "bg-ink-900 text-white border-ink-900" : "border-ink-900/15 bg-white"}`}>{m}</button>)}
          </div>
        </div>
        <div className="bg-ink-900 text-white p-5 sm:p-7 flex flex-col">
          <div className="text-[11px] uppercase tracking-[.16em] text-brass-300 font-bold">{t("calc.monthly")}</div>
          <div className="font-display text-4xl sm:text-5xl font-extrabold mt-1.5 tracking-tight" data-testid="calc-monthly">{fmtMnt(r.monthly)}</div>
          {usd && <div className="text-sm text-white/60">{fmtUsd(r.monthly)}</div>}
          <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
            <div><dt className="text-white/50 text-xs">{t("calc.downamount")}</dt><dd className="font-semibold mt-0.5" data-testid="calc-out-down">{money(r.down)}</dd></div>
            <div><dt className="text-white/50 text-xs">{t("calc.financed")}</dt><dd className="font-semibold mt-0.5" data-testid="calc-out-financed">{money(r.financed)}</dd></div>
            <div><dt className="text-white/50 text-xs">{t("calc.interest")}</dt><dd className="font-semibold mt-0.5" data-testid="calc-out-interest">{money(r.totalInterest)}</dd></div>
            <div><dt className="text-white/50 text-xs">{t("calc.repayment")}</dt><dd className="font-semibold mt-0.5" data-testid="calc-out-total">{money(r.totalRepayment)}</dd></div>
          </dl>
          <button onClick={() => setList((l) => [...l, { id: Date.now(), price: priceN, down: r.down, rate: Number(rate) || 0, months, monthly: r.monthly, interest: r.totalInterest, total: r.totalRepayment }].slice(-4))} className="btn btn-accent mt-6 self-start" data-testid="calc-add"><Plus size={16} />{t("calc.addscenario")}</button>
          <p className="mt-auto pt-5 text-[11px] text-white/50 flex gap-1.5"><Info size={13} className="shrink-0 mt-0.5" />{t("calc.disclaimer")}</p>
        </div>
      </div>
      {!compact && (
        <div className="p-5 sm:p-7 border-t border-ink-900/[.07] grid gap-8">
          <div>
            <h3 className="font-bold mb-3">{t("calc.allterms")}</h3>
            <div className="overflow-x-auto"><table className="tbl"><thead><tr><th>{t("calc.term")}</th><th>{t("calc.monthly")}</th><th>{t("calc.interest")}</th><th>{t("calc.repayment")}</th></tr></thead>
              <tbody>{TERMS.map((m) => { const x = calcLoan({ price: priceN, down: downN, annualRate: Number(rate) || 0, months: m }); return <tr key={m} className={m === months ? "bg-brass-500/10" : ""}><td className="font-semibold">{m} {t("calc.months")}</td><td>{fmtMnt(x.monthly)}</td><td>{fmtMnt(x.totalInterest)}</td><td>{fmtMnt(x.totalRepayment)}</td></tr>; })}</tbody></table></div>
          </div>
          <div>
            <h3 className="font-bold mb-3">{t("calc.scenarios")}</h3>
            {list.length === 0 ? <p className="text-sm text-steel-500">{t("calc.scenarios.empty")}</p> : (
              <div className="overflow-x-auto"><table className="tbl" data-testid="scenarios"><thead><tr><th>#</th><th>{t("calc.price")}</th><th>{t("calc.down")}</th><th>{t("calc.rate")}</th><th>{t("calc.term")}</th><th>{t("calc.monthly")}</th><th>{t("calc.interest")}</th><th /></tr></thead>
                <tbody>{list.map((s, i) => { const best = Math.min(...list.map((x) => x.total)) === s.total && list.length > 1; return (
                  <tr key={s.id} className={best ? "bg-ok/10" : ""}><td>{i + 1}</td><td>{fmtMnt(s.price)}</td><td>{fmtMnt(s.down)}</td><td>{s.rate}%</td><td>{s.months}</td><td className="font-semibold">{fmtMnt(s.monthly)}</td><td>{fmtMnt(s.interest)}{best && <span className="ml-2 chip bg-ok/15 text-ok">{t("calc.lowest")}</span>}</td>
                    <td><button aria-label={t("common.delete")} onClick={() => setList((l) => l.filter((x) => x.id !== s.id))} className="h-8 w-8 grid place-items-center rounded-full hover:bg-ink-900/5"><Trash2 size={15} /></button></td></tr>); })}</tbody></table></div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
