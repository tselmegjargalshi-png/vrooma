"use client";
import { useMemo, useState } from "react";
import { Check, QrCode, Smartphone, Landmark, Banknote } from "lucide-react";
import { Modal, Field } from "./ui";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/hooks";
import { getPackage } from "@/lib/seed";
import { fmtMnt } from "@/lib/format";
import type { PayMethod, Payment } from "@/lib/types";

function FakeQr({ seed }: { seed: string }) {
  const cells = useMemo(() => { let h = 0; for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0; const out: boolean[] = []; for (let i = 0; i < 441; i++) { h = (h * 1664525 + 1013904223) >>> 0; out.push((h >>> 20) % 2 === 0); } return out; }, [seed]);
  return (
    <svg viewBox="0 0 21 21" className="w-40 h-40 bg-white rounded-xl p-2 border border-ink-900/10" aria-label="QR (demo)" role="img">
      {cells.map((on, i) => { const x = i % 21, y = Math.floor(i / 21); const finder = (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13); return on && !finder ? <rect key={i} x={x} y={y} width="1" height="1" fill="#0B0B0D" /> : null; })}
      {[[0, 0], [14, 0], [0, 14]].map(([x, y]) => <g key={x + "-" + y}><rect x={x} y={y} width="7" height="7" fill="#0B0B0D" /><rect x={x + 1} y={y + 1} width="5" height="5" fill="#fff" /><rect x={x + 2} y={y + 2} width="3" height="3" fill="#0B0B0D" /></g>)}
    </svg>
  );
}

export function PayModal({ packageId, vehicleId, onClose, onDone }: { packageId: string | null; vehicleId?: string; onClose: () => void; onDone?: (p: Payment) => void }) {
  const { t } = useT();
  const purchase = useStore((s) => s.purchase), campaigns = useStore((s) => s.campaigns);
  const [method, setMethod] = useState<PayMethod>("qpay");
  const [code, setCode] = useState("");
  const [done, setDone] = useState<Payment | null>(null);
  const pk = packageId ? getPackage(packageId) : null;
  const camp = campaigns.find((c) => c.active && code && c.code.toLowerCase() === code.trim().toLowerCase() && new Date(c.endAt) > new Date());
  const amount = pk ? Math.round((pk.priceMnt * (100 - (camp?.discount ?? 0))) / 100) : 0;
  const close = () => { setDone(null); setCode(""); onClose(); };
  const opts: [PayMethod, typeof QrCode][] = [["qpay", QrCode], ["socialpay", Smartphone], ["bank", Landmark], ["cash", Banknote]];
  const ref = useMemo(() => "VR" + Math.floor(100000 + Math.random() * 899999), [packageId]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Modal open={!!pk} onClose={close} title={t("pay.title")}>
      {pk && (done ? (
        <div className="text-center py-4" data-testid="pay-done">
          <div className="mx-auto h-14 w-14 rounded-full bg-ok/10 text-ok grid place-items-center mb-3"><Check size={28} /></div>
          <h3 className="font-bold text-lg">{done.status === "paid_simulated" ? t("pay.done.paid") : t("pay.done.pending")}</h3>
          <p className="text-sm text-steel-500 mt-1">{t("pay.ref")}: <b>{done.ref}</b> · {fmtMnt(done.amount)}</p>
          <p className="text-xs text-steel-500 mt-3">{t("pay.simulated.note")}</p>
          <button className="btn btn-primary mt-5" onClick={close}>{t("common.close")}</button>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="rounded-2xl bg-warn/10 text-warn px-4 py-3 text-xs font-semibold" role="note">{t("pay.simulated.note")}</div>
          <div className="flex items-center justify-between"><div><div className="font-bold">{t("pk." + pk.id)}</div><div className="text-xs text-steel-500">{pk.days} {t("pay.days")}</div></div>
            <div className="text-right">{camp && <div className="text-xs line-through text-steel-400">{fmtMnt(pk.priceMnt)}</div>}<div className="font-display text-2xl font-extrabold" data-testid="pay-amount">{fmtMnt(amount)}</div></div></div>
          <Field label={t("pay.promocode")} hint={camp ? t("pay.promo.ok", { n: camp.discount }) : t("pay.promo.hint")}><input name="promo" className="input uppercase" value={code} onChange={(e) => setCode(e.target.value)} placeholder="WINTER10" /></Field>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={t("pay.method")}>
            {opts.map(([m, Ic]) => <button key={m} role="radio" aria-checked={method === m} onClick={() => setMethod(m)} data-testid={"pay-" + m} className={`flex items-center gap-2 px-3 h-12 rounded-xl border-2 text-sm font-semibold ${method === m ? "border-ink-900 bg-ink-900 text-white" : "border-ink-900/10"}`}><Ic size={17} />{t("pay." + m)}</button>)}
          </div>
          <div className="rounded-2xl bg-bone-100 p-4 text-sm">
            {method === "qpay" && <div className="flex gap-4 items-center"><FakeQr seed={ref} /><div className="text-xs text-steel-600 space-y-1"><p>{t("pay.qpay.help")}</p><p>{t("pay.invoice")}: <b>{ref}</b></p></div></div>}
            {method === "socialpay" && <div className="space-y-2"><p className="text-xs text-steel-600">{t("pay.social.help")}</p><input className="input" name="socialPhone" inputMode="tel" placeholder="9911 2233" aria-label={t("common.phone")} /></div>}
            {method === "bank" && <div className="text-xs space-y-1 text-steel-700"><p>{t("pay.bank.help")}</p><p>{t("pay.bank.name")}: <b>Vrooma Demo LLC</b></p><p>{t("pay.bank.account")}: <b>DEMO 0000 0000 00</b></p><p>{t("pay.ref")}: <b>{ref}</b></p></div>}
            {method === "cash" && <p className="text-xs text-steel-700">{t("pay.cash.help")}</p>}
          </div>
          <button className="btn btn-primary w-full" data-testid="pay-confirm" onClick={() => { const p = purchase({ packageId: pk.id, vehicleId, method, code }); setDone(p); onDone?.(p); }}>{method === "qpay" || method === "socialpay" ? t("pay.simulate") : t("pay.submit")}</button>
        </div>
      ))}
    </Modal>
  );
}
