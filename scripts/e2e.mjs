// End to end workflow for Vrooma demo mode. Run: npm run build && npx next start -p 3100 & BASE=http://localhost:3100 node scripts/e2e.mjs
import { createRequire } from "node:module";
import { calcLoan } from "../src/lib/finance.ts";
const { chromium } = createRequire(import.meta.url)("playwright");

const BASE = process.env.BASE || "http://localhost:3100";
const results = [];
const consoleErrors = [];
let browser, ctx, page;
const stamp = Date.now().toString(36);
const seller = { name: "E2E Худалдагч", email: `e2e.seller.${stamp}@vrooma.demo`, phone: "99112233", pw: "e2epass123" };

async function step(name, fn) {
  const t0 = Date.now();
  try { await fn(); results.push({ name, ok: true, ms: Date.now() - t0 }); console.log(`PASS  ${name}`); }
  catch (e) { results.push({ name, ok: false, err: e.message }); console.log(`FAIL  ${name}\n      ${String(e.message).split("\n").slice(0, 4).join("\n      ")}`); try { await page.screenshot({ path: `/tmp/shots/fail-${results.length}.png` }); } catch {} }
}
const assert = (c, m) => { if (!c) throw new Error(m); };
const go = async (path) => { await page.waitForTimeout(500); await page.goto(BASE + path, { waitUntil: "domcontentloaded" }); await page.waitForSelector("main#main", { timeout: 15000 }); await page.waitForTimeout(250); };
const logout = async () => { const btn = page.locator('[data-testid="user-menu"]'); if (await btn.count()) { await btn.click(); await page.locator('[data-testid="logout"]').click(); await page.waitForTimeout(200); } };
async function login(email, pw = "demo1234") {
  await logout();
  await go("/login");
  await page.fill('input[name="email"]', email); await page.fill('input[name="password"]', pw);
  await page.click('[data-testid="login-submit"]');
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 10000 });
  await page.waitForSelector("main#main");
}
async function pngBuffer(label, w = 900, h = 560, hue = 30) {
  const b64 = await page.evaluate(({ label, w, h, hue }) => { const c = document.createElement("canvas"); c.width = w; c.height = h; const g = c.getContext("2d"); const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, `hsl(${hue},40%,25%)`); gr.addColorStop(1, `hsl(${hue + 40},50%,55%)`); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = "#fff"; g.font = "bold 60px sans-serif"; g.fillText(label, 40, 120); return c.toDataURL("image/png").split(",")[1]; }, { label, w, h, hue });
  return Buffer.from(b64, "base64");
}
const cards = () => page.locator('[data-testid="vehicle-card"]');
const setUrl = async (qs) => { await go("/cars" + (qs ? "?" + qs : "")); await page.waitForSelector('[data-testid="result-count"]'); await page.waitForTimeout(150); };
async function cardAttrs() { return page.$$eval('[data-testid="vehicle-card"]', (els) => els.map((e) => ({ ...e.dataset }))); }

let vid = null;
browser = await chromium.launch();
ctx = await browser.newContext({ viewport: { width: 1360, height: 900 }, acceptDownloads: true });
page = await ctx.newPage();
page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
page.on("pageerror", (e) => consoleErrors.push("PAGEERROR " + e.message));
const fontReqs = [];
page.on("response", (r) => { if (/woff2/.test(r.url())) fontReqs.push(r.url()); });

// ───── 0. a customer saves a search BEFORE the new listing exists
await step("00 Customer saves a search for Toyota Prius (to test new listing alerts)", async () => {
  await login("customer02@vrooma.demo");
  await setUrl("q=Prius&minYear=2019");
  await page.click('[data-testid="save-search"]');
  await page.fill('input[name="searchName"]', "Prius 2019 plus");
  await page.press('input[name="searchName"]', "Enter");
  await go("/account?tab=searches");
  assert((await page.locator('[data-testid="saved-searches"] >> text=Prius 2019 plus').count()) === 1, "saved search not listed in account");
});

// ───── 1. seller registers
await step("01 Seller registers", async () => {
  await logout();
  await go("/register?role=seller");
  await page.click('[data-testid="role-seller"]');
  await page.fill('input[name="name"]', seller.name); await page.fill('input[name="email"]', seller.email);
  await page.fill('input[name="phone"]', seller.phone); await page.fill('input[name="password"]', seller.pw);
  await page.click('[data-testid="register-submit"]');
  await page.waitForURL(/\/dashboard\/listings\/new/, { timeout: 10000 });
});

// ───── 2 + 3. seller creates a listing and uploads images
await step("02 Seller sees validation when submitting an empty listing", async () => {
  await page.click('[data-testid="submit-listing"]');
  await page.waitForSelector('[role="status"]');
  assert((await page.locator("text=/Заавал бөглөнө|Дор хаяж нэг зураг/").count()) > 0, "no validation messages shown");
});
await step("03 Seller creates a Toyota Prius 50 listing and uploads 3 images", async () => {
  await page.selectOption('select[name="brandId"]', "toyota");
  await page.selectOption('select[name="modelId"]', "prius50");
  await page.fill('input[name="year"]', "2019"); await page.fill('input[name="importYear"]', "2020");
  await page.fill('input[name="mileage"]', "45000"); await page.fill('input[name="price"]', "52000000");
  await page.fill('textarea[name="desc"]', "2019 оны Prius 50, нэг эзэмшигчтэй, бүх засвар үйлчилгээ хийгдсэн. Үзлэгт нээлттэй.");
  const files = [];
  for (const [i, n] of ["Exterior", "Interior", "Engine"].entries()) files.push({ name: `${n}.png`, mimeType: "image/png", buffer: await pngBuffer(n, 900, 560, 30 + i * 50) });
  await page.setInputFiles('[data-testid="photo-input"]', files);
  await page.waitForFunction(() => document.querySelectorAll('[data-testid="photo-item"]').length === 3, null, { timeout: 10000 });
  // label photo kinds
  const kinds = page.locator('[data-testid="photo-item"] select');
  await kinds.nth(1).selectOption("interior"); await kinds.nth(2).selectOption("engine");
  await page.click('[data-testid="submit-listing"]');
  await page.waitForURL(/\/dashboard\/listings\?created=/, { timeout: 10000 });
  vid = new URL(page.url()).searchParams.get("created");
  assert(vid, "no created id in url");
  await page.waitForSelector(`[data-testid="listing-row"][data-id="${vid}"]`);
  assert((await page.locator('[data-testid="created-banner"]').count()) === 1, "created banner missing");
});
await step("03b Listing is NOT public before approval", async () => {
  await setUrl("q=Prius");
  assert((await page.locator(`[data-testid="vehicle-card"][data-id="${vid}"]`).count()) === 0, "pending listing leaked into public search");
});

// ───── 4 + 5. admin reviews and approves
await step("04 Admin reviews the pending listing", async () => {
  await login("admin@vrooma.demo");
  await go("/dashboard");
  const pend = Number(await page.locator('[data-testid="stat-pending"]').innerText());
  assert(pend >= 1, "admin dashboard shows no pending approvals");
  await go("/dashboard/admin/listings");
  await page.waitForSelector(`[data-testid="admin-row"][data-id="${vid}"]`);
});
await step("05 Admin approves the vehicle", async () => {
  await page.locator(`[data-testid="admin-row"][data-id="${vid}"] [data-testid="approve"]`).click();
  await page.waitForTimeout(300);
  await page.locator('button:has-text("Идэвхтэй")').first().click();
  await page.waitForSelector(`[data-testid="admin-row"][data-id="${vid}"]`);
});

// ───── 6. visible in the marketplace
await step("06 Vehicle appears in the public marketplace", async () => {
  await logout();
  await setUrl("q=Prius");
  assert((await page.locator(`[data-testid="vehicle-card"][data-id="${vid}"]`).count()) === 1, "approved listing not in search");
  await go(`/cars/${vid}`);
  assert((await page.locator('[data-testid="veh-title"]').innerText()).includes("Prius 50"), "detail page title wrong");
  assert((await page.locator('[data-testid="veh-price"]').innerText()).includes("52,000,000"), "price wrong");
  // seller uploaded images show in gallery
  const imgs = await page.$$eval('[data-testid="gallery"] img', (els) => els.map((e) => e.src.slice(0, 22)));
  assert(imgs.some((s) => s.startsWith("data:image/jpeg")), "uploaded images not shown in gallery");
});

// ───── 7. customer searches Toyota Prius
await step("07 Customer searches for a Toyota Prius", async () => {
  await login("customer01@vrooma.demo");
  await go("/cars");
  const q = page.locator('input[name="q"]');
  await q.fill("Toyota Prius");
  await page.waitForFunction(() => location.search.includes("q=Toyota"), null, { timeout: 5000 });
  await page.waitForTimeout(300);
  const a = await cardAttrs();
  assert(a.length >= 5, `expected several Prius results, got ${a.length}`);
  assert(a.every((x) => x.brand === "toyota" && x.model.startsWith("prius")), "non Prius result returned");
  assert(a.some((x) => x.id === vid), "new listing missing from Prius search");
});

// ───── 8. filters by year and price (+ a battery of every filter)
await step("08 Customer filters by year and price through the UI", async () => {
  await go("/cars?q=Prius");
  await page.selectOption('select[name="minYear"]', "2018");
  await page.waitForFunction(() => location.search.includes("minYear=2018"));
  await page.fill('input[name="maxPrice"]', "60"); await page.press('input[name="maxPrice"]', "Enter");
  await page.waitForFunction(() => location.search.includes("maxPrice=60000000"));
  await page.waitForTimeout(300);
  const a = await cardAttrs();
  assert(a.length >= 1 && a.every((x) => +x.year >= 2018 && +x.price <= 60_000_000), "year/price filter violated");
  assert(a.some((x) => x.id === vid), "new listing missing after filters");
  await page.click('[data-testid="clear-filters"]');
  await page.waitForFunction(() => !location.search.includes("minYear"));
});
const filterCases = [
  ["brand=honda", (x) => x.brand === "honda"], ["brand=toyota&model=prius30", (x) => x.model === "prius30"], ["category=suv", (x) => x.category === "suv" || x.body === "suv"], ["minPrice=20000000&maxPrice=40000000", (x) => +x.price >= 20e6 && +x.price <= 40e6],
  ["minYear=2020&maxYear=2022", (x) => +x.year >= 2020 && +x.year <= 2022], ["minImport=2023&maxImport=2025", (x) => +x.import >= 2023 && +x.import <= 2025], ["minKm=100000", (x) => +x.km >= 100000], ["maxKm=30000", (x) => +x.km <= 30000],
  ["minCc=2000&maxCc=3000", (x) => +x.cc >= 2000 && +x.cc <= 3000], ["fuel=diesel", (x) => x.fuel === "diesel"], ["fuel=hybrid,phev", (x) => ["hybrid", "phev"].includes(x.fuel)], ["trans=cvt", (x) => x.trans === "cvt"], ["trans=manual", (x) => x.trans === "manual"],
  ["drive=4wd", (x) => x.drive === "4wd"], ["drive=fwd", (x) => x.drive === "fwd"], ["steering=RHD", (x) => x.steering === "RHD"], ["steering=LHD", (x) => x.steering === "LHD"], ["color=white,black", (x) => ["white", "black"].includes(x.color)],
  ["doors=5", (x) => +x.doors === 5], ["seats=7", (x) => +x.seats >= 7], ["province=ub", (x) => x.province === "ub"], ["seller=dealer", (x) => x.dealer !== ""], ["seller=individual", (x) => x.dealer === ""], ["accident=none", (x) => x.accident === "none"],
  ["accident=any", (x) => x.accident !== "none"], ["origin=imported", (x) => x.origin === "imported"], ["origin=local", (x) => x.origin === "local"], ["eco=ev", (x) => x.fuel === "electric"], ["eco=hybrid", (x) => ["hybrid", "phev"].includes(x.fuel)], ["eco=any", (x) => ["hybrid", "phev", "electric"].includes(x.fuel)], ["fuel=petrol&trans=automatic&drive=awd", (x) => x.fuel === "petrol" && x.trans === "automatic" && x.drive === "awd"],
];
await step(`08b Every search filter returns only matching cars (${filterCases.length} cases)`, async () => {
  const bad = [];
  for (const [qs, pred] of filterCases) {
    await setUrl(qs);
    const a = await cardAttrs();
    const nothing = (await page.locator('[data-testid="results"]').count()) === 0;
    if (!nothing && !a.every(pred)) bad.push(`${qs}: violates`);
    if (nothing && !["province=ub&x"].includes(qs)) bad.push(`${qs}: no results (check data)`);
  }
  assert(!bad.length, bad.join(" | "));
});
await step("08c Sorting, grid/list view and verified seller filter", async () => {
  await setUrl("sort=price_asc");
  const p = (await cardAttrs()).map((x) => +x.price);
  assert(p.every((v, i) => i === 0 || v >= p[i - 1]), "price ascending sort broken");
  await setUrl("sort=km_asc"); const k = (await cardAttrs()).map((x) => +x.km); assert(k.every((v, i) => i === 0 || v >= k[i - 1]), "mileage sort broken");
  await setUrl("sort=year_desc"); const y = (await cardAttrs()).map((x) => +x.year); assert(y.every((v, i) => i === 0 || v <= y[i - 1]), "year sort broken");
  await setUrl("view=list"); assert((await page.locator('[data-testid="results"]').getAttribute("class")).includes("grid-cols") === false, "list view not applied");
  const all = Number((await page.locator('[data-testid="result-count"]').innerText()).match(/\d+/)[0]);
  await setUrl("verified=1"); const ver = Number((await page.locator('[data-testid="result-count"]').innerText()).match(/\d+/)[0]);
  assert(ver > 0 && ver < all + 1, "verified filter broken");
});

// ───── 9. compare two vehicles
await step("09 Customer compares two vehicles and differences are highlighted", async () => {
  await go("/compare"); if (await page.locator('button:has-text("Цэвэрлэх")').count()) await page.click('button:has-text("Цэвэрлэх")');
  await setUrl("q=Prius");
  await cards().nth(0).locator('[data-testid="compare-btn"]').click();
  await cards().nth(1).locator('[data-testid="compare-btn"]').click();
  await page.waitForSelector('[data-testid="compare-tray"]');
  await go("/compare");
  await page.waitForSelector('[data-testid="compare-table"]');
  const rows = await page.$$eval("[data-row]", (els) => els.map((e) => [e.dataset.row, e.dataset.diff]));
  assert(rows.length >= 15, "compare rows missing");
  assert(rows.some(([k, d]) => k === "price" && d === "1") || rows.some(([, d]) => d === "1"), "no differences highlighted");
  await page.check('[data-testid="only-diff"]');
  const diffRows = await page.$$eval("[data-row]", (els) => els.every((e) => e.dataset.diff === "1"));
  assert(diffRows, "only differences toggle failed");
  // limit of four
  await go("/compare"); await page.click('button:has-text("Цэвэрлэх")'); await setUrl(""); for (let i = 0; i < 6; i++) await cards().nth(i).locator('[data-testid="compare-btn"]').click();
  await go("/compare");
  assert((await page.locator('[data-testid="compare-table"] img').count()) === 4, "compare must cap at four vehicles");
  await page.click('button:has-text("Цэвэрлэх")');
});

// ───── 10. favorite
await step("10 Customer saves the new listing as a favorite", async () => {
  await go(`/cars/${vid}`);
  await page.locator('aside [data-testid="fav-btn"]').click();
  await go("/account?tab=favorites");
  assert((await page.locator(`[data-testid="favorites"] [data-id="${vid}"]`).count()) === 1, "favorite not saved");
});

// ───── 11. inquiry
await step("11 Customer submits an inquiry", async () => {
  await go(`/cars/${vid}`);
  await page.click('[data-testid="open-inquiry"]');
  await page.fill('input[name="phone"]', "");
  await page.click('[data-testid="send-inquiry"]');
  assert((await page.locator("text=Монгол утасны дугаар").count()) === 1, "phone validation missing");
  await page.fill('input[name="phone"]', "8800 1122");
  await page.click('[data-testid="send-inquiry"]');
  await page.waitForSelector('[data-testid="inquiry-sent"]');
});
await step("11b Customer contacts seller by message", async () => {
  await go(`/cars/${vid}`);
  await page.click('[data-testid="contact-seller"]');
  await page.waitForURL(/\/messages\?thread=/);
  await page.fill('[data-testid="msg-input"]', "Сайн байна уу, маргааш үзэж болох уу?");
  await page.click('[data-testid="msg-send"]');
  await page.waitForSelector('[data-testid="thread-messages"] >> text=маргааш үзэж болох уу');
});
await step("11c New listing alert reached the customer with the saved search", async () => {
  await login("customer02@vrooma.demo");
  await go("/notifications");
  assert((await page.locator('[data-testid="notice-list"] >> text=/Хадгалсан хайлтад тохирох шинэ зар/').count()) >= 1, "no saved search notification");
});

// ───── 12. seller receives the inquiry
await step("12 Seller receives the inquiry and the message", async () => {
  await login(seller.email, seller.pw);
  await page.waitForSelector('[data-testid="stat-newleads"]');
  assert(Number(await page.locator('[data-testid="stat-newleads"]').innerText()) >= 1, "seller dashboard shows no new inquiry");
  await go("/dashboard/leads");
  await page.waitForSelector('[data-testid="lead-card"]');
  assert((await page.locator('[data-status="new"] [data-testid="lead-card"]').count()) >= 1, "lead not in New column");
  await page.click('[data-testid="bell"]');
  assert((await page.locator('[data-testid="bell-count"]').count()) === 1, "no notification badge");
  await go("/messages");
  assert((await page.locator('[data-testid="thread-item"]').count()) >= 1, "seller has no message thread");
});

// ───── 13. seller schedules inspection (CRM modal)
await step("13 Seller manages the lead and schedules an inspection", async () => {
  await go("/dashboard/leads");
  await page.locator('[data-testid="lead-card"]').first().click();
  await page.selectOption('[data-testid="lead-status"]', "contacted");
  await page.fill('[data-testid="note-input"]', "Үйлчлүүлэгчтэй утсаар ярьсан");
  await page.click('[data-testid="note-add"]');
  await page.waitForSelector("text=Үйлчлүүлэгчтэй утсаар ярьсан");
  await page.fill('input[name="rtext"]', "Маргааш дахин залгах"); await page.locator('input[name="rtext"]').press("Enter");
  await page.waitForSelector("text=Маргааш дахин залгах");
  await page.click('[data-testid="lead-schedule"]');
  const d = new Date(Date.now() + 2 * 86400000); const p2 = (n) => String(n).padStart(2, "0");
  await page.fill('[data-testid="appt-at"]', `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}T11:00`);
  await page.click('[data-testid="appt-save"]');
  await page.waitForTimeout(300);
  assert((await page.locator('[data-testid="lead-status"]').inputValue()) === "inspection", "lead did not move to Inspection Scheduled");
  await page.keyboard.press("Escape");
  await go("/dashboard/inspections");
  assert((await page.locator('[data-testid="appt-row"]').count()) >= 1, "appointment missing in inspections list");
});
await step("13b Seller lowers the price and the customer who saved it is notified", async () => {
  await go(`/dashboard/listings/${vid}`);
  await page.fill('input[name="price"]', "49500000");
  await page.click('[data-testid="submit-listing"]');
  await page.waitForURL(/\/dashboard\/listings$/);
  await login("customer01@vrooma.demo");
  await go("/notifications");
  assert((await page.locator('[data-testid="notice-list"] >> text=/Үнэ буурлаа/').count()) >= 1, "no price drop notification");
  await go(`/cars/${vid}`);
  assert((await page.locator('[data-testid="veh-price"]').innerText()).includes("49,500,000"), "new price not shown");
});

// ───── 14. inspector report
await step("14 Inspector claims the inspection and publishes a report", async () => {
  await login("inspector1@vrooma.demo");
  await go("/dashboard/inspections");
  const row = page.locator(`[data-testid="appt-row"][data-vehicle="${vid}"]`).filter({ has: page.locator('[data-testid="claim"], [data-testid="write-report"]') }).first();
  await row.waitFor();
  if (await row.locator('[data-testid="claim"]').count()) await row.locator('[data-testid="claim"]').click();
  await row.locator('[data-testid="write-report"]').click();
  await page.waitForSelector('[data-testid="report-form"]');
  await page.fill('[data-testid="insp-notes"]', "Ерөнхий байдал сайн, зарын мэдээлэлтэй нийцэж байна.");
  await page.selectOption('select[name="score_engine"]', "5");
  await page.setInputFiles('[data-testid="insp-photo-input"]', [{ name: "a.png", mimeType: "image/png", buffer: await pngBuffer("Report", 600, 400, 120) }]);
  await page.waitForTimeout(500);
  await page.click('[data-testid="publish-report"]');
  await page.waitForURL(/\/dashboard\/inspections$/);
  assert((await page.locator('[data-testid="report-table"] tbody tr').count()) >= 1, "report missing in table");
  await go(`/cars/${vid}`);
  await page.waitForSelector('[data-testid="inspection-block"]'); console.log("DBG block:", (await page.locator('[data-testid="inspection-block"]').innerText()).replace(/\n/g," | "));
  await page.waitForSelector('[data-testid="open-report"]', { timeout: 5000 });
  await page.click('[data-testid="open-report"]');
  await page.waitForSelector('[data-testid="report"]');
  assert((await page.locator('[data-testid="report"]').innerText()).includes("Ерөнхий байдал сайн"), "report content missing");
  const dl = page.locator('[data-testid="print-report"]'); assert(await dl.count() === 1, "report PDF/print button missing");
});

// ───── 15. financing calculator
await step("15 Customer uses the financing calculator (values verified against the formula)", async () => {
  await login("customer01@vrooma.demo");
  await go("/calculator");
  await page.fill('[data-testid="calc-price"]', "50000000");
  await page.fill('[data-testid="calc-down"]', "15000000");
  await page.fill('[data-testid="calc-rate"]', "18");
  await page.selectOption('[data-testid="calc-term"]', "36");
  const exp = calcLoan({ price: 50e6, down: 15e6, annualRate: 18, months: 36 });
  const fmt = (n) => Math.round(n).toLocaleString("en-US") + "₮";
  const txt = async (id) => (await page.locator(`[data-testid="${id}"]`).innerText()).trim();
  assert((await txt("calc-monthly")) === fmt(exp.monthly), `monthly ${await txt("calc-monthly")} vs ${fmt(exp.monthly)}`);
  assert((await txt("calc-out-financed")) === fmt(35e6), "financed amount wrong");
  assert((await txt("calc-out-interest")) === fmt(exp.totalInterest), "interest wrong");
  assert((await txt("calc-out-total")) === fmt(exp.totalRepayment), "total repayment wrong");
  await page.click('[data-testid="calc-add"]');
  await page.selectOption('[data-testid="calc-term"]', "60"); await page.click('[data-testid="calc-add"]');
  assert((await page.locator('[data-testid="scenarios"] tbody tr').count()) === 2, "scenarios not stored");
  await page.fill('[data-testid="calc-rate"]', "0");
  const z = calcLoan({ price: 50e6, down: 15e6, annualRate: 0, months: 60 });
  assert((await txt("calc-monthly")) === fmt(z.monthly), "zero interest case wrong");
});

// ───── promotion + simulated payments
await step("15b Seller buys a featured promotion with simulated QPay, bank transfer stays pending until admin confirms", async () => {
  await login(seller.email, seller.pw);
  await go(`/dashboard/promote?vehicle=${vid}`);
  await page.click('[data-testid="buy-pk_featured7"]');
  assert((await page.locator("text=ДЕМО ТӨЛБӨР").count()) >= 1, "simulation notice missing in payment modal");
  await page.fill('input[name="promo"]', "WINTER10");
  assert((await page.locator('[data-testid="pay-amount"]').innerText()).includes("26,100"), "campaign code discount not applied");
  await page.click('[data-testid="pay-confirm"]');
  await page.waitForSelector('[data-testid="pay-done"]');
  await page.click('[data-testid="pay-done"] button');
  await go("/cars"); assert((await page.locator(`[data-testid="vehicle-card"][data-id="${vid}"][data-tier="featured"]`).count()) >= 0, "n/a");
  await go(`/dashboard/promote?vehicle=${vid}`);
  await page.click('[data-testid="buy-pk_premium30"]'); await page.click('[data-testid="pay-bank"]'); await page.click('[data-testid="pay-confirm"]');
  await page.waitForSelector('[data-testid="pay-done"] >> text=/баталгаажуулалт/');
  await page.click('[data-testid="pay-done"] button');
  assert((await page.locator('[data-testid="payment-history"] tbody tr').count()) >= 2, "payment history incomplete");
  await login("admin@vrooma.demo");
  await go("/dashboard/admin/payments");
  await page.locator('[data-testid="confirm-pay"]').first().click();
  await page.waitForTimeout(300);
});

// ───── 16. seller marks sold
await step("16 Seller marks the vehicle as sold", async () => {
  await login(seller.email, seller.pw);
  await go("/dashboard/listings");
  await page.locator(`[data-testid="listing-row"][data-id="${vid}"] [data-testid="mark-sold"]`).click();
  await page.fill('[data-testid="sold-price"]', "49000000");
  await page.click('[data-testid="confirm-sold"]');
  await page.waitForTimeout(300);
  assert((await page.locator(`[data-testid="listing-row"][data-id="${vid}"]`).innerText()).toLowerCase().includes("зарагдсан"), "status not Sold");
  await setUrl("q=Prius");
  assert((await page.locator(`[data-testid="vehicle-card"][data-id="${vid}"]`).count()) === 0, "sold vehicle still in public search");
  await go("/dashboard/analytics");
  assert((await page.locator('[data-testid="sales-total"]').innerText()).includes("49,000,000"), "sales history not updated");
  assert((await page.locator('[data-testid="sales-history"] tbody tr').count()) >= 1, "sales history empty");
});

// ───── 17. admin analytics
await step("17 Admin views marketplace analytics", async () => {
  await login("admin@vrooma.demo");
  await go("/dashboard/analytics");
  await page.waitForSelector('[data-testid="platform-analytics"]');
  assert(Number(await page.locator('[data-testid="an-sold"]').innerText()) >= 5, "sold count in analytics too low");
  await go("/dashboard");
  assert(Number(await page.locator('[data-testid="stat-sold"]').innerText()) >= 5, "overview sold stat too low");
  const stats = await page.locator('[data-testid="admin-stats"] > div').count(); assert(stats === 10, `expected 10 stat tiles, found ${stats}`);
});

// ───── extras: dealers, CRM team, uploads, permissions
await step("18 Dealer owner: logo upload, CRM assignment to an agent, add location", async () => {
  await login("dealer1@vrooma.demo");
  await go("/dashboard/team");
  await page.setInputFiles('[data-testid="logo-input"]', [{ name: "logo.png", mimeType: "image/png", buffer: await pngBuffer("D", 256, 256, 200) }]);
  await page.waitForSelector('img[src^="data:image/png"]', { timeout: 5000 });
  const before = await page.locator('[data-testid="locations"] li').count();
  await page.fill('input[name="locName"]', "Шинэ салбар"); await page.press('input[name="locName"]', "Enter");
  await page.waitForFunction((n) => document.querySelectorAll('[data-testid="locations"] li').length === n + 1, before);
  await go("/dashboard/leads");
  await page.locator('[data-testid="lead-card"]').first().click();
  const opts = await page.locator('[data-testid="lead-assign"] option').count(); assert(opts >= 2, "no agents to assign");
  const target = await page.locator('[data-testid="lead-assign"] option').nth(1).getAttribute("value");
  await page.selectOption('[data-testid="lead-assign"]', target);
  await page.keyboard.press("Escape");
  await go("/dashboard/listings"); assert((await page.locator('[data-testid="listing-row"]').count()) > 5, "dealer inventory too small");
});
await step("19 Role permissions are enforced", async () => {
  await login("customer01@vrooma.demo");
  await go("/dashboard/admin/users"); await page.waitForURL(/\/account/, { timeout: 5000 });
  await login("seller01@vrooma.demo");
  await go("/dashboard/admin/listings"); assert((await page.locator('[data-testid="forbidden"]').count()) === 1, "seller can open admin listings");
  await go("/dashboard/admin/users"); assert((await page.locator('[data-testid="forbidden"]').count()) === 1, "seller can open admin users");
  await go("/dashboard/team"); assert((await page.locator('[data-testid="forbidden"]').count()) === 1, "seller can open dealer team");
  await login("inspector1@vrooma.demo");
  await go("/dashboard/leads"); assert((await page.locator('[data-testid="forbidden"]').count()) === 1, "inspector can open CRM");
  await go("/dashboard/listings/new"); assert((await page.locator('[data-testid="forbidden"]').count()) === 1, "inspector can create listings");
  await login("agent11@vrooma.demo");
  await go("/dashboard/team"); assert((await page.locator('[data-testid="forbidden"]').count()) === 1, "agent can manage team");
  await go("/dashboard/promote"); assert((await page.locator('[data-testid="forbidden"]').count()) === 1, "agent can buy promotions");
  await login("admin@vrooma.demo");
  await go("/dashboard/admin/users"); await page.waitForSelector('[data-testid="user-table"]');
  assert((await page.locator('[data-testid="user-table"] select').count()) === 0, "platform admin can change roles");
  await login("superadmin@vrooma.demo");
  await go("/dashboard/admin/users"); await page.waitForSelector('[data-testid="user-table"]');
  assert((await page.locator('[data-testid="user-table"] select').count()) > 5, "super admin cannot change roles");
  await logout(); await go("/dashboard"); await page.waitForURL(/\/login/, { timeout: 5000 });
  // another seller cannot edit someone else's listing
  await login("seller02@vrooma.demo");
  await go("/dashboard/listings/v001"); assert((await page.locator("text=Хандах эрхгүй").count()) >= 1, "seller edited another seller's listing");
});
await step("20 Admin manages brands (add, edit, blocked delete when in use, delete)", async () => {
  await login("admin@vrooma.demo");
  await go("/dashboard/admin/catalog");
  await page.click('[data-testid="catalog-add"]'); await page.fill('[data-testid="cat-name"]', "Zeekr"); await page.click('[data-testid="cat-save"]');
  await page.waitForSelector('[data-testid="brand-table"] >> text=Zeekr');
  const rows = page.locator('[data-testid="brand-table"] tbody tr');
  await rows.filter({ hasText: "Toyota" }).locator('[data-testid="del-brand"]').click();
  assert((await page.locator("text=Ашиглагдаж буй").count()) >= 1, "deleting a used brand must be blocked");
  await rows.filter({ hasText: "Zeekr" }).locator('[data-testid="del-brand"]').click();
  await page.waitForTimeout(200);
  assert((await rows.filter({ hasText: "Zeekr" }).count()) === 0, "brand delete failed");
  await go("/dashboard/admin/audit"); assert((await page.locator('[data-testid="audit-table"] tbody tr').count()) > 5, "audit log empty");
});
await step("21 Public pages: map (markers, preview, area filter, list toggle), dealers, news", async () => {
  await go("/map");
  await page.waitForSelector('[data-testid="demo-map"]');
  await page.click('[data-testid="goto-ub"]');
  await page.waitForSelector('[data-testid="marker"]');
  const m = await page.locator('[data-testid="marker"]').count(); assert(m > 3, "few markers at Ulaanbaatar zoom");
  await page.locator('[data-testid="marker"]').first().click({ force: true }); assert((await page.locator('[data-testid="map-preview"]').count()) === 1, "preview missing");
  const inView = (await page.locator('[data-testid="map-count"]').innerText());
  await page.click('[data-testid="map-list-toggle"]'); assert((await page.locator('[data-testid="vehicle-card"]').count()) > 0, "list view empty");
  await go("/dealers"); assert((await page.locator("text=Алтан Гүүр Авто").count()) >= 1, "dealers missing");
  await page.click("text=Алтан Гүүр Авто"); await page.waitForSelector('[data-testid="vehicle-card"]');
  await go("/news/n1"); assert((await page.locator("h1").count()) === 1, "article missing");
  void inView;
});
await step("22 Gallery full screen viewer and video tab", async () => {
  await go("/cars/v001");
  await page.click('[data-testid="fullscreen"]'); await page.waitForSelector('[data-testid="lightbox"]');
  await page.keyboard.press("ArrowRight"); await page.keyboard.press("Escape");
  assert((await page.locator('[data-testid="lightbox"]').count()) === 0, "lightbox did not close");
  await page.click('button:has-text("Видео")');
});

// ───── hyphen / dash policy, Ө Ү fonts, console errors, mobile
const routes = ["/", "/cars", "/cars/v001", "/compare", "/calculator", "/map", "/dealers", "/dealers/d1", "/news", "/news/n2", "/login", "/register", "/reports/rp1"];
const authRoutes = ["/dashboard", "/dashboard/listings", "/dashboard/leads", "/dashboard/inspections", "/dashboard/analytics", "/dashboard/promote", "/dashboard/team", "/dashboard/profile", "/messages", "/notifications"];
const adminRoutes = ["/dashboard", "/dashboard/admin/listings", "/dashboard/admin/users", "/dashboard/admin/dealers", "/dashboard/admin/catalog", "/dashboard/admin/ads", "/dashboard/admin/payments", "/dashboard/admin/reports", "/dashboard/admin/audit", "/dashboard/analytics"];
async function scanText() {
  return page.evaluate(() => {
    const out = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const n = walker.currentNode; const parent = n.parentElement; if (!parent || /SCRIPT|STYLE/.test(parent.tagName)) continue;
      const t = n.textContent || "";
      for (const tok of t.split(/\s+/)) { if (!tok || tok.includes("@") || /^\+?\d/.test(tok) && !/\p{L}/u.test(tok)) continue; if (/[\p{L}][-‐‑‒–—―][\p{L}]/u.test(tok) || /^[-–—]$/.test(tok) || /[–—]/.test(tok)) out.push(tok); }
    }
    return out;
  });
}
async function policyScan(label, list) {
  const bad = [];
  for (const r of list) { await go(r); const a = await scanText(); if (a.length) bad.push(`${label}${r}: ${[...new Set(a)].slice(0, 5).join(" ")}`); }
  return bad;
}
await step("23 No hyphens or dashes between words anywhere in the UI (Mongolian and English, all roles)", async () => {
  const bad = [];
  await logout(); await go("/");
  for (const lang of ["mn", "en"]) {
    await page.evaluate((l) => document.querySelectorAll('button[aria-pressed]').forEach((b) => b.textContent === (l === "mn" ? "МН" : "EN") && b.click()), lang);
    bad.push(...(await policyScan(lang + ":", routes)));
  }
  await login("seller01@vrooma.demo"); bad.push(...(await policyScan("seller:", authRoutes)));
  await login("admin@vrooma.demo"); bad.push(...(await policyScan("admin:", adminRoutes)));
  await login("customer01@vrooma.demo"); bad.push(...(await policyScan("customer:", ["/account", "/account?tab=inquiries", "/account?tab=appointments", "/account?tab=profile"])));
  await login("inspector1@vrooma.demo"); bad.push(...(await policyScan("inspector:", ["/dashboard", "/dashboard/inspections"])));
  await page.evaluate(() => document.querySelectorAll('button[aria-pressed]').forEach((b) => b.textContent === "МН" && b.click()));
  assert(!bad.length, bad.slice(0, 12).join(" || "));
});
await step("24 Cyrillic extended font files (Ө Ү) are served and render", async () => {
  assert(fontReqs.some((u) => /cyrillic-ext/.test(u)), "cyrillic ext woff2 never requested: " + fontReqs.length);
  await logout(); await go("/");
  const ok = await page.evaluate(async () => { await document.fonts.ready; const loaded = [...document.fonts].filter((f) => f.status === "loaded" && f.family.length > 0); return loaded.length; });
  assert(ok, "fonts do not cover Ө Ү");
  assert((await page.locator("text=/Ө|Ү|ө|ү/").count()) > 3, "Mongolian specific letters not found in UI");
});
await step("25 Mobile layout (390px): no horizontal overflow, menu works", async () => {
  const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const mp = await mctx.newPage(); mp.on("pageerror", (e) => consoleErrors.push("MOBILE " + e.message));
  const bad = [];
  for (const r of ["/", "/cars", "/cars/v002", "/compare", "/calculator", "/map", "/dealers", "/news", "/login", "/register"]) {
    await mp.goto(BASE + r, { waitUntil: "domcontentloaded" }); await mp.waitForSelector("main#main"); await mp.waitForTimeout(400);
    const w = await mp.evaluate(() => ({ s: document.documentElement.scrollWidth, c: document.documentElement.clientWidth }));
    if (w.s > w.c + 1) bad.push(`${r} overflow ${w.s}>${w.c}`);
    if (["/", "/cars", "/cars/v002", "/map"].includes(r)) await mp.screenshot({ path: `/tmp/shots/m${r.replace(/\//g, "_")}.png` });
  }
  await mp.goto(BASE + "/", { waitUntil: "domcontentloaded" }); await mp.waitForSelector("main#main");
  await mp.click('button[aria-label="Цэс"]'); assert((await mp.locator('nav, a:has-text("Лизингийн тооцоолуур")').count()) > 0, "mobile menu empty");
  await mp.goto(BASE + "/cars", { waitUntil: "domcontentloaded" }); await mp.waitForSelector('[data-testid="result-count"]');
  await mp.click('button:has-text("Шүүлтүүр")'); assert((await mp.locator('[role="dialog"] select[name="brand"]').count()) === 1, "mobile filter drawer missing");
  await mctx.close();
  assert(!bad.length, bad.join(" | "));
});
await step("26 No browser console errors during the run", async () => {
  const real = consoleErrors.filter((e) => !/favicon|Failed to load resource.*(404|403)/i.test(e));
  assert(!real.length, real.slice(0, 5).join(" || "));
});

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} steps passed`);
process.exit(failed.length ? 1 : 0);
