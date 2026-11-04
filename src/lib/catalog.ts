import type { Brand, Category, ModelDef } from "./types";

export const BRANDS: Brand[] = [
  ["toyota", "Toyota", "JP"], ["lexus", "Lexus", "JP"], ["mercedes", "Mercedes Benz", "DE"], ["bmw", "BMW", "DE"],
  ["hyundai", "Hyundai", "KR"], ["kia", "Kia", "KR"], ["honda", "Honda", "JP"], ["nissan", "Nissan", "JP"],
  ["subaru", "Subaru", "JP"], ["mitsubishi", "Mitsubishi", "JP"], ["mazda", "Mazda", "JP"], ["volkswagen", "Volkswagen", "DE"],
  ["audi", "Audi", "DE"], ["tesla", "Tesla", "US"], ["porsche", "Porsche", "DE"], ["landrover", "Land Rover", "GB"],
  ["ford", "Ford", "US"], ["chevrolet", "Chevrolet", "US"], ["byd", "BYD", "CN"], ["suzuki", "Suzuki", "JP"],
].map(([id, name, country]) => ({ id, name, country, demo: true }));

export const CATEGORIES: Category[] = [
  { id: "sedan", mn: "Седан", en: "Sedans", body: "sedan" },
  { id: "suv", mn: "Жийп", en: "SUVs", body: "suv" },
  { id: "crossover", mn: "Кроссовер", en: "Crossovers", body: "crossover" },
  { id: "hatchback", mn: "Хэтчбэк", en: "Hatchbacks", body: "hatchback" },
  { id: "coupe", mn: "Купе", en: "Coupes", body: "coupe" },
  { id: "convertible", mn: "Кабриолет", en: "Convertibles", body: "convertible" },
  { id: "pickup", mn: "Пикап", en: "Pickup Trucks", body: "pickup" },
  { id: "van", mn: "Фургон", en: "Vans", body: "van" },
  { id: "minivan", mn: "Минивэн", en: "Minivans", body: "minivan" },
  { id: "truck", mn: "Ачааны машин", en: "Trucks", body: "truck" },
  { id: "ev", mn: "Цахилгаан машин", en: "Electric Vehicles" },
  { id: "hybrid", mn: "Хибрид машин", en: "Hybrid Vehicles" },
  { id: "luxury", mn: "Тансаг машин", en: "Luxury Vehicles" },
  { id: "commercial", mn: "Худалдаа, үйлчилгээний машин", en: "Commercial Vehicles" },
  { id: "offroad", mn: "Явах чадвар өндөртэй машин", en: "Off road Vehicles" },
];

type M = [string, string, string, ModelDef["body"], string, ModelDef["fuel"], number, ModelDef["trans"], ModelDef["drive"], number, number, number, number, number, number, number, ModelDef["steering"], number, number, [number, number], boolean?];
// id, brand, name, body, category, fuel, cc, trans, drive, hp, consumption, length, width, height, seats, doors, steering, refYear, refPriceMnt, years, luxury
const RAW = [
  ["prius30", "toyota", "Prius 30", "hatchback", "hybrid", "hybrid", 1800, "cvt", "fwd", 98, 4.0, 4460, 1745, 1490, 5, 5, "RHD", 2012, 24_500_000, [2009, 2015]],
  ["prius50", "toyota", "Prius 50", "hatchback", "hybrid", "hybrid", 1800, "cvt", "fwd", 122, 3.4, 4540, 1760, 1470, 5, 5, "RHD", 2018, 52_000_000, [2016, 2023]],
  ["lc200", "toyota", "Land Cruiser 200", "suv", "offroad", "diesel", 4500, "automatic", "4wd", 272, 11.5, 4950, 1980, 1955, 7, 5, "LHD", 2016, 205_000_000, [2008, 2021], true],
  ["lc300", "toyota", "Land Cruiser 300", "suv", "offroad", "diesel", 3300, "automatic", "4wd", 309, 9.6, 4985, 1980, 1925, 7, 5, "LHD", 2023, 430_000_000, [2022, 2025], true],
  ["prado150", "toyota", "Land Cruiser Prado 150", "suv", "offroad", "diesel", 2800, "automatic", "4wd", 177, 8.9, 4780, 1885, 1845, 7, 5, "LHD", 2017, 118_000_000, [2010, 2023]],
  ["hilux", "toyota", "Hilux", "pickup", "pickup", "diesel", 2400, "manual", "4wd", 150, 8.2, 5330, 1855, 1815, 5, 4, "LHD", 2019, 92_000_000, [2012, 2024]],
  ["rx350", "lexus", "RX 350", "crossover", "luxury", "petrol", 3500, "automatic", "awd", 295, 11.0, 4890, 1895, 1690, 5, 5, "LHD", 2017, 95_000_000, [2010, 2022], true],
  ["lx570", "lexus", "LX 570", "suv", "luxury", "petrol", 5700, "automatic", "4wd", 383, 14.4, 5080, 1980, 1910, 8, 5, "LHD", 2017, 255_000_000, [2008, 2021], true],
  ["eclass", "mercedes", "E Class", "sedan", "luxury", "petrol", 2000, "automatic", "rwd", 245, 7.4, 4923, 1852, 1468, 5, 4, "LHD", 2018, 112_000_000, [2012, 2023], true],
  ["gle", "mercedes", "GLE", "suv", "luxury", "diesel", 3000, "automatic", "awd", 258, 8.1, 4924, 2003, 1796, 5, 5, "LHD", 2019, 175_000_000, [2015, 2023], true],
  ["x5", "bmw", "X5", "suv", "luxury", "diesel", 3000, "automatic", "awd", 265, 7.9, 4922, 2004, 1745, 5, 5, "LHD", 2018, 150_000_000, [2012, 2023], true],
  ["bmw5", "bmw", "5 Series", "sedan", "luxury", "petrol", 2000, "automatic", "rwd", 252, 7.0, 4963, 1868, 1479, 5, 4, "LHD", 2018, 98_000_000, [2012, 2023], true],
  ["tucson", "hyundai", "Tucson", "crossover", "crossover", "petrol", 2000, "automatic", "fwd", 155, 8.4, 4480, 1850, 1650, 5, 5, "LHD", 2019, 56_000_000, [2012, 2024]],
  ["ioniq5", "hyundai", "Ioniq 5", "crossover", "ev", "electric", 0, "automatic", "awd", 306, 18.0, 4635, 1890, 1605, 5, 5, "LHD", 2023, 138_000_000, [2022, 2025]],
  ["sportage", "kia", "Sportage", "crossover", "crossover", "petrol", 2000, "automatic", "awd", 155, 8.2, 4480, 1855, 1655, 5, 5, "LHD", 2018, 54_000_000, [2011, 2024]],
  ["sorento", "kia", "Sorento", "suv", "suv", "diesel", 2200, "automatic", "awd", 200, 7.6, 4810, 1900, 1700, 7, 5, "LHD", 2018, 78_000_000, [2012, 2023]],
  ["crv", "honda", "CRV", "crossover", "crossover", "petrol", 2400, "cvt", "awd", 185, 8.0, 4585, 1855, 1680, 5, 5, "LHD", 2016, 46_000_000, [2008, 2022]],
  ["fit", "honda", "Fit", "hatchback", "hatchback", "hybrid", 1500, "cvt", "fwd", 110, 4.2, 3995, 1695, 1525, 5, 5, "RHD", 2015, 19_500_000, [2009, 2020]],
  ["xtrail", "nissan", "X Trail", "crossover", "crossover", "petrol", 2000, "cvt", "awd", 144, 8.3, 4640, 1820, 1710, 5, 5, "RHD", 2016, 38_500_000, [2008, 2021]],
  ["leaf", "nissan", "Leaf", "hatchback", "ev", "electric", 0, "automatic", "fwd", 150, 16.0, 4480, 1790, 1540, 5, 5, "RHD", 2019, 36_000_000, [2012, 2022]],
  ["forester", "subaru", "Forester", "crossover", "crossover", "petrol", 2000, "cvt", "awd", 150, 7.8, 4610, 1795, 1735, 5, 5, "RHD", 2015, 33_000_000, [2008, 2022]],
  ["outback", "subaru", "Outback", "crossover", "crossover", "petrol", 2500, "cvt", "awd", 175, 8.3, 4820, 1840, 1675, 5, 5, "RHD", 2016, 36_000_000, [2009, 2022]],
  ["outlander", "mitsubishi", "Outlander", "crossover", "crossover", "petrol", 2400, "cvt", "awd", 168, 8.6, 4695, 1810, 1710, 7, 5, "RHD", 2015, 31_500_000, [2008, 2022]],
  ["pajero", "mitsubishi", "Pajero", "suv", "offroad", "diesel", 3200, "automatic", "4wd", 190, 10.5, 4900, 1875, 1900, 7, 5, "RHD", 2014, 58_000_000, [2006, 2020]],
  ["cx5", "mazda", "CX 5", "crossover", "crossover", "diesel", 2200, "automatic", "awd", 175, 6.3, 4550, 1840, 1680, 5, 5, "RHD", 2017, 44_000_000, [2012, 2023]],
  ["mazda3", "mazda", "Mazda3", "sedan", "sedan", "petrol", 1500, "automatic", "fwd", 120, 6.4, 4660, 1795, 1445, 5, 4, "RHD", 2016, 27_000_000, [2010, 2022]],
  ["golf", "volkswagen", "Golf", "hatchback", "hatchback", "petrol", 1400, "automatic", "fwd", 150, 5.8, 4258, 1799, 1492, 5, 5, "LHD", 2017, 37_000_000, [2012, 2023]],
  ["tiguan", "volkswagen", "Tiguan", "crossover", "crossover", "petrol", 2000, "automatic", "awd", 180, 8.0, 4486, 1839, 1673, 5, 5, "LHD", 2018, 59_000_000, [2012, 2024]],
  ["q7", "audi", "Q7", "suv", "luxury", "diesel", 3000, "automatic", "awd", 249, 7.4, 5063, 1970, 1741, 7, 5, "LHD", 2017, 128_000_000, [2010, 2023], true],
  ["a6", "audi", "A6", "sedan", "luxury", "petrol", 2000, "automatic", "fwd", 245, 7.0, 4939, 1886, 1457, 5, 4, "LHD", 2018, 88_000_000, [2011, 2023], true],
  ["modely", "tesla", "Model Y", "crossover", "ev", "electric", 0, "automatic", "awd", 384, 16.5, 4751, 1921, 1624, 5, 5, "LHD", 2023, 172_000_000, [2021, 2025]],
  ["model3", "tesla", "Model 3", "sedan", "ev", "electric", 0, "automatic", "rwd", 283, 14.9, 4694, 1849, 1443, 5, 4, "LHD", 2021, 108_000_000, [2019, 2025]],
  ["cayenne", "porsche", "Cayenne", "suv", "luxury", "petrol", 3000, "automatic", "awd", 340, 10.0, 4918, 1983, 1696, 5, 5, "LHD", 2019, 260_000_000, [2011, 2024], true],
  ["rrsport", "landrover", "Range Rover Sport", "suv", "luxury", "diesel", 3000, "automatic", "4wd", 306, 8.6, 4879, 2073, 1803, 5, 5, "LHD", 2018, 190_000_000, [2012, 2024], true],
  ["f150", "ford", "F150", "pickup", "pickup", "petrol", 3500, "automatic", "4wd", 375, 12.7, 5890, 2029, 1961, 5, 4, "LHD", 2018, 118_000_000, [2012, 2024]],
  ["ranger", "ford", "Ranger", "pickup", "pickup", "diesel", 2000, "automatic", "4wd", 213, 8.0, 5370, 1918, 1884, 5, 4, "LHD", 2020, 98_000_000, [2015, 2024]],
  ["equinox", "chevrolet", "Equinox", "crossover", "crossover", "petrol", 1500, "automatic", "awd", 170, 8.5, 4652, 1843, 1661, 5, 5, "LHD", 2019, 52_000_000, [2012, 2024]],
  ["songplus", "byd", "Song Plus", "crossover", "ev", "phev", 1500, "automatic", "fwd", 197, 1.6, 4705, 1890, 1680, 5, 5, "LHD", 2023, 99_000_000, [2021, 2025]],
  ["han", "byd", "Han", "sedan", "ev", "electric", 0, "automatic", "awd", 517, 17.0, 4995, 1910, 1495, 5, 4, "LHD", 2023, 148_000_000, [2020, 2025], true],
  ["jimny", "suzuki", "Jimny", "suv", "offroad", "petrol", 660, "manual", "4wd", 64, 7.0, 3395, 1475, 1725, 4, 3, "RHD", 2016, 26_000_000, [2008, 2022]],
] as unknown as M[];
export const MODELS: ModelDef[] = RAW.map((r) => {
  const [id, brandId, name, body, categoryId, fuel, cc, trans, drive, hp, cons, len, wid, hei, seats, doors, steering, refYear, refPrice, years, luxury] = r as M;
  return { id, brandId, name, body, categoryId, fuel, cc, trans, drive, hp, cons, len, wid, hei, seats, doors, steering, refYear, refPrice, years, luxury: !!luxury, demo: true } as ModelDef;
});

export const COLORS = ["white", "black", "silver", "gray", "blue", "red", "green", "brown", "gold", "beige"] as const;
export const COLOR_HEX: Record<string, string> = {
  white: "#ECECEA", black: "#1A1B1E", silver: "#B9BEC4", gray: "#6C7178", blue: "#2C4A7A", red: "#9E2A2B", green: "#2F5D45", brown: "#5A4030", gold: "#B79B66", beige: "#CDBFA6",
};
export const INTERIOR_COLORS = ["black", "beige", "gray", "brown", "red"] as const;
export const SAFETY = ["abs", "esp", "airbags", "blind_spot", "lane_assist", "adaptive_cruise", "camera360", "parking_sensors", "collision_warning", "isofix"] as const;
export const EQUIPMENT = ["leather", "sunroof", "navigation", "heated_seats", "cooled_seats", "remote_start", "led_lights", "carplay", "bose", "tow_bar", "roof_rails", "power_tailgate", "cruise", "keyless"] as const;
