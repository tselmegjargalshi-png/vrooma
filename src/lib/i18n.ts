import { common } from "./dict/common";
import { market } from "./dict/market";
import { dash } from "./dict/dash";
import type { Lang } from "./types";

export const DICT: Record<Lang, Record<string, string>> = {
  mn: { ...common.mn, ...market.mn, ...dash.mn },
  en: { ...common.en, ...market.en, ...dash.en },
};
export function translate(lang: Lang, key: string, params?: Record<string, string | number>): string {
  let s = DICT[lang][key] ?? DICT.en[key] ?? key;
  if (params) for (const k of Object.keys(params)) s = s.split(`{${k}}`).join(String(params[k]));
  return s;
}
