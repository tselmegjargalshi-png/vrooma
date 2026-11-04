export type Lang = "mn" | "en";
export type Role = "super_admin" | "admin" | "dealer_owner" | "agent" | "seller" | "inspector" | "customer";
export const ROLES: Role[] = ["super_admin", "admin", "dealer_owner", "agent", "seller", "inspector", "customer"];

export type Fuel = "petrol" | "diesel" | "hybrid" | "phev" | "electric" | "lpg";
export type Trans = "automatic" | "manual" | "cvt" | "other";
export type Drive = "2wd" | "awd" | "4wd" | "fwd" | "rwd";
export type Steering = "LHD" | "RHD";
export type Condition = "new" | "excellent" | "good" | "fair";
export type Accident = "none" | "minor" | "major";
export type Origin = "imported" | "local";
export type VStatus = "pending" | "active" | "paused" | "sold" | "rejected" | "expired";
export type Tier = "free" | "premium" | "featured";
export type PhotoKind = "exterior" | "interior" | "engine" | "dashboard";
export type Body = "sedan" | "suv" | "crossover" | "hatchback" | "coupe" | "convertible" | "pickup" | "van" | "minivan" | "truck";
export type LeadStatus = "new" | "contacted" | "interested" | "inspection" | "negotiation" | "deposit" | "sold" | "lost";
export const LEAD_STATUSES: LeadStatus[] = ["new", "contacted", "interested", "inspection", "negotiation", "deposit", "sold", "lost"];
export type LeadSource = "website" | "phone" | "map" | "dealer_page" | "referral" | "social";
export type PayMethod = "qpay" | "socialpay" | "bank" | "cash";

export interface Prefs { priceDrop: boolean; newListing: boolean; inquiry: boolean; reminders: boolean; expiry: boolean }

export interface User {
  id: string; name: string; email: string; phone: string; pw: string; role: Role;
  province: string; verified: boolean; banned?: boolean; createdAt: string;
  dealerId?: string; bio?: string; prefs: Prefs; demo: boolean;
}
export interface Location { id: string; name: string; province: string; district: string; address: string; lat: number; lng: number }
export interface Dealer {
  id: string; name: string; description: string; phone: string; email: string; website?: string; tone: string;
  logo?: string; locations: Location[]; ownerId: string; verified: boolean;
  plan: "none" | "silver" | "gold" | "platinum"; planExpires?: string; createdAt: string; demo: boolean;
}
export interface Brand { id: string; name: string; country: string; demo?: boolean }
export interface Category { id: string; mn: string; en: string; body?: Body }
export interface ModelDef {
  id: string; brandId: string; name: string; body: Body; categoryId: string; fuel: Fuel; cc: number; trans: Trans; drive: Drive;
  hp: number; cons: number; len: number; wid: number; hei: number; seats: number; doors: number;
  steering: Steering; refYear: number; refPrice: number; years: [number, number]; luxury?: boolean; demo?: boolean;
}
export interface Photo { kind: PhotoKind; url?: string }
export interface Vehicle {
  id: string; brandId: string; modelId: string; modelName: string; categoryId: string; body: Body;
  year: number; importYear: number | null; mileage: number; cc: number; fuel: Fuel; trans: Trans; drive: Drive; steering: Steering;
  color: string; interiorColor: string; doors: number; seats: number; condition: Condition;
  accident: Accident; accidentNote: string; service: string[]; origin: Origin;
  province: string; district: string; lat: number; lng: number;
  price: number; negotiable: boolean; prevPrice?: number;
  descMn: string; descEn: string;
  sellerId: string; dealerId?: string; status: VStatus; tier: Tier; featuredUntil?: string; premiumUntil?: string;
  createdAt: string; expiresAt: string; soldAt?: string; soldPrice?: number; rejectReason?: string;
  views: number; phoneClicks: number; viewsDaily: number[];
  photos: Photo[]; hasVideo: boolean; videoUrl?: string;
  hp: number; cons: number; len: number; wid: number; hei: number; safety: string[]; equipment: string[];
  plate: string; owners: number; customsCleared: boolean; reportId?: string; demo: boolean;
}
export interface Note { id: string; by: string; text: string; at: string }
export interface Reminder { id: string; at: string; text: string; done: boolean }
export interface HistoryItem { at: string; text: string }
export interface Lead {
  id: string; vehicleId: string; customerId?: string; name: string; phone: string; email?: string; message: string;
  source: LeadSource; status: LeadStatus; assignedTo?: string; notes: Note[]; reminders: Reminder[]; history: HistoryItem[];
  offer?: number; deposit?: number; createdAt: string; updatedAt: string; demo: boolean;
}
export interface Appointment {
  id: string; vehicleId: string; customerId?: string; leadId?: string; at: string; place: string;
  status: "requested" | "scheduled" | "completed" | "cancelled"; inspectorId?: string; requestedBy: string; note?: string; reportId?: string; demo: boolean;
}
export type CheckKey = "exterior" | "interior" | "engine" | "transmission" | "suspension" | "tires" | "electrical";
export const CHECKS: CheckKey[] = ["exterior", "interior", "engine", "transmission", "suspension", "tires", "electrical"];
export interface Report {
  id: string; vehicleId: string; appointmentId?: string; inspectorId: string; date: string;
  checks: Record<CheckKey, { score: number; note: string }>;
  accidentFound: boolean; accidentNote: string; maintenance: string; notes: string; odometer: number;
  photos: string[]; status: "draft" | "published"; demo: boolean;
}
export interface Msg { id: string; from: string; text: string; at: string }
export interface Thread { id: string; vehicleId?: string; participants: string[]; messages: Msg[]; readAt: Record<string, string>; demo: boolean }
export interface Notice { id: string; userId: string; kind: string; title: string; body: string; link?: string; at: string; read: boolean; key?: string }
export interface SavedSearch { id: string; userId: string; name: string; query: string; notify: boolean; createdAt: string }
export interface Ad {
  id: string; placement: "hero" | "banner" | "spotlight"; vehicleId?: string; dealerId?: string; title: string; subtitle: string;
  startAt: string; endAt: string; active: boolean; impressions: number; clicks: number; paid: number; demo: boolean;
}
export interface Campaign { id: string; name: string; code: string; discount: number; startAt: string; endAt: string; active: boolean }
export interface Payment {
  id: string; userId: string; amount: number; method: PayMethod; status: "paid_simulated" | "pending" | "rejected";
  purpose: string; packageId: string; vehicleId?: string; at: string; ref: string; demo: boolean;
}
export interface Sub { id: string; userId: string; dealerId?: string; packageId: string; startAt: string; endAt: string; active: boolean }
export interface Flag { id: string; vehicleId: string; reporterId?: string; reason: string; status: "open" | "resolved" | "dismissed"; at: string }
export interface Audit { id: string; actorId: string; actor: string; action: string; entity: string; entityId: string; detail: string; at: string }
export interface Article { id: string; mn: string; en: string; bodyMn: string; bodyEn: string; tagMn: string; tagEn: string; at: string; tone: string }
