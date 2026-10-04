import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCheck, FileDown, MapPin, Pencil } from "lucide-react";
import { ANSWER_BANK, TIER_LABEL } from "@/lib/answer-bank";
import { OUTCOME_LABEL, loadReports, markReviewed, timeAgo, type LeafReport } from "@/lib/store";
import { exportReviewedPdf } from "@/lib/report-pdf";
import { useReports } from "@/lib/sync";
import { CoopSync } from "@/components/CoopSync";

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
  const reports = useReports(loadReports, [] as LeafReport[]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [busy, setBusy] = useState(false);

  const queued = reports.filter((r) => r.status === "queued");
  const reviewed = reports.filter((r) => r.status === "reviewed");

  const fromTs = from ? new Date(`${from}T00:00:00`).getTime() : -Infinity;
  const toTs = to ? new Date(`${to}T23:59:59`).getTime() : Infinity;
  const filtered = reviewed.filter((r) => {
    const t = r.reviewedAt ?? r.createdAt;
    return t >= fromTs && t <= toTs;
  });

  const review = (id: string, outcome: NonNullable<LeafReport["outcome"]>) => {
    markReviewed(id, outcome);
  };

  const download = async () => {
    setBusy(true);
    try {
      await exportReviewedPdf(filtered, from, to);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight">Officer view</h1>
      <p className="mt-1 text-[13px] text-muted-foreground">
        Reports from every farmer in your co-op arrive here when their phones have signal. Low-confidence cases first —
        the tool never decides for the farmer.
      </p>
      <CoopSync />

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
              .sort((a, b) => Number(b.visitRequestedAt ?? 0) - Number(a.visitRequestedAt ?? 0) || a.confidence - b.confidence)
              .map((r) => {
                const entry = ANSWER_BANK[r.diagnosis];
                return (
                  <div key={r.id} className="rounded-xl bg-foreground/5 px-3 py-2.5">
                    <div className="flex items-center gap-3">
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
                        {r.visitRequestedAt && (
                          <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-rust">
                            <MapPin className="size-3" />
                            Farmer asked for a visit
                            {r.visitNote ? ` — ${r.visitNote}` : ""}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 flex gap-1.5">
                      <button
                        onClick={() => review(r.id, "confirmed")}
                        className="flex items-center gap-1 rounded-full bg-teal/15 px-2.5 py-1.5 text-[11px] font-semibold text-teal"
                      >
                        <CheckCheck className="size-3.5" /> Confirm
                      </button>
                      <button
                        onClick={() => review(r.id, "corrected")}
                        className="flex items-center gap-1 rounded-full bg-amber/15 px-2.5 py-1.5 text-[11px] font-semibold text-amber"
                      >
                        <Pencil className="size-3.5" /> Correct
                      </button>
                      <button
                        onClick={() => review(r.id, "visit")}
                        className="flex items-center gap-1 rounded-full bg-rust/15 px-2.5 py-1.5 text-[11px] font-semibold text-rust"
                      >
                        <MapPin className="size-3.5" /> Visit
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      <div className="glass-card mt-4 p-4">
        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Download summary
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <label className="text-[11px] text-muted-foreground">
            From
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="mt-1 w-full rounded-xl border border-foreground/10 bg-background/60 px-2 py-2 text-[13px] text-foreground"
            />
          </label>
          <label className="text-[11px] text-muted-foreground">
            To
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="mt-1 w-full rounded-xl border border-foreground/10 bg-background/60 px-2 py-2 text-[13px] text-foreground"
            />
          </label>
        </div>
        <button
          onClick={download}
          disabled={busy || filtered.length === 0}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand to-violet py-3 text-[13px] font-semibold text-primary-foreground disabled:opacity-50"
        >
          <FileDown className="size-4" />
          {filtered.length === 0 ? "No reviewed checks in this period" : `Download PDF (${filtered.length})`}
        </button>
      </div>

      {filtered.length > 0 && (
        <div className="glass-card mt-4 p-4">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Reviewed</div>
          <div className="mt-2 space-y-2">
            {filtered.map((r) => (
              <div key={r.id} className="flex items-center gap-2 rounded-xl bg-foreground/5 px-3 py-2 text-[12px]">
                <span className="size-1.5 rounded-full bg-teal" />
                <span className="truncate">
                  {ANSWER_BANK[r.diagnosis].name.en} · {OUTCOME_LABEL[r.outcome ?? "confirmed"]}
                </span>
                <span className="ml-auto shrink-0 text-muted-foreground">{timeAgo(r.reviewedAt ?? r.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
