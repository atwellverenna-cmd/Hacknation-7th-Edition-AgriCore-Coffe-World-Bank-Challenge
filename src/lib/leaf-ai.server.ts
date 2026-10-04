import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { DIAGNOSIS_IDS, type DiagnosisId } from "./answer-bank";

const GATEWAY = "https://ai.gateway.lovable.dev/v1";
const MODEL = "openai/gpt-6-astra";

export interface AiLeafResult {
  diagnosis: DiagnosisId;
  confidence: number;
  severity: number;
}

const PROMPT = `You are a coffee leaf classifier for smallholder Arabica farms in Uganda.
Look at the photo and pick exactly ONE label from this fixed list:
- leaf_rust: orange/yellow powdery spots on leaf underside (Hemileia vastatrix)
- leaf_miner: brown irregular blotches/tunnels, papery dead patches
- cercospora: round brown spots with grey/white centre and yellow halo (brown eye spot)
- healthy: no visible disease
If the photo is not a coffee leaf or is unclear, pick the closest label and give LOW confidence (below 0.5).
Severity: 0 = early/mild, 1 = moderate, 2 = severe.
Do NOT give advice. Reply with ONLY JSON: {"diagnosis":"<label>","confidence":<0..1>,"severity":<0|1|2>}`;

export async function classifyLeaf(imageDataUrl: string, signal?: AbortSignal): Promise<AiLeafResult> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured");
  const match = /^data:(image\/[a-z+.-]+);base64,(.+)$/i.exec(imageDataUrl);
  if (!match) throw new Error("Invalid image");

  const provider = createOpenAI({
    baseURL: GATEWAY,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
  });

  const result = streamText({
    model: provider.responses(MODEL),
    ...(signal ? { abortSignal: signal } : {}),
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: PROMPT },
          { type: "image", image: match[2]!, mediaType: match[1]! },
        ],
      },
    ],
    providerOptions: {
      openai: {
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        store: false,
        include: ["reasoning.encrypted_content"],
      },
    },
  });

  const text = await result.text;
  const json = /\{[\s\S]*\}/.exec(text)?.[0];
  if (!json) throw new Error("AI returned no result");
  const parsed = JSON.parse(json) as { diagnosis?: string; confidence?: number; severity?: number };

  // Only labels from the fixed answer bank are accepted; anything else = low-confidence.
  const known = DIAGNOSIS_IDS.includes(parsed.diagnosis as DiagnosisId);
  const diagnosis = (known ? parsed.diagnosis : "healthy") as DiagnosisId;
  let confidence = Math.min(1, Math.max(0, Number(parsed.confidence) || 0));
  if (!known) confidence = Math.min(confidence, 0.3);
  const severity = Math.min(2, Math.max(0, Math.round(Number(parsed.severity) || 0)));
  return { diagnosis, confidence, severity };
}
