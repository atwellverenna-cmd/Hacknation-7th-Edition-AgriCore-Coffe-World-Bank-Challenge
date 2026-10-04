/**
 * Local persistence. Reports are saved on the device first (localStorage) so
 * everything works offline. When a co-op code is set, changed reports are
 * marked "pending" and sent to the co-op's online database when there is
 * signal (see sync.ts); the officer's phone pulls them from there.
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
  thumbnail?: string | undefined;
  reviewedAt?: number | undefined;
  outcome?: "confirmed" | "corrected" | "visit" | undefined;
  source?: "ai" | "on-device" | undefined;
  visitRequestedAt?: number | undefined;
  visitNote?: string | undefined;
  /** Last change time — newest change wins when syncing. */
  updatedAt?: number | undefined;
  /** Which phone made the check. */
  deviceId?: string | undefined;
  farmer?: string | undefined;
}

export const OUTCOME_LABEL = {
  confirmed: "Diagnosis confirmed",
  corrected: "Diagnosis corrected",
  visit: "Farm visit needed",
} as const;

const REPORTS_KEY = "kopi.reports";
const LANG_KEY = "kopi.lang";
const PENDING_KEY = "kopi.pending";
const COOP_KEY = "kopi.coop";
const DEVICE_KEY = "kopi.device";

export const REPORTS_EVENT = "kopi:reports";
export const DIRTY_EVENT = "kopi:dirty";

export function deviceId(): string {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = `d-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

export function loadReports(): LeafReport[] {
  try {
    const raw = localStorage.getItem(REPORTS_KEY);
    return raw ? (JSON.parse(raw) as LeafReport[]) : [];
  } catch {
    return [];
  }
}

/** Reports made on this phone (the farmer's own). */
export function loadMyReports(): LeafReport[] {
  const me = deviceId();
  return loadReports().filter((r) => !r.deviceId || r.deviceId === me);
}

export function writeReports(reports: LeafReport[]) {
  localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
  window.dispatchEvent(new Event(REPORTS_EVENT));
}

export function loadPending(): string[] {
  try {
    return JSON.parse(localStorage.getItem(PENDING_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

export function clearPending(ids: string[]) {
  const done = new Set(ids);
  localStorage.setItem(PENDING_KEY, JSON.stringify(loadPending().filter((i) => !done.has(i))));
}

function markDirty(id: string) {
  const p = new Set(loadPending());
  p.add(id);
  localStorage.setItem(PENDING_KEY, JSON.stringify([...p]));
  window.dispatchEvent(new Event(DIRTY_EVENT));
}

function update(id: string, patch: Partial<LeafReport>) {
  writeReports(loadReports().map((r) => (r.id === id ? { ...r, ...patch, updatedAt: Date.now() } : r)));
  markDirty(id);
}

export function saveReport(report: LeafReport) {
  const full = { ...report, updatedAt: Date.now(), deviceId: deviceId() };
  writeReports([full, ...loadReports()].slice(0, 300));
  markDirty(report.id);
}

export function markReviewed(id: string, outcome: NonNullable<LeafReport["outcome"]> = "confirmed") {
  update(id, { status: "reviewed", reviewedAt: Date.now(), outcome });
}

export function requestVisit(id: string, note?: string) {
  update(id, { visitRequestedAt: Date.now(), visitNote: note?.trim() || undefined });
}

export function cancelVisitRequest(id: string) {
  update(id, { visitRequestedAt: undefined, visitNote: undefined });
}

export function loadCoop(): { code: string; name: string } | null {
  try {
    return JSON.parse(localStorage.getItem(COOP_KEY) ?? "null") as { code: string; name: string } | null;
  } catch {
    return null;
  }
}

export function saveCoop(coop: { code: string; name: string } | null) {
  if (coop) {
    localStorage.setItem(COOP_KEY, JSON.stringify(coop));
    // Send everything made on this phone so far.
    const p = new Set(loadPending());
    loadMyReports().forEach((r) => p.add(r.id));
    localStorage.setItem(PENDING_KEY, JSON.stringify([...p]));
    window.dispatchEvent(new Event(DIRTY_EVENT));
  } else {
    localStorage.removeItem(COOP_KEY);
  }
  window.dispatchEvent(new Event(REPORTS_EVENT));
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
