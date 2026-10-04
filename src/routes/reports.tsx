import { createFileRoute } from "@tanstack/react-router";
import { ANSWER_BANK, TIER_LABEL } from "@/lib/answer-bank";
import { loadMyReports, timeAgo, type LeafReport } from "@/lib/store";
import { useReports } from "@/lib/sync";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Saved reports — Kopi" },
      { name: "description", content: "Your saved leaf checks, kept on this phone and shared with your co-op officer." },
      { property: "og:title", content: "Saved reports — Kopi" },
      { property: "og:description", content: "Your saved leaf checks, shared with your co-op." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReportsPage,
});

const DOT = { high: "bg-teal", medium: "bg-amber", low: "bg-rust" } as const;

function ReportsPage() {
  const reports = useReports(loadMyReports, [] as LeafReport[]);

  return (
    <>
      <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight">Saved reports</h1>
      <p className="mt-1 text-[13px] text-muted-foreground">
        Stored on this phone. Queued reports go to your co-op officer when signal returns.
      </p>

      <div className="glass-card mt-4 p-4">
        {reports.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-muted-foreground">
            No reports yet — check a leaf from the Home tab.
          </p>
        ) : (
          <div className="divide-y divide-foreground/5">
            {reports.map((r) => {
              const entry = ANSWER_BANK[r.diagnosis];
              return (
                <div key={r.id} className="flex items-center gap-3 py-3">
                  {r.thumbnail ? (
                    <img src={r.thumbnail} alt="" className="size-11 rounded-xl object-cover" loading="lazy" />
                  ) : (
                    <span className={`size-2.5 rounded-full ${DOT[r.tier]}`} />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] font-medium">{entry.name.en}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {TIER_LABEL[r.tier].en} · {timeAgo(r.createdAt)}
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                      r.status === "reviewed" ? "bg-teal/10 text-teal" : "bg-amber/10 text-amber"
                    }`}
                  >
                    {r.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
