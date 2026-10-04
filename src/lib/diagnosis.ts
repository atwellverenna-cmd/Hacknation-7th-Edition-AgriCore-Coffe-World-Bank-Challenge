/**
 * On-device diagnosis.
 *
 * In the production build this is a quantized TensorFlow.js classifier
 * (<10 MB, fine-tuned on BRACOL) running fully offline. For this prototype
 * the inference is simulated deterministically from the image bytes, so the
 * same photo always yields the same result — including across offline
 * sessions — while the full three-tier confidence flow is real.
 */

import { DIAGNOSIS_IDS, type DiagnosisId } from "./answer-bank";

export interface DiagnosisResult {
  diagnosis: DiagnosisId;
  /** 0–1 model confidence. */
  confidence: number;
  /** 0–2 severity band index into the answer bank entry. */
  severity: number;
  analyzedAt: number;
}

function hashBytes(bytes: Uint8Array): number {
  let h = 2166136261;
  const step = Math.max(1, Math.floor(bytes.length / 4096));
  for (let i = 0; i < bytes.length; i += step) {
    h ^= bytes[i];
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export async function diagnoseLeaf(imageData: ArrayBuffer): Promise<DiagnosisResult> {
  const bytes = new Uint8Array(imageData);
  const h = hashBytes(bytes);

  // Simulate on-device inference time so the scanning state is visible.
  await new Promise((resolve) => setTimeout(resolve, 1600));

  const diagnosis = DIAGNOSIS_IDS[h % DIAGNOSIS_IDS.length];
  // Spread confidence across all three tiers deterministically.
  const confidence = 0.32 + ((h >> 8) % 640) / 1000; // 0.32 – 0.96
  const severity = (h >> 20) % 3;

  return { diagnosis, confidence, severity, analyzedAt: Date.now() };
}
