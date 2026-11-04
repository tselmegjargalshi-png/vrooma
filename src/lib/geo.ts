export interface Place { id: string; mn: string; en: string; lat: number; lng: number }
export const UB = "ub";
export const PROVINCES: Place[] = [
  { id: "ub", mn: "Улаанбаатар", en: "Ulaanbaatar", lat: 47.918, lng: 106.917 },
  { id: "arkhangai", mn: "Архангай", en: "Arkhangai", lat: 47.47, lng: 101.45 },
  { id: "bayan_olgii", mn: "Баян Өлгий", en: "Bayan Ölgii", lat: 48.97, lng: 89.96 },
  { id: "bayankhongor", mn: "Баянхонгор", en: "Bayankhongor", lat: 46.19, lng: 100.72 },
  { id: "bulgan", mn: "Булган", en: "Bulgan", lat: 48.81, lng: 103.53 },
  { id: "govi_altai", mn: "Говь Алтай", en: "Govi Altai", lat: 46.37, lng: 96.26 },
  { id: "govisumber", mn: "Говьсүмбэр", en: "Govisümber", lat: 46.36, lng: 108.36 },
  { id: "darkhan_uul", mn: "Дархан Уул", en: "Darkhan Uul", lat: 49.49, lng: 105.92 },
  { id: "dornogovi", mn: "Дорноговь", en: "Dornogovi", lat: 44.89, lng: 110.12 },
  { id: "dornod", mn: "Дорнод", en: "Dornod", lat: 48.07, lng: 114.53 },
  { id: "dundgovi", mn: "Дундговь", en: "Dundgovi", lat: 45.76, lng: 106.27 },
  { id: "zavkhan", mn: "Завхан", en: "Zavkhan", lat: 47.74, lng: 96.84 },
  { id: "orkhon", mn: "Орхон", en: "Orkhon", lat: 49.03, lng: 104.05 },
  { id: "uvurkhangai", mn: "Өвөрхангай", en: "Övörkhangai", lat: 46.26, lng: 102.78 },
  { id: "umnugovi", mn: "Өмнөговь", en: "Ömnögovi", lat: 43.57, lng: 104.42 },
  { id: "sukhbaatar", mn: "Сүхбаатар", en: "Sükhbaatar", lat: 46.68, lng: 113.28 },
  { id: "selenge", mn: "Сэлэнгэ", en: "Selenge", lat: 50.23, lng: 106.2 },
  { id: "tuv", mn: "Төв", en: "Töv", lat: 47.71, lng: 106.95 },
  { id: "uvs", mn: "Увс", en: "Uvs", lat: 49.98, lng: 92.07 },
  { id: "khovd", mn: "Ховд", en: "Khovd", lat: 48.0, lng: 91.64 },
  { id: "khuvsgul", mn: "Хөвсгөл", en: "Khövsgöl", lat: 49.64, lng: 100.16 },
  { id: "khentii", mn: "Хэнтий", en: "Khentii", lat: 47.32, lng: 110.65 },
];
export const DISTRICTS: Place[] = [
  { id: "bayangol", mn: "Баянгол", en: "Bayangol", lat: 47.915, lng: 106.87 },
  { id: "bayanzurkh", mn: "Баянзүрх", en: "Bayanzürkh", lat: 47.92, lng: 107.03 },
  { id: "songinokhairkhan", mn: "Сонгинохайрхан", en: "Songinokhairkhan", lat: 47.93, lng: 106.78 },
  { id: "sukhbaatar_d", mn: "Сүхбаатар", en: "Sükhbaatar", lat: 47.925, lng: 106.92 },
  { id: "khan_uul", mn: "Хан Уул", en: "Khan Uul", lat: 47.88, lng: 106.88 },
  { id: "chingeltei", mn: "Чингэлтэй", en: "Chingeltei", lat: 47.945, lng: 106.9 },
  { id: "nalaikh", mn: "Налайх", en: "Nalaikh", lat: 47.77, lng: 107.26 },
];
export const provName = (id: string, lang: "mn" | "en") => { const p = PROVINCES.find((x) => x.id === id); return p ? p[lang] : id; };
export const distName = (id: string, lang: "mn" | "en") => { const p = DISTRICTS.find((x) => x.id === id); return p ? p[lang] : id; };
export const provCenter = (id: string) => PROVINCES.find((x) => x.id === id) ?? PROVINCES[0];

/** Schematic outline of Mongolia as [lng, lat] pairs. Illustrative only, not survey accurate. */
export const OUTLINE: [number, number][] = [
  [87.75, 49.2], [89.0, 49.9], [90.7, 50.3], [92.1, 50.8], [94.3, 50.6], [95.8, 49.95], [97.8, 49.0], [98.4, 50.7], [98.9, 52.0],
  [100.6, 51.7], [102.2, 51.3], [104.0, 50.2], [106.0, 50.3], [107.9, 49.9], [109.5, 49.2], [111.5, 49.4], [114.3, 50.2], [116.7, 49.8],
  [117.8, 49.5], [119.3, 50.3], [119.9, 48.2], [118.5, 47.9], [117.4, 46.6], [116.0, 45.7], [113.6, 44.8], [111.9, 45.1], [111.0, 43.4],
  [109.0, 42.5], [106.0, 42.0], [101.8, 42.5], [99.5, 42.6], [96.4, 42.7], [95.3, 44.2], [93.5, 45.0], [91.0, 46.0], [90.8, 47.3], [88.8, 48.2],
];
