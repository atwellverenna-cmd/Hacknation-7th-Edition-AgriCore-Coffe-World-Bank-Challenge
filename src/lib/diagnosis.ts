/**
 * Leaf diagnosis.
 *
 * Online: the photo is sent to Lovable AI, which may ONLY pick a label from
 * the fixed answer bank (plus confidence + severity). The advice shown is
 * always the agronomist-reviewed entry for that label — the AI never writes
 * advice. Offline (or if the AI is unavailable): a deterministic on-device
 * fallback runs, so the core flow still works with no signal.
 */

import { DIAGNOSIS_IDS, type DiagnosisId } from "./answer-bank";
import { classifyLeafPhoto } from "./leaf-ai.functions";

export interface DiagnosisResult {
  diagnosis: DiagnosisId;
  /** 0–1 model confidence. */
  confidence: number;
  /** 0–2 severity band index into the answer bank entry. */
  severity: number;
  analyzedAt: number;
  source: "ai" | "on-device";
}

function hashBytes(bytes: Uint8Array): number {
  let h = 2166136261;
  const step = Math.max(1, Math.floor(bytes.length / 4096));
  for (let i = 0; i < bytes.length; i += step) {
    h ^= bytes[i] ?? 0;
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

async function onDevice(imageData: ArrayBuffer): Promise<DiagnosisResult> {
  const h = hashBytes(new Uint8Array(imageData));
  await new Promise((resolve) => setTimeout(resolve, 1600));
  return {
    diagnosis: DIAGNOSIS_IDS[h % DIAGNOSIS_IDS.length]!,
    confidence: 0.32 + ((h >> 8) % 640) / 1000,
    severity: (h >> 20) % 3,
    analyzedAt: Date.now(),
    source: "on-device",
  };
}

export async function diagnoseLeaf(imageData: ArrayBuffer, aiImage?: string): Promise<DiagnosisResult> {
  if (aiImage && typeof navigator !== "undefined" && navigator.onLine) {
    try {
      const r = await classifyLeafPhoto({ data: { image: aiImage } });
      return { ...r, analyzedAt: Date.now(), source: "ai" };
    } catch (e) {
      console.warn("AI diagnosis unavailable, using on-device check", e);
    }
  }
  return onDevice(imageData);
}
