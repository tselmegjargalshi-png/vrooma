"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { useBrandName, useT, useUser } from "@/lib/hooks";
import { Empty, Field, PageHead } from "@/components/ui";
import { Guard } from "@/components/Guard";
import { CHECKS, type CheckKey, type Report } from "@/lib/types";
import { toLocalInput, uid } from "@/lib/format";

async function compress(file: File, max = 1100): Promise<string> {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas"); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.75);
}

function Editor({ id }: { id: string }) {
  const { t } = useT();
  const user = useUser()!;
  const router = useRouter();
  const brandName = useBrandName();
  const st = useStore();
  const ap = st.appointments.find((a) => a.id === id);
  const v = st.vehicles.find((x) => x.id === ap?.vehicleId);
  const existing = st.reports.find((r) => r.id === ap?.reportId);
  const [r, setR] = useState<Report | null>(() => existing ?? (ap && v ? {
    id: uid("rp"), vehicleId: v.id, appointmentId: ap.id, inspectorId: user.id, date: new Date().toISOString(), odometer: v.mileage,
    checks: Object.fromEntries(CHECKS.map((k) => [k, { score: 4, note: "" }])) as Report["checks"], accidentFound: v.accident !== "none", accidentNote: "", maintenance: "", notes: "", photos: [], status: "draft", demo: false,
  } : null));
  const [errs, setErrs] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);
  if (!ap || !v || !r) return <Empty title={t("err.notfound")} />;
  if (user.role !== "inspector" && !["admin", "super_admin"].includes(user.role)) return <Empty title={t("err.forbidden")} body={t("err.forbidden.body")} />;
  const patch = (p: Partial<Report>) => setR((x) => ({ ...x!, ...p }));
  const save = (status: "draft" | "published") => {
    const er: Record<string, string> = {};
    if (!(r.odometer >= 0)) er.odometer = t("common.required");
    if (status === "published" && r.accidentFound && !r.accidentNote.trim()) er.accidentNote = t("insp.accnote.required");
    setErrs(er);
    if (Object.keys(er).length) return;
    st.saveReport({ ...r, status });
    st.flash(status === "published" ? t("insp.publishedmsg") : t("common.saved"));
    router.push("/dashboard/inspections");
  };
  return (
    <>
      <PageHead title={t("insp.reporttitle")} sub={`${brandName(v.brandId)} ${v.modelName} ${v.year}`} />
      <div className="rounded-2xl bg-bone-200 px-4 py-3 text-xs text-steel-700 mb-5">{t("insp.disclaimer")}</div>
      <form className="space-y-6" onSubmit={(e) => e.preventDefault()} data-testid="report-form">
        <section className="card p-5 sm:p-6 grid sm:grid-cols-3 gap-4">
          <Field label={t("insp.date")}><input type="datetime-local" className="input" name="date" value={toLocalInput(r.date)} onChange={(e) => patch({ date: new Date(e.target.value).toISOString() })} /></Field>
          <Field label={`${t("insp.odometer")} (${t("common.km")})`} error={errs.odometer} hint={`${t("veh.sellerdeclared")}: ${v.mileage.toLocaleString("en-US")}`}><input type="number" min={0} name="odometer" className="input" value={r.odometer} onChange={(e) => patch({ odometer: Number(e.target.value) })} /></Field>
        </section>
        <section className="card p-5 sm:p-6"><h2 className="font-bold text-lg mb-4">{t("insp.checks")}</h2>
          <div className="space-y-3">{CHECKS.map((k: CheckKey) => (
            <div key={k} className="grid sm:grid-cols-[170px_150px_1fr] gap-2 items-center">
              <span className="text-sm font-semibold">{t("check." + k)}</span>
              <select aria-label={t("check." + k)} name={"score_" + k} className="input !h-10" value={r.checks[k].score} onChange={(e) => patch({ checks: { ...r.checks, [k]: { ...r.checks[k], score: Number(e.target.value) } } })}>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} / 5 · {t("insp.score." + n)}</option>)}</select>
              <input aria-label={t("common.notes")} name={"note_" + k} className="input !h-10" placeholder={t("common.notes")} value={r.checks[k].note} onChange={(e) => patch({ checks: { ...r.checks, [k]: { ...r.checks[k], note: e.target.value } } })} />
            </div>))}</div></section>
        <section className="card p-5 sm:p-6 space-y-4"><h2 className="font-bold text-lg">{t("veh.accident")}</h2>
          <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer"><input type="checkbox" className="h-4 w-4 accent-ink-900" checked={r.accidentFound} onChange={(e) => patch({ accidentFound: e.target.checked })} name="accidentFound" />{t("insp.accfound")}</label>
          {r.accidentFound && <Field label={t("insp.accnote")} error={errs.accidentNote}><textarea className="input" rows={2} name="accidentNote" value={r.accidentNote} onChange={(e) => patch({ accidentNote: e.target.value })} /></Field>}
          <Field label={t("insp.maintenance")}><textarea className="input" rows={2} name="maintenance" value={r.maintenance} onChange={(e) => patch({ maintenance: e.target.value })} /></Field>
          <Field label={t("insp.notes")}><textarea className="input" rows={4} name="notes" value={r.notes} onChange={(e) => patch({ notes: e.target.value })} data-testid="insp-notes" /></Field></section>
        <section className="card p-5 sm:p-6"><h2 className="font-bold text-lg mb-3">{t("insp.photos")}</h2>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {r.photos.map((p, i) => <div key={i} className="relative aspect-[4/3] rounded-xl overflow-hidden">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={p} alt="" className="absolute inset-0 w-full h-full object-cover" /><button type="button" aria-label={t("common.delete")} onClick={() => patch({ photos: r.photos.filter((_, j) => j !== i) })} className="absolute right-1 top-1 h-7 w-7 rounded-full bg-white grid place-items-center text-bad"><Trash2 size={13} /></button></div>)}
            {r.photos.length < 8 && <button type="button" onClick={() => fileRef.current?.click()} className="aspect-[4/3] rounded-xl border-2 border-dashed border-ink-900/20 grid place-items-center text-steel-500 text-xs font-semibold"><span className="text-center"><ImagePlus className="mx-auto mb-1" size={20} />{t("lst.addphotos")}</span></button>}
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple className="sr-only" aria-label={t("insp.photos")} data-testid="insp-photo-input" onChange={async (e) => { const files = Array.from(e.target.files ?? []).slice(0, 8 - r.photos.length); const out: string[] = []; for (const f of files) try { out.push(await compress(f)); } catch { /* skip */ } patch({ photos: [...r.photos, ...out] }); e.target.value = ""; }} /></section>
        <div className="flex gap-3 flex-wrap"><button type="button" className="btn btn-outline" onClick={() => save("draft")} data-testid="save-draft">{t("insp.savedraft")}</button><button type="button" className="btn btn-primary" onClick={() => save("published")} data-testid="publish-report">{t("insp.publish")}</button></div>
      </form>
    </>
  );
}
function ReportEditorInner({ id }: { id: string }) { return <Guard><Editor id={id} /></Guard>; }

function ReportEditorQuery() { const id = useSearchParams().get("id") ?? ""; return <ReportEditorInner key={id} id={id} />; }
export default function ReportEditor() { return <Suspense fallback={null}><ReportEditorQuery /></Suspense>; }
