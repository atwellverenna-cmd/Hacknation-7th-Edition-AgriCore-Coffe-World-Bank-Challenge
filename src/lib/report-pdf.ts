import { ANSWER_BANK, TIER_LABEL } from "./answer-bank";
import { OUTCOME_LABEL, type LeafReport } from "./store";
import { PLOT } from "./cached-data";

const fmt = (ts: number) =>
  new Date(ts).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export async function exportReviewedPdf(reports: LeafReport[], from: string, to: string) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("Kopi — Reviewed leaf checks", 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`${PLOT.coop} co-op · Period: ${from || "start"} to ${to || "today"}`, 14, 25);
  doc.text(`Generated ${fmt(Date.now())} · ${reports.length} reviewed check(s)`, 14, 30);

  // Outcome summary
  const counts: Record<string, number> = {};
  for (const r of reports) {
    const k = ANSWER_BANK[r.diagnosis].name.en;
    counts[k] = (counts[k] ?? 0) + 1;
  }
  autoTable(doc, {
    startY: 36,
    head: [["Condition", "Checks"]],
    body: Object.entries(counts).map(([k, v]) => [k, String(v)]),
    headStyles: { fillColor: [91, 141, 239] },
    theme: "grid",
  });

  const lastY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 60;
  autoTable(doc, {
    startY: lastY + 8,
    head: [["Checked", "Farmer", "Condition", "Severity", "Confidence", "Reviewed", "Signed off by", "Outcome"]],
    body: [...reports].sort((a, b) => (a.farmer ?? "").localeCompare(b.farmer ?? "") || a.createdAt - b.createdAt).map((r) => {
      const e = ANSWER_BANK[r.diagnosis];
      return [
        fmt(r.createdAt),
        r.farmer ?? "Unnamed",
        e.name.en,
        e.severityBands[r.severity]?.split(" — ")[0] ?? "",
        `${Math.round(r.confidence * 100)}% (${TIER_LABEL[r.tier].en})`,
        r.reviewedAt ? fmt(r.reviewedAt) : "",
        r.reviewedBy ?? "",
        OUTCOME_LABEL[r.outcome ?? "confirmed"],
      ];
    }),
    headStyles: { fillColor: [91, 141, 239] },
    styles: { fontSize: 8 },
  });

  doc.save(`kopi-reviewed-${from || "all"}-to-${to || "today"}.pdf`);
}
