"use client";

import { useMemo, useState, useTransition } from "react";
import { respondCallup, setTransport } from "./actions";

export type GuestMatch = {
  id: string;
  opponent: string;
  start_time: string | null;
  court: string | null;
  team: { name: string; category: string; gender: string };
  callups: { id: string; player_id: string; player_name: string; jersey_number: number | null; status: string }[];
};

export function filterToAllowed(matches: GuestMatch[], allowedPlayerIds: Set<string>): GuestMatch[] {
  return matches
    .map((m) => ({ ...m, callups: m.callups.filter((c) => allowedPlayerIds.has(c.player_id)) }))
    .filter((m) => m.callups.length > 0);
}

export type GuestPlayer = { player_id: string; player_name: string; jersey_number: number | null; transport: string | null };

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
// "First Last" strings sort the same as (first_name, last_name) since first_name is the prefix.
const byName = <T extends { player_name: string }>(a: T, b: T) => a.player_name.localeCompare(b.player_name);

function StatusPill({ status }: { status: string }) {
  if (status === "confirmed")
    return <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-950 dark:text-green-300">✓ Asiste</span>;
  if (status === "declined")
    return <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-950 dark:text-red-300">No asiste</span>;
  return <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">Pendiente</span>;
}

function Responder({ token, callupId, onDone }: { token: string; callupId: string; onDone: () => void }) {
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState(false);
  const send = (status: "confirmed" | "declined") =>
    start(async () => {
      const r = await respondCallup(token, callupId, status, note);
      if (r.ok) onDone();
      else setError(true);
    });
  const btn = "w-full rounded-lg px-3 py-2.5 text-sm font-medium disabled:opacity-50";
  return (
    <div className="mt-2 space-y-2 rounded-lg bg-background p-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <button disabled={pending} onClick={() => send("confirmed")} className={`${btn} bg-green-600 text-white hover:bg-green-700`}>
          ✓ Asiste
        </button>
        <button disabled={pending} onClick={() => send("declined")} className={`${btn} border border-red-300 bg-card text-red-700`}>
          ✗ No asiste
        </button>
      </div>
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={500}
        placeholder="Comentario opcional (ej. llega tarde)"
        className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
      />
      {pending && <p className="text-xs text-muted-foreground">Guardando…</p>}
      {error && <p className="text-xs text-red-600">No se pudo guardar. Intentá de nuevo.</p>}
    </div>
  );
}

function TransportRow({ token, player, needsTransport, disabled }: { token: string; player: GuestPlayer; needsTransport: boolean; disabled: boolean }) {
  const [transport, setLocalTransport] = useState(player.transport);
  // Server truth can change from outside this control too — e.g. re-answering a single
  // match clears a "no voy" set here. Adjust local state during render (not an effect)
  // when the prop moves, per React's guidance for syncing state from props.
  const [trackedProp, setTrackedProp] = useState(player.transport);
  if (player.transport !== trackedProp) {
    setTrackedProp(player.transport);
    setLocalTransport(player.transport);
  }
  const [pending, start] = useTransition();
  const missing = needsTransport && !transport;
  const pick = (t: "bus" | "own" | "no_go") =>
    start(async () => {
      const r = await setTransport(token, player.player_id, t);
      if (r.ok) setLocalTransport(t);
    });
  const opt = "flex-1 rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-50";
  return (
    <li className="py-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm">
          {player.jersey_number != null && <span className="mr-1 font-mono text-xs text-muted-foreground">#{player.jersey_number}</span>}
          {player.player_name}
          {missing && <span className="ml-1.5 text-xs text-amber-600">⚠️ falta elegir</span>}
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            disabled={disabled || pending}
            onClick={() => pick("bus")}
            className={`${opt} ${transport === "bus" ? "border-primary bg-primary/10 text-primary" : "border-border bg-card"}`}
          >
            🚌 Buseta
          </button>
          <button
            disabled={disabled || pending}
            onClick={() => pick("own")}
            className={`${opt} ${transport === "own" ? "border-primary bg-primary/10 text-primary" : "border-border bg-card"}`}
          >
            🚗 Medios propios
          </button>
          <button
            disabled={disabled || pending}
            onClick={() => pick("no_go")}
            className={`${opt} ${transport === "no_go" ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-950" : "border-border bg-card"}`}
          >
            🚫 No voy
          </button>
        </div>
      </div>
      {transport === "no_go" && (
        <p className="mt-1 text-xs text-red-600">Marcado como ausente en todos los partidos de esta jornada.</p>
      )}
    </li>
  );
}

export function CallupBoard({
  token,
  matches,
  players,
  isHome,
  allowedPlayerIds,
  isPast,
}: {
  token: string;
  matches: GuestMatch[];
  players: GuestPlayer[];
  isHome: boolean;
  allowedPlayerIds: Set<string>;
  isPast: boolean;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const ownMatches = useMemo(() => filterToAllowed(matches, allowedPlayerIds), [matches, allowedPlayerIds]);
  const ownPlayers = useMemo(() => players.filter((p) => allowedPlayerIds.has(p.player_id)), [players, allowedPlayerIds]);

  const goingPlayerIds = useMemo(() => {
    const ids = new Set<string>();
    for (const m of ownMatches) for (const c of m.callups) if (c.status === "confirmed") ids.add(c.player_id);
    return ids;
  }, [ownMatches]);

  const nq = norm(q.trim());
  const filteredMatches = useMemo(() => {
    const withSortedCallups = ownMatches.map((m) => ({ ...m, callups: [...m.callups].sort(byName) }));
    if (!nq) return withSortedCallups;
    return withSortedCallups
      .map((m) => ({ ...m, callups: m.callups.filter((c) => norm(c.player_name).includes(nq)) }))
      .filter((m) => m.callups.length > 0);
  }, [nq, ownMatches]);
  const filteredPlayers = useMemo(() => {
    const sorted = [...ownPlayers].sort(byName);
    if (!nq) return sorted;
    return sorted.filter((p) => norm(p.player_name).includes(nq));
  }, [nq, ownPlayers]);

  return (
    <div className="space-y-4">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="🔎 Nombre del atleta"
        className="w-full rounded-xl border border-border bg-card px-4 py-3 text-base shadow-sm outline-none focus:border-primary"
      />

      {!isHome && filteredPlayers.length > 0 && (
        <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h2 className="mb-1 font-semibold">🚌 ¿Cómo llega tu atleta?</h2>
          <p className="mb-2 text-xs text-muted-foreground">Una sola respuesta por atleta para toda la jornada, aunque tenga más de un partido.</p>
          <ul className="divide-y divide-border">
            {filteredPlayers.map((p) => (
              <TransportRow key={p.player_id} token={token} player={p} needsTransport={goingPlayerIds.has(p.player_id)} disabled={isPast} />
            ))}
          </ul>
        </section>
      )}

      {filteredMatches.length === 0 && (
        <p className="text-center text-sm text-muted-foreground">
          {ownMatches.length === 0 ? "Tu(s) atleta(s) no está(n) convocado(s) en esta jornada." : "No se encontró ningún atleta convocado con ese nombre."}
        </p>
      )}
      {filteredMatches.map((m) => (
        <section key={m.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="mb-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-800 dark:bg-orange-950 dark:text-orange-300">{m.team.category}</span>
              <span className="font-semibold">{m.team.name}</span>
              <span className="text-muted-foreground">vs {m.opponent}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {m.start_time ? `🕒 ${m.start_time.slice(0, 5)}` : "Hora por confirmar"}{m.court ? ` · ${m.court}` : ""}
            </div>
          </div>
          <ul className="divide-y divide-border">
            {m.callups.map((c) =>
              isPast ? (
                <li key={c.id} className="flex items-center justify-between gap-2 py-2">
                  <span className="text-sm">
                    {c.jersey_number != null && <span className="mr-1 font-mono text-xs text-muted-foreground">#{c.jersey_number}</span>}
                    {c.player_name}
                  </span>
                  <StatusPill status={c.status} />
                </li>
              ) : (
                <li key={c.id} className="py-2">
                  <button className="flex w-full items-center justify-between gap-2 text-left" onClick={() => setOpen(open === c.id ? null : c.id)}>
                    <span className="text-sm">
                      {c.jersey_number != null && <span className="mr-1 font-mono text-xs text-muted-foreground">#{c.jersey_number}</span>}
                      {c.player_name}
                    </span>
                    <span className="flex items-center gap-2">
                      {saved === c.id && <span className="text-xs text-green-600">¡Guardado!</span>}
                      <StatusPill status={c.status} />
                      <span className={`text-muted-foreground transition-transform ${open === c.id ? "rotate-180" : ""}`} aria-hidden>▾</span>
                    </span>
                  </button>
                  {c.status === "pending" && open !== c.id && (
                    <p className="mt-0.5 text-xs text-amber-600">👆 Tocá aquí para confirmar si asiste</p>
                  )}
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
              ),
            )}
          </ul>
        </section>
      ))}
    </div>
  );
}
