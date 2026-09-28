import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, Empty, PageHeader } from "@/components/ui";
import { ConfirmSubmit, SubmitButton } from "@/components/client";
import { ageOn, genderLabel } from "@/lib/labels";
import { addPlayersToTeam, deleteTeam, removePlayerFromTeam, updateTeam } from "../actions";
import { TeamForm, type Team } from "../team-form";

type P = { id: string; first_name: string; last_name: string; jersey_number: number | null; birth_date: string | null; positions: string[]; gender: string | null };

export default async function TeamPage({ params }: PageProps<"/teams/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: team }, { data: roster }, { data: allPlayers }, { data: coaches }] = await Promise.all([
    supabase.from("teams").select("*").eq("id", id).single(),
    supabase
      .from("team_players")
      .select("player:players(id, first_name, last_name, jersey_number, birth_date, positions, gender)")
      .eq("team_id", id),
    supabase
      .from("players")
      .select("id, first_name, last_name, jersey_number, birth_date, positions, gender")
      .eq("active", true)
      .order("last_name"),
    supabase.from("coaches").select("id, full_name").order("full_name"),
  ]);
  if (!team) notFound();

  const members = ((roster ?? []).map((r) => r.player) as unknown as P[]).sort((a, b) =>
    (a.jersey_number ?? 999) - (b.jersey_number ?? 999) || a.last_name.localeCompare(b.last_name),
  );
  const memberIds = new Set(members.map((m) => m.id));
  const available = ((allPlayers ?? []) as P[]).filter((p) => !memberIds.has(p.id));

  return (
    <>
      <PageHeader
        title={team.name}
        subtitle={<>{team.category} · {genderLabel(team.gender)} {team.season ? `· ${team.season}` : ""}</>}
        action={<Link href="/teams" className="text-sm text-muted hover:underline">← Equipos</Link>}
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title={`Plantel (${members.length})`}>
            {members.length === 0 ? (
              <Empty>Sin atletas asignados.</Empty>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase text-muted">
                    <tr><th className="py-2 pr-2">#</th><th className="pr-2">Nombre</th><th className="pr-2">Edad</th><th className="pr-2">Posiciones</th><th /></tr>
                  </thead>
                  <tbody>
                    {members.map((p) => (
                      <tr key={p.id} className="border-t border-line">
                        <td className="py-2 pr-2 font-mono">{p.jersey_number ?? "—"}</td>
                        <td className="pr-2"><Link className="hover:underline" href={`/players/${p.id}`}>{p.first_name} {p.last_name}</Link></td>
                        <td className="pr-2">{ageOn(p.birth_date) ?? "—"}</td>
                        <td className="pr-2">{p.positions?.join(", ") || "—"}</td>
                        <td className="text-right">
                          <form action={removePlayerFromTeam.bind(null, id, p.id)}>
                            <button className="text-xs text-red-600 hover:underline">Quitar</button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card title="Agregar atletas al equipo">
            {available.length === 0 ? (
              <Empty>No hay más atletas activos. <Link href="/players/new" className="text-brand underline">Registrar atleta</Link></Empty>
            ) : (
              <form action={addPlayersToTeam.bind(null, id)} className="space-y-3">
                <div className="grid max-h-80 gap-1 overflow-y-auto rounded-lg border border-line p-2 sm:grid-cols-2">
                  {available.map((p) => (
                    <label key={p.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-canvas">
                      <input type="checkbox" name="player_id" value={p.id} className="accent-[var(--brand)]" />
                      <span className="flex-1">{p.first_name} {p.last_name}</span>
                      <span className="text-xs text-muted">{ageOn(p.birth_date) ?? "?"} años</span>
                      {p.gender && <Badge>{genderLabel(p.gender).charAt(0)}</Badge>}
                    </label>
                  ))}
                </div>
                <SubmitButton>Agregar seleccionados</SubmitButton>
              </form>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Editar equipo">
            <TeamForm action={updateTeam.bind(null, id)} team={team as Team} coaches={coaches ?? []} submitLabel="Guardar" compact />
          </Card>
          <form action={deleteTeam.bind(null, id)}>
            <ConfirmSubmit message="¿Eliminar este equipo?">Eliminar equipo</ConfirmSubmit>
          </form>
        </div>
      </div>
    </>
  );
}
