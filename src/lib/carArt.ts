import { COLOR_HEX } from "./catalog";
import type { Body, PhotoKind } from "./types";

// Generated vehicle illustrations (original vector art). Used for demo listings so no third party photography is required.
type Shape = { deck: number; cBase: number; roofRear: number; roofFront: number; aBase: number; hood: number; roof: number };
const SHAPES: Record<string, Shape> = {
  sedan: { deck: 290, cBase: 235, roofRear: 318, roofFront: 438, aBase: 520, hood: 292, roof: 196 },
  suv: { deck: 252, cBase: 118, roofRear: 135, roofFront: 480, aBase: 556, hood: 288, roof: 158 },
  hatch: { deck: 262, cBase: 140, roofRear: 205, roofFront: 440, aBase: 528, hood: 292, roof: 186 },
  pickup: { deck: 282, cBase: 352, roofRear: 392, roofFront: 506, aBase: 582, hood: 284, roof: 176 },
  van: { deck: 238, cBase: 100, roofRear: 118, roofFront: 530, aBase: 612, hood: 302, roof: 150 },
  coupe: { deck: 294, cBase: 205, roofRear: 305, roofFront: 400, aBase: 512, hood: 298, roof: 214 },
};
const shapeFor = (b: Body): Shape => SHAPES[{ sedan: "sedan", suv: "suv", crossover: "suv", hatchback: "hatch", coupe: "coupe", convertible: "coupe", pickup: "pickup", van: "van", minivan: "van", truck: "van" }[b]];

function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(c + amt)));
  return "#" + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => f(c).toString(16).padStart(2, "0")).join("");
}
function hash(s: string) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return Math.abs(h); }

function exterior(body: Body, color: string, variant: number, uid: string): string {
  const s = shapeFor(body);
  const hex = COLOR_HEX[color] ?? "#888";
  const dark = shade(hex, -55), light = shade(hex, 40);
  const nose = 736, tail = 78, floor = 352, beltY = s.hood - 10;
  const bodyPath = `M ${tail} ${floor} L ${tail} ${s.deck + 6} Q ${tail} ${s.deck} ${tail + 24} ${s.deck} L ${s.cBase} ${s.deck} C ${s.cBase + 40} ${s.deck - 4} ${s.roofRear - 40} ${s.roof + 4} ${s.roofRear} ${s.roof} L ${s.roofFront} ${s.roof} C ${s.roofFront + 50} ${s.roof + 2} ${s.aBase - 50} ${s.hood - 16} ${s.aBase} ${s.hood} L ${nose - 70} ${s.hood + 6} Q ${nose - 6} ${s.hood + 14} ${nose} ${s.hood + 44} L ${nose} ${floor} Z`;
  const glass = `M ${s.cBase + 22} ${beltY} L ${s.roofRear - 6} ${s.roof + 14} L ${s.roofFront + 12} ${s.roof + 14} L ${s.aBase - 12} ${beltY} Z`;
  const pillar = (s.roofRear + s.roofFront) / 2;
  const wheel = (cx: number) => `<circle cx="${cx}" cy="${floor}" r="${body === "suv" || body === "pickup" || body === "crossover" ? 60 : 54}" fill="#08090b"/><circle cx="${cx}" cy="${floor}" r="${body === "suv" || body === "pickup" || body === "crossover" ? 47 : 42}" fill="#15161a"/><circle cx="${cx}" cy="${floor}" r="30" fill="url(#rim${uid})"/><circle cx="${cx}" cy="${floor}" r="7" fill="#2a2c31"/>${[0, 72, 144, 216, 288].map((a) => `<line x1="${cx}" y1="${floor}" x2="${cx + 28 * Math.cos((a * Math.PI) / 180)}" y2="${floor + 28 * Math.sin((a * Math.PI) / 180)}" stroke="#7b8088" stroke-width="3"/>`).join("")}`;
  const zoom = variant === 1 ? `transform="translate(-210 -90) scale(1.35)"` : variant === 2 ? `transform="translate(800 0) scale(-1 1)"` : "";
  return `<g ${zoom}>
  <ellipse cx="410" cy="396" rx="340" ry="22" fill="#000" opacity=".45"/>
  <defs><clipPath id="clip${uid}"><path d="${bodyPath}"/></clipPath>
  <linearGradient id="body${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${light}"/><stop offset=".55" stop-color="${hex}"/><stop offset="1" stop-color="${dark}"/></linearGradient>
  <radialGradient id="rim${uid}"><stop offset="0" stop-color="#d9dce1"/><stop offset="1" stop-color="#8e939b"/></radialGradient></defs>
  <path d="${bodyPath}" fill="url(#body${uid})"/>
  <g clip-path="url(#clip${uid})">
    <path d="${glass}" fill="#0d1218" opacity=".92"/>
    <path d="${glass}" fill="url(#body${uid})" opacity=".12"/>
    <rect x="${pillar - 3}" y="${s.roof}" width="6" height="${beltY - s.roof}" fill="${hex}"/>
    <rect x="${tail}" y="${beltY + 8}" width="${nose - tail}" height="3" fill="#000" opacity=".22"/>
    <rect x="${tail}" y="${floor - 26}" width="${nose - tail}" height="26" fill="#000" opacity=".28"/>
    <path d="M ${tail + 20} ${beltY + 34} L ${nose - 20} ${beltY + 30}" stroke="#fff" stroke-opacity=".28" stroke-width="2"/>
  </g>
  <rect x="${nose - 38}" y="${s.hood + 20}" width="30" height="9" rx="4" fill="#fff6d8"/>
  <rect x="${tail + 2}" y="${s.deck + 22}" width="20" height="8" rx="3" fill="#a8222a"/>
  ${wheel(205)}${wheel(600)}</g>`;
}

function interior(kind: PhotoKind, ic: string, fuel: string): string {
  const seat = COLOR_HEX[ic] ?? "#333";
  if (kind === "interior") {
    return `<rect x="90" y="120" width="620" height="260" rx="28" fill="#1b1d21"/>
    <rect x="130" y="150" width="190" height="200" rx="40" fill="${seat}"/><rect x="480" y="150" width="190" height="200" rx="40" fill="${seat}"/>
    <rect x="130" y="290" width="190" height="60" rx="22" fill="${shade(seat, -25)}"/><rect x="480" y="290" width="190" height="60" rx="22" fill="${shade(seat, -25)}"/>
    <rect x="340" y="200" width="120" height="150" rx="16" fill="#0f1013"/><circle cx="400" cy="260" r="26" fill="#2a2d33"/><circle cx="400" cy="260" r="10" fill="#8b9098"/>`;
  }
  if (kind === "dashboard") {
    return `<rect x="60" y="150" width="680" height="200" rx="40" fill="#14161a"/>
    <circle cx="250" cy="260" r="88" fill="#0b0c0e" stroke="${seat}" stroke-width="10"/><circle cx="250" cy="260" r="22" fill="#2a2d33"/>
    <rect x="360" y="180" width="210" height="110" rx="12" fill="#0a1a2a"/><rect x="372" y="192" width="186" height="86" rx="6" fill="#143a5e"/><path d="M380 262 L420 230 L460 250 L500 215 L548 240" stroke="#7fb8e8" stroke-width="3" fill="none"/>
    ${[0, 1, 2, 3].map((i) => `<rect x="${590 + i * 28}" y="215" width="20" height="8" rx="3" fill="#2a2d33"/>`).join("")}
    <rect x="360" y="305" width="210" height="14" rx="7" fill="${seat}"/>`;
  }
  const ev = fuel === "electric";
  return ev
    ? `<rect x="120" y="200" width="560" height="150" rx="18" fill="#1d2025"/><rect x="150" y="226" width="500" height="98" rx="10" fill="#2a2e35"/>${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${170 + i * 78}" y="244" width="64" height="62" rx="6" fill="#3b4a5a"/>`).join("")}<text x="400" y="190" fill="#7fb8e8" font-size="18" text-anchor="middle" font-family="sans-serif">HV BATTERY</text>`
    : `<rect x="140" y="170" width="520" height="190" rx="22" fill="#1d2025"/><rect x="190" y="200" width="420" height="80" rx="10" fill="#3a3e45"/>${[0, 1, 2, 3].map((i) => `<rect x="${215 + i * 100}" y="170" width="52" height="40" rx="8" fill="#8b9098"/>`).join("")}<rect x="190" y="300" width="130" height="38" rx="8" fill="#B8925A"/><circle cx="520" cy="320" r="26" fill="#2a2d33"/>`;
}

const cache = new Map<string, string>();
export function carArt(opts: { body: Body; color: string; interiorColor: string; fuel: string; kind: PhotoKind; variant?: number; seed: string; label?: string }): string {
  const key = [opts.body, opts.color, opts.interiorColor, opts.fuel, opts.kind, opts.variant ?? 0, opts.label ?? ""].join("|");
  const hit = cache.get(key);
  if (hit) return hit;
  const uid = String(hash(key) % 99999);
  const bgA = ["#1a1c20", "#16181c", "#202328"][hash(opts.seed) % 3];
  const inner = opts.kind === "exterior" ? exterior(opts.body, opts.color, opts.variant ?? 0, uid) : interior(opts.kind, opts.interiorColor, opts.fuel);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="bg${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bgA}"/><stop offset=".72" stop-color="#2c2f35"/><stop offset="1" stop-color="#0d0e10"/></linearGradient></defs><rect width="800" height="500" fill="url(#bg${uid})"/><rect y="372" width="800" height="128" fill="#0d0e10" opacity=".6"/>${inner}<text x="784" y="486" fill="#fff" fill-opacity=".38" font-size="13" text-anchor="end" font-family="sans-serif" letter-spacing="2">VROOMA DEMO ILLUSTRATION</text></svg>`;
  const uri = "data:image/svg+xml;utf8," + encodeURIComponent(svg);
  cache.set(key, uri);
  return uri;
}
