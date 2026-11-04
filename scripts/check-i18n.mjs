// Verifies every t("...") key used in src exists in both languages, and that no dictionary text contains hyphens or dashes between words.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const files = walk("src").filter((f) => /\.(ts|tsx)$/.test(f));
const used = new Map();
for (const f of files) {
  const s = readFileSync(f, "utf8");
  for (const m of s.matchAll(/\bt\(\s*(["'`])([^"'`$]+?)\1/g)) used.set(m[2].endsWith(".") ? "PREFIX:" + m[2] : m[2], f);
  for (const m of s.matchAll(/\bt\(\s*(["'])([a-zA-Z0-9_.]+\.)\1\s*\+/g)) used.set("PREFIX:" + m[2], f);
  for (const m of s.matchAll(/\bt\(\s*`([a-zA-Z0-9_.]+\.)\$\{/g)) used.set("PREFIX:" + m[1], f);
  for (const m of s.matchAll(/(?:label|key|title|k|Tab)[:=]\s*"([a-z]+\.[a-zA-Z0-9_.]+)"/g)) used.set(m[1], f);
}
const load = async () => {
  const mods = {};
  for (const n of ["common", "market", "dash"]) mods[n] = (await import(`../src/lib/dict/${n}.ts`))[n];
  return { mn: Object.assign({}, ...Object.values(mods).map((m) => m.mn)), en: Object.assign({}, ...Object.values(mods).map((m) => m.en)) };
};
const dict = await load();
let bad = 0;
for (const [k, f] of used) {
  if (k.startsWith("PREFIX:")) { const pre = k.slice(7); for (const l of ["mn", "en"]) if (!Object.keys(dict[l]).some((x) => x.startsWith(pre))) { console.log(`missing prefix ${pre} [${l}] (${f})`); bad++; } continue; }
  for (const l of ["mn", "en"]) if (!(k in dict[l])) { console.log(`missing ${l}: ${k}  (${f})`); bad++; }
}
for (const k of Object.keys(dict.mn)) if (!(k in dict.en)) { console.log("only mn: " + k); bad++; }
for (const k of Object.keys(dict.en)) if (!(k in dict.mn)) { console.log("only en: " + k); bad++; }
for (const l of ["mn", "en"]) for (const [k, v] of Object.entries(dict[l])) if (/[\p{L}\p{N}]\s*[-–—‑]\s*[\p{L}\p{N}]/u.test(v) || /\s[-–—]\s/.test(v)) { console.log(`hyphen in ${l}:${k}: ${v}`); bad++; }
console.log(bad ? `FAILED: ${bad} problems` : `OK: ${used.size} keys checked`);
process.exit(bad ? 1 : 0);
