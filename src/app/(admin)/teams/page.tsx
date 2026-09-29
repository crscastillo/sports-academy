import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge, Button, Empty, PageHeader } from "@/components/ui";
import { ResponsiveDialog } from "@/components/elements/responsive-dialog";
import { GENDERS, genderLabel } from "@/lib/labels";
import { createTeam } from "./actions";
import { TeamForm } from "./team-form";

export const metadata = { title: "Equipos" };

export default async function TeamsPage({ searchParams }: PageProps<"/teams">) {
  const sp = await searchParams;
  const gender = typeof sp.gender === "string" ? sp.gender : "";

  const supabase = await createClient();
  let query = supabase
    .from("teams")
    .select("id, name, category, gender, season, coach:coaches(full_name), team_players(count)")
    .order("category")
    .order("name");
  if (gender) query = query.eq("gender", gender);
  const [{ data: teams }, { data: coaches }] = await Promise.all([
    query,
    supabase.from("coaches").select("id, full_name, is_default").order("full_name"),
  ]);

  return (
    <>
      <PageHeader
        title="Equipos"
        subtitle="Categorías por edad y género"
        action={
          <ResponsiveDialog trigger={<Button>+ Nuevo equipo</Button>} title="Nuevo equipo">
            <TeamForm action={createTeam} coaches={coaches ?? []} submitLabel="Crear equipo" compact />
          </ResponsiveDialog>
        }
      />
      <div className="mb-4 flex flex-wrap gap-1">
        {[{ value: "", label: "Todos" }, ...GENDERS].map((g) => (
          <Link
            key={g.value}
            href={g.value ? `/teams?gender=${g.value}` : "/teams"}
            className={`rounded-lg px-3 py-1.5 text-sm ${gender === g.value ? "bg-primary/10 font-semibold text-primary" : "text-muted-foreground hover:bg-background"}`}
          >
            {g.label}
          </Link>
        ))}
      </div>
      {!teams?.length ? (
        <Empty>Aún no hay equipos.</Empty>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((t) => (
            <Link key={t.id} href={`/teams/${t.id}`} className="rounded-xl border border-border bg-card p-4 shadow-sm transition hover:border-primary">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {(t.coach as unknown as { full_name: string } | null)?.full_name ?? "Sin entrenador asignado"}
                  </div>
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
