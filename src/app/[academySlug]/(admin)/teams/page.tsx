import Link from "next/link";
import { getRepositories } from "@/lib/repositories";
import { Badge, Button, Empty, PageHeader } from "@/components/ui";
import { FilterPills } from "@/components/elements/filter-pills";
import { ResponsiveDialog } from "@/components/elements/responsive-dialog";
import { GENDERS, genderLabel } from "@/lib/labels";
import { paths } from "@/lib/paths";
import { createTeam } from "./actions";
import { TeamForm } from "./team-form";

export const metadata = { title: "Equipos" };

export default async function TeamsPage({ params, searchParams }: PageProps<"/[academySlug]/teams">) {
  const { academySlug } = await params;
  const sp = await searchParams;
  const gender = typeof sp.gender === "string" ? sp.gender : "";

  const { teams, coaches } = await getRepositories();
  const [teamRows, coachOptions] = await Promise.all([teams.listWithCoachAndCount(gender), coaches.listForAssignment()]);

  return (
    <>
      <PageHeader
        title="Equipos"
        subtitle="Categorías por edad y género"
        action={
          <ResponsiveDialog trigger={<Button>+ Nuevo equipo</Button>} title="Nuevo equipo">
            <TeamForm action={createTeam} coaches={coachOptions} submitLabel="Crear equipo" compact />
          </ResponsiveDialog>
        }
      />
      <div className="mb-4">
        <FilterPills options={[{ value: "", label: "Todos" }, ...GENDERS]} value={gender} basePath={paths.teams.list(academySlug)} param="gender" />
      </div>
      {!teamRows.length ? (
        <Empty>Aún no hay equipos.</Empty>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {teamRows.map((t) => (
            <Link key={t.id} href={paths.teams.detail(academySlug, t.id)} className="rounded-xl border border-border bg-card p-4 shadow-sm transition hover:border-primary">
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
