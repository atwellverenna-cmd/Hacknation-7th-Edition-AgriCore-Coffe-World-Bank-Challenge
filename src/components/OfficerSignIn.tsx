import { useEffect, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { checkOfficerPin } from "@/lib/sync.functions";
import { loadCoop, loadOfficer, saveOfficer, REPORTS_EVENT, type Officer } from "@/lib/store";

/** Officer PIN: only signed-in officers can sign off reports, and their name is recorded. */
export function OfficerSignIn({ onChange }: { onChange?: (o: Officer | null) => void }) {
  const [officer, setOfficer] = useState<Officer | null>(null);
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const r = () => {
      const o = loadOfficer();
      setOfficer(o);
      onChange?.(o);
    };
    r();
    window.addEventListener(REPORTS_EVENT, r);
    return () => window.removeEventListener(REPORTS_EVENT, r);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signIn = async () => {
    setErr("");
    const coop = loadCoop();
    if (!coop) return setErr("Join your co-op first.");
    if (!navigator.onLine) return setErr("You need signal to check your PIN the first time.");
    setBusy(true);
    try {
      const r = await checkOfficerPin({ data: { code: coop.code, pin } });
      if (!r.ok || !r.name) return setErr("That PIN wasn't recognised.");
      saveOfficer({ name: r.name, pin: pin.trim() });
      setPin("");
    } catch {
      setErr("Couldn't check the PIN. Try again.");
    } finally {
      setBusy(false);
    }
  };

  if (officer) {
    return (
      <div className="glass-card mt-4 flex items-center gap-3 p-4">
        <ShieldCheck className="size-5 text-teal" />
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold">Signed in as {officer.name}</div>
          <div className="text-[11px] text-muted-foreground">Your name is recorded on every report you review.</div>
        </div>
        <button onClick={() => saveOfficer(null)} className="text-[11px] font-medium text-muted-foreground">
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="glass-card mt-4 p-4">
      <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Officer PIN</div>
      <p className="mt-1 text-[12px] leading-snug text-muted-foreground">
        Enter your personal PIN to review reports. Farmers can see their reports but can't sign them off.
      </p>
      <div className="mt-2 flex gap-2">
        <input
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          inputMode="numeric"
          type="password"
          maxLength={8}
          placeholder="PIN"
          className="min-w-0 flex-1 rounded-xl border border-foreground/10 bg-background/60 px-3 py-2 text-[13px] text-foreground"
        />
        <button
          onClick={signIn}
          disabled={busy || pin.length < 4}
          className="rounded-xl bg-gradient-to-r from-brand to-violet px-4 text-[13px] font-semibold text-primary-foreground disabled:opacity-50"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : "Sign in"}
        </button>
      </div>
      {err && <p className="mt-2 text-[12px] text-rust">{err}</p>}
    </div>
  );
}
