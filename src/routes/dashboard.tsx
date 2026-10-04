import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MapPin, Undo2 } from "lucide-react";
import { ANSWER_BANK, TIER_LABEL } from "@/lib/answer-bank";
import { PLOT } from "@/lib/cached-data";
import {
  cancelVisitRequest,
  loadMyReports,
  requestVisit,
  timeAgo,
  type LeafReport,
} from "@/lib/store";
import { useReports } from "@/lib/sync";
import { CoopSync } from "@/components/CoopSync";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "My farm — Kopi" },
      {
        name: "description",
        content: "Your queued leaf checks and farm visit requests, shared with your co-op officer.",
      },
      { property: "og:title", content: "My farm — Kopi" },
      { property: "og:description", content: "Your queued leaf checks and farm visit requests." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DashboardPage,
});

const DOT = { high: "bg-teal", medium: "bg-amber", low: "bg-rust" } as const;

function DashboardPage() {
  const reports = useReports(loadMyReports, [] as LeafReport[]);
  const [noteFor, setNoteFor] = useState<string>();
  const [note, setNote] = useState("");

  const queued = reports.filter((r) => r.status === "queued");
  const visitRequests = reports.filter((r) => r.visitRequestedAt);

  const refresh = () => {};

  const submitVisit = (id: string) => {
    requestVisit(id, note);
    setNoteFor(undefined);
    setNote("");
  };

  return (
    <>
      <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight">My farm</h1>
      <p className="mt-1 text-[13px] text-muted-foreground">
        {PLOT.farmer} · {PLOT.coop} · {PLOT.trees} trees. Your checks waiting for the officer, and
        any visits you've asked for.
      </p>
      <CoopSync />

      {/* Visit requests */}
      <div className="glass-card mt-4 p-4">
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Visit requests
          </div>
          <span className="text-[11px] font-semibold text-muted-foreground">
            {visitRequests.length}
          </span>
        </div>
        {visitRequests.length === 0 ? (
          <p className="py-5 text-center text-[13px] text-muted-foreground">
            No visits requested. Ask from a queued check below.
          </p>
        ) : (
          <div className="mt-2 space-y-2">
            {visitRequests.map((r) => (
              <div key={r.id} className="rounded-xl bg-rust/10 px-3 py-2.5">
                <div className="flex items-center gap-2 text-[13px] font-medium">
                  <MapPin className="size-3.5 shrink-0 text-rust" />
                  <span className="truncate">{ANSWER_BANK[r.diagnosis].name.en}</span>
                  <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">
                    {timeAgo(r.visitRequestedAt ?? r.createdAt)}
                  </span>
                </div>
                {r.visitNote && (
                  <p className="mt-1 text-[12px] leading-snug text-foreground/70">{r.visitNote}</p>
                )}
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-rust">
                    {r.status === "reviewed" ? "Officer has seen this" : "Waiting for the officer"}
                  </span>
                  <button
                    onClick={() => {
                      cancelVisitRequest(r.id);
                      refresh();
                    }}
                    className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground"
                  >
                    <Undo2 className="size-3" /> Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Queued checks */}
      <div className="glass-card mt-4 p-4">
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Queued checks
          </div>
          <span className="text-[11px] font-semibold text-muted-foreground">{queued.length}</span>
        </div>
        {queued.length === 0 ? (
          <p className="py-5 text-center text-[13px] text-muted-foreground">
            Nothing waiting — the officer has reviewed everything.
          </p>
        ) : (
          <div className="mt-2 space-y-2">
            {queued.map((r) => {
              const entry = ANSWER_BANK[r.diagnosis];
              const requesting = noteFor === r.id;
              return (
                <div key={r.id} className="rounded-xl bg-foreground/5 px-3 py-2.5">
                  <div className="flex items-center gap-3">
                    {r.thumbnail ? (
                      <img src={r.thumbnail} alt="" className="size-10 rounded-lg object-cover" loading="lazy" />
                    ) : (
                      <span className={`size-2.5 rounded-full ${DOT[r.tier]}`} />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-medium">{entry.name.en}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {TIER_LABEL[r.tier].en} · {timeAgo(r.createdAt)}
                      </div>
                    </div>
                    {!r.visitRequestedAt && !requesting && (
                      <button
                        onClick={() => {
                          setNoteFor(r.id);
                          setNote("");
                        }}
                        className="flex shrink-0 items-center gap-1 rounded-full bg-rust/15 px-2.5 py-1.5 text-[11px] font-semibold text-rust"
                      >
                        <MapPin className="size-3.5" /> Ask for a visit
                      </button>
                    )}
                    {r.visitRequestedAt && (
                      <span className="shrink-0 rounded-full bg-rust/10 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-rust">
                        Visit asked
                      </span>
                    )}
                  </div>
                  {requesting && (
                    <div className="mt-2">
                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Anything the officer should know? (optional)"
                        rows={2}
                        className="w-full rounded-xl border border-foreground/10 bg-background/60 px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground/60"
                      />
                      <div className="mt-1.5 flex gap-1.5">
                        <button
                          onClick={() => submitVisit(r.id)}
                          className="rounded-full bg-rust px-3 py-1.5 text-[11px] font-semibold text-white"
                        >
                          Send request
                        </button>
                        <button
                          onClick={() => setNoteFor(undefined)}
                          className="rounded-full bg-foreground/10 px-3 py-1.5 text-[11px] font-medium text-muted-foreground"
                        >
                          Back
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="mt-3 text-center text-[11px] leading-snug text-muted-foreground">
        Requests are saved on this phone and reach the officer when there is signal.
      </p>
    </>
  );
}
