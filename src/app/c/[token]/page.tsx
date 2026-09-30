import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { getRepositories } from "@/lib/repositories";
import { formatDate, formatTime, todayISO } from "@/lib/labels";
import { CallupBoard, type GuestMatch, type GuestPlayer } from "./callup-board";
import { GuardianBadge, GuardianGate } from "./guardian-gate";

export const metadata = { title: "Convocatoria", robots: { index: false } };

const GUARDIAN_COOKIE = "sa_guardian";

type Data = {
  matchday: { title: string | null; date: string; venue: string; address: string | null; is_home: boolean; notes: string | null };
  donation_list: { title: string; share_token: string } | null;
  bus_trips: { label: string; departure_place: string | null; departure_time: string | null; return_time: string | null }[];
  players: GuestPlayer[];
  matches: GuestMatch[];
};

function readGuardian(raw: string | undefined, rosterIds: Set<string>) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { name?: unknown; playerIds?: unknown };
    if (typeof parsed.name !== "string" || !Array.isArray(parsed.playerIds)) return null;
    const playerIds = parsed.playerIds.filter((id): id is string => typeof id === "string" && rosterIds.has(id));
    if (!parsed.name.trim() || playerIds.length === 0) return null;
    return { name: parsed.name, playerIds };
  } catch {
    return null;
  }
}

export default async function GuestCallupPage({ params }: PageProps<"/c/[token]">) {
  const { token } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(token)) notFound();
  const { matchdays } = await getRepositories();
  const data = await matchdays.guestGetCallups(token);
  if (!data) notFound();
  const d = data as Data;
  const md = d.matchday;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([md.venue, md.address].filter(Boolean).join(", "))}`;

  const rosterIds = new Set(d.players.map((p) => p.player_id));
  const guardian = readGuardian((await cookies()).get(GUARDIAN_COOKIE)?.value, rosterIds);
  const isPast = md.date < todayISO();

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

      {md.is_home && (
        <section className="mb-5 rounded-xl border border-border bg-card p-4">
          <h2 className="mb-2 font-semibold">🥤 Soda y ventas</h2>
          {d.donation_list ? (
            <a href={`/d/${d.donation_list.share_token}`} className="text-sm text-primary underline">
              Ver lista de donaciones: {d.donation_list.title}
            </a>
          ) : (
            <p className="text-sm text-muted-foreground">Todavía no hay una lista de donaciones creada para esta jornada.</p>
          )}
        </section>
      )}

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

      {guardian ? (
        <>
          <GuardianBadge token={token} name={guardian.name} />
          {isPast ? (
            <p className="mb-3 rounded-lg border border-border bg-card p-3 text-sm text-muted-foreground">Esta jornada ya pasó, así que no se pueden hacer cambios.</p>
          ) : (
            <p className="mb-3 text-sm text-muted-foreground">Confirmá si tu atleta asiste a cada partido e indicá cómo llega (una vez por jornada).</p>
          )}
          <CallupBoard token={token} matches={d.matches} players={d.players} isHome={md.is_home} allowedPlayerIds={new Set(guardian.playerIds)} isPast={isPast} />
        </>
      ) : (
        <GuardianGate token={token} players={d.players} />
      )}
    </main>
  );
}
