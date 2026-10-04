/**
 * Local persistence. Everything lives on the device (localStorage) — no
 * account, no server. Reports queue here until an officer reviews them;
 * cached prices/weather carry a saved-at timestamp so the app can always
 * say how old the data is.
 */

import type { DiagnosisId, ConfidenceTier, Lang } from "./answer-bank";

export type { Lang };

export interface LeafReport {
  id: string;
  diagnosis: DiagnosisId;
  confidence: number;
  tier: ConfidenceTier;
  severity: number;
  createdAt: number;
  status: "queued" | "reviewed";
  /** objectURL is session-scoped, so we persist a small dataURL thumbnail. */
  thumbnail?: string | undefined;
  reviewedAt?: number | undefined;
  /** Officer's outcome when reviewing. */
  outcome?: "confirmed" | "corrected" | "visit" | undefined;
  source?: "ai" | "on-device" | undefined;
}

export const OUTCOME_LABEL = {
  confirmed: "Diagnosis confirmed",
  corrected: "Diagnosis corrected",
  visit: "Farm visit needed",
} as const;

const REPORTS_KEY = "kopi.reports";
const LANG_KEY = "kopi.lang";

export function loadReports(): LeafReport[] {
  try {
    const raw = localStorage.getItem(REPORTS_KEY);
    return raw ? (JSON.parse(raw) as LeafReport[]) : [];
  } catch {
    return [];
  }
}

export function saveReport(report: LeafReport) {
  const reports = [report, ...loadReports()].slice(0, 50);
  localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
}

export function markReviewed(id: string, outcome: NonNullable<LeafReport["outcome"]> = "confirmed") {
  const reports = loadReports().map((r) =>
    r.id === id ? { ...r, status: "reviewed" as const, reviewedAt: Date.now(), outcome } : r,
  );
  localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
}

export function loadLang(): Lang {
  return localStorage.getItem(LANG_KEY) === "lg" ? "lg" : "en";
}

export function saveLang(lang: Lang) {
  localStorage.setItem(LANG_KEY, lang);
}

/** Speak advice with on-device speech synthesis — works fully offline. */
export function speak(text: string, lang: Lang) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang === "lg" ? "lg-UG" : "en-US";
  utterance.rate = 0.92;
  window.speechSynthesis.speak(utterance);
}

export function timeAgo(ts: number): string {
  const mins = Math.max(0, Math.round((Date.now() - ts) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}
