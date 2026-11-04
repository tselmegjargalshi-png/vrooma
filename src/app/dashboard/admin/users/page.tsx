"use client";
import { useState } from "react";
import { BadgeCheck, Ban, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { useT, useUser } from "@/lib/hooks";
import { Badge, PageHead } from "@/components/ui";
import { Guard } from "@/components/Guard";
import { fmtDate } from "@/lib/format";
import { ROLES, type Role } from "@/lib/types";

function Inner() {
  const { t, lang } = useT();
  const me = useUser()!;
  const st = useStore();
  const [q, setQ] = useState(""), [role, setRole] = useState("");
  const rows = st.users.filter((u) => (!role || u.role === role) && (!q || `${u.name} ${u.email}`.toLowerCase().includes(q.toLowerCase())));
  const superAdmin = me.role === "super_admin";
  return (
    <>
      <PageHead title={t("dash.a.users")} sub={t("adm.users.sub", { n: st.users.length })} />
      <div className="flex flex-wrap gap-2 mb-4"><input className="input !h-10 !w-60" placeholder={t("common.search")} aria-label={t("common.search")} value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input !h-10 !w-52" aria-label={t("adm.role")} value={role} onChange={(e) => setRole(e.target.value)}><option value="">{t("adm.role")}</option>{ROLES.map((r) => <option key={r} value={r}>{t("role." + r)}</option>)}</select></div>
      <div className="card overflow-x-auto"><table className="tbl min-w-[800px]" data-testid="user-table"><thead><tr><th>{t("common.name")}</th><th>{t("common.email")}</th><th>{t("adm.role")}</th><th>{t("common.status")}</th><th>{t("adm.joined")}</th><th /></tr></thead>
        <tbody>{rows.slice(0, 80).map((u) => (
          <tr key={u.id}><td className="font-semibold">{u.name}{u.demo && <span className="ml-2 text-[10px] text-steel-400 uppercase">{t("demo.badge")}</span>}</td><td className="text-steel-600">{u.email}</td>
            <td>{superAdmin && u.id !== me.id ? <select aria-label={t("adm.role")} className="input !h-8 !text-xs !w-44" value={u.role} onChange={(e) => { st.setRole(u.id, e.target.value as Role); st.flash(t("common.updated")); }}>{ROLES.map((r) => <option key={r} value={r}>{t("role." + r)}</option>)}</select> : <Badge tone="gray">{t("role." + u.role)}</Badge>}</td>
            <td><div className="flex gap-1">{u.verified && <Badge tone="ok">{t("common.verified")}</Badge>}{u.banned && <Badge tone="bad">{t("adm.banned")}</Badge>}</div></td>
            <td className="text-xs text-steel-600 whitespace-nowrap">{fmtDate(u.createdAt, lang)}</td>
            <td><div className="flex gap-1 justify-end">
              <button className="btn btn-xs btn-ghost" onClick={() => st.verifyUser(u.id, !u.verified)} title={t("adm.verify")}><BadgeCheck size={14} />{u.verified ? t("adm.unverify") : t("adm.verify")}</button>
              {u.id !== me.id && !["super_admin"].includes(u.role) && <button className="btn btn-xs btn-ghost" onClick={() => st.banUser(u.id, !u.banned)}><Ban size={14} />{u.banned ? t("adm.unban") : t("adm.ban")}</button>}
              {superAdmin && u.id !== me.id && <button aria-label={t("common.delete")} className="h-8 w-8 grid place-items-center rounded-lg hover:bg-ink-900/5 text-bad" onClick={() => { if (confirm(t("adm.deleteuser"))) st.deleteUser(u.id); }}><Trash2 size={14} /></button>}</div></td></tr>))}</tbody></table></div>
      {!superAdmin && <p className="text-xs text-steel-500 mt-3">{t("adm.roleonly")}</p>}
    </>
  );
}
export default function AdminUsers() { return <Guard perm="users.manage"><Inner /></Guard>; }
