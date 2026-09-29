import type { ReactNode } from "react";

export function Stat({ label, value, tone }: { label: string; value: ReactNode; tone?: string }) {
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-xl font-bold ${tone ?? ""}`}>{value}</div>
    </div>
  );
}
