import { createFileRoute } from "@tanstack/react-router";
import { CACHED_PRICES, CACHED_WEATHER, SOIL_CONTEXT } from "@/lib/cached-data";
import { timeAgo } from "@/lib/store";

export const Route = createFileRoute("/market")({
  head: () => ({
    meta: [
      { title: "Market, weather & soil — Kopi" },
      {
        name: "description",
        content: "Cached coffee prices, weather and soil context for your plot — always labelled with how old the data is.",
      },
      { property: "og:title", content: "Market, weather & soil — Kopi" },
      { property: "og:description", content: "Cached prices, weather and soil context, with data age shown." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MarketPage,
});

function MarketPage() {
  return (
    <>
      <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight">Market & weather</h1>
      <p className="mt-1 text-[13px] text-muted-foreground">
        Last values saved on this phone. Each card says how old it is.
      </p>

      <section className="mt-4">
        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Prices</div>
        <div className="mt-2 grid grid-cols-1 gap-3">
          {CACHED_PRICES.map((p) => (
            <div key={p.label} className="glass-card p-4">
              <div className="flex items-baseline justify-between gap-2">
                <div className="text-[13px] font-medium text-foreground/80">{p.label}</div>
                <div className="text-[10px] text-muted-foreground">saved {timeAgo(p.savedAt)}</div>
              </div>
              <div className="mt-1 font-display text-xl font-semibold">{p.value}</div>
              <div className="text-[11px] text-muted-foreground">{p.detail}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-5">
        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Weather</div>
        <div className="mt-2 grid grid-cols-1 gap-3">
          {CACHED_WEATHER.map((w) => (
            <div key={w.label} className="glass-card p-4">
              <div className="flex items-baseline justify-between gap-2">
                <div className="text-[13px] font-medium text-foreground/80">{w.label}</div>
                <div className="text-[10px] text-muted-foreground">saved {timeAgo(w.savedAt)}</div>
              </div>
              <div className="mt-1 font-display text-xl font-semibold">{w.value}</div>
              <div className="text-[11px] text-muted-foreground">{w.detail}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-5">
        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Soil · your plot</div>
        <div className="glass-card mt-2 p-4">
          <div className="font-display text-lg font-semibold">pH {SOIL_CONTEXT.ph}</div>
          <div className="mt-0.5 text-[12px] text-muted-foreground">{SOIL_CONTEXT.texture}</div>
          <p className="mt-2 text-[13px] leading-snug text-foreground/85">{SOIL_CONTEXT.advice}</p>
          <div className="mt-2 text-[10px] text-muted-foreground">
            {SOIL_CONTEXT.source} · saved {timeAgo(SOIL_CONTEXT.savedAt)}
          </div>
        </div>
      </section>
    </>
  );
}
