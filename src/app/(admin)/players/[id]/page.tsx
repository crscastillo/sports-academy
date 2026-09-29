import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, PageHeader, Stat } from "@/components/ui";
import { ConfirmSubmit } from "@/components/client";
import { ageAchievedThisYear, ageOn, CALLUP_STATUS, categoryAgeCap, formatDate } from "@/lib/labels";
import { deletePlayer, updatePlayer } from "../actions";
import { PlayerForm, type Player } from "../player-form";

type CallupRow = {
  id: string; status: string; attended: boolean | null;
  match: { opponent: string; matchday: { id: string; date: string; venue: string } };
};

export default async function PlayerPage({ params }: PageProps<"/players/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: player }, { data: teams }, { data: links }, { data: callups }] = await Promise.all([
    supabase.from("players").select("*").eq("id", id).single(),
    supabase.from("teams").select("id, name, category, gender").order("category"),
    supabase.from("team_players").select("team_id").eq("player_id", id),
    supabase
      .from("callups")
      .select("id, status, attended, match:matches(opponent, matchday:matchdays(id, date, venue))")
      .eq("player_id", id),
  ]);
  if (!player) notFound();

  const rows = ((callups ?? []) as unknown as CallupRow[]).sort((a, b) => b.match.matchday.date.localeCompare(a.match.matchday.date));
  const attended = rows.filter((c) => c.attended === true).length;
  const marked = rows.filter((c) => c.attended !== null).length;
  const p = player as Player;
  const ratio = p.height_cm && p.wingspan_cm ? (p.wingspan_cm - p.height_cm).toFixed(1) : null;

  // A player is eligible for a category if its cap is at least the age they achieve this
  // calendar year: turning 13 this year means U13+; having turned 13 last year means U14+.
  const age = ageAchievedThisYear(p.birth_date);
  const selectedTeamIds = (links ?? []).map((l) => l.team_id);
  const eligibleTeams = (teams ?? []).filter((t) => {
    if (selectedTeamIds.includes(t.id)) return true;
    const cap = categoryAgeCap(t.category);
    const ageOk = cap == null || age == null || cap >= age;
    const genderOk = !p.gender || t.gender === "mixed" || t.gender === p.gender;
    return ageOk && genderOk;
  });

  return (
    <>
      <PageHeader
        title={`${p.first_name} ${p.last_name}`}
        subtitle={<>{p.jersey_number != null && <>#{p.jersey_number} · </>}{ageOn(p.birth_date) ?? "?"} años</>}
        action={<Link href="/players" className="text-sm text-muted-foreground hover:underline">← Atletas</Link>}
      />
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Estatura" value={p.height_cm ? `${p.height_cm} cm` : "—"} />
        <Stat label="Peso" value={p.weight_kg ? `${p.weight_kg} kg` : "—"} />
        <Stat label="Envergadura" value={p.wingspan_cm ? `${p.wingspan_cm} cm` : "—"} />
        <Stat label="Asistencia a partidos" value={marked ? `${attended}/${marked}` : "—"} />
      </div>
      {ratio && <p className="-mt-3 mb-6 text-xs text-muted-foreground">Diferencia envergadura − estatura: {ratio} cm</p>}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Datos del atleta" className="lg:col-span-2">
          <PlayerForm
            action={updatePlayer.bind(null, id)}
            player={p}
            teams={eligibleTeams}
            selectedTeamIds={selectedTeamIds}
            submitLabel="Guardar cambios"
          />
        </Card>
        <div className="space-y-6">
          <Card title="Convocatorias">
            {rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin convocatorias.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {rows.slice(0, 15).map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-2">
                    <Link href={`/matchdays/${c.match.matchday.id}`} className="hover:underline">
                      {formatDate(c.match.matchday.date, { weekday: undefined })} · vs {c.match.opponent}
                    </Link>
                    <span className="flex gap-1">
                      <Badge tone={c.status === "confirmed" ? "green" : c.status === "declined" ? "red" : "amber"}>{CALLUP_STATUS[c.status]}</Badge>
                      {c.attended === true && <Badge tone="blue">Asistió</Badge>}
                      {c.attended === false && <Badge tone="red">Ausente</Badge>}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <form action={deletePlayer.bind(null, id)}>
            <ConfirmSubmit message="¿Eliminar este atleta y su historial?">Eliminar atleta</ConfirmSubmit>
          </form>
        </div>
      </div>
    </>
  );
}
