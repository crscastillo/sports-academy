import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge, Button, Card, Field, Input, PageHeader, Select, Stat } from "@/components/ui";
import { AutoSubmitForm, ConfirmSubmit, ShareLink, SubmitButton } from "@/components/client";
import { ResponsiveDialog } from "@/components/elements/responsive-dialog";
import { formatDate, formatTime, genderLabel } from "@/lib/labels";
import {
  addBusTrip, addMatch, createDonationListForMatchday, deleteBusTrip, deleteMatchday,
  regenerateShareToken, setPlayerTransport, updateMatchday,
} from "../actions";
import { MatchdayForm, type Matchday } from "../matchday-form";
import { MatchBlock, type MatchRow } from "./match-block";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Bus = {
  id: string; label: string; departure_place: string | null; departure_time: string | null; return_time: string | null;
  capacity: number | null; driver: string | null; driver_phone: string | null; cost: number | null; notes: string | null;
};

export default async function MatchdayPage({ params }: PageProps<"/matchdays/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: md }, { data: matches }, { data: teams }, { data: buses }, { data: lists }, { data: transport }] = await Promise.all([
    supabase.from("matchdays").select("*").eq("id", id).single(),
    supabase
      .from("matches")
      .select(`id, opponent, start_time, court, score_for, score_against, notes,
        team:teams(id, name, category, gender, team_players(player:players(id, first_name, last_name, jersey_number, active))),
        callups(id, status, guest_note, responded_at, attended, player:players(id, first_name, last_name, jersey_number, guardian_phone))`)
      .eq("matchday_id", id)
      .order("start_time", { nullsFirst: false }),
    supabase.from("teams").select("id, name, category, gender").order("category"),
    supabase.from("bus_trips").select("*").eq("matchday_id", id).order("departure_time"),
    supabase.from("donation_lists").select("id, title").eq("matchday_id", id),
    supabase.from("matchday_transport").select("player_id, transport").eq("matchday_id", id),
  ]);
  if (!md) notFound();
  const matchday = md as Matchday;
  const rows = (matches ?? []) as unknown as MatchRow[];
  const trips = (buses ?? []) as Bus[];
  const transportByPlayer = new Map((transport ?? []).map((t) => [t.player_id, t.transport as string | null]));

  // Unique players across all matches of the day — one attendance/transport reading per player.
  const all = rows.flatMap((m) => m.callups.map((c) => ({ ...c, match: m })));
  const confirmed = all.filter((c) => c.status === "confirmed");
  const confirmedPlayers = [...new Map(confirmed.map((c) => [c.player.id, c.player])).values()]
    .sort((a, b) => a.last_name.localeCompare(b.last_name));
  // Everyone called up (not just currently-confirmed), so a player who picked "no voy" —
  // which declines them everywhere — stays visible here to review or undo.
  const calledPlayers = [...new Map(all.map((c) => [c.player.id, c.player])).values()]
    .sort((a, b) => a.last_name.localeCompare(b.last_name));
  const busRiders = confirmedPlayers.filter((p) => transportByPlayer.get(p.id) === "bus");
  const ownCount = confirmedPlayers.filter((p) => transportByPlayer.get(p.id) === "own").length;
  const noGoCount = calledPlayers.filter((p) => transportByPlayer.get(p.id) === "no_go").length;
  const confirmedPlayerIds = new Set(confirmedPlayers.map((p) => p.id));
  const missingTransportCount = confirmedPlayers.filter((p) => !transportByPlayer.get(p.id)).length;
  const capacity = trips.reduce((s, t) => s + (t.capacity ?? 0), 0);
  const pending = all.filter((c) => c.status === "pending").length;
  const declined = all.filter((c) => c.status === "declined").length;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([matchday.venue, matchday.address].filter(Boolean).join(", "))}`;

  const partidosContent = (
    <div className="space-y-6">
      <div className="flex justify-end">
        <ResponsiveDialog trigger={<Button>+ Agregar partido</Button>} title="Agregar partido">
          <form action={addMatch.bind(null, id)} className="grid gap-3">
            <Field label="Equipo / categoría">
              <Select name="team_id" required defaultValue="">
                <option value="" disabled>Seleccionar…</option>
                {teams?.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.category} {genderLabel(t.gender)})</option>)}
              </Select>
            </Field>
            <Field label="Rival"><Input name="opponent" required placeholder="Club rival" /></Field>
            <Field label="Hora"><Input type="time" name="start_time" /></Field>
            <Field label="Cancha"><Input name="court" placeholder="Cancha 1" /></Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="call_all" defaultChecked className="accent-[var(--brand)]" />
              Convocar a todo el plantel del equipo
            </label>
            <SubmitButton>Agregar partido</SubmitButton>
          </form>
        </ResponsiveDialog>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aún no hay partidos en esta jornada.</p>
      ) : (
        rows.map((m) => <MatchBlock key={m.id} match={m} matchdayId={id} />)
      )}
    </div>
  );

  const transporteContent = (
    <Card title="Transporte (buseta)">
      {trips.length === 0 && <p className="mb-3 text-sm text-muted-foreground">Sin busetas planificadas.</p>}
      <div className="space-y-3">
        {trips.map((t) => (
          <div key={t.id} className="rounded-lg border border-border p-3 text-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="font-semibold">🚌 {t.label}</div>
              <form action={deleteBusTrip.bind(null, t.id, id)}><button className="text-xs text-red-600 hover:underline">Quitar</button></form>
            </div>
            <div className="text-muted-foreground">
              Sale {formatTime(t.departure_time)} {t.departure_place ? `de ${t.departure_place}` : ""}
              {t.return_time && <> · Regreso {formatTime(t.return_time)}</>}
            </div>
            <div className="text-muted-foreground">
              {t.capacity ? `${t.capacity} campos` : "Capacidad sin definir"}
              {t.driver && <> · {t.driver}</>}{t.driver_phone && <> ({t.driver_phone})</>}
              {t.cost != null && <> · ₡{Number(t.cost).toLocaleString("es-CR")}</>}
            </div>
            {t.notes && <div className="mt-1 text-xs">{t.notes}</div>}
          </div>
        ))}
      </div>
      <details className="mt-3">
        <summary className="cursor-pointer text-sm font-medium text-primary">+ Agregar buseta</summary>
        <form action={addBusTrip.bind(null, id)} className="mt-3 grid grid-cols-2 gap-2">
          <Field label="Nombre" className="col-span-2"><Input name="label" defaultValue={`Buseta ${trips.length + 1}`} /></Field>
          <Field label="Punto de salida" className="col-span-2"><Input name="departure_place" placeholder="Gimnasio de la academia" /></Field>
          <Field label="Salida"><Input type="time" name="departure_time" /></Field>
          <Field label="Regreso"><Input type="time" name="return_time" /></Field>
          <Field label="Capacidad"><Input type="number" min={1} name="capacity" /></Field>
          <Field label="Costo (₡)"><Input type="number" min={0} name="cost" /></Field>
          <Field label="Chofer"><Input name="driver" /></Field>
          <Field label="Teléfono"><Input name="driver_phone" type="tel" /></Field>
          <Field label="Notas" className="col-span-2"><Input name="notes" /></Field>
          <div className="col-span-2"><SubmitButton>Guardar buseta</SubmitButton></div>
        </form>
      </details>

      <div className="mt-4 border-t border-border pt-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="font-semibold">Transporte por atleta ({calledPlayers.length})</span>
          <div className="flex items-center gap-2">
            {missingTransportCount > 0 && <Badge tone="amber">⚠️ {missingTransportCount} sin transporte</Badge>}
            {capacity > 0 && (
              <Badge tone={busRiders.length > capacity ? "red" : "green"}>
                {busRiders.length > capacity ? `Faltan ${busRiders.length - capacity} campos` : `${capacity - busRiders.length} libres`}
              </Badge>
            )}
          </div>
        </div>
        {calledPlayers.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nadie ha sido convocado aún.</p>
        ) : (
          <ul className="space-y-1">
            {calledPlayers.map((p) => {
              const missing = confirmedPlayerIds.has(p.id) && !transportByPlayer.get(p.id);
              return (
                <li key={p.id} className="flex items-center justify-between gap-2 text-sm">
                  <span>
                    {p.first_name} {p.last_name}
                    {missing && <span className="ml-1.5 text-xs text-amber-600" title="Confirmó asistencia pero no eligió transporte">⚠️</span>}
                  </span>
                  <AutoSubmitForm action={setPlayerTransport.bind(null, p.id, id)}>
                    <select
                      name="transport"
                      defaultValue={transportByPlayer.get(p.id) ?? ""}
                      className={`rounded-md border px-1.5 py-1 text-xs ${missing ? "border-amber-400 bg-amber-50 dark:bg-amber-950" : "border-border bg-card"}`}
                    >
                      <option value="">Sin definir</option>
                      <option value="bus">🚌 Buseta</option>
                      <option value="own">🚗 Medios propios</option>
                      <option value="no_go">🚫 No voy (declina todos los partidos)</option>
                    </select>
                  </AutoSubmitForm>
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-2 text-xs text-muted-foreground">
          1 voto por atleta para toda la jornada · {ownCount} llegan por sus propios medios{noGoCount > 0 && <> · {noGoCount} no van</>}.
        </p>
      </div>
    </Card>
  );

  return (
    <>
      <PageHeader
        title={matchday.title ?? matchday.venue}
        subtitle={
          <>
            {formatDate(matchday.date, { weekday: "long" })} · {matchday.venue}
            {matchday.address && <> · {matchday.address}</>} ·{" "}
            <a href={mapsUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">Mapa</a>
          </>
        }
        action={<Link href="/matchdays" className="text-sm text-muted-foreground hover:underline">← Jornadas</Link>}
      />

      <div className={`mb-6 grid grid-cols-2 gap-3 ${matchday.is_home ? "sm:grid-cols-4" : "sm:grid-cols-5"}`}>
        <Stat label="Partidos" value={rows.length} />
        <Stat label="Confirmados" value={confirmed.length} tone="text-green-600" />
        <Stat label="Pendientes" value={pending} tone="text-amber-600" />
        <Stat label="No asisten" value={declined} tone="text-red-600" />
        {!matchday.is_home && (
          <Stat label="En buseta" value={`${busRiders.length}${capacity ? ` / ${capacity}` : ""}`} tone={capacity && busRiders.length > capacity ? "text-red-600" : ""} />
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {matchday.is_home ? (
            partidosContent
          ) : (
            <Tabs defaultValue="partidos">
              <TabsList>
                <TabsTrigger value="partidos">Partidos</TabsTrigger>
                <TabsTrigger value="transporte">Transporte</TabsTrigger>
              </TabsList>
              <TabsContent value="partidos" className="pt-4">{partidosContent}</TabsContent>
              <TabsContent value="transporte" className="pt-4">{transporteContent}</TabsContent>
            </Tabs>
          )}
        </div>

        <div className="space-y-6">
          <Card title="Editar jornada">
            <MatchdayForm action={updateMatchday.bind(null, id)} matchday={matchday} submitLabel="Guardar" />
          </Card>

          {matchday.is_home && (
            <Card title="Soda y ventas">
              {lists?.length ? (
                <ul className="space-y-1 text-sm">
                  {lists.map((l) => <li key={l.id}><Link href={`/donations/${l.id}`} className="text-primary hover:underline">{l.title}</Link></li>)}
                </ul>
              ) : (
                <form action={createDonationListForMatchday.bind(null, id)}>
                  <p className="mb-2 text-sm text-muted-foreground">Creá la lista de donaciones para que los padres se anoten.</p>
                  <SubmitButton variant="secondary">Crear lista de donaciones</SubmitButton>
                </form>
              )}
            </Card>
          )}

          <Card title="Link de convocatoria para padres">
            <p className="mb-3 text-sm text-muted-foreground">
              Compartí este enlace: los padres buscan a su atleta, confirman asistencia e indican si usan la buseta o llegan por sus medios. No requiere cuenta.
            </p>
            <ShareLink path={`/c/${matchday.share_token}`} label="Copiar link" />
            <form action={regenerateShareToken.bind(null, id)} className="mt-2">
              <button className="text-xs text-muted-foreground hover:underline">Generar nuevo link (invalida el anterior)</button>
            </form>
          </Card>
          <form action={deleteMatchday.bind(null, id)}>
            <ConfirmSubmit message="¿Eliminar la jornada con todos sus partidos y convocatorias?">Eliminar jornada</ConfirmSubmit>
          </form>
        </div>
      </div>
    </>
  );
}
