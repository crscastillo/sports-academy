"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { clearGuardian, setGuardian } from "./actions";
import type { GuestPlayer } from "./callup-board";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function GuardianGate({ token, players }: { token: string; players: GuestPlayer[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, start] = useTransition();
  const [error, setError] = useState(false);

  const sorted = useMemo(() => [...players].sort((a, b) => a.player_name.localeCompare(b.player_name)), [players]);
  const nq = norm(q.trim());
  const filtered = nq ? sorted.filter((p) => norm(p.player_name).includes(nq)) : sorted;

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const submit = () => {
    setError(false);
    if (!name.trim() || selected.size === 0) {
      setError(true);
      return;
    }
    start(async () => {
      const r = await setGuardian(token, name, [...selected]);
      if (r.ok) router.refresh();
      else setError(true);
    });
  };

  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <h2 className="mb-1 font-semibold">👋 ¿Quién sos?</h2>
      <p className="mb-3 text-sm text-muted-foreground">
        Ingresá tu nombre y elegí a tu(s) hijo(a) para poder confirmar asistencia y transporte. Lo vamos a recordar en este navegador.
      </p>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Tu nombre"
        className="mb-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
      />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="🔎 Buscar atleta"
        className="mb-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
      />
      <ul className="mb-3 max-h-64 divide-y divide-border overflow-y-auto rounded-lg border border-border">
        {filtered.length === 0 && <li className="p-2 text-sm text-muted-foreground">Sin resultados.</li>}
        {filtered.map((p) => (
          <li key={p.player_id}>
            <label className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm">
              <input type="checkbox" checked={selected.has(p.player_id)} onChange={() => toggle(p.player_id)} />
              {p.jersey_number != null && <span className="font-mono text-xs text-muted-foreground">#{p.jersey_number}</span>}
              {p.player_name}
            </label>
          </li>
        ))}
      </ul>
      {error && <p className="mb-2 text-xs text-red-600">Ingresá tu nombre y elegí al menos un atleta.</p>}
      <button
        disabled={pending}
        onClick={submit}
        className="w-full rounded-lg bg-primary px-3 py-2.5 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Guardando…" : "Continuar"}
      </button>
    </section>
  );
}

export function GuardianBadge({ token, name }: { token: string; name: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const reset = () => start(async () => { await clearGuardian(token); router.refresh(); });
  return (
    <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
      <span>👋 Hola, {name}</span>
      <button disabled={pending} onClick={reset} className="underline disabled:opacity-50">
        No soy yo / cambiar
      </button>
    </div>
  );
}
