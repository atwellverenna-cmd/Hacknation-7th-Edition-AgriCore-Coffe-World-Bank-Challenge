import { useEffect, useState } from "react";
import { syncReports } from "./sync.functions";
import {
  DIRTY_EVENT,
  REPORTS_EVENT,
  clearPending,
  loadCoop,
  loadOfficer,
  loadPending,
  loadReports,
  writeReports,
  type LeafReport,
} from "./store";

export type SyncState = { status: "off" | "offline" | "syncing" | "synced" | "error"; at?: number; pending: number };

let state: SyncState = { status: "off", pending: 0 };
const listeners = new Set<(s: SyncState) => void>();
function set(s: SyncState) {
  state = s;
  listeners.forEach((l) => l(s));
}

let running: Promise<void> | null = null;

export function syncNow(): Promise<void> {
  if (running) return running;
  running = doSync().finally(() => {
    running = null;
  });
  return running;
}

async function doSync() {
  const coop = loadCoop();
  const pendingIds = loadPending();
  if (!coop) return set({ status: "off", pending: pendingIds.length });
  if (!navigator.onLine) return set({ status: "offline", pending: pendingIds.length });
  set({ ...state, status: "syncing", pending: pendingIds.length });
  try {
    const local = loadReports();
    const pendingSet = new Set(pendingIds);
    const toSend = local.filter((r) => pendingSet.has(r.id)).slice(0, 50);
    const remote = (await syncReports({
      data: { code: coop.code, reports: toSend.map(clean), ...(loadOfficer() ? { officerPin: loadOfficer()!.pin } : {}) },
    })) as LeafReport[];
    clearPending(toSend.map((r) => r.id));

    // Merge: newest change wins; keep local rows the server doesn't have yet.
    const byId = new Map(loadReports().map((r) => [r.id, r]));
    for (const r of remote) {
      const l = byId.get(r.id);
      if (!l || (r.updatedAt ?? 0) >= (l.updatedAt ?? 0)) byId.set(r.id, { ...r, thumbnail: r.thumbnail ?? l?.thumbnail });
    }
    writeReports([...byId.values()].sort((a, b) => b.createdAt - a.createdAt));
    const left = loadPending().length;
    set({ status: "synced", at: Date.now(), pending: left });
    if (left) void Promise.resolve().then(syncNow);
  } catch (e) {
    console.warn("Sync failed", e);
    set({ status: "error", pending: loadPending().length });
  }
}

/** Strip undefined so the server validator accepts optional fields. */
function clean(r: LeafReport) {
  return Object.fromEntries(Object.entries(r).filter(([, v]) => v !== undefined && v !== null)) as never;
}

/** Mount once: syncs on start, when signal returns, after changes, and every minute. */
export function useSyncEngine() {
  useEffect(() => {
    void syncNow();
    let t: ReturnType<typeof setTimeout> | undefined;
    const soon = () => {
      clearTimeout(t);
      t = setTimeout(() => void syncNow(), 800);
    };
    window.addEventListener("online", soon);
    window.addEventListener(DIRTY_EVENT, soon);
    const iv = setInterval(() => {
      if (document.visibilityState === "visible") void syncNow();
    }, 60_000);
    return () => {
      window.removeEventListener("online", soon);
      window.removeEventListener(DIRTY_EVENT, soon);
      clearInterval(iv);
      clearTimeout(t);
    };
  }, []);
}

export function useSyncState() {
  const [s, setS] = useState(state);
  useEffect(() => {
    listeners.add(setS);
    return () => void listeners.delete(setS);
  }, []);
  return s;
}

/** Re-read reports whenever they change (local edit or sync). */
export function useReports<T>(read: () => T, initial: T): T {
  const [v, setV] = useState<T>(initial);
  useEffect(() => {
    const r = () => setV(read());
    r();
    window.addEventListener(REPORTS_EVENT, r);
    return () => window.removeEventListener(REPORTS_EVENT, r);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return v;
}
