import { useState } from "react";
import { Play, Square, UserCheck } from "lucide-react";
import { ANSWER_BANK, TIER_LABEL, confidenceTier, type Lang } from "@/lib/answer-bank";
import type { DiagnosisResult } from "@/lib/diagnosis";
import { speak } from "@/lib/store";

const TIER_STYLES = {
  high: "bg-teal/15 text-teal border-teal/30",
  medium: "bg-amber/15 text-amber border-amber/30",
  low: "bg-rust/15 text-rust border-rust/30",
} as const;

const TIER_BARS = {
  high: ["bg-teal", "bg-teal", "bg-teal"],
  medium: ["bg-teal", "bg-amber", "bg-foreground/10"],
  low: ["bg-rust", "bg-foreground/10", "bg-foreground/10"],
} as const;

export function DiagnosisCard({
  result,
  lang,
  onLangChange,
  thumbnail,
}: {
  result: DiagnosisResult;
  lang: Lang;
  onLangChange: (lang: Lang) => void;
  thumbnail?: string | undefined;
}) {
  const [playing, setPlaying] = useState(false);
  const entry = ANSWER_BANK[result.diagnosis];
  const tier = confidenceTier(result.confidence);
  const severityLabel = entry.severityBands[result.severity];

  const togglePlay = () => {
    if (playing) {
      window.speechSynthesis?.cancel();
      setPlaying(false);
      return;
    }
    speak(entry.spoken[lang], lang);
    setPlaying(true);
    // Reset when speech ends (approximate — utterance end events are flaky on mobile).
    const est = entry.spoken[lang].split(" ").length * 450;
    window.setTimeout(() => setPlaying(false), Math.min(est, 20000));
  };

  return (
    <div className="glass-card animate-rise p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Diagnosis
        </div>
        <span
          className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${TIER_STYLES[tier]}`}
        >
          {TIER_LABEL[tier][lang]}
        </span>
      </div>

      {thumbnail && (
        <img
          src={thumbnail}
          alt="Checked leaf"
          className="mt-3 h-28 w-full rounded-2xl object-cover"
          loading="lazy"
        />
      )}

      <div className="mt-3 font-display text-2xl font-semibold leading-tight text-foreground">
        {entry.name[lang]}
      </div>
      <div className="mt-0.5 text-xs text-muted-foreground">
        {severityLabel} · {Math.round(result.confidence * 100)}% match
      </div>

      {/* Three-tier confidence gauge */}
      <div className="mt-3 flex gap-1.5">
        {TIER_BARS[tier].map((bar, i) => (
          <div key={i} className={`h-2 flex-1 rounded-full ${bar}`} />
        ))}
      </div>

      <div className="mt-4 space-y-2.5">
        {entry.advice[lang].map((line) => (
          <div key={line} className="flex gap-2.5">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" />
            <p className="text-[13px] leading-snug text-foreground/85">{line}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <div className="flex items-center rounded-full bg-foreground/5 p-1 text-[11px] font-semibold">
          {(["lg", "en"] as const).map((l) => (
            <button
              key={l}
              onClick={() => onLangChange(l)}
              className={
                lang === l
                  ? "rounded-full bg-white px-3 py-1.5 text-foreground shadow-sm ring-1 ring-foreground/10"
                  : "px-3 py-1.5 text-muted-foreground"
              }
            >
              {l === "lg" ? "Luganda" : "English"}
            </button>
          ))}
        </div>
        <button
          onClick={togglePlay}
          className="ml-auto flex items-center gap-2 rounded-full bg-gradient-to-r from-brand to-violet px-4 py-2.5 text-[13px] font-semibold text-white shadow-lg shadow-brand/30 transition-transform active:scale-95"
        >
          {playing ? <Square className="size-3.5" /> : <Play className="size-3.5" />}
          {playing ? "Stop" : lang === "lg" ? "Wuliriza" : "Play advice"}
        </button>
      </div>

      {tier !== "high" && (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-rust/10 px-3 py-2 text-xs font-medium text-rust">
          <UserCheck className="size-4 shrink-0" />
          {lang === "lg"
            ? "Tetukakase ddala — report yeewaayo eri omukozi wa koperative."
            : "Not fully certain — this report is queued for your co-op officer."}
        </div>
      )}

      <p className="mt-3 text-[10px] text-muted-foreground">
        Advice #{entry.id} · reviewed by {entry.reviewedBy}
      </p>
    </div>
  );
}
