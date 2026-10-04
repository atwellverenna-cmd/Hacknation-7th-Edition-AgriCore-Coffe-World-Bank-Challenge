/**
 * Fixed answer bank — the heart of the fail-safe design.
 *
 * Every piece of advice the tool can give lives here, pre-written and
 * agronomist-checked, in English and Luganda. The app NEVER generates
 * free-text advice: a diagnosis maps to an entry ID, and only these
 * strings can be shown or spoken. This is what makes hallucination
 * impossible in the core flow.
 */

export type DiagnosisId = "leaf_rust" | "leaf_miner" | "cercospora" | "healthy";

/** UI language: English or Luganda. */
export type Lang = "en" | "lg";

export interface AnswerBankEntry {
  id: DiagnosisId;
  name: { en: string; lg: string };
  severityBands: string[];
  advice: { en: string[]; lg: string[] };
  /** Spoken summary, played via on-device speech (works offline). */
  spoken: { en: string; lg: string };
  reviewedBy: string;
}

export const ANSWER_BANK: Record<DiagnosisId, AnswerBankEntry> = {
  leaf_rust: {
    id: "leaf_rust",
    name: { en: "Coffee leaf rust", lg: "Olukwekwe lwa kafe" },
    severityBands: ["Early — a few yellow spots", "Moderate — spots spreading", "Severe — leaves falling"],
    advice: {
      en: [
        "Rake and burn fallen leaves now — do not compost them.",
        "Prune the lowest branches so air moves through the tree.",
        "Spray a copper-based fungicide in the cool morning, before noon.",
        "Check the same trees again in 14 days.",
      ],
      lg: [
        "Yoola era ogye emiti eguddeko amakoola kakano — togazaasa.",
        "Salako amatabi aga wansi omuyaga guyitamu.",
        "Fuuuyira eddagala lya copper mu makya nga enkuba tennyanira.",
        "Ddamu okebeze emiti gye gimu oluvannyuma lwa ennaku 14.",
      ],
    },
    spoken: {
      en: "This looks like coffee leaf rust. Burn fallen leaves, prune low branches, and spray copper fungicide in the cool morning. Check again in two weeks.",
      lg: "Kino kiyise ng'olukwekwe lwa kafe. Gya amakoola agagudde, salako amatabi aga wansi, era fuuuyira copper mu makya. Ddamu okebeze oluvannyuma lwa sabbiiti bbiri.",
    },
    reviewedBy: "J. Nalwoga, agronomist — Kibale co-op",
  },
  leaf_miner: {
    id: "leaf_miner",
    name: { en: "Coffee leaf miner", lg: "Ekokolimo mu koola" },
    severityBands: ["Few mined leaves", "Many leaves mined", "Whole branches affected"],
    advice: {
      en: [
        "Pick and destroy leaves with winding white tunnels.",
        "Keep shade trees — they reduce leaf miner attacks.",
        "Do not spray yet; check again in 7 days and count affected leaves.",
      ],
      lg: [
        "Noola era ozikirize amakoola agalina emikutu emyeru.",
        "Leke emiti emikuufu — gikendeeza ku kokolimo.",
        "Tofuuuyira kakano; ddamu okebeze oluvannyuma lwa ennaku 7.",
      ],
    },
    spoken: {
      en: "This looks like leaf miner. Pick and destroy leaves with white tunnels, keep your shade trees, and check again in one week.",
      lg: "Kino kiyise ng'ekokolimo mu koola. Noola amakoola agalina emikutu, leke emiti emikuufu, era ddamu okebeze oluvannyuma lwa sabbiiti emu.",
    },
    reviewedBy: "J. Nalwoga, agronomist — Kibale co-op",
  },
  cercospora: {
    id: "cercospora",
    name: { en: "Cercospora leaf spot", lg: "Ebibala bya cercospora" },
    severityBands: ["Few brown spots", "Spots joining together", "Leaves yellowing"],
    advice: {
      en: [
        "Improve airflow: prune crowded branches.",
        "Avoid working among trees when leaves are wet.",
        "If spots keep spreading, ask the co-op officer about fungicide.",
      ],
      lg: [
        "Wa omuyaga omala: salako amatabi ag'ekinyeenye.",
        "Tokola mu miti nga amakoola galuma.",
        "Bwe biba byeeyongera, buuza omukozi wa koperative ku ddagala.",
      ],
    },
    spoken: {
      en: "This looks like cercospora leaf spot. Prune crowded branches for airflow and avoid working when leaves are wet.",
      lg: "Kino kiyise nga cercospora. Salako amatabi omuyaga guyite, era tokola nga amakoola galuma.",
    },
    reviewedBy: "J. Nalwoga, agronomist — Kibale co-op",
  },
  healthy: {
    id: "healthy",
    name: { en: "Healthy leaf", lg: "Ekoola eddungi" },
    severityBands: ["No disease signs"],
    advice: {
      en: [
        "No disease signs on this leaf. Well done.",
        "Keep checking one leaf per tree each week during the rainy season.",
        "Keep fallen leaves raked to stop disease starting.",
      ],
      lg: [
        "Tewali bulwadde ku koola lino. Webale nyo.",
        "Weerengeku ekoola kimu ku muti buli wiiki mu kiseera ky'enkuba.",
        "Yoola amakoola agagudde obulwadde bbutatandika.",
      ],
    },
    spoken: {
      en: "Good news — this leaf looks healthy. Keep checking one leaf per tree each week during the rains.",
      lg: "Amawulire amalungi — ekoola lino ddungi. Weerengeku ekoola kimu ku muti buli wiiki mu nkuba.",
    },
    reviewedBy: "J. Nalwoga, agronomist — Kibale co-op",
  },
};

export const DIAGNOSIS_IDS = Object.keys(ANSWER_BANK) as DiagnosisId[];

/** Three-tier confidence model (pass/fail guardrail). */
export type ConfidenceTier = "high" | "medium" | "low";

export function confidenceTier(confidence: number): ConfidenceTier {
  if (confidence >= 0.8) return "high";
  if (confidence >= 0.5) return "medium";
  return "low";
}

export const TIER_LABEL: Record<ConfidenceTier, { en: string; lg: string }> = {
  high: { en: "High confidence", lg: "Tukakase nyo" },
  medium: { en: "Medium confidence", lg: "Tukakase katono" },
  low: { en: "Not sure — ask a person", lg: "Tetukakase — buuza omuntu" },
};
