"use client";

import { useMemo, useState, useTransition } from "react";
import { respondCallup } from "./actions";

export type GuestMatch = {
  id: string;
  opponent: string;
  start_time: string | null;
  court: string | null;
  team: { name: string; category: string; gender: string };
  callups: { id: string; player_name: string; jersey_number: number | null; status: string; transport: string | null }[];
};

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function StatusPill({ status, transport }: { status: string; transport: string | null }) {
  if (status === "confirmed")
    return (
      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-950 dark:text-green-300">
        ✓ Asiste {transport === "bus" ? "· 🚌" : transport === "own" ? "· 🚗" : ""}
      </span>
    );
  if (status === "declined")
    return <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-950 dark:text-red-300">No asiste</span>;
  return <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">Pendiente</span>;
}

function Responder({ token, callupId, onDone }: { token: string; callupId: string; onDone: () => void }) {
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState(false);
  const send = (status: "confirmed" | "declined", transport: "bus" | "own" | null) =>
    start(async () => {
      const r = await respondCallup(token, callupId, status, transport, note);
      if (r.ok) onDone();
      else setError(true);
    });
  const btn = "w-full rounded-lg px-3 py-2.5 text-sm font-medium disabled:opacity-50";
  return (
    <div className="mt-2 space-y-2 rounded-lg bg-canvas p-3">
      <div className="grid gap-2 sm:grid-cols-3">
        <button disabled={pending} onClick={() => send("confirmed", "bus")} className={`${btn} bg-green-600 text-white hover:bg-green-700`}>
          ✓ Asiste · 🚌 Buseta
        </button>
        <button disabled={pending} onClick={() => send("confirmed", "own")} className={`${btn} bg-green-600 text-white hover:bg-green-700`}>
          ✓ Asiste · 🚗 Medios propios
        </button>
        <button disabled={pending} onClick={() => send("declined", null)} className={`${btn} border border-red-300 bg-surface text-red-700`}>
          ✗ No asiste
        </button>
      </div>
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={500}
        placeholder="Comentario opcional (ej. llega tarde)"
        className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm"
      />
      {pending && <p className="text-xs text-muted">Guardando…</p>}
      {error && <p className="text-xs text-red-600">No se pudo guardar. Intentá de nuevo.</p>}
    </div>
  );
}

export function CallupBoard({ token, matches }: { token: string; matches: GuestMatch[] }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const nq = norm(q.trim());
    if (!nq) return matches;
    return matches
      .map((m) => ({ ...m, callups: m.callups.filter((c) => norm(c.player_name).includes(nq)) }))
      .filter((m) => m.callups.length > 0);
  }, [q, matches]);

  return (
    <div className="space-y-4">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="🔎 Nombre del atleta"
        className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-base shadow-sm outline-none focus:border-brand"
      />
      {filtered.length === 0 && <p className="text-center text-sm text-muted">No se encontró ningún atleta convocado con ese nombre.</p>}
      {filtered.map((m) => (
        <section key={m.id} className="rounded-xl border border-line bg-surface p-4 shadow-sm">
          <div className="mb-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-800 dark:bg-orange-950 dark:text-orange-300">{m.team.category}</span>
              <span className="font-semibold">{m.team.name}</span>
              <span className="text-muted">vs {m.opponent}</span>
            </div>
            <div className="text-sm text-muted">
              {m.start_time ? `🕒 ${m.start_time.slice(0, 5)}` : "Hora por confirmar"}{m.court ? ` · ${m.court}` : ""}
            </div>
          </div>
          <ul className="divide-y divide-line">
            {m.callups.map((c) => (
              <li key={c.id} className="py-2">
                <button className="flex w-full items-center justify-between gap-2 text-left" onClick={() => setOpen(open === c.id ? null : c.id)}>
                  <span className="text-sm">
                    {c.jersey_number != null && <span className="mr-1 font-mono text-xs text-muted">#{c.jersey_number}</span>}
                    {c.player_name}
                  </span>
                  <span className="flex items-center gap-2">
                    {saved === c.id && <span className="text-xs text-green-600">¡Guardado!</span>}
                    <StatusPill status={c.status} transport={c.transport} />
                  </span>
                </button>
                {open === c.id && (
                  <Responder
                    token={token}
                    callupId={c.id}
                    onDone={() => {
                      setOpen(null);
                      setSaved(c.id);
                      setTimeout(() => setSaved(null), 2500);
                    }}
                  />
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
