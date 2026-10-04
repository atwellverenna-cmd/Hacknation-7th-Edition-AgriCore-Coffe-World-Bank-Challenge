import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCheck } from "lucide-react";
import { ANSWER_BANK, TIER_LABEL } from "@/lib/answer-bank";
import { loadReports, markReviewed, timeAgo, type LeafReport } from "@/lib/store";

export const Route = createFileRoute("/officer")({
  head: () => ({
    meta: [
      { title: "Officer view — Kopi" },
      {
        name: "description",
        content: "Extension officer queue: review leaf reports farmers flagged, starting with low-confidence cases.",
      },
      { property: "og:title", content: "Officer view — Kopi" },
      { property: "og:description", content: "Review queued leaf reports from farmers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OfficerPage,
});

function OfficerPage() {
  const [reports, setReports] = useState<LeafReport[]>([]);
  useEffect(() => setReports(loadReports()), []);

  const queued = reports.filter((r) => r.status === "queued");
  const reviewed = reports.filter((r) => r.status === "reviewed");

  const review = (id: string) => {
    markReviewed(id);
    setReports(loadReports());
  };

  return (
    <>
      <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight">Officer view</h1>
      <p className="mt-1 text-[13px] text-muted-foreground">
        Reports queue on the farmer's phone and sync to you when there is signal. Low-confidence cases first — the tool
        never decides for the farmer.
      </p>

      <div className="glass-card mt-4 p-4">
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Awaiting review
          </div>
          <span className="text-[11px] font-semibold text-muted-foreground">{queued.length}</span>
        </div>
        {queued.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-muted-foreground">Nothing queued. All caught up.</p>
        ) : (
          <div className="mt-2 space-y-2">
            {[...queued]
              .sort((a, b) => a.confidence - b.confidence)
              .map((r) => {
                const entry = ANSWER_BANK[r.diagnosis];
                return (
                  <div key={r.id} className="flex items-center gap-3 rounded-xl bg-foreground/5 px-3 py-2.5">
                    {r.thumbnail && (
                      <img src={r.thumbnail} alt="" className="size-10 rounded-lg object-cover" loading="lazy" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-medium">
                        {entry.name.en} · {Math.round(r.confidence * 100)}%
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {TIER_LABEL[r.tier].en} · {timeAgo(r.createdAt)}
                      </div>
                    </div>
                    <button
                      onClick={() => review(r.id)}
                      className="flex items-center gap-1 rounded-full bg-teal/15 px-3 py-1.5 text-[11px] font-semibold text-teal"
                    >
                      <CheckCheck className="size-3.5" />
                      Review
                    </button>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {reviewed.length > 0 && (
        <div className="glass-card mt-4 p-4">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Reviewed</div>
          <div className="mt-2 space-y-2">
            {reviewed.map((r) => (
              <div key={r.id} className="flex items-center gap-2 rounded-xl bg-foreground/5 px-3 py-2 text-[12px]">
                <span className="size-1.5 rounded-full bg-teal" />
                {ANSWER_BANK[r.diagnosis].name.en}
                <span className="ml-auto text-muted-foreground">{timeAgo(r.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
