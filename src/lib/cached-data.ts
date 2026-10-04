/**
 * Cached context data — store-and-forward.
 *
 * Prices, weather and soil are support features (non-AI). The last fetched
 * values are cached with a timestamp; when offline, the app shows the cache
 * and says exactly how old it is. Values here are the demo cache for Noor's
 * plot in Kibale district, Uganda.
 */

export interface CachedReading {
  label: string;
  value: string;
  detail: string;
  savedAt: number;
}

const DAY = 24 * 60 * 60 * 1000;
const now = Date.now();

export const CACHED_PRICES: CachedReading[] = [
  {
    label: "Kiboko (dry cherry)",
    value: "USh 4,200/kg",
    detail: "Local buying price (example)",
    savedAt: now - 2 * DAY,
  },
  {
    label: "FAQ (green bean)",
    value: "USh 9,800/kg",
    detail: "Kampala exporter reference",
    savedAt: now - 2 * DAY,
  },
  {
    label: "Maize (support)",
    value: "USh 1,150/kg",
    detail: "WFP HDX monthly, regional",
    savedAt: now - 9 * DAY,
  },
];

export const CACHED_WEATHER: CachedReading[] = [
  {
    label: "Today",
    value: "24°C · rain likely",
    detail: "CHIRPS/NASA POWER blend",
    savedAt: now - 3 * DAY,
  },
  {
    label: "This week",
    value: "Rain 4 of 7 days",
    detail: "Good for spraying gaps on dry mornings",
    savedAt: now - 3 * DAY,
  },
  {
    label: "Heat stress",
    value: "Low risk",
    detail: "Max temps below 28°C during flowering",
    savedAt: now - 3 * DAY,
  },
];

export const SOIL_CONTEXT = {
  ph: "5.8 — slightly acidic",
  texture: "Sandy loam, good drainage",
  advice: "Coffee target pH is 5.0–6.5. Your plot is in range; a little lime next season keeps it there.",
  source: "iSDAsoil, cached at registration",
  savedAt: now - 30 * DAY,
};

export const PLOT = {
  farmer: "Noor",
  coop: "Agricore",
  trees: 24,
  variety: "Arabica · SL28",
  altitude: "1,540 m",
};
