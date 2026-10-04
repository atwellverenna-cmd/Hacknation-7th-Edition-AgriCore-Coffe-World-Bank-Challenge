import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Camera, WifiOff } from "lucide-react";
import leafRustImg from "@/assets/leaf-rust.jpg";
import { DiagnosisCard } from "@/components/DiagnosisCard";
import { diagnoseLeaf, type DiagnosisResult } from "@/lib/diagnosis";
import { confidenceTier } from "@/lib/answer-bank";
import { loadLang, saveLang, saveReport, type Lang } from "@/lib/store";
import { PLOT } from "@/lib/cached-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kopi — Check a coffee leaf, offline" },
      {
        name: "description",
        content:
          "Photograph a coffee leaf and get an on-device diagnosis with agronomist-checked advice in Luganda or English. Works fully offline.",
      },
      { property: "og:title", content: "Kopi — Check a coffee leaf, offline" },
      {
        property: "og:description",
        content:
          "Photograph a coffee leaf and get an on-device diagnosis with trusted advice. Works fully offline.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

type Phase = "idle" | "preview" | "analyzing" | "result";

function HomePage() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [photoUrl, setPhotoUrl] = useState<string>();
  const [result, setResult] = useState<DiagnosisResult>();
  const [lang, setLang] = useState<Lang>("en");

  // Read stored language only in the browser, after mount (SSR-safe).
  useEffect(() => {
    setLang(loadLang());
  }, []);

  const handleFile = async (file: File) => {
    const url = URL.createObjectURL(file);
    setPhotoUrl(url);
    setPhase("analyzing");
    const buffer = await file.arrayBuffer();
    const aiImage = await makeThumbnail(file, 768, 0.8);
    const diagnosis = await diagnoseLeaf(buffer, aiImage);
    setResult(diagnosis);
    setPhase("result");

    // Save as a report; low/medium confidence is queued for the officer.
    const thumb = await makeThumbnail(file);
    saveReport({
      id: `r-${diagnosis.analyzedAt}`,
      diagnosis: diagnosis.diagnosis,
      confidence: diagnosis.confidence,
      tier: confidenceTier(diagnosis.confidence),
      severity: diagnosis.severity,
      createdAt: diagnosis.analyzedAt,
      status: "queued",
      thumbnail: thumb,
      source: diagnosis.source,
      farmer: PLOT.farmer,
    });
  };

  const reset = () => {
    setPhase("idle");
    setPhotoUrl(undefined);
    setResult(undefined);
  };

  return (
    <>
      {/* Header */}
      <header className="glass-chip flex items-center gap-3 px-3 py-2 shadow-sm">
        <div className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand to-violet font-display text-[15px] font-bold text-primary-foreground">
          K
        </div>
        <div className="min-w-0 leading-tight">
          <div className="font-display text-[15px] font-bold text-foreground">Kopi</div>
          <div className="truncate text-[10px] text-muted-foreground">{PLOT.farmer} · {PLOT.coop} · {PLOT.trees} trees</div>
        </div>
        <div className="ml-auto flex items-center gap-1.5 rounded-full bg-teal/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-teal">
          <WifiOff className="size-3" />
          Offline ready
        </div>
      </header>

      <div className="mt-4">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          {lang === "lg" ? "Wasuze otya, Noor." : "Good morning, Noor."}
        </h1>
        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
          {lang === "lg"
            ? "Byonna biri ku ssimu yo. Osobola okkebera ekoola nga tolina mutimbagano."
            : "Everything is saved on this phone. You can check a leaf with no signal at all."}
        </p>
      </div>

      {/* Core action / flow */}
      {phase === "idle" && (
        <button
          onClick={() => fileInput.current?.click()}
          className="mt-5 w-full rounded-3xl bg-gradient-to-r from-brand to-violet px-6 py-5 text-left shadow-lg shadow-brand/30 transition-transform active:scale-[0.99]"
        >
          <div className="flex items-center gap-4">
            <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/20">
              <Camera className="size-7 text-white" />
            </div>
            <div className="min-w-0 text-white">
              <div className="font-display text-xl font-semibold leading-tight">
                {lang === "lg" ? "Kebera ekoola" : "Check a leaf"}
              </div>
              <div className="text-xs leading-snug opacity-80">
                {lang === "lg"
                  ? "Twala ekifaananyi — ansWere erawo wano."
                  : "Photograph it — the answer appears right here, offline."}
              </div>
            </div>
          </div>
        </button>
      )}

      {phase === "analyzing" && (
        <div className="glass-card mt-5 overflow-hidden p-4">
          <div className="relative overflow-hidden rounded-2xl">
            <img src={photoUrl} alt="Leaf being checked" className="h-44 w-full object-cover" />
            <div className="animate-scan absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-teal to-transparent" />
          </div>
          <p className="mt-3 text-center text-[13px] font-medium text-muted-foreground">
            Checking the leaf… works even with no signal
          </p>
        </div>
      )}

      {phase === "result" && result && (
        <div className="mt-5 space-y-3">
          <DiagnosisCard
            result={result}
            lang={lang}
            onLangChange={(l) => {
              setLang(l);
              saveLang(l);
            }}
            thumbnail={photoUrl}
          />
          <button
            onClick={reset}
            className="w-full rounded-2xl border border-white/60 bg-white/50 py-3 text-[13px] font-semibold text-foreground backdrop-blur-xl transition-transform active:scale-[0.99]"
          >
            Check another leaf
          </button>
        </div>
      )}

      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = "";
        }}
      />

      {/* Demo shortcut: analyze the sample rust leaf */}
      {phase === "idle" && (
        <button
          onClick={async () => {
            const res = await fetch(leafRustImg);
            const blob = await res.blob();
            void handleFile(new File([blob], "sample-leaf.jpg", { type: "image/jpeg" }));
          }}
          className="mt-3 w-full rounded-2xl border border-white/60 bg-white/40 py-3 text-[12px] font-medium text-muted-foreground backdrop-blur-xl"
        >
          No camera handy? Try a sample leaf photo
        </button>
      )}

      {/* How it stays honest */}
      <div className="glass-card mt-5 p-4">
        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Why you can trust it
        </div>
        <ul className="mt-2 space-y-2 text-[12px] leading-snug text-foreground/80">
          <li>· Every answer is pre-written and checked by an agronomist — the app never invents advice.</li>
          <li>· When it is not sure, it says so and sends the report to your co-op officer.</li>
          <li>· It recommends — you decide. It never sprays, sells or orders anything.</li>
        </ul>
      </div>
    </>
  );
}

async function makeThumbnail(file: File, size = 320, quality = 0.7): Promise<string | undefined> {
  try {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, size / Math.max(bitmap.width, bitmap.height));
    canvas.width = bitmap.width * scale;
    canvas.height = bitmap.height * scale;
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", quality);
  } catch {
    return undefined;
  }
}
