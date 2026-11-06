"use client";
import { create } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";
import { get as idbGet, set as idbSet, del as idbDel } from "idb-keyval";
import { buildSeed, SEED_VERSION, DEMO_PW_HASH, getPackage, type DB } from "./seed";
import { addDays, nowIso, uid } from "./format";
import { matchesSaved, isPublic } from "./search";
import type {
  Ad, Appointment, Brand, Campaign, Category, CheckKey, Dealer, Lang, Lead, LeadSource, LeadStatus, Location, ModelDef, PayMethod, Payment, Report, Role, SavedSearch, Thread, User, Vehicle, VStatus,
} from "./types";

export async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

const memory = new Map<string, string>();
const storage: StateStorage = {
  getItem: async (k) => (typeof indexedDB === "undefined" ? memory.get(k) ?? null : ((await idbGet(k)) as string | undefined) ?? null),
  setItem: async (k, v) => { if (typeof indexedDB === "undefined") memory.set(k, v); else await idbSet(k, v); },
  removeItem: async (k) => { if (typeof indexedDB === "undefined") memory.delete(k); else await idbDel(k); },
};

interface UI { lang: Lang; showUsd: boolean; sessionId: string | null; compare: string[]; toast: { id: number; text: string; tone: "ok" | "err" } | null }
export interface Actions {
  setLang(l: Lang): void; setUsd(b: boolean): void; flash(text: string, tone?: "ok" | "err"): void;
  login(email: string, pw: string): Promise<{ ok: boolean; error?: string; user?: User }>;
  register(p: { name: string; email: string; phone: string; password: string; role: "customer" | "seller" | "dealer_owner"; dealerName?: string }): Promise<{ ok: boolean; error?: string; user?: User }>;
  logout(): void; updateProfile(patch: Partial<User>): void; changePassword(pw: string): Promise<void>;
  toggleFavorite(id: string): boolean; toggleCompare(id: string): "added" | "removed" | "full"; clearCompare(): void; viewVehicle(id: string): void; phoneClick(id: string): void;
  saveSearch(name: string, query: string): boolean; removeSearch(id: string): void; toggleSearchNotify(id: string): void;
  createVehicle(v: Omit<Vehicle, "id" | "status" | "createdAt" | "expiresAt" | "views" | "phoneClicks" | "viewsDaily" | "demo" | "tier" | "sellerId">): Vehicle;
  updateVehicle(id: string, patch: Partial<Vehicle>): void; deleteVehicle(id: string): void; setVehicleStatus(id: string, status: VStatus, extra?: Partial<Vehicle>): void;
  approveVehicle(id: string): void; rejectVehicle(id: string, reason: string): void; markSold(id: string, price?: number): void; renewVehicle(id: string): void;
  submitInquiry(p: { vehicleId: string; name: string; phone: string; email?: string; message: string; source?: LeadSource }): Lead;
  updateLead(id: string, patch: Partial<Lead>): void; setLeadStatus(id: string, s: LeadStatus): void; addNote(id: string, text: string): void;
  addReminder(id: string, at: string, text: string): void; toggleReminder(leadId: string, rid: string): void; assignLead(id: string, userId: string): void;
  requestAppointment(p: { vehicleId: string; at: string; place: string; leadId?: string; note?: string; inspectorId?: string; scheduled?: boolean }): Appointment;
  updateAppointment(id: string, patch: Partial<Appointment>): void;
  saveReport(r: Report): void; deleteReport(id: string): void;
  openThread(vehicleId: string | undefined, otherId: string): string; sendMessage(threadId: string, text: string): void; readThread(threadId: string): void;
  markNoticeRead(id: string): void; markAllNotices(): void;
  upsertAd(a: Partial<Ad> & { id?: string }): void; deleteAd(id: string): void; adImpression(id: string): void; adClick(id: string): void;
  upsertCampaign(c: Partial<Campaign> & { id?: string }): void; deleteCampaign(id: string): void;
  purchase(p: { packageId: string; vehicleId?: string; method: PayMethod; code?: string }): Payment;
  confirmPayment(id: string): void; rejectPayment(id: string): void;
  setRole(userId: string, role: Role): boolean; banUser(id: string, b: boolean): void; verifyUser(id: string, b: boolean): void; deleteUser(id: string): void;
  updateDealer(id: string, patch: Partial<Dealer>): void; addLocation(dealerId: string, l: Omit<Location, "id">): void; removeLocation(dealerId: string, lid: string): void;
  addAgent(dealerId: string, p: { name: string; email: string; phone: string }): Promise<{ ok: boolean; error?: string }>; removeAgent(userId: string): void;
  upsertBrand(b: Partial<Brand> & { name: string }): void; deleteBrand(id: string): boolean;
  upsertModel(m: Partial<ModelDef> & { name: string; brandId: string }): void; deleteModel(id: string): boolean;
  upsertCategory(c: Partial<Category> & { mn: string; en: string }): void; deleteCategory(id: string): boolean;
  reportListing(vehicleId: string, reason: string): void; resolveFlag(id: string, status: "resolved" | "dismissed"): void;
  tick(): void; resetDemo(): void;
}
export type Store = DB & UI & Actions;

const ui0: UI = { lang: "mn", showUsd: false, sessionId: null, compare: [], toast: null };
let toastN = 0;

export const useStore = create<Store>()(
  persist(
    (set, get) => {
      const seed = buildSeed();
      const me = () => get().users.find((u) => u.id === get().sessionId);
      const audit = (action: string, entity: string, entityId: string, detail = "") => {
        const u = me();
        set((s) => ({ audits: [{ id: uid("au"), actorId: u?.id ?? "system", actor: u?.name ?? "system", action, entity, entityId, detail, at: nowIso() }, ...s.audits].slice(0, 400) }));
      };
      const notify = (userId: string | undefined, kind: string, title: string, body: string, link?: string, key?: string) => {
        if (!userId) return;
        const s = get();
        const u = s.users.find((x) => x.id === userId);
        if (!u) return;
        const pref: Record<string, keyof User["prefs"]> = { inquiry: "inquiry", price: "priceDrop", listing: "newListing", reminder: "reminders", expiry: "expiry" };
        if (pref[kind] && !u.prefs[pref[kind]]) return;
        if (key && s.notices.some((n) => n.key === key && n.userId === userId)) return;
        set((st) => ({ notices: [{ id: uid("nt"), userId, kind, title, body, link, at: nowIso(), read: false, key }, ...st.notices] }));
      };
      const vName = (v?: Vehicle) => (v ? `${get().brands.find((b) => b.id === v.brandId)?.name ?? ""} ${v.modelName} ${v.year}` : "");
      const admins = () => get().users.filter((u) => u.role === "admin" || u.role === "super_admin");
      const patchV = (id: string, fn: (v: Vehicle) => Partial<Vehicle>) => set((s) => ({ vehicles: s.vehicles.map((v) => (v.id === id ? { ...v, ...fn(v) } : v)) }));
      const patchLead = (id: string, fn: (l: Lead) => Partial<Lead>) => set((s) => ({ leads: s.leads.map((l) => (l.id === id ? { ...l, ...fn(l), updatedAt: nowIso() } : l)) }));
      const agentsOf = (dealerId: string) => get().users.filter((u) => u.role === "agent" && u.dealerId === dealerId);

      const applyPackage = (p: Payment) => {
        const pk = getPackage(p.packageId);
        if (!pk) return;
        const end = addDays(nowIso(), pk.days);
        if (pk.kind === "listing" && p.vehicleId) {
          patchV(p.vehicleId, () => (pk.tier === "featured" ? { tier: "featured", featuredUntil: end } : { tier: "premium", premiumUntil: end, expiresAt: addDays(nowIso(), 90) }));
        } else if (pk.kind === "homepage" && p.vehicleId) {
          const v = get().vehicles.find((x) => x.id === p.vehicleId);
          set((s) => ({ ads: [{ id: uid("ad"), placement: "hero", vehicleId: p.vehicleId, dealerId: v?.dealerId, title: "", subtitle: "", startAt: nowIso(), endAt: end, active: true, impressions: 0, clicks: 0, paid: p.amount, demo: false }, ...s.ads] }));
          patchV(p.vehicleId, () => ({ tier: "featured", featuredUntil: end }));
        } else if (pk.kind === "dealer") {
          const u = get().users.find((x) => x.id === p.userId);
          if (u?.dealerId) set((s) => ({ dealers: s.dealers.map((d) => (d.id === u.dealerId ? { ...d, plan: (pk as { plan: Dealer["plan"] }).plan, planExpires: end } : d)), subs: [{ id: uid("s"), userId: p.userId, dealerId: u.dealerId, packageId: pk.id, startAt: nowIso(), endAt: end, active: true }, ...s.subs] }));
        } else if (pk.kind === "seller") {
          set((s) => ({ subs: [{ id: uid("s"), userId: p.userId, packageId: pk.id, startAt: nowIso(), endAt: end, active: true }, ...s.subs] }));
        }
        notify(p.userId, "payment", "ntf.payment", pk.id, "/dashboard/promote");
      };

      return {
        ...seed, ...ui0,
        setLang: (lang) => set({ lang }), setUsd: (showUsd) => set({ showUsd }),
        flash: (text, tone = "ok") => set({ toast: { id: ++toastN, text, tone } }),

        login: async (email, pw) => {
          const h = await sha256(pw);
          const u = get().users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
          if (!u || u.pw !== h) return { ok: false, error: "auth.invalid" };
          if (u.banned) return { ok: false, error: "auth.banned" };
          set({ sessionId: u.id });
          get().tick();
          return { ok: true, user: u };
        },
        register: async ({ name, email, phone, password, role, dealerName }) => {
          const em = email.trim().toLowerCase();
          if (get().users.some((u) => u.email.toLowerCase() === em)) return { ok: false, error: "auth.exists" };
          const id = uid("u");
          let dealerId: string | undefined;
          if (role === "dealer_owner") {
            dealerId = uid("d");
            const d: Dealer = { id: dealerId, name: dealerName || name, description: "", phone: phone.replace(/\D/g, ""), email: em, tone: "#B8925A", ownerId: id, verified: false, plan: "none", createdAt: nowIso(), locations: [], demo: false };
            set((s) => ({ dealers: [...s.dealers, d] }));
          }
          const user: User = { id, name, email: em, phone: phone.replace(/\D/g, "").replace(/^976/, ""), pw: await sha256(password), role, province: "ub", verified: false, createdAt: nowIso(), dealerId, prefs: { priceDrop: true, newListing: true, inquiry: true, reminders: true, expiry: true }, demo: false };
          set((s) => ({ users: [...s.users, user], sessionId: id }));
          admins().forEach((a) => notify(a.id, "user", "ntf.newuser", name, "/dashboard/admin/users"));
          return { ok: true, user };
        },
        logout: () => set({ sessionId: null }),
        updateProfile: (patch) => set((s) => ({ users: s.users.map((u) => (u.id === s.sessionId ? { ...u, ...patch, id: u.id, role: u.role, pw: u.pw } : u)) })),
        changePassword: async (pw) => { const h = await sha256(pw); set((s) => ({ users: s.users.map((u) => (u.id === s.sessionId ? { ...u, pw: h } : u)) })); },

        toggleFavorite: (id) => {
          const u = me();
          if (!u) return false;
          const cur = get().favorites[u.id] ?? [];
          set((s) => ({ favorites: { ...s.favorites, [u.id]: cur.includes(id) ? cur.filter((x) => x !== id) : [id, ...cur] } }));
          return true;
        },
        toggleCompare: (id) => {
          const c = get().compare;
          if (c.includes(id)) { set({ compare: c.filter((x) => x !== id) }); return "removed"; }
          if (c.length >= 4) return "full";
          set({ compare: [...c, id] });
          return "added";
        },
        clearCompare: () => set({ compare: [] }),
        viewVehicle: (id) => {
          const key = get().sessionId ?? "anon";
          set((s) => ({
            recent: { ...s.recent, [key]: [id, ...(s.recent[key] ?? []).filter((x) => x !== id)].slice(0, 12) },
            vehicles: s.vehicles.map((v) => (v.id === id ? { ...v, views: v.views + 1, viewsDaily: [...v.viewsDaily.slice(0, -1), (v.viewsDaily.at(-1) ?? 0) + 1] } : v)),
          }));
        },
        phoneClick: (id) => patchV(id, (v) => ({ phoneClicks: v.phoneClicks + 1 })),

        saveSearch: (name, query) => {
          const u = me();
          if (!u) return false;
          set((s) => ({ savedSearches: [{ id: uid("ss"), userId: u.id, name, query, notify: true, createdAt: nowIso() }, ...s.savedSearches] }));
          return true;
        },
        removeSearch: (id) => set((s) => ({ savedSearches: s.savedSearches.filter((x) => x.id !== id) })),
        toggleSearchNotify: (id) => set((s) => ({ savedSearches: s.savedSearches.map((x) => (x.id === id ? { ...x, notify: !x.notify } : x)) })),

        createVehicle: (draft) => {
          const u = me()!;
          const n = get().vehicles.length + 1;
          const v: Vehicle = {
            ...draft, id: `v${String(n).padStart(3, "0")}${uid("").slice(0, 3)}`, sellerId: u.id, dealerId: u.dealerId, status: "pending", tier: "free", createdAt: nowIso(),
            expiresAt: addDays(nowIso(), 60), views: 0, phoneClicks: 0, viewsDaily: Array(30).fill(0), demo: false,
          };
          set((s) => ({ vehicles: [v, ...s.vehicles] }));
          admins().forEach((a) => notify(a.id, "listing", "ntf.pending", vName(v), "/dashboard/admin/listings"));
          audit("listing.create", "vehicle", v.id);
          return v;
        },
        updateVehicle: (id, patch) => {
          const old = get().vehicles.find((v) => v.id === id);
          if (!old) return;
          patchV(id, () => ({ ...patch, prevPrice: patch.price != null && patch.price < old.price ? old.price : patch.price != null && patch.price > old.price ? undefined : old.prevPrice }));
          if (patch.price != null && patch.price < old.price) {
            Object.entries(get().favorites).forEach(([uidk, ids]) => { if (ids.includes(id)) notify(uidk, "price", "ntf.pricedrop", vName(old), `/cars/view?id=${id}`, `pd:${id}:${patch.price}`); });
          }
          audit("listing.update", "vehicle", id);
        },
        deleteVehicle: (id) => { set((s) => ({ vehicles: s.vehicles.filter((v) => v.id !== id), compare: s.compare.filter((x) => x !== id) })); audit("listing.delete", "vehicle", id); },
        setVehicleStatus: (id, status, extra) => { patchV(id, () => ({ status, ...extra })); audit("listing.status", "vehicle", id, status); },
        approveVehicle: (id) => {
          const v = get().vehicles.find((x) => x.id === id);
          if (!v) return;
          patchV(id, () => ({ status: "active", rejectReason: undefined, expiresAt: addDays(nowIso(), 60), createdAt: nowIso() }));
          notify(v.sellerId, "listing", "ntf.approved", vName(v), `/cars/view?id=${id}`);
          const next = { ...v, status: "active" as const, expiresAt: addDays(nowIso(), 60) };
          const ctx = { users: get().users, dealers: get().dealers, brands: get().brands };
          get().savedSearches.forEach((ss) => { if (ss.notify && matchesSaved(next, ss.query, ctx)) notify(ss.userId, "listing", "ntf.newmatch", vName(v), `/cars/view?id=${id}`, `nm:${ss.id}:${id}`); });
          audit("listing.approve", "vehicle", id);
        },
        rejectVehicle: (id, reason) => {
          const v = get().vehicles.find((x) => x.id === id);
          patchV(id, () => ({ status: "rejected", rejectReason: reason }));
          notify(v?.sellerId, "listing", "ntf.rejected", vName(v), "/dashboard/listings");
          audit("listing.reject", "vehicle", id, reason);
        },
        markSold: (id, price) => {
          patchV(id, (v) => ({ status: "sold", soldAt: nowIso(), soldPrice: price ?? v.price }));
          set((s) => ({ leads: s.leads.map((l) => (l.vehicleId === id && !["sold", "lost"].includes(l.status) && l.status === "deposit" ? { ...l, status: "sold" as const, updatedAt: nowIso() } : l)) }));
          audit("listing.sold", "vehicle", id);
        },
        renewVehicle: (id) => { patchV(id, (v) => ({ status: v.status === "expired" ? "active" : v.status, expiresAt: addDays(nowIso(), 60) })); audit("listing.renew", "vehicle", id); },

        submitInquiry: ({ vehicleId, name, phone, email, message, source = "website" }) => {
          const v = get().vehicles.find((x) => x.id === vehicleId)!;
          const u = me();
          const agents = v.dealerId ? agentsOf(v.dealerId) : [];
          const count = get().leads.filter((l) => l.vehicleId && get().vehicles.find((x) => x.id === l.vehicleId)?.dealerId === v.dealerId).length;
          const assignedTo = v.dealerId ? (agents.length ? agents[count % agents.length].id : get().dealers.find((d) => d.id === v.dealerId)?.ownerId) : v.sellerId;
          const at = nowIso();
          const lead: Lead = { id: uid("l"), vehicleId, customerId: u?.role === "customer" || u ? u?.id : undefined, name, phone: phone.replace(/\D/g, "").replace(/^976/, ""), email, message, source, status: "new", assignedTo, notes: [], reminders: [], history: [{ at, text: "created" }], createdAt: at, updatedAt: at, demo: false };
          set((s) => ({ leads: [lead, ...s.leads] }));
          notify(assignedTo, "inquiry", "ntf.inquiry", `${name}: ${vName(v)}`, "/dashboard/leads");
          if (v.dealerId) notify(get().dealers.find((d) => d.id === v.dealerId)?.ownerId, "inquiry", "ntf.inquiry", `${name}: ${vName(v)}`, "/dashboard/leads");
          return lead;
        },
        updateLead: (id, patch) => patchLead(id, () => patch),
        setLeadStatus: (id, status) => {
          patchLead(id, (l) => ({ status, history: [...l.history, { at: nowIso(), text: `status:${status}` }] }));
          if (status === "sold") { const l = get().leads.find((x) => x.id === id); if (l) get().markSold(l.vehicleId, l.offer); }
        },
        addNote: (id, text) => patchLead(id, (l) => ({ notes: [...l.notes, { id: uid("n"), by: get().sessionId ?? "", text, at: nowIso() }], history: [...l.history, { at: nowIso(), text: "note" }] })),
        addReminder: (id, at, text) => patchLead(id, (l) => ({ reminders: [...l.reminders, { id: uid("r"), at, text, done: false }] })),
        toggleReminder: (leadId, rid) => patchLead(leadId, (l) => ({ reminders: l.reminders.map((r) => (r.id === rid ? { ...r, done: !r.done } : r)) })),
        assignLead: (id, userId) => { patchLead(id, (l) => ({ assignedTo: userId, history: [...l.history, { at: nowIso(), text: `assigned:${userId}` }] })); notify(userId, "inquiry", "ntf.assigned", "", "/dashboard/leads"); },

        requestAppointment: ({ vehicleId, at, place, leadId, note, inspectorId, scheduled }) => {
          const u = me();
          const v = get().vehicles.find((x) => x.id === vehicleId);
          const lead = leadId ? get().leads.find((l) => l.id === leadId) : undefined;
          const ap: Appointment = { id: uid("a"), vehicleId, customerId: lead?.customerId ?? (u?.role === "customer" ? u.id : undefined), leadId, at, place, status: scheduled ? "scheduled" : "requested", inspectorId, requestedBy: u?.id ?? "guest", note, demo: false };
          set((s) => ({ appointments: [ap, ...s.appointments] }));
          if (leadId && scheduled) patchLead(leadId, (l) => ({ status: ["new", "contacted", "interested"].includes(l.status) ? "inspection" : l.status, history: [...l.history, { at: nowIso(), text: "status:inspection" }] }));
          if (u?.id !== v?.sellerId) notify(v?.sellerId, "inspection", "ntf.insp.new", vName(v), "/dashboard/inspections");
          get().users.filter((x) => x.role === "inspector").forEach((i) => notify(i.id, "inspection", "ntf.insp.new", vName(v), "/dashboard/inspections"));
          if (ap.customerId && ap.customerId !== u?.id) notify(ap.customerId, "inspection", "ntf.insp.sched", vName(v), "/account");
          return ap;
        },
        updateAppointment: (id, patch) => set((s) => ({ appointments: s.appointments.map((a) => (a.id === id ? { ...a, ...patch } : a)) })),

        saveReport: (r) => {
          set((s) => ({ reports: s.reports.some((x) => x.id === r.id) ? s.reports.map((x) => (x.id === r.id ? r : x)) : [r, ...s.reports] }));
          if (r.status === "published") {
            patchV(r.vehicleId, () => ({ reportId: r.id }));
            if (r.appointmentId) get().updateAppointment(r.appointmentId, { status: "completed", reportId: r.id });
            const v = get().vehicles.find((x) => x.id === r.vehicleId);
            const ap = get().appointments.find((a) => a.id === r.appointmentId);
            notify(v?.sellerId, "inspection", "ntf.report", vName(v), `/cars/view?id=${r.vehicleId}`, `rp:${r.id}`);
            notify(ap?.customerId, "inspection", "ntf.report", vName(v), `/cars/view?id=${r.vehicleId}`, `rp:${r.id}`);
          }
          audit("report.save", "report", r.id, r.status);
        },
        deleteReport: (id) => {
          set((s) => ({ reports: s.reports.filter((r) => r.id !== id), vehicles: s.vehicles.map((v) => (v.reportId === id ? { ...v, reportId: undefined } : v)) }));
          audit("report.delete", "report", id);
        },

        openThread: (vehicleId, otherId) => {
          const meId = get().sessionId!;
          const ex = get().threads.find((t) => t.vehicleId === vehicleId && t.participants.includes(meId) && t.participants.includes(otherId));
          if (ex) return ex.id;
          const t: Thread = { id: uid("t"), vehicleId, participants: [meId, otherId], messages: [], readAt: { [meId]: nowIso() }, demo: false };
          set((s) => ({ threads: [t, ...s.threads] }));
          return t.id;
        },
        sendMessage: (threadId, text) => {
          const meId = get().sessionId!;
          const at = nowIso();
          const t = get().threads.find((x) => x.id === threadId);
          set((s) => ({ threads: s.threads.map((x) => (x.id === threadId ? { ...x, messages: [...x.messages, { id: uid("m"), from: meId, text, at }], readAt: { ...x.readAt, [meId]: at } } : x)) }));
          t?.participants.filter((p) => p !== meId).forEach((p) => notify(p, "message", "ntf.message", text.slice(0, 60), "/messages"));
        },
        readThread: (threadId) => { const meId = get().sessionId; if (!meId) return; set((s) => ({ threads: s.threads.map((x) => (x.id === threadId ? { ...x, readAt: { ...x.readAt, [meId]: nowIso() } } : x)) })); },

        markNoticeRead: (id) => set((s) => ({ notices: s.notices.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
        markAllNotices: () => set((s) => ({ notices: s.notices.map((n) => (n.userId === s.sessionId ? { ...n, read: true } : n)) })),

        upsertAd: (a) => { set((s) => ({ ads: a.id && s.ads.some((x) => x.id === a.id) ? s.ads.map((x) => (x.id === a.id ? { ...x, ...a } : x)) : [{ id: uid("ad"), placement: "banner", title: "", subtitle: "", startAt: nowIso(), endAt: addDays(nowIso(), 14), active: true, impressions: 0, clicks: 0, paid: 0, demo: false, ...a } as Ad, ...s.ads] })); audit("ad.save", "ad", a.id ?? "new"); },
        deleteAd: (id) => { set((s) => ({ ads: s.ads.filter((a) => a.id !== id) })); audit("ad.delete", "ad", id); },
        adImpression: (id) => set((s) => ({ ads: s.ads.map((a) => (a.id === id ? { ...a, impressions: a.impressions + 1 } : a)) })),
        adClick: (id) => set((s) => ({ ads: s.ads.map((a) => (a.id === id ? { ...a, clicks: a.clicks + 1 } : a)) })),
        upsertCampaign: (c) => { set((s) => ({ campaigns: c.id && s.campaigns.some((x) => x.id === c.id) ? s.campaigns.map((x) => (x.id === c.id ? { ...x, ...c } : x)) : [{ id: uid("c"), name: "", code: "", discount: 10, startAt: nowIso(), endAt: addDays(nowIso(), 30), active: true, ...c } as Campaign, ...s.campaigns] })); audit("campaign.save", "campaign", c.id ?? "new"); },
        deleteCampaign: (id) => { set((s) => ({ campaigns: s.campaigns.filter((c) => c.id !== id) })); audit("campaign.delete", "campaign", id); },

        purchase: ({ packageId, vehicleId, method, code }) => {
          const u = me()!;
          const pk = getPackage(packageId)!;
          const camp = code ? get().campaigns.find((c) => c.active && c.code.toLowerCase() === code.trim().toLowerCase() && new Date(c.endAt) > new Date()) : undefined;
          const amount = Math.round((pk.priceMnt * (100 - (camp?.discount ?? 0))) / 100);
          const paid = method === "qpay" || method === "socialpay";
          const p: Payment = { id: uid("pay"), userId: u.id, amount, method, status: paid ? "paid_simulated" : "pending", purpose: packageId, packageId, vehicleId, at: nowIso(), ref: "VR" + Math.floor(100000 + Math.random() * 899999), demo: false };
          set((s) => ({ payments: [p, ...s.payments] }));
          if (paid) applyPackage(p);
          else admins().forEach((a) => notify(a.id, "payment", "ntf.paypending", p.ref, "/dashboard/admin/payments"));
          audit("payment.create", "payment", p.id, method);
          return p;
        },
        confirmPayment: (id) => {
          const p = get().payments.find((x) => x.id === id);
          if (!p || p.status !== "pending") return;
          set((s) => ({ payments: s.payments.map((x) => (x.id === id ? { ...x, status: "paid_simulated" as const } : x)) }));
          applyPackage({ ...p, status: "paid_simulated" });
          audit("payment.confirm", "payment", id);
        },
        rejectPayment: (id) => { set((s) => ({ payments: s.payments.map((x) => (x.id === id ? { ...x, status: "rejected" as const } : x)) })); audit("payment.reject", "payment", id); },

        setRole: (userId, role) => {
          const actor = me();
          const target = get().users.find((u) => u.id === userId);
          if (!actor || actor.role !== "super_admin" || !target || target.id === actor.id) return false;
          set((s) => ({ users: s.users.map((u) => (u.id === userId ? { ...u, role } : u)) }));
          audit("user.role", "user", userId, role);
          return true;
        },
        banUser: (id, b) => { set((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, banned: b } : u)) })); audit(b ? "user.ban" : "user.unban", "user", id); },
        verifyUser: (id, b) => { set((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, verified: b } : u)) })); audit("user.verify", "user", id, String(b)); },
        deleteUser: (id) => { set((s) => ({ users: s.users.filter((u) => u.id !== id) })); audit("user.delete", "user", id); },
        updateDealer: (id, patch) => { set((s) => ({ dealers: s.dealers.map((d) => (d.id === id ? { ...d, ...patch } : d)) })); audit("dealer.update", "dealer", id); },
        addLocation: (dealerId, l) => set((s) => ({ dealers: s.dealers.map((d) => (d.id === dealerId ? { ...d, locations: [...d.locations, { ...l, id: uid("loc") }] } : d)) })),
        removeLocation: (dealerId, lid) => set((s) => ({ dealers: s.dealers.map((d) => (d.id === dealerId ? { ...d, locations: d.locations.filter((l) => l.id !== lid) } : d)) })),
        addAgent: async (dealerId, { name, email, phone }) => {
          const em = email.trim().toLowerCase();
          if (get().users.some((u) => u.email.toLowerCase() === em)) return { ok: false, error: "auth.exists" };
          const user: User = { id: uid("u"), name, email: em, phone: phone.replace(/\D/g, "").replace(/^976/, ""), pw: DEMO_PW_HASH, role: "agent", province: "ub", verified: true, createdAt: nowIso(), dealerId, prefs: { priceDrop: true, newListing: true, inquiry: true, reminders: true, expiry: true }, demo: false };
          set((s) => ({ users: [...s.users, user] }));
          audit("agent.add", "user", user.id);
          return { ok: true };
        },
        removeAgent: (userId) => {
          set((s) => ({ users: s.users.filter((u) => u.id !== userId), leads: s.leads.map((l) => (l.assignedTo === userId ? { ...l, assignedTo: s.dealers.find((d) => s.users.find((u) => u.id === userId)?.dealerId === d.id)?.ownerId } : l)) }));
          audit("agent.remove", "user", userId);
        },

        upsertBrand: (b) => { set((s) => ({ brands: b.id && s.brands.some((x) => x.id === b.id) ? s.brands.map((x) => (x.id === b.id ? { ...x, ...b } : x)) : [...s.brands, { id: b.name.toLowerCase().replace(/[^a-z0-9]/g, "") + uid("").slice(0, 3), country: "", ...b } as Brand] })); audit("brand.save", "brand", b.id ?? b.name); },
        deleteBrand: (id) => { if (get().vehicles.some((v) => v.brandId === id) || get().models.some((m) => m.brandId === id)) return false; set((s) => ({ brands: s.brands.filter((b) => b.id !== id) })); audit("brand.delete", "brand", id); return true; },
        upsertModel: (m) => { set((s) => ({ models: m.id && s.models.some((x) => x.id === m.id) ? s.models.map((x) => (x.id === m.id ? { ...x, ...m } : x)) : [...s.models, { id: "m" + uid("").slice(0, 6), body: "sedan", categoryId: "sedan", fuel: "petrol", cc: 2000, trans: "automatic", drive: "fwd", hp: 150, cons: 8, len: 4500, wid: 1800, hei: 1500, seats: 5, doors: 4, steering: "LHD", refYear: 2018, refPrice: 40_000_000, years: [2012, 2024], ...m } as ModelDef] })); audit("model.save", "model", m.id ?? m.name); },
        deleteModel: (id) => { if (get().vehicles.some((v) => v.modelId === id)) return false; set((s) => ({ models: s.models.filter((m) => m.id !== id) })); audit("model.delete", "model", id); return true; },
        upsertCategory: (c) => { set((s) => ({ categories: c.id && s.categories.some((x) => x.id === c.id) ? s.categories.map((x) => (x.id === c.id ? { ...x, ...c } : x)) : [...s.categories, { id: "c" + uid("").slice(0, 6), ...c } as Category] })); audit("category.save", "category", c.id ?? c.en); },
        deleteCategory: (id) => { if (get().vehicles.some((v) => v.categoryId === id) || get().models.some((m) => m.categoryId === id)) return false; set((s) => ({ categories: s.categories.filter((c) => c.id !== id) })); audit("category.delete", "category", id); return true; },

        reportListing: (vehicleId, reason) => { set((s) => ({ flags: [{ id: uid("f"), vehicleId, reporterId: s.sessionId ?? undefined, reason, status: "open", at: nowIso() }, ...s.flags] })); },
        resolveFlag: (id, status) => { set((s) => ({ flags: s.flags.map((f) => (f.id === id ? { ...f, status } : f)) })); audit("flag." + status, "flag", id); },

        tick: () => {
          const now = Date.now();
          const s = get();
          // expire listings and promotions
          const changed: Vehicle[] = [];
          s.vehicles.forEach((v) => {
            const patch: Partial<Vehicle> = {};
            if (v.status === "active" && new Date(v.expiresAt).getTime() < now) patch.status = "expired";
            if (v.tier === "featured" && v.featuredUntil && new Date(v.featuredUntil).getTime() < now) { patch.tier = "free"; patch.featuredUntil = undefined; }
            if (v.tier === "premium" && v.premiumUntil && new Date(v.premiumUntil).getTime() < now) { patch.tier = "free"; patch.premiumUntil = undefined; }
            if (Object.keys(patch).length) changed.push({ ...v, ...patch });
          });
          if (changed.length) set((st) => ({ vehicles: st.vehicles.map((v) => changed.find((c) => c.id === v.id) ?? v) }));
          s.vehicles.forEach((v) => {
            if (v.status === "active") {
              const days = (new Date(v.expiresAt).getTime() - now) / 86400000;
              if (days <= 7 && days > 0) notify(v.sellerId, "expiry", "ntf.expiring", vName(v), "/dashboard/listings", `exp:${v.id}:${v.expiresAt.slice(0, 10)}`);
            }
          });
          s.appointments.forEach((a) => {
            if (a.status === "scheduled") {
              const hrs = (new Date(a.at).getTime() - now) / 3600000;
              if (hrs > 0 && hrs <= 24) {
                const v = s.vehicles.find((x) => x.id === a.vehicleId);
                [a.customerId, v?.sellerId, a.inspectorId].forEach((p) => notify(p, "reminder", "ntf.insp.remind", vName(v), "/dashboard/inspections", `ar:${a.id}:${p}`));
              }
            }
          });
          s.leads.forEach((l) => l.reminders.forEach((r) => { if (!r.done && new Date(r.at).getTime() <= now) notify(l.assignedTo, "reminder", "ntf.followup", `${l.name}: ${r.text}`, "/dashboard/leads", `fu:${r.id}`); }));
        },
        resetDemo: () => set({ ...buildSeed(), sessionId: null, compare: [] }),
      };
    },
    {
      name: "vrooma-demo-db",
      version: SEED_VERSION,
      storage: createJSONStorage(() => storage),
      migrate: () => ({ ...buildSeed(), ...ui0 }) as unknown as Store,
      partialize: (s) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { toast, ...rest } = s;
        return Object.fromEntries(Object.entries(rest).filter(([, v]) => typeof v !== "function")) as unknown as Store;
      },
    },
  ),
);

export { isPublic };
