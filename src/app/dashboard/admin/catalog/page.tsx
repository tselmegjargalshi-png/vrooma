"use client";
import { useState } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/hooks";
import { Field, Modal, PageHead, Tabs } from "@/components/ui";
import { Guard } from "@/components/Guard";
import type { Brand, Category, ModelDef } from "@/lib/types";

type Edit = { kind: "brand"; v: Partial<Brand> & { name: string } } | { kind: "model"; v: Partial<ModelDef> & { name: string; brandId: string } } | { kind: "category"; v: Partial<Category> & { mn: string; en: string } } | null;

function Inner() {
  const { t, lang } = useT();
  const st = useStore();
  const [tab, setTab] = useState<"brands" | "models" | "categories">("brands");
  const [edit, setEdit] = useState<Edit>(null);
  const [q, setQ] = useState("");
  const rm = (ok: boolean) => st.flash(ok ? t("common.deleted") : t("adm.inuse"), ok ? "ok" : "err");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!edit) return;
    if (edit.kind === "brand") { if (!edit.v.name.trim()) return; st.upsertBrand({ ...edit.v, name: edit.v.name.trim() }); }
    if (edit.kind === "model") { if (!edit.v.name.trim() || !edit.v.brandId) return; st.upsertModel({ ...edit.v, name: edit.v.name.trim() }); }
    if (edit.kind === "category") { if (!edit.v.mn.trim() || !edit.v.en.trim()) return; st.upsertCategory(edit.v); }
    setEdit(null); st.flash(t("common.saved"));
  };
  const models = st.models.filter((m) => !q || `${m.name} ${st.brands.find((b) => b.id === m.brandId)?.name}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <PageHead title={t("dash.a.catalog")} sub={t("adm.catalog.sub")} actions={
        <button className="btn btn-sm btn-primary" data-testid="catalog-add" onClick={() => setEdit(tab === "brands" ? { kind: "brand", v: { name: "", country: "" } } : tab === "models" ? { kind: "model", v: { name: "", brandId: st.brands[0]?.id ?? "" } } : { kind: "category", v: { mn: "", en: "" } })}><Plus size={15} />{t("common.add")}</button>} />
      <Tabs value={tab} onChange={setTab} tabs={[{ id: "brands", label: t("adm.brands"), count: st.brands.length }, { id: "models", label: t("adm.models"), count: st.models.length }, { id: "categories", label: t("adm.categories"), count: st.categories.length }]} />
      {tab === "models" && <input className="input !h-10 !w-60 mt-4" aria-label={t("common.search")} placeholder={t("common.search")} value={q} onChange={(e) => setQ(e.target.value)} />}
      <div className="card mt-4 overflow-x-auto">
        {tab === "brands" && <table className="tbl" data-testid="brand-table"><thead><tr><th>{t("common.name")}</th><th>{t("adm.country")}</th><th>{t("nav.cars")}</th><th /></tr></thead><tbody>{st.brands.map((b) => <tr key={b.id}><td className="font-semibold">{b.name}</td><td>{b.country}</td><td>{st.vehicles.filter((v) => v.brandId === b.id).length}</td><td className="text-right whitespace-nowrap"><button aria-label={t("common.edit")} className="h-8 w-8 inline-grid place-items-center rounded-lg hover:bg-ink-900/5" onClick={() => setEdit({ kind: "brand", v: { ...b } })}><Pencil size={14} /></button><button aria-label={t("common.delete")} data-testid="del-brand" className="h-8 w-8 inline-grid place-items-center rounded-lg hover:bg-ink-900/5 text-bad" onClick={() => rm(st.deleteBrand(b.id))}><Trash2 size={14} /></button></td></tr>)}</tbody></table>}
        {tab === "models" && <table className="tbl min-w-[640px]"><thead><tr><th>{t("veh.brand")}</th><th>{t("veh.model")}</th><th>{t("flt.category")}</th><th>{t("veh.fuel")}</th><th /></tr></thead><tbody>{models.map((m) => <tr key={m.id}><td>{st.brands.find((b) => b.id === m.brandId)?.name}</td><td className="font-semibold">{m.name}</td><td>{st.categories.find((c) => c.id === m.categoryId)?.[lang]}</td><td>{t("fuel." + m.fuel)}</td><td className="text-right whitespace-nowrap"><button aria-label={t("common.edit")} className="h-8 w-8 inline-grid place-items-center rounded-lg hover:bg-ink-900/5" onClick={() => setEdit({ kind: "model", v: { ...m } })}><Pencil size={14} /></button><button aria-label={t("common.delete")} className="h-8 w-8 inline-grid place-items-center rounded-lg hover:bg-ink-900/5 text-bad" onClick={() => rm(st.deleteModel(m.id))}><Trash2 size={14} /></button></td></tr>)}</tbody></table>}
        {tab === "categories" && <table className="tbl"><thead><tr><th>Монгол</th><th>English</th><th /></tr></thead><tbody>{st.categories.map((c) => <tr key={c.id}><td className="font-semibold">{c.mn}</td><td>{c.en}</td><td className="text-right whitespace-nowrap"><button aria-label={t("common.edit")} className="h-8 w-8 inline-grid place-items-center rounded-lg hover:bg-ink-900/5" onClick={() => setEdit({ kind: "category", v: { ...c } })}><Pencil size={14} /></button><button aria-label={t("common.delete")} className="h-8 w-8 inline-grid place-items-center rounded-lg hover:bg-ink-900/5 text-bad" onClick={() => rm(st.deleteCategory(c.id))}><Trash2 size={14} /></button></td></tr>)}</tbody></table>}
      </div>
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit ? t("adm." + edit.kind) : ""}>
        {edit && <form className="space-y-4" onSubmit={submit}>
          {edit.kind === "brand" && <><Field label={t("common.name")}><input name="name" className="input" value={edit.v.name} onChange={(e) => setEdit({ kind: "brand", v: { ...edit.v, name: e.target.value } })} data-testid="cat-name" /></Field><Field label={t("adm.country")}><input name="country" className="input" maxLength={2} value={edit.v.country ?? ""} onChange={(e) => setEdit({ kind: "brand", v: { ...edit.v, country: e.target.value.toUpperCase() } })} /></Field></>}
          {edit.kind === "model" && <><Field label={t("veh.brand")}><select name="brandId" className="input" value={edit.v.brandId} onChange={(e) => setEdit({ kind: "model", v: { ...edit.v, brandId: e.target.value } })}>{st.brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></Field><Field label={t("common.name")}><input name="name" className="input" value={edit.v.name} onChange={(e) => setEdit({ kind: "model", v: { ...edit.v, name: e.target.value } })} /></Field><Field label={t("flt.category")}><select name="categoryId" className="input" value={edit.v.categoryId ?? "sedan"} onChange={(e) => setEdit({ kind: "model", v: { ...edit.v, categoryId: e.target.value, body: st.categories.find((c) => c.id === e.target.value)?.body ?? edit.v.body } })}>{st.categories.map((c) => <option key={c.id} value={c.id}>{c[lang]}</option>)}</select></Field></>}
          {edit.kind === "category" && <><Field label="Монгол"><input name="mn" className="input" value={edit.v.mn} onChange={(e) => setEdit({ kind: "category", v: { ...edit.v, mn: e.target.value } })} /></Field><Field label="English"><input name="en" className="input" value={edit.v.en} onChange={(e) => setEdit({ kind: "category", v: { ...edit.v, en: e.target.value } })} /></Field></>}
          <button className="btn btn-primary w-full" data-testid="cat-save">{t("common.save")}</button></form>}
      </Modal>
    </>
  );
}
export default function AdminCatalog() { return <Guard perm="catalog.manage"><Inner /></Guard>; }
