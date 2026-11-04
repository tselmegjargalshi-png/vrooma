import { BRANDS, CATEGORIES, MODELS, COLORS, INTERIOR_COLORS, SAFETY, EQUIPMENT } from "./catalog";
import { PROVINCES, DISTRICTS, provCenter } from "./geo";
import { addDays } from "./format";
import type {
  Ad, Appointment, Article, Audit, Campaign, CheckKey, Dealer, Flag, Lead, LeadSource, LeadStatus, Msg, Notice, Payment, Report, Sub, Thread, User, Vehicle, Photo, Condition, Accident, VStatus,
} from "./types";
import { CHECKS, LEAD_STATUSES } from "./types";

export const DEMO_PASSWORD = "demo1234";
export const DEMO_PW_HASH = "0ead2060b65992dca4769af601a1b3a35ef38cfad2c2c465bb160ea764157c5d"; // sha256("demo1234")
export const SEED_VERSION = 3;

function rng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const GIVEN = ["Ганбаатар", "Билгүүн", "Төмөр", "Оюунаа", "Сарнай", "Номин", "Цэцэг", "Төгөлдөр", "Мөнхбат", "Энхжин", "Анужин", "Тэмүүлэн", "Золбоо", "Хулан", "Тунгалаг", "Ариунаа", "Батбаяр", "Дөлгөөн", "Өлзийбаяр", "Үүрцайх", "Нандин", "Гэрэл", "Баярмаа", "Саруул", "Мөнхзул", "Отгонбаяр", "Элбэгдорж", "Пүрэвсүрэн", "Амаржаргал", "Эрдэнэбат"];
const FAMILY = ["Б", "Д", "Г", "С", "Т", "Э", "Н", "Л", "М", "О", "Ү", "Ө", "Х", "Ц"];
const PLATE_LETTERS = ["УБА", "УНА", "УБЭ", "УБХ", "УНЭ", "УБТ", "УАА", "УБГ"];

export interface DB {
  users: User[]; dealers: Dealer[]; vehicles: Vehicle[]; leads: Lead[]; appointments: Appointment[]; reports: Report[];
  threads: Thread[]; notices: Notice[]; ads: Ad[]; campaigns: Campaign[]; payments: Payment[]; subs: Sub[]; flags: Flag[]; audits: Audit[];
  articles: Article[]; savedSearches: import("./types").SavedSearch[];
  brands: typeof BRANDS; models: typeof MODELS; categories: typeof CATEGORIES;
  favorites: Record<string, string[]>; recent: Record<string, string[]>;
}

export function buildSeed(): DB {
  const R = rng(20261104);
  const pick = <T,>(a: readonly T[]): T => a[Math.floor(R() * a.length)];
  const between = (a: number, b: number) => a + R() * (b - a);
  const int = (a: number, b: number) => Math.floor(between(a, b + 1));
  const now = Date.now();
  const iso = (daysAgo: number) => new Date(now - daysAgo * 86400000).toISOString();
  const prefs = { priceDrop: true, newListing: true, inquiry: true, reminders: true, expiry: true };
  const phone = () => String(pick([8, 9])) + String(int(100, 999)) + String(int(1000, 9999)).padStart(4, "0");
  const pname = (i: number) => `${FAMILY[i % FAMILY.length]}. ${GIVEN[(i * 7 + 3) % GIVEN.length]}`;

  const users: User[] = [];
  const mk = (u: Partial<User> & Pick<User, "id" | "name" | "email" | "role">): User => {
    const user: User = { phone: phone(), pw: DEMO_PW_HASH, province: "ub", verified: false, createdAt: iso(int(40, 400)), prefs: { ...prefs }, demo: true, ...u };
    users.push(user);
    return user;
  };
  mk({ id: "u_super", name: "Vrooma Ерөнхий админ", email: "superadmin@vrooma.demo", role: "super_admin", verified: true });
  mk({ id: "u_admin", name: "Vrooma Платформын админ", email: "admin@vrooma.demo", role: "admin", verified: true });
  mk({ id: "u_insp1", name: "Ө. Мөнхжин (үзлэгийн мэргэжилтэн)", email: "inspector1@vrooma.demo", role: "inspector", verified: true });
  mk({ id: "u_insp2", name: "Ү. Болормаа (үзлэгийн мэргэжилтэн)", email: "inspector2@vrooma.demo", role: "inspector", verified: true });

  const dealerNames = [
    ["Алтан Гүүр Авто", "Япон, Солонгосоос шууд импортолсон хэрэглээний болон бизнес ангиллын машинууд.", "#B8925A"],
    ["Хан Тэнгэр Моторс", "Тансаг болон жийп ангиллын шалгагдсан машинуудын төрөлжсөн төв.", "#2C4A7A"],
    ["Говийн Дөл Драйв", "Говь, хээрийн замд зориулсан найдвартай 4WD, пикап, жийп.", "#7A5E36"],
    ["Үнэт Авто Төв", "Хүртээмжтэй үнэтэй гэр бүлийн машин, хибрид, хэтчбэк.", "#2F5D45"],
    ["Өргөө EV Хаб", "Цахилгаан болон залгууртай хибрид машины мэргэжлийн төв, цэнэглэгчийн зөвлөгөөтэй.", "#1B1D21"],
  ];
  const dealers: Dealer[] = [];
  dealerNames.forEach(([name, description, tone], i) => {
    const n = i + 1;
    const owner = mk({ id: `u_dealer${n}`, name: pname(n + 30), email: `dealer${n}@vrooma.demo`, role: "dealer_owner", verified: true, dealerId: `d${n}`, province: "ub" });
    for (let a = 1; a <= 2; a++) mk({ id: `u_agent${n}${a}`, name: pname(n * 5 + a), email: `agent${n}${a}@vrooma.demo`, role: "agent", verified: true, dealerId: `d${n}`, province: "ub" });
    const d1 = DISTRICTS[(i * 2) % DISTRICTS.length], d2 = DISTRICTS[(i * 2 + 3) % DISTRICTS.length];
    dealers.push({
      id: `d${n}`, name, description, phone: phone(), email: `info${n}@vrooma.demo`, tone, ownerId: owner.id, verified: i !== 3,
      plan: (["gold", "platinum", "silver", "silver", "gold"] as const)[i], planExpires: addDays(new Date(now), 20 + i * 5), createdAt: iso(300 - i * 20), demo: true,
      locations: [
        { id: `d${n}l1`, name: "Үндсэн салбар", province: "ub", district: d1.id, address: `${d1.mn} дүүрэг, ${int(1, 20)} р хороо`, lat: d1.lat, lng: d1.lng },
        { id: `d${n}l2`, name: "Үзлэг, борлуулалтын талбай", province: "ub", district: d2.id, address: `${d2.mn} дүүрэг, ${int(1, 20)} р хороо`, lat: d2.lat, lng: d2.lng },
      ],
    });
  });
  for (let i = 1; i <= 15; i++) mk({ id: `u_seller${i}`, name: pname(i + 7), email: `seller${String(i).padStart(2, "0")}@vrooma.demo`, role: "seller", verified: i % 3 !== 0, province: i % 4 === 0 ? pick(PROVINCES.slice(1)).id : "ub" });
  for (let i = 1; i <= 30; i++) mk({ id: `u_cust${i}`, name: pname(i + 15), email: `customer${String(i).padStart(2, "0")}@vrooma.demo`, role: "customer", province: i % 5 === 0 ? pick(PROVINCES).id : "ub" });

  // ───── Vehicles ─────
  const forced = ["prius30", "prius50", "lc200", "lc300", "rx350", "lx570", "eclass", "x5", "tucson", "sportage", "forester", "crv", "modely", "songplus"];
  const weights: string[] = [];
  MODELS.forEach((m) => { const w = m.id.startsWith("prius") ? 7 : ["prado150", "crv", "xtrail", "forester", "tucson", "sportage", "fit", "hilux", "rx350"].includes(m.id) ? 4 : 2; for (let i = 0; i < w; i++) weights.push(m.id); });

  const sellerIds = users.filter((u) => u.role === "seller").map((u) => u.id);
  const vehicles: Vehicle[] = [];
  const statusPlan: VStatus[] = [];
  for (let i = 0; i < 100; i++) statusPlan.push("active");
  [[3, "pending"], [7, "pending"], [12, "pending"], [18, "pending"], [29, "pending"], [41, "pending"], [55, "pending"], [8, "sold"], [21, "sold"], [33, "sold"], [47, "sold"], [60, "paused"], [74, "paused"], [66, "rejected"], [88, "rejected"], [95, "expired"]].forEach(([i, s]) => (statusPlan[i as number] = s as VStatus));

  for (let i = 0; i < 100; i++) {
    const mid = i < forced.length ? forced[i] : pick(weights);
    const m = MODELS.find((x) => x.id === mid)!;
    const year = Math.min(m.years[1], Math.max(m.years[0], Math.round(m.years[1] - Math.pow(R(), 1.6) * (m.years[1] - m.years[0]))));
    const age = Math.max(0, 2026 - year);
    const isNew = year >= 2025 && R() < 0.5;
    const mileage = isNew ? int(0, 900) : Math.max(1500, Math.round((age * between(9000, 17000) + between(-5000, 8000)) / 100) * 100);
    const accident: Accident = R() < 0.72 ? "none" : R() < 0.8 ? "minor" : "major";
    const condition: Condition = isNew ? "new" : accident === "major" ? "fair" : mileage < 60000 ? (R() < 0.6 ? "excellent" : "good") : R() < 0.5 ? "good" : "fair";
    const importYear = Math.min(2026, year + (R() < 0.5 ? 0 : int(0, Math.min(4, 2026 - year))));
    const origin = importYear >= 2025 ? "imported" : "local";
    const dealerIdx = i % 9 < 4 ? (i % 5) : -1;
    const dealer = dealerIdx >= 0 ? dealers[dealerIdx] : undefined;
    const sellerId = dealer ? dealer.ownerId : sellerIds[i % sellerIds.length];
    const inUb = R() < 0.64;
    const loc = dealer ? dealer.locations[i % 2] : null;
    const province = loc ? "ub" : inUb ? "ub" : pick(PROVINCES.slice(1)).id;
    const dist = province === "ub" ? (loc ? DISTRICTS.find((d) => d.id === loc.district)! : pick(DISTRICTS)) : null;
    const c = dist ?? provCenter(province);
    const jit = dist ? 0.014 : 0.14;
    const color = pick(COLORS);
    const base = m.refPrice * Math.pow(1.078, year - m.refYear);
    const expected = age * 13000;
    let price = base * (1 - Math.max(-0.06, Math.min(0.22, (mileage - expected) / 450000))) * (accident === "none" ? 1 : accident === "minor" ? 0.9 : 0.74) * (condition === "fair" ? 0.94 : 1);
    price *= between(0.95, 1.06);
    const step = price > 100_000_000 ? 1_000_000 : 100_000;
    price = Math.max(6_000_000, Math.round(price / step) * step);
    const status = statusPlan[i];
    const createdDays = int(1, 58);
    const roll = R();
    const tier: Vehicle["tier"] = status !== "active" ? "free" : i < 6 || roll < 0.06 ? "featured" : roll < 0.24 ? "premium" : "free";
    const maybeDrop = status === "active" && R() < 0.12;
    const kinds: Photo["kind"][] = ["exterior", "exterior", "exterior", "interior", "interior", "engine", "dashboard"];
    const eq = [...EQUIPMENT].filter(() => R() < (m.luxury ? 0.6 : 0.3));
    const sf = [...SAFETY].filter((s) => (s === "abs" || s === "airbags" ? true : R() < (year >= 2018 ? 0.55 : 0.25)));
    const svcKeys = ["oil", "brakes", "tires", "battery", "inspection", "ac", "suspension"];
    const svcCount = isNew ? 0 : int(1, 4);
    const service = Array.from({ length: svcCount }, (_, k) => `${svcKeys[(i + k * 2) % svcKeys.length]}|${2025 - (k > 1 ? 1 : 0)}.${String(int(1, 12)).padStart(2, "0")}|${Math.max(1000, mileage - (k + 1) * int(3000, 9000))}`);
    const v: Vehicle = {
      id: `v${String(i + 1).padStart(3, "0")}`, brandId: m.brandId, modelId: m.id, modelName: m.name, categoryId: m.categoryId, body: m.body,
      year, importYear, mileage, cc: m.cc, fuel: m.fuel, trans: m.trans, drive: m.drive, steering: m.steering === "RHD" && R() < 0.08 ? "LHD" : m.steering,
      color, interiorColor: pick(INTERIOR_COLORS), doors: m.doors, seats: m.seats, condition, accident,
      accidentNote: accident === "none" ? "" : accident === "minor" ? "bumper" : "frame",
      service, origin, province, district: dist ? dist.id : "", lat: c.lat + between(-jit, jit), lng: c.lng + between(-jit, jit) * 1.4,
      price, negotiable: R() < 0.55, prevPrice: maybeDrop ? Math.round((price * 1.06) / step) * step : undefined,
      descMn: "", descEn: "", sellerId, dealerId: dealer?.id, status, tier,
      featuredUntil: tier === "featured" ? addDays(new Date(now), int(5, 25)) : undefined,
      premiumUntil: tier === "premium" ? addDays(new Date(now), int(5, 25)) : undefined,
      createdAt: iso(createdDays), expiresAt: status === "expired" ? iso(3) : addDays(new Date(now), 60 - createdDays + int(0, 4)),
      soldAt: status === "sold" ? iso(int(1, 12)) : undefined, soldPrice: status === "sold" ? Math.round(price * 0.97 / step) * step : undefined,
      rejectReason: status === "rejected" ? (i % 2 ? "photos" : "price") : undefined,
      views: int(40, 1900), phoneClicks: int(2, 90), viewsDaily: Array.from({ length: 30 }, () => int(0, 55)),
      photos: kinds.map((kind) => ({ kind })), hasVideo: R() < 0.22,
      hp: m.hp, cons: m.cons, len: m.len, wid: m.wid, hei: m.hei, safety: sf, equipment: eq,
      plate: `${int(1000, 9999)} ${pick(PLATE_LETTERS)}`, owners: isNew ? 1 : int(1, 4), customsCleared: R() < 0.93, demo: true,
    };
    const b = BRANDS.find((x) => x.id === v.brandId)!.name;
    const fuelMn = { petrol: "бензин", diesel: "дизель", hybrid: "хибрид", phev: "залгууртай хибрид", electric: "цахилгаан", lpg: "хийн" }[v.fuel];
    v.descMn = `${b} ${v.modelName}, ${v.year} онд үйлдвэрлэгдсэн, ${v.importYear} онд орж ирсэн. ${fuelMn} хөдөлгүүртэй, ${v.mileage.toLocaleString("en-US")} км явсан. ${accident === "none" ? "Осол гараагүй гэж худалдагч мэдүүлсэн." : "Ослын түүхтэй, дэлгэрэнгүйг үзлэгээр шалгаж болно."} Үзлэг шалгалтад нээлттэй, дэлгэрэнгүй мэдээллийг утсаар лавлана уу.`;
    v.descEn = `${b} ${v.modelName}, built in ${v.year} and imported in ${v.importYear}. ${v.fuel === "electric" ? "Fully electric" : v.fuel === "phev" ? "Plug in hybrid" : v.fuel === "hybrid" ? "Hybrid" : v.fuel === "diesel" ? "Diesel" : "Petrol"} powertrain with ${v.mileage.toLocaleString("en-US")} km on the odometer. ${accident === "none" ? "The seller declares no accident history." : "Has an accident history, see the inspection for details."} Open to inspection, contact the seller for more details.`;
    vehicles.push(v);
  }

  // ───── Leads (50) ─────
  const activeVeh = vehicles.filter((v) => v.status === "active" || v.status === "sold");
  const customers = users.filter((u) => u.role === "customer");
  const msgs = ["Энэ машин зарагдаагүй байгаа юу?", "Үнэ дээр хөнгөлөлт хийх боломжтой юу?", "Маргааш үзэж болох уу?", "Солилцоо хийх боломжтой юу?", "Лизингээр авч болох уу?", "Ослын түүх, засварын мэдээлэл өгч туслана уу."];
  const leads: Lead[] = [];
  const statusDist: LeadStatus[] = ["new", "new", "new", "new", "new", "new", "contacted", "contacted", "contacted", "contacted", "contacted", "interested", "interested", "interested", "interested", "inspection", "inspection", "inspection", "inspection", "negotiation", "negotiation", "negotiation", "deposit", "deposit", "sold", "sold", "sold", "lost", "lost", "lost"];
  for (let i = 0; i < 50; i++) {
    const v = activeVeh[(i * 7 + 3) % activeVeh.length];
    const cust = i % 6 === 5 ? undefined : customers[i % customers.length];
    const status = i < statusDist.length ? statusDist[i] : pick(LEAD_STATUSES);
    const agentsOf = users.filter((u) => u.role === "agent" && u.dealerId === v.dealerId);
    const assignedTo = v.dealerId ? agentsOf[i % 2]?.id : v.sellerId;
    const at = iso(int(0, 30));
    const lead: Lead = {
      id: `l${String(i + 1).padStart(3, "0")}`, vehicleId: v.id, customerId: cust?.id, name: cust?.name ?? `Зочин ${i + 1}`, phone: cust?.phone ?? phone(), email: cust?.email,
      message: pick(msgs), source: pick(["website", "website", "phone", "map", "dealer_page", "referral", "social"] as LeadSource[]), status, assignedTo,
      notes: i % 3 === 0 ? [{ id: `n${i}a`, by: assignedTo ?? "u_admin", text: "Үйлчлүүлэгч хоёр өдрийн дараа дахин холбогдохоор тохирсон.", at }] : [],
      reminders: i % 4 === 0 ? [{ id: `r${i}a`, at: addDays(new Date(now), int(-1, 3)), text: "Утсаар холбогдох", done: false }] : [],
      history: [{ at, text: "created" }],
      offer: status === "negotiation" || status === "deposit" || status === "sold" ? Math.round((v.price * 0.96) / 100000) * 100000 : undefined,
      deposit: status === "deposit" || status === "sold" ? Math.round((v.price * 0.05) / 100000) * 100000 : undefined,
      createdAt: at, updatedAt: at, demo: true,
    };
    leads.push(lead);
  }

  // ───── Appointments (15) and reports ─────
  const appointments: Appointment[] = [];
  const reports: Report[] = [];
  const places = ["Үзлэгийн төв, Баянзүрх", "Худалдагчийн талбай", "Vrooma үзлэгийн цэг, Хан Уул"];
  for (let i = 0; i < 15; i++) {
    const v = activeVeh[(i * 5 + 1) % activeVeh.length];
    const done = i < 3;
    const days = done ? -int(2, 15) : i < 8 ? int(0, 6) : int(2, 14);
    const at = new Date(now + days * 86400000 + (i % 3) * 3600000).toISOString();
    const status: Appointment["status"] = done ? "completed" : i % 5 === 4 ? "requested" : i === 14 ? "cancelled" : "scheduled";
    const ap: Appointment = {
      id: `a${String(i + 1).padStart(2, "0")}`, vehicleId: v.id, customerId: customers[(i * 2) % customers.length].id, at, place: pick(places), status,
      inspectorId: status === "requested" ? undefined : i % 2 ? "u_insp2" : "u_insp1", requestedBy: customers[(i * 2) % customers.length].id, demo: true,
    };
    if (done) {
      const rid = `rp${i + 1}`;
      const checks = Object.fromEntries(CHECKS.map((k) => [k, { score: int(3, 5), note: "" }])) as Report["checks"];
      reports.push({ id: rid, vehicleId: v.id, appointmentId: ap.id, inspectorId: ap.inspectorId!, date: at, checks, accidentFound: v.accident !== "none", accidentNote: v.accident !== "none" ? "Урд бампер засвартай, бусад хэсэг хэвийн." : "", maintenance: "Тосны сүүлийн солилт баримттай.", notes: "Ерөнхий байдал үнэтэй нийцэж байна.", odometer: v.mileage + int(0, 120), photos: [], status: "published", demo: true });
      ap.reportId = rid; v.reportId = rid;
    }
    appointments.push(ap);
  }

  // ───── Threads ─────
  const threads: Thread[] = [];
  for (let i = 0; i < 12; i++) {
    const v = activeVeh[(i * 4 + 2) % activeVeh.length];
    const cust = customers[i % customers.length];
    const seller = v.dealerId ? users.find((u) => u.role === "agent" && u.dealerId === v.dealerId)!.id : v.sellerId;
    const t0 = iso(int(1, 9));
    const m: Msg[] = [
      { id: `m${i}a`, from: cust.id, text: pick(msgs), at: t0 },
      { id: `m${i}b`, from: seller, text: "Сайн байна уу, зарагдаагүй байгаа. Хэзээ ирж үзэх вэ?", at: new Date(new Date(t0).getTime() + 3600000).toISOString() },
    ];
    threads.push({ id: `t${i + 1}`, vehicleId: v.id, participants: [cust.id, seller], messages: m, readAt: { [cust.id]: m[1].at, [seller]: m[1].at }, demo: true });
  }

  // ───── Ads (10) ─────
  const feat = vehicles.filter((v) => v.tier === "featured" && v.status === "active");
  const ads: Ad[] = [];
  for (let i = 0; i < 10; i++) {
    const placement = i < 3 ? "hero" : i < 6 ? "banner" : "spotlight";
    const veh = feat[i % feat.length];
    ads.push({
      id: `ad${i + 1}`, placement, vehicleId: placement === "spotlight" ? undefined : veh.id, dealerId: placement === "spotlight" ? dealers[i % 5].id : veh.dealerId,
      title: placement === "spotlight" ? dealers[i % 5].name : "", subtitle: "", startAt: iso(10), endAt: addDays(new Date(now), 20 + i), active: true,
      impressions: int(2000, 18000), clicks: int(60, 900), paid: [150000, 250000, 350000][i % 3], demo: true,
    });
  }

  // ───── Payments / subs / campaigns ─────
  const packs = ["pk_featured7", "pk_featured14", "pk_premium30", "pk_home7", "pk_seller_std", "pk_dealer_silver", "pk_dealer_gold"];
  const prices: Record<string, number> = { pk_featured7: 29000, pk_featured14: 49000, pk_premium30: 49000, pk_home7: 150000, pk_seller_std: 99000, pk_dealer_silver: 490000, pk_dealer_gold: 990000 };
  const payments: Payment[] = [];
  for (let i = 0; i < 26; i++) {
    const pk = packs[i % packs.length];
    const isDealer = pk.startsWith("pk_dealer");
    const payer = isDealer ? dealers[i % 5].ownerId : sellerIds[i % sellerIds.length];
    payments.push({ id: `pay${i + 1}`, userId: payer, amount: prices[pk], method: pick(["qpay", "qpay", "socialpay", "bank", "cash"] as const), status: i === 24 || i === 25 ? "pending" : "paid_simulated", purpose: pk, packageId: pk, at: iso(i * 7 + 1), ref: `VR${100000 + i * 37}`, demo: true });
  }
  const subs: Sub[] = dealers.map((d, i) => ({ id: `s${i + 1}`, userId: d.ownerId, dealerId: d.id, packageId: `pk_dealer_${d.plan}`, startAt: iso(10), endAt: d.planExpires!, active: true }));
  const campaigns: Campaign[] = [
    { id: "c1", name: "Өвлийн урамшуулал", code: "WINTER10", discount: 10, startAt: iso(5), endAt: addDays(new Date(now), 25), active: true },
    { id: "c2", name: "Шинэ дилерийн урамшуулал", code: "DEALER15", discount: 15, startAt: iso(20), endAt: addDays(new Date(now), 40), active: true },
    { id: "c3", name: "Намрын хямдрал", code: "AUTUMN5", discount: 5, startAt: iso(70), endAt: iso(10), active: false },
  ];
  const flags: Flag[] = [
    { id: "f1", vehicleId: vehicles[10].id, reporterId: "u_cust3", reason: "price", status: "open", at: iso(2) },
    { id: "f2", vehicleId: vehicles[24].id, reporterId: "u_cust9", reason: "sold", status: "open", at: iso(1) },
    { id: "f3", vehicleId: vehicles[31].id, reporterId: "u_cust12", reason: "photos", status: "resolved", at: iso(6) },
  ];
  const audits: Audit[] = [
    { id: "au1", actorId: "u_admin", actor: "Vrooma Платформын админ", action: "listing.approve", entity: "vehicle", entityId: vehicles[1].id, detail: "seed", at: iso(3) },
    { id: "au2", actorId: "u_super", actor: "Vrooma Ерөнхий админ", action: "dealer.verify", entity: "dealer", entityId: "d1", detail: "seed", at: iso(9) },
  ];

  const articles: Article[] = [
    { id: "n1", mn: "Монголд Prius 30 болон Prius 50 аль нь илүү вэ?", en: "Prius 30 or Prius 50: which suits Mongolia better?", tagMn: "Харьцуулалт", tagEn: "Comparison", at: iso(4), tone: "#B8925A",
      bodyMn: "Prius 30 нь хүртээмжтэй үнэтэй, сэлбэг олдоцтой. Prius 50 нь шинэ платформтой, тогтвортой, шатахуун бага иддэг. Өвлийн хүйтэнд батерейны байдлыг заавал шалгаарай. Хоёр загварыг манай харьцуулах хэрэгслээр зэрэгцүүлж үзнэ үү.",
      bodyEn: "The Prius 30 is affordable with plentiful parts. The Prius 50 uses a newer platform, feels more stable and uses less fuel. Always check hybrid battery health before a Mongolian winter. Use our compare tool to put both side by side." },
    { id: "n2", mn: "Хуучин машин авахдаа үзлэг хийлгэх 7 шалтгаан", en: "Seven reasons to inspect a used car before you buy", tagMn: "Зөвлөгөө", tagEn: "Guide", at: iso(8), tone: "#2C4A7A",
      bodyMn: "Ослын мэдээлэл, гүйлтийн бодит байдал, хөдөлгүүр дамжуулгын төлөв зэргийг зөвхөн бие даасан үзлэгээр баталгаажуулна. Vrooma дээрх үзлэгийн тайланд худалдагчийн мэдүүлсэн болон шалгагдсан мэдээллийг тусад нь харуулдаг.",
      bodyEn: "Accident history, true mileage and engine and transmission condition can only be confirmed by an independent inspection. Vrooma reports show seller declared data separately from verified results." },
    { id: "n3", mn: "Цахилгаан машин өвлийн улиралд: юуг мэдэх вэ", en: "Electric cars in winter: what to know", tagMn: "Цахилгаан", tagEn: "Electric", at: iso(12), tone: "#2F5D45",
      bodyMn: "Хүйтэнд батерейны багтаамж буурдаг тул нэг цэнэгээр явах зай богиносдог. Гэрийн цэнэглэгч, урьдчилан халаах функц, дулаан гараж чухал.",
      bodyEn: "Cold reduces battery capacity so range drops. A home charger, pre heating and a warm garage matter." },
    { id: "n4", mn: "Лизингийн сарын төлбөрийг хэрхэн тооцох вэ", en: "How to estimate a monthly financing payment", tagMn: "Санхүү", tagEn: "Finance", at: iso(15), tone: "#7A5E36",
      bodyMn: "Урьдчилгаа, хүү, хугацаа гурав сарын төлбөрийг тодорхойлно. Манай тооцоолуур зөвхөн урьдчилсан тооцоо гаргадаг бөгөөд банк, лизингийн албан ёсны санал биш.",
      bodyEn: "Down payment, rate and term set the monthly payment. Our calculator gives estimates only, not official bank or leasing offers." },
    { id: "n5", mn: "Говь, хээрийн замд зориулсан шилдэг 4WD машинууд", en: "Best 4WD vehicles for the Gobi and steppe", tagMn: "Жийп", tagEn: "SUV", at: iso(21), tone: "#1B1D21",
      bodyMn: "Land Cruiser, Prado, Pajero болон Hilux нь сэлбэг олдоц, засварын сүлжээгээрээ давуу. Дугуй, түдгэлзүүлэлт, хөргөлтийн системийг шалгаарай.",
      bodyEn: "Land Cruiser, Prado, Pajero and Hilux lead on parts availability and service networks. Check tires, suspension and the cooling system." },
    { id: "n6", mn: "Баруун болон зүүн жолоотой машин: Монголд юу өөр вэ", en: "Right hand and left hand drive in Mongolia", tagMn: "Мэдээлэл", tagEn: "Info", at: iso(30), tone: "#9E2A2B",
      bodyMn: "Монголд баруун болон зүүн жолоотой машин хоёул түгээмэл. Хайлтын шүүлтүүрээр жолооны байрлалыг сонгон харж болно.",
      bodyEn: "Both right and left hand drive cars are common in Mongolia. Use the steering filter in search to pick one." },
  ];

  // ───── favorites, recent ─────
  const favorites: Record<string, string[]> = {};
  const recent: Record<string, string[]> = {};
  customers.forEach((c, i) => {
    favorites[c.id] = Array.from({ length: int(2, 5) }, (_, k) => activeVeh[(i * 3 + k * 11) % activeVeh.length].id);
    recent[c.id] = Array.from({ length: 4 }, (_, k) => activeVeh[(i * 5 + k * 7) % activeVeh.length].id);
  });

  const notices: Notice[] = [];
  return { users, dealers, vehicles, leads, appointments, reports, threads, notices, ads, campaigns, payments, subs, flags, audits, articles, savedSearches: [], brands: BRANDS.map((b) => ({ ...b })), models: MODELS.map((m) => ({ ...m })), categories: CATEGORIES.map((c) => ({ ...c })), favorites, recent };
}

export const PACKAGES = [
  { id: "pk_premium30", kind: "listing", priceMnt: 49000, days: 30, tier: "premium" },
  { id: "pk_featured7", kind: "listing", priceMnt: 29000, days: 7, tier: "featured" },
  { id: "pk_featured14", kind: "listing", priceMnt: 49000, days: 14, tier: "featured" },
  { id: "pk_featured30", kind: "listing", priceMnt: 89000, days: 30, tier: "featured" },
  { id: "pk_home7", kind: "homepage", priceMnt: 150000, days: 7 },
  { id: "pk_seller_std", kind: "seller", priceMnt: 99000, days: 30 },
  { id: "pk_seller_pro", kind: "seller", priceMnt: 249000, days: 30 },
  { id: "pk_dealer_silver", kind: "dealer", priceMnt: 490000, days: 30, plan: "silver" },
  { id: "pk_dealer_gold", kind: "dealer", priceMnt: 990000, days: 30, plan: "gold" },
  { id: "pk_dealer_platinum", kind: "dealer", priceMnt: 1990000, days: 30, plan: "platinum" },
] as const;
export type PackageDef = (typeof PACKAGES)[number];
export const getPackage = (id: string) => PACKAGES.find((p) => p.id === id);
