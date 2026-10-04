import { useEffect, useState } from "react";
import { UserRound } from "lucide-react";
import { loadFarmerName, saveFarmerName } from "@/lib/store";

/** The farmer's name, attached to every photo/check from this phone. */
export function FarmerName() {
  const [saved, setSaved] = useState("");
  const [value, setValue] = useState("");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const n = loadFarmerName();
    setSaved(n);
    setValue(n);
    setEditing(!n);
  }, []);

  const save = () => {
    saveFarmerName(value);
    setSaved(value.trim());
    setEditing(!value.trim());
  };

  if (!editing) {
    return (
      <div className="glass-card mt-4 flex items-center gap-3 p-4">
        <UserRound className="size-5 text-brand" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold">{saved}</div>
          <div className="text-[11px] text-muted-foreground">Your photos reach the officer under this name.</div>
        </div>
        <button onClick={() => setEditing(true)} className="text-[11px] font-medium text-muted-foreground">
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="glass-card mt-4 p-4">
      <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Your name</div>
      <p className="mt-1 text-[12px] leading-snug text-muted-foreground">
        So the officer knows whose leaf photos these are.
      </p>
      <div className="mt-2 flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g. Noor Nakato"
          maxLength={120}
          className="min-w-0 flex-1 rounded-xl border border-foreground/10 bg-background/60 px-3 py-2 text-[13px] text-foreground"
        />
        <button
          onClick={save}
          disabled={!value.trim()}
          className="rounded-xl bg-gradient-to-r from-brand to-violet px-4 text-[13px] font-semibold text-primary-foreground disabled:opacity-50"
        >
          Save
        </button>
      </div>
    </div>
  );
}
