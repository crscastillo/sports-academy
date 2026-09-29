import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatTime } from "@/lib/labels";
import { CallupBoard, type GuestMatch, type GuestPlayer } from "./callup-board";

export const metadata = { title: "Convocatoria", robots: { index: false } };

type Data = {
  matchday: { title: string | null; date: string; venue: string; address: string | null; is_home: boolean; notes: string | null };
  bus_trips: { label: string; departure_place: string | null; departure_time: string | null; return_time: string | null }[];
  players: GuestPlayer[];
  matches: GuestMatch[];
};

export default async function GuestCallupPage({ params }: PageProps<"/c/[token]">) {
  const { token } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(token)) notFound();
  const supabase = await createClient();
  const { data } = await supabase.rpc("guest_get_callups", { p_token: token });
  if (!data) notFound();
  const d = data as Data;
  const md = d.matchday;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([md.venue, md.address].filter(Boolean).join(", "))}`;

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <header className="mb-5 rounded-2xl bg-primary p-5 text-white shadow">
        <div className="text-sm opacity-90">🏀 Convocatoria</div>
        <h1 className="text-2xl font-bold">{md.title ?? md.venue}</h1>
        <div className="mt-1 text-sm">{formatDate(md.date, { weekday: "long" })}</div>
        <div className="text-sm">
          📍 {md.venue}{md.address ? ` · ${md.address}` : ""} ·{" "}
          <a href={mapsUrl} target="_blank" rel="noreferrer" className="underline">Ver mapa</a>
        </div>
        {md.notes && <p className="mt-2 rounded-lg bg-white/15 p-2 text-sm">{md.notes}</p>}
      </header>

      {d.bus_trips.length > 0 && (
        <section className="mb-5 rounded-xl border border-border bg-card p-4">
          <h2 className="mb-2 font-semibold">🚌 Buseta</h2>
          <ul className="space-y-1 text-sm">
            {d.bus_trips.map((b, i) => (
              <li key={i}>
                <strong>{b.label}</strong>: sale {formatTime(b.departure_time)}
                {b.departure_place ? ` de ${b.departure_place}` : ""}
                {b.return_time ? ` · regreso ${formatTime(b.return_time)}` : ""}
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mb-3 text-sm text-muted-foreground">Buscá a tu atleta, confirmá si asiste a cada partido e indicá cómo llega (una vez por jornada).</p>
      <CallupBoard token={token} matches={d.matches} players={d.players} />
    </main>
  );
}
