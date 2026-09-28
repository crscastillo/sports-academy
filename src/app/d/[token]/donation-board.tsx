"use client";

import { useState, useTransition } from "react";
import { pledgeDonation } from "./actions";

export type GuestItem = {
  id: string;
  name: string;
  kind: string;
  quantity_needed: number;
  unit: string | null;
  notes: string | null;
  pledged: number;
  pledges: { parent_name: string; player_name: string | null; quantity: number }[];
};

const KIND_LABEL: Record<string, string> = { snack_bar: "🥤 Soda", sale: "🛍️ Ventas", other: "📦 Otros" };
const STORAGE_KEY = "sports-academy:guest";

// The pledge form only mounts after a click, so reading browser storage here is safe.
function remembered(): { parentName?: string; playerName?: string; phone?: string } {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function PledgeForm({ token, item, onDone }: { token: string; item: GuestItem; onDone: () => void }) {
  const remaining = Math.max(1, item.quantity_needed - item.pledged);
  const [saved] = useState(remembered);
  const [parentName, setParentName] = useState(saved.parentName ?? "");
  const [playerName, setPlayerName] = useState(saved.playerName ?? "");
  const [phone, setPhone] = useState(saved.phone ?? "");
  const [quantity, setQuantity] = useState(Math.min(remaining, 1) || 1);
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState(false);

  const input = "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm";
  return (
    <form
      className="mt-3 grid gap-2 rounded-lg bg-canvas p-3 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await pledgeDonation(token, item.id, { parentName, playerName, phone, quantity, note });
          if (!r.ok) return setError(true);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ parentName, playerName, phone }));
          } catch {}
          onDone();
        });
      }}
    >
      <input required value={parentName} onChange={(e) => setParentName(e.target.value)} placeholder="Tu nombre *" className={input} />
      <input value={playerName} onChange={(e) => setPlayerName(e.target.value)} placeholder="Nombre del atleta" className={input} />
      <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" placeholder="Teléfono" className={input} />
      <label className="flex items-center gap-2 text-sm">
        Cantidad
        <input type="number" min={1} max={1000} required value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className={`${input} w-24`} />
        <span className="text-muted">{item.unit}</span>
      </label>
      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Comentario (opcional)" className={`${input} sm:col-span-2`} />
      {error && <p className="text-xs text-red-600 sm:col-span-2">No se pudo guardar. Intentá de nuevo.</p>}
      <button disabled={pending} className="rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50 sm:col-span-2">
        {pending ? "Guardando…" : "Me anoto"}
      </button>
    </form>
  );
}

export function DonationBoard({ token, items, isOpen }: { token: string; items: GuestItem[]; isOpen: boolean }) {
  const [open, setOpen] = useState<string | null>(null);
  const [thanks, setThanks] = useState<string | null>(null);
  const kinds = [...new Set(items.map((i) => i.kind))];

  if (items.length === 0) return <p className="text-center text-sm text-muted">La lista aún no tiene artículos.</p>;

  return (
    <div className="space-y-6">
      {kinds.map((k) => (
        <section key={k}>
          <h2 className="mb-2 font-semibold">{KIND_LABEL[k] ?? k}</h2>
          <div className="space-y-2">
            {items.filter((i) => i.kind === k).map((i) => {
              const full = i.pledged >= i.quantity_needed;
              const pct = Math.min(100, Math.round((i.pledged / i.quantity_needed) * 100));
              return (
                <div key={i.id} className={`rounded-xl border bg-surface p-4 shadow-sm ${full ? "border-green-300 dark:border-green-900" : "border-line"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium">{i.name}</div>
                      {i.notes && <div className="text-xs text-muted">{i.notes}</div>}
                    </div>
                    <div className="text-right text-sm">
                      <span className={full ? "font-semibold text-green-600" : "font-semibold"}>{i.pledged}</span>
                      <span className="text-muted"> / {i.quantity_needed} {i.unit ?? ""}</span>
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-canvas">
                    <div className={`h-full rounded-full ${full ? "bg-green-500" : "bg-brand"}`} style={{ width: `${pct}%` }} />
                  </div>
                  {i.pledges.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {i.pledges.map((p, idx) => (
                        <span key={idx} className="rounded-full bg-canvas px-2 py-0.5 text-xs">
                          {p.parent_name}{p.player_name ? ` (${p.player_name})` : ""} · {p.quantity}
                        </span>
                      ))}
                    </div>
                  )}
                  {thanks === i.id && <p className="mt-2 text-sm font-medium text-green-600">¡Gracias! Quedaste anotado 🙌</p>}
                  {isOpen && open !== i.id && (
                    <button onClick={() => setOpen(i.id)} className={`mt-3 w-full rounded-lg px-3 py-2 text-sm font-medium ${full ? "border border-line text-muted" : "bg-brand text-white hover:bg-brand-dark"}`}>
                      {full ? "Ya está cubierto · anotarme igual" : "Yo lo traigo"}
                    </button>
                  )}
                  {isOpen && open === i.id && (
                    <PledgeForm
                      token={token}
                      item={i}
                      onDone={() => {
                        setOpen(null);
                        setThanks(i.id);
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
