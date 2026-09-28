import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, Empty, PageHeader } from "@/components/ui";
import { genderLabel } from "@/lib/labels";
import { createTeam } from "./actions";
import { TeamForm } from "./team-form";

export const metadata = { title: "Equipos" };

export default async function TeamsPage() {
  const supabase = await createClient();
  const { data: teams } = await supabase
    .from("teams")
    .select("id, name, category, gender, season, coach, team_players(count)")
    .order("category")
    .order("name");

  return (
    <>
      <PageHeader title="Equipos" subtitle="Categorías por edad y género" />
      <Card title="Nuevo equipo" className="mb-6">
        <TeamForm action={createTeam} submitLabel="Crear equipo" />
      </Card>
      {!teams?.length ? (
        <Empty>Aún no hay equipos.</Empty>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((t) => (
            <Link key={t.id} href={`/teams/${t.id}`} className="rounded-xl border border-line bg-surface p-4 shadow-sm transition hover:border-brand">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-sm text-muted">{t.coach ?? "Sin entrenador asignado"}</div>
                </div>
                <Badge tone="brand">{t.category}</Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <Badge>{genderLabel(t.gender)}</Badge>
                {t.season && <Badge>{t.season}</Badge>}
                <Badge tone="blue">{(t.team_players as unknown as { count: number }[])[0]?.count ?? 0} atletas</Badge>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
