"use client";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Trash2, Star } from "lucide-react";
import { useStore } from "@/lib/store";
import { useT, useUser } from "@/lib/hooks";
import { COLORS, EQUIPMENT, INTERIOR_COLORS, SAFETY } from "@/lib/catalog";
import { DISTRICTS, PROVINCES, provCenter } from "@/lib/geo";
import type { Photo, PhotoKind, Vehicle } from "@/lib/types";
import { Field } from "./ui";

async function compress(file: File, max = 1280): Promise<string> {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.78);
}

const KINDS: PhotoKind[] = ["exterior", "interior", "engine", "dashboard"];
export function ListingForm({ vehicle }: { vehicle?: Vehicle }) {
  const { t, lang } = useT();
  const router = useRouter();
  const user = useUser()!;
  const { brands, models, categories } = useStore();
  const create = useStore((s) => s.createVehicle), update = useStore((s) => s.updateVehicle), flash = useStore((s) => s.flash);
  const [f, setF] = useState(() => ({
    brandId: vehicle?.brandId ?? "", modelId: vehicle?.modelId ?? "", categoryId: vehicle?.categoryId ?? "", year: String(vehicle?.year ?? ""), importYear: String(vehicle?.importYear ?? ""),
    mileage: String(vehicle?.mileage ?? ""), cc: String(vehicle?.cc ?? ""), fuel: vehicle?.fuel ?? "petrol", trans: vehicle?.trans ?? "automatic", drive: vehicle?.drive ?? "fwd", steering: vehicle?.steering ?? "LHD",
    color: vehicle?.color ?? "white", interiorColor: vehicle?.interiorColor ?? "black", doors: String(vehicle?.doors ?? 5), seats: String(vehicle?.seats ?? 5), condition: vehicle?.condition ?? "good",
    accident: vehicle?.accident ?? "none", accidentNote: vehicle?.accidentNote ?? "", origin: vehicle?.origin ?? "local", province: vehicle?.province ?? "ub", district: vehicle?.district ?? "bayanzurkh",
    price: String(vehicle?.price ?? ""), negotiable: vehicle?.negotiable ?? true, desc: (lang === "mn" ? vehicle?.descMn : vehicle?.descEn) ?? "", plate: vehicle?.plate ?? "", owners: String(vehicle?.owners ?? 1),
    customs: vehicle?.customsCleared ?? true, videoUrl: vehicle?.videoUrl ?? "", equipment: vehicle?.equipment ?? [], safety: vehicle?.safety ?? [], hp: String(vehicle?.hp ?? ""), cons: String(vehicle?.cons ?? ""),
  }));
  const [photos, setPhotos] = useState<Photo[]>(vehicle?.photos ?? []);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));
  const model = models.find((m) => m.id === f.modelId);
  const brandModels = useMemo(() => models.filter((m) => m.brandId === f.brandId), [models, f.brandId]);

  const pickModel = (id: string) => {
    const m = models.find((x) => x.id === id);
    if (!m) { set("modelId", ""); return; }
    setF((p) => ({ ...p, modelId: id, categoryId: m.categoryId, fuel: m.fuel, trans: m.trans, drive: m.drive, steering: m.steering, cc: String(m.cc), doors: String(m.doors), seats: String(m.seats), hp: String(m.hp), cons: String(m.cons) }));
  };
  const upload = async (files: FileList | null) => {
    if (!files) return;
    const room = 15 - photos.length;
    const list = Array.from(files).filter((x) => x.type.startsWith("image/")).slice(0, room);
    if (!list.length) { flash(t("lst.photo.type"), "err"); return; }
    setBusy(true);
    try {
      const out: Photo[] = [];
      for (const file of list) {
        if (file.size > 12 * 1024 * 1024) { flash(t("lst.photo.big"), "err"); continue; }
        out.push({ kind: photos.length + out.length === 0 ? "exterior" : "exterior", url: await compress(file) });
      }
      setPhotos((p) => [...p, ...out]);
    } catch { flash(t("lst.photo.fail"), "err"); } finally { setBusy(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    const num = (k: keyof typeof f) => Number(f[k]);
    if (!f.brandId) er.brandId = t("common.required");
    if (!f.modelId) er.modelId = t("common.required");
    if (!(num("year") >= 1990 && num("year") <= 2026)) er.year = t("val.year");
    if (f.importYear && (num("importYear") < num("year") || num("importYear") > 2026)) er.importYear = t("val.importyear");
    if (!(f.mileage !== "" && num("mileage") >= 0)) er.mileage = t("common.required");
    if (!(num("price") >= 1_000_000)) er.price = t("val.price");
    if (f.desc.trim().length < 10) er.desc = t("val.desc");
    if (photos.length < 1) er.photos = t("val.photos");
    setErrs(er);
    if (Object.keys(er).length) { flash(t("val.fix"), "err"); document.querySelector("[data-err]")?.scrollIntoView({ block: "center" }); return; }
    const c = f.district && f.province === "ub" ? DISTRICTS.find((d) => d.id === f.district)! : provCenter(f.province);
    const jit = f.province === "ub" ? 0.012 : 0.1;
    const base = {
      brandId: f.brandId, modelId: f.modelId, modelName: model?.name ?? "", categoryId: f.categoryId || model?.categoryId || "sedan", body: model?.body ?? "sedan", year: num("year"), importYear: f.importYear ? num("importYear") : null,
      mileage: num("mileage"), cc: num("cc") || 0, fuel: f.fuel, trans: f.trans, drive: f.drive, steering: f.steering, color: f.color, interiorColor: f.interiorColor, doors: num("doors"), seats: num("seats"),
      condition: f.condition, accident: f.accident, accidentNote: f.accident === "none" ? "" : f.accidentNote || "bumper", service: vehicle?.service ?? [], origin: f.origin, province: f.province, district: f.province === "ub" ? f.district : "",
      lat: vehicle && vehicle.province === f.province && vehicle.district === (f.province === "ub" ? f.district : "") ? vehicle.lat : c.lat + (Math.random() - 0.5) * 2 * jit,
      lng: vehicle && vehicle.province === f.province && vehicle.district === (f.province === "ub" ? f.district : "") ? vehicle.lng : c.lng + (Math.random() - 0.5) * 2.8 * jit,
      price: num("price"), negotiable: f.negotiable, descMn: f.desc.trim(), descEn: f.desc.trim(), photos, hasVideo: !!f.videoUrl || !!vehicle?.hasVideo, videoUrl: f.videoUrl.trim() || undefined,
      hp: num("hp") || model?.hp || 0, cons: num("cons") || model?.cons || 0, len: model?.len ?? 4500, wid: model?.wid ?? 1800, hei: model?.hei ?? 1500, safety: f.safety, equipment: f.equipment,
      plate: f.plate.trim(), owners: num("owners") || 1, customsCleared: f.customs,
    } as Omit<Vehicle, "id" | "status" | "createdAt" | "expiresAt" | "views" | "phoneClicks" | "viewsDaily" | "demo" | "tier" | "sellerId">;
    if (vehicle) { update(vehicle.id, { ...base, status: vehicle.status === "rejected" ? "pending" : vehicle.status, rejectReason: undefined }); flash(t("common.saved")); router.push("/dashboard/listings"); }
    else { const v = create(base); flash(t("lst.created")); router.push("/dashboard/listings?created=" + v.id); }
  };

  const Sel = ({ k, opts, label }: { k: keyof typeof f; opts: [string, string][]; label: string }) => (
    <Field label={label} error={errs[k as string]}><select name={k as string} className="input" value={String(f[k])} onChange={(e) => set(k, e.target.value as never)}>{opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
  );
  const Num = ({ k, label, ph }: { k: keyof typeof f; label: string; ph?: string }) => (
    <Field label={label} error={errs[k as string]}><input name={k as string} type="number" min={0} className="input" value={String(f[k])} placeholder={ph} onChange={(e) => set(k, e.target.value as never)} data-err={errs[k as string] ? "1" : undefined} /></Field>
  );
  const toggle = (k: "equipment" | "safety", id: string) => set(k, f[k].includes(id) ? f[k].filter((x) => x !== id) : [...f[k], id]);

  return (
    <form onSubmit={submit} noValidate className="space-y-6" data-testid="listing-form">
      <section className="card p-5 sm:p-6"><h2 className="font-bold text-lg mb-4">{t("lst.s.vehicle")}</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label={t("veh.brand")} error={errs.brandId}><select name="brandId" className="input" value={f.brandId} onChange={(e) => setF((p) => ({ ...p, brandId: e.target.value, modelId: "" }))} data-err={errs.brandId ? "1" : undefined}><option value="">{t("common.select")}</option>{[...brands].sort((a, b) => a.name.localeCompare(b.name)).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></Field>
          <Field label={t("veh.model")} error={errs.modelId}><select name="modelId" className="input" value={f.modelId} disabled={!f.brandId} onChange={(e) => pickModel(e.target.value)}><option value="">{t("common.select")}</option>{brandModels.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></Field>
          <Field label={t("flt.category")}><select name="categoryId" className="input" value={f.categoryId} onChange={(e) => set("categoryId", e.target.value)}><option value="">{t("common.select")}</option>{categories.map((c) => <option key={c.id} value={c.id}>{c[lang]}</option>)}</select></Field>
          <Num k="year" label={t("veh.year")} ph="2018" /><Num k="importYear" label={t("veh.importyear")} ph="2020" /><Num k="mileage" label={`${t("veh.mileage")} (${t("common.km")})`} />
          <Num k="cc" label={`${t("veh.engine")} (cc)`} /><Sel k="fuel" label={t("veh.fuel")} opts={["petrol", "diesel", "hybrid", "phev", "electric", "lpg"].map((x) => [x, t("fuel." + x)])} />
          <Sel k="trans" label={t("veh.trans")} opts={["automatic", "manual", "cvt", "other"].map((x) => [x, t("trans." + x)])} /><Sel k="drive" label={t("veh.drive")} opts={["2wd", "awd", "4wd", "fwd", "rwd"].map((x) => [x, x.toUpperCase()])} />
          <Sel k="steering" label={t("veh.steering")} opts={[["LHD", t("steer.LHD")], ["RHD", t("steer.RHD")]]} /><Sel k="condition" label={t("veh.condition")} opts={["new", "excellent", "good", "fair"].map((x) => [x, t("cond." + x)])} />
          <Sel k="color" label={t("veh.extcolor")} opts={COLORS.map((x) => [x, t("color." + x)])} /><Sel k="interiorColor" label={t("veh.intcolor")} opts={INTERIOR_COLORS.map((x) => [x, t("color." + x)])} />
          <Num k="doors" label={t("veh.doors")} /><Num k="seats" label={t("veh.seats")} /><Num k="hp" label={t("veh.hp")} />
        </div></section>

      <section className="card p-5 sm:p-6"><h2 className="font-bold text-lg mb-4">{t("lst.s.price")}</h2>
        <div className="grid sm:grid-cols-3 gap-4 items-end">
          <Num k="price" label={`${t("common.price")} (₮)`} ph="55000000" />
          <Sel k="province" label={t("veh.location")} opts={PROVINCES.map((p) => [p.id, p[lang]])} />
          {f.province === "ub" && <Sel k="district" label={t("veh.district")} opts={DISTRICTS.map((d) => [d.id, d[lang]])} />}
          <label className="flex items-center gap-2 text-sm font-semibold h-11 cursor-pointer"><input type="checkbox" className="h-4 w-4 accent-ink-900" checked={f.negotiable} onChange={(e) => set("negotiable", e.target.checked)} />{t("veh.negotiable")}</label>
        </div></section>

      <section className="card p-5 sm:p-6"><h2 className="font-bold text-lg mb-1">{t("lst.s.history")}</h2><p className="text-xs text-steel-500 mb-4">{t("lst.declared")}</p>
        <div className="grid sm:grid-cols-3 gap-4">
          <Sel k="accident" label={t("veh.accident")} opts={["none", "minor", "major"].map((x) => [x, t("acc." + x)])} />
          {f.accident !== "none" && <Sel k="accidentNote" label={t("lst.accnote")} opts={["bumper", "door", "frame", "engine", "other"].map((x) => [x, t("accnote." + x)])} />}
          <Sel k="origin" label={t("veh.origin")} opts={[["local", t("origin.local")], ["imported", t("origin.imported")]]} /><Num k="owners" label={t("veh.owners")} />
          <Field label={t("veh.plate")} hint={t("veh.plate.hint")}><input name="plate" className="input" value={f.plate} onChange={(e) => set("plate", e.target.value)} placeholder="1234 УБА" /></Field>
          <label className="flex items-center gap-2 text-sm font-semibold h-11 mt-6 cursor-pointer"><input type="checkbox" className="h-4 w-4 accent-ink-900" checked={f.customs} onChange={(e) => set("customs", e.target.checked)} />{t("veh.customs")}</label>
        </div></section>

      <section className="card p-5 sm:p-6"><h2 className="font-bold text-lg mb-4">{t("lst.s.desc")}</h2>
        <Field label={t("veh.description")} error={errs.desc}><textarea name="desc" rows={5} className="input" value={f.desc} onChange={(e) => set("desc", e.target.value)} data-err={errs.desc ? "1" : undefined} /></Field>
        <div className="grid sm:grid-cols-2 gap-6 mt-5">
          <fieldset><legend className="label">{t("veh.equipment")}</legend><div className="grid grid-cols-2 gap-1.5">{EQUIPMENT.map((e) => <label key={e} className="flex gap-2 text-sm items-center cursor-pointer"><input type="checkbox" className="h-4 w-4 accent-ink-900" checked={f.equipment.includes(e)} onChange={() => toggle("equipment", e)} />{t("equip." + e)}</label>)}</div></fieldset>
          <fieldset><legend className="label">{t("veh.safety")}</legend><div className="grid grid-cols-1 gap-1.5">{SAFETY.map((e) => <label key={e} className="flex gap-2 text-sm items-center cursor-pointer"><input type="checkbox" className="h-4 w-4 accent-ink-900" checked={f.safety.includes(e)} onChange={() => toggle("safety", e)} />{t("safety." + e)}</label>)}</div></fieldset>
        </div></section>

      <section className="card p-5 sm:p-6"><h2 className="font-bold text-lg mb-1">{t("lst.s.photos")}</h2><p className="text-xs text-steel-500 mb-4">{t("lst.photos.hint")}</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3" data-testid="photo-grid">
          {photos.map((p, i) => (
            <div key={i} className="rounded-xl border border-ink-900/10 overflow-hidden bg-white" data-testid="photo-item">
              <div className="relative aspect-[4/3] bg-ink-800">{/* eslint-disable-next-line @next/next/no-img-element */}{p.url ? <img src={p.url} alt="" className="absolute inset-0 w-full h-full object-cover" /> : <span className="absolute inset-0 grid place-items-center text-xs text-white/60">{t("gal." + p.kind)}</span>}
                {i === 0 && <span className="absolute left-1.5 top-1.5 chip bg-brass-500 text-ink-900">{t("lst.cover")}</span>}</div>
              <div className="p-2 flex gap-1 items-center">
                <select aria-label={t("lst.photokind")} className="input !h-8 !text-xs !px-2 flex-1" value={p.kind} onChange={(e) => setPhotos((l) => l.map((x, j) => (j === i ? { ...x, kind: e.target.value as PhotoKind } : x)))}>{KINDS.map((k) => <option key={k} value={k}>{t("gal." + k)}</option>)}</select>
                {i > 0 && <button type="button" aria-label={t("lst.makecover")} onClick={() => setPhotos((l) => [l[i], ...l.filter((_, j) => j !== i)])} className="h-8 w-8 grid place-items-center rounded-lg hover:bg-ink-900/5"><Star size={14} /></button>}
                <button type="button" aria-label={t("common.delete")} onClick={() => setPhotos((l) => l.filter((_, j) => j !== i))} className="h-8 w-8 grid place-items-center rounded-lg hover:bg-ink-900/5 text-bad"><Trash2 size={14} /></button></div>
            </div>
          ))}
          {photos.length < 15 && (
            <button type="button" onClick={() => fileRef.current?.click()} disabled={busy} className="aspect-[4/3] sm:aspect-auto sm:min-h-[140px] rounded-xl border-2 border-dashed border-ink-900/20 hover:border-ink-900/50 grid place-items-center text-steel-500 text-sm font-semibold" data-testid="add-photos"><span className="text-center"><ImagePlus className="mx-auto mb-1" />{busy ? t("common.loading") : t("lst.addphotos")}</span></button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple className="sr-only" aria-label={t("lst.addphotos")} data-testid="photo-input" onChange={(e) => upload(e.target.files)} />
        {errs.photos && <p className="text-xs text-bad mt-2" role="alert" data-err="1">{errs.photos}</p>}
        <div className="mt-5"><Field label={`${t("gal.video")} (${t("common.optional")})`} hint={t("lst.video.hint")}><input name="videoUrl" type="url" className="input" value={f.videoUrl} onChange={(e) => set("videoUrl", e.target.value)} placeholder="https://" /></Field></div>
      </section>

      <div className="flex gap-3 sticky bottom-3 z-10">
        <button className="btn btn-primary" data-testid="submit-listing" disabled={busy}>{vehicle ? t("common.save") : t("lst.submit")}</button>
        <button type="button" className="btn btn-outline bg-white" onClick={() => router.back()}>{t("common.cancel")}</button>
      </div>
      {!vehicle && <p className="text-xs text-steel-500">{t("lst.review.note")}</p>}
      <p className="sr-only">{user.id}</p>
    </form>
  );
}
