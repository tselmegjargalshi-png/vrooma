import type { Role } from "./types";

export type Perm =
  | "admin.access" | "listing.create" | "listing.approve" | "listing.all" | "users.manage" | "roles.assign" | "dealers.manage" | "catalog.manage"
  | "ads.manage" | "payments.manage" | "reports.manage" | "audit.view" | "analytics.platform" | "inspection.write" | "inspection.manage"
  | "crm.use" | "crm.all" | "team.manage" | "promote" | "messages" | "sales.view";

const M: Record<Role, Perm[]> = {
  super_admin: ["admin.access", "listing.approve", "listing.all", "users.manage", "roles.assign", "dealers.manage", "catalog.manage", "ads.manage", "payments.manage", "reports.manage", "audit.view", "analytics.platform", "inspection.manage", "crm.use", "crm.all", "messages", "sales.view"],
  admin: ["admin.access", "listing.approve", "listing.all", "users.manage", "dealers.manage", "catalog.manage", "ads.manage", "payments.manage", "reports.manage", "audit.view", "analytics.platform", "inspection.manage", "crm.use", "crm.all", "messages", "sales.view"],
  dealer_owner: ["listing.create", "crm.use", "crm.all", "team.manage", "promote", "messages", "sales.view"],
  agent: ["listing.create", "crm.use", "messages", "sales.view"],
  seller: ["listing.create", "crm.use", "promote", "messages", "sales.view"],
  inspector: ["inspection.write", "messages"],
  customer: ["messages"],
};
export const can = (role: Role | undefined | null, perm: Perm) => !!role && M[role].includes(perm);
export const isAdmin = (role?: Role | null) => role === "admin" || role === "super_admin";
export const isStaffSeller = (role?: Role | null) => role === "seller" || role === "dealer_owner" || role === "agent";

export interface NavItem { href: string; key: string; icon: string; perm?: Perm }
export const DASH_NAV: NavItem[] = [
  { href: "/dashboard", key: "dash.overview", icon: "layout" },
  { href: "/dashboard/listings", key: "dash.listings", icon: "car", perm: "listing.create" },
  { href: "/dashboard/leads", key: "dash.crm", icon: "users", perm: "crm.use" },
  { href: "/dashboard/inspections", key: "dash.inspections", icon: "clipboard" },
  { href: "/messages", key: "dash.messages", icon: "message", perm: "messages" },
  { href: "/dashboard/analytics", key: "dash.analytics", icon: "chart", perm: "sales.view" },
  { href: "/dashboard/promote", key: "dash.promote", icon: "megaphone", perm: "promote" },
  { href: "/dashboard/team", key: "dash.team", icon: "building", perm: "team.manage" },
  { href: "/dashboard/profile", key: "dash.profile", icon: "user" },
  { href: "/dashboard/admin/listings", key: "dash.a.listings", icon: "check", perm: "listing.approve" },
  { href: "/dashboard/admin/users", key: "dash.a.users", icon: "users", perm: "users.manage" },
  { href: "/dashboard/admin/dealers", key: "dash.a.dealers", icon: "building", perm: "dealers.manage" },
  { href: "/dashboard/admin/catalog", key: "dash.a.catalog", icon: "tag", perm: "catalog.manage" },
  { href: "/dashboard/admin/ads", key: "dash.a.ads", icon: "megaphone", perm: "ads.manage" },
  { href: "/dashboard/admin/payments", key: "dash.a.payments", icon: "wallet", perm: "payments.manage" },
  { href: "/dashboard/admin/reports", key: "dash.a.reports", icon: "flag", perm: "reports.manage" },
  { href: "/dashboard/admin/audit", key: "dash.a.audit", icon: "log", perm: "audit.view" },
];
export const homeFor = (r: import("./types").Role) => (r === "customer" ? "/account" : "/dashboard");
