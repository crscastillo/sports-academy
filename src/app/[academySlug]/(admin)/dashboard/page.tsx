import Link from "next/link";
import { getRepositories } from "@/lib/repositories";
import { Badge, Card, Empty, LinkButton, PageHeader, Stat } from "@/components/ui";
import { buttonVariants } from "@/components/ui/button";
import { formatDate, formatTime, shiftDate, todayISO } from "@/lib/labels";
import { paths } from "@/lib/paths";

type Md = {
  id: string; title: string | null; date: string; venue: string; is_home: boolean;
  matches: { callups: { status: string; player_id: string }[] }[];
  matchday_transport: { player_id: string; transport: string | null }[];
};
type Tr = { id: string; date: string; start_time: string | null; location: string | null; training_teams: { team: { category: string } | null }[] };
type Result = {
  id: string; opponent: string; score_for: number | null; score_against: number | null;
  team: { name: string; category: string } | null;
  matchday: { id: string; date: string; title: string | null } | null;
};

export default async function Dashboard({ params }: PageProps<"/[academySlug]/dashboard">) {
  const { academySlug } = await params;
  const { players, teams, matchdays, trainings, academy } = await getRepositories();
  const today = todayISO();
  const weekAgo = shiftDate(today, -7);
  const [playerCount, teamCount, mds, trs, res, settings] = await Promise.all([
    players.countActive(),
    teams.count(),
    matchdays.listUpcomingForDashboard(today, 4),
    trainings.listUpcomingPlanned(today, 6),
    matchdays.listRecentScores(weekAgo, today),
    academy.getSettings(),
  ]);
  const matchdayRows = mds as unknown as Md[];
  const trainingRows = trs as unknown as Tr[];
  const results = res as unknown as Result[];

  return (
    <>
      <PageHeader
        title="Inicio"
        subtitle={formatDate(today, { weekday: "long" })}
        action={
          settings?.is_public && settings.slug ? (
            <a href={`/a/${settings.slug}`} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "outline", className: "h-9 px-3.5" })}>
              🌐 Página pública
            </a>
          ) : (
            <Link href={paths.staff.list(academySlug)} className="text-sm text-muted-foreground hover:underline">Activar página pública</Link>
          )
        }
      />
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Atletas activos" value={playerCount} />
        <Stat label="Equipos" value={teamCount} />
        <Stat label="Próximas jornadas" value={matchdayRows.length} />
        <Stat label="Entrenamientos planificados" value={trainingRows.length} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Próximas jornadas" action={<LinkButton href={paths.matchdays.new(academySlug)} variant="secondary">+ Jornada</LinkButton>}>
          {matchdayRows.length === 0 ? (
            <Empty>Sin jornadas próximas.</Empty>
          ) : (
            <ul className="divide-y divide-border">
              {matchdayRows.map((m) => {
                const c = m.matches.flatMap((x) => x.callups);
                const pend = c.filter((x) => x.status === "pending").length;
                const conf = c.filter((x) => x.status === "confirmed").length;
                const confirmedPlayerIds = new Set(c.filter((x) => x.status === "confirmed").map((x) => x.player_id));
                const transportByPlayer = new Map(m.matchday_transport.map((t) => [t.player_id, t.transport]));
                const bus = [...confirmedPlayerIds].filter((id) => transportByPlayer.get(id) === "bus").length;
                return (
                  <li key={m.id} className="py-2.5">
                    <Link href={paths.matchdays.detail(academySlug, m.id)} className="flex items-center justify-between gap-2 hover:underline">
                      <span>
                        <span className="text-sm font-semibold text-primary">{formatDate(m.date, { year: undefined })}</span>{" "}
                        <span className="text-sm">{m.title ?? m.venue}</span>
                      </span>
                      <span className="flex shrink-0 gap-1">
                        {m.is_home && <Badge tone="brand">Casa</Badge>}
                        <Badge tone="green">{conf} ✓</Badge>
                        {pend > 0 && <Badge tone="amber">{pend} ?</Badge>}
                        {bus > 0 && <Badge>🚌 {bus}</Badge>}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
        <Card title="Próximos entrenamientos" action={<LinkButton href={paths.trainings.list(academySlug)} variant="secondary">Planificador</LinkButton>}>
          {trainingRows.length === 0 ? (
            <Empty>Sin entrenamientos planificados.</Empty>
          ) : (
            <ul className="divide-y divide-border">
              {trainingRows.map((t) => (
                <li key={t.id} className="py-2.5">
                  <Link href={paths.trainings.detail(academySlug, t.id)} className="flex items-center justify-between gap-2 text-sm hover:underline">
                    <span>
                      <span className="font-semibold">{formatDate(t.date, { year: undefined })}</span> · {formatTime(t.start_time)}
                      {t.location && <span className="text-muted-foreground"> · {t.location}</span>}
                    </span>
                    <span className="flex gap-1">
                      {t.training_teams.map((tt, i) => tt.team && <Badge key={i}>{tt.team.category}</Badge>)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title="Resultados de la semana pasada" className="mt-6">
        {results.length === 0 ? (
          <Empty>Sin partidos con resultado registrado en los últimos 7 días.</Empty>
        ) : (
          <ul className="divide-y divide-border">
            {results.map((r) => {
              const win = r.score_for! > r.score_against!;
              const loss = r.score_for! < r.score_against!;
              return (
                <li key={r.id} className="py-2.5">
                  <Link href={r.matchday ? paths.matchdays.detail(academySlug, r.matchday.id) : "#"} className="flex flex-wrap items-center justify-between gap-2 text-sm hover:underline">
                    <span>
                      {r.matchday && <span className="font-semibold text-primary">{formatDate(r.matchday.date, { year: undefined })}</span>}{" "}
                      {r.team && <Badge tone="brand">{r.team.category}</Badge>}{" "}
                      {r.team?.name} <span className="text-muted-foreground">vs {r.opponent}</span>
                    </span>
                    <span className="flex items-center gap-1.5 font-semibold">
                      {r.score_for}–{r.score_against} {win ? "✅" : loss ? "❌" : "➖"}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
