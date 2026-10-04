import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Co-op sync. Access is by co-op code only (no accounts): every call checks
 * the code exists before touching reports, and only that co-op's rows are
 * read or written. Tables have no public policies; only these functions
 * can reach them.
 */

const code = z.string().trim().toUpperCase().min(3).max(40);

const reportSchema = z.object({
  id: z.string().min(1).max(80),
  diagnosis: z.enum(["leaf_rust", "leaf_miner", "cercospora", "healthy"]),
  confidence: z.number().min(0).max(1),
  tier: z.enum(["high", "medium", "low"]),
  severity: z.number().int().min(0).max(2),
  createdAt: z.number(),
  status: z.enum(["queued", "reviewed"]),
  thumbnail: z.string().max(200_000).optional(),
  reviewedAt: z.number().optional(),
  outcome: z.enum(["confirmed", "corrected", "visit"]).optional(),
  source: z.enum(["ai", "on-device"]).optional(),
  visitRequestedAt: z.number().optional(),
  visitNote: z.string().max(1000).optional(),
  updatedAt: z.number(),
  deviceId: z.string().max(80).optional(),
  farmer: z.string().max(120).optional(),
});

export type SyncReport = z.infer<typeof reportSchema>;

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function coopName(db: Awaited<ReturnType<typeof admin>>, c: string) {
  const { data } = await db.from("coops").select("name").eq("code", c).eq("active", true).maybeSingle();
  return data?.name ?? null;
}

const iso = (n?: number) => (n ? new Date(n).toISOString() : null);
const ms = (s: string | null) => (s ? new Date(s).getTime() : undefined);

export const checkCoopCode = createServerFn({ method: "POST" })
  .validator((d) => z.object({ code }).parse(d))
  .handler(async ({ data }) => {
    const name = await coopName(await admin(), data.code);
    return { ok: !!name, name };
  });

export const syncReports = createServerFn({ method: "POST" })
  .validator((d) => z.object({ code, reports: z.array(reportSchema).max(50) }).parse(d))
  .handler(async ({ data }) => {
    const db = await admin();
    if (!(await coopName(db, data.code))) throw new Error("Unknown co-op code");

    if (data.reports.length) {
      const ids = data.reports.map((r) => r.id);
      const { data: existing } = await db
        .from("reports")
        .select("id, coop_code, updated_at")
        .in("id", ids);
      const ex = new Map((existing ?? []).map((e) => [e.id, e]));
      const rows = data.reports
        .filter((r) => {
          const e = ex.get(r.id);
          if (!e) return true;
          if (e.coop_code !== data.code) return false; // never overwrite another co-op's row
          return r.updatedAt >= new Date(e.updated_at).getTime();
        })
        .map((r) => ({
          id: r.id,
          coop_code: data.code,
          device_id: r.deviceId ?? null,
          farmer_name: r.farmer ?? null,
          diagnosis: r.diagnosis,
          confidence: r.confidence,
          tier: r.tier,
          severity: r.severity,
          created_at: new Date(r.createdAt).toISOString(),
          status: r.status,
          thumbnail: r.thumbnail ?? null,
          reviewed_at: iso(r.reviewedAt),
          outcome: r.outcome ?? null,
          source: r.source ?? null,
          visit_requested_at: iso(r.visitRequestedAt),
          visit_note: r.visitNote ?? null,
          updated_at: new Date(r.updatedAt).toISOString(),
        }));
      if (rows.length) {
        const { error } = await db.from("reports").upsert(rows);
        if (error) throw new Error("Could not save reports");
      }
    }

    const { data: all, error } = await db
      .from("reports")
      .select("*")
      .eq("coop_code", data.code)
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) throw new Error("Could not load reports");

    return (all ?? []).map((r) => ({
      id: r.id,
      diagnosis: r.diagnosis,
      confidence: r.confidence,
      tier: r.tier,
      severity: r.severity,
      createdAt: new Date(r.created_at).getTime(),
      status: r.status,
      thumbnail: r.thumbnail ?? undefined,
      reviewedAt: ms(r.reviewed_at),
      outcome: r.outcome ?? undefined,
      source: r.source ?? undefined,
      visitRequestedAt: ms(r.visit_requested_at),
      visitNote: r.visit_note ?? undefined,
      updatedAt: new Date(r.updated_at).getTime(),
      deviceId: r.device_id ?? undefined,
      farmer: r.farmer_name ?? undefined,
    }));
  });
