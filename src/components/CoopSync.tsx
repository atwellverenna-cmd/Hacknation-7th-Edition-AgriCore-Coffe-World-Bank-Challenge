import { useEffect, useState } from "react";
import { Cloud, CloudOff, Loader2, RefreshCw } from "lucide-react";
import { checkCoopCode } from "@/lib/sync.functions";
import { loadCoop, saveCoop, REPORTS_EVENT } from "@/lib/store";
import { syncNow, useSyncState } from "@/lib/sync";

/** Co-op code entry + sync status. Same card on farmer and officer pages. */
export function CoopSync() {
  const [coop, setCoop] = useState<{ code: string; name: string } | null>(null);
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const s = useSyncState();

  useEffect(() => {
    const r = () => setCoop(loadCoop());
    r();
    window.addEventListener(REPORTS_EVENT, r);
    return () => window.removeEventListener(REPORTS_EVENT, r);
  }, []);

  const join = async () => {
    setErr("");
    if (!navigator.onLine) return setErr("You need signal to join a co-op the first time.");
    setBusy(true);
    try {
      const r = await checkCoopCode({ data: { code } });
      if (!r.ok || !r.name) return setErr("That code wasn't found. Check it with your officer.");
      saveCoop({ code: code.trim().toUpperCase(), name: r.name });
      setCode("");
    } catch {
      setErr("Couldn't check the code. Try again when signal is better.");
    } finally {
      setBusy(false);
    }
  };

  if (!coop) {
    return (
      <div className="glass-card mt-4 p-4">
        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Share with your co-op
        </div>
        <p className="mt-1 text-[12px] leading-snug text-muted-foreground">
          Enter your co-op code so reports reach the officer's phone. Until then, they stay on this phone only.
        </p>
        <div className="mt-2 flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="AGRICORE"
            className="min-w-0 flex-1 rounded-xl border border-foreground/10 bg-background/60 px-3 py-2 text-[13px] uppercase text-foreground"
          />
          <button
            onClick={join}
            disabled={busy || code.trim().length < 3}
            className="rounded-xl bg-gradient-to-r from-brand to-violet px-4 text-[13px] font-semibold text-primary-foreground disabled:opacity-50"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : "Join"}
          </button>
        </div>
        {err && <p className="mt-1.5 text-[11px] font-medium text-rust">{err}</p>}
      </div>
    );
  }

  const label =
    s.status === "syncing"
      ? "Sending…"
      : s.status === "offline"
        ? `No signal — ${s.pending} waiting to send`
        : s.status === "error"
          ? `Couldn't reach the co-op — ${s.pending} waiting`
          : s.pending
            ? `${s.pending} waiting to send`
            : "All reports shared";

  return (
    <div className="glass-chip mt-4 flex items-center gap-2 px-3 py-2 text-[12px]">
      {s.status === "offline" || s.status === "error" ? (
        <CloudOff className="size-4 text-amber" />
      ) : (
        <Cloud className="size-4 text-teal" />
      )}
      <div className="min-w-0 flex-1 leading-tight">
        <div className="truncate font-semibold">{coop.name}</div>
        <div className="truncate text-[11px] text-muted-foreground">{label}</div>
      </div>
      <button onClick={() => void syncNow()} aria-label="Sync now" className="p-1 text-muted-foreground">
        <RefreshCw className={`size-4 ${s.status === "syncing" ? "animate-spin" : ""}`} />
      </button>
      <button onClick={() => saveCoop(null)} className="text-[11px] font-medium text-muted-foreground">
        Leave
      </button>
    </div>
  );
}
