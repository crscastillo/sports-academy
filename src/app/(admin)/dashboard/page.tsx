import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, Empty, LinkButton, PageHeader, Stat } from "@/components/ui";
import { formatDate, formatTime, shiftDate, todayISO } from "@/lib/labels";

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

export default async function Dashboard() {
  const supabase = await createClient();
  const today = todayISO();
  const weekAgo = shiftDate(today, -7);
  const [{ count: players }, { count: teams }, { data: mds }, { data: trs }, { data: res }] = await Promise.all([
    supabase.from("players").select("id", { count: "exact", head: true }).eq("active", true),
    supabase.from("teams").select("id", { count: "exact", head: true }),
    supabase
      .from("matchdays")
      .select("id, title, date, venue, is_home, matches(callups(status, player_id)), matchday_transport(player_id, transport)")
      .gte("date", today).order("date").limit(4),
    supabase
      .from("trainings")
      .select("id, date, start_time, location, training_teams(team:teams(category))")
      .gte("date", today).eq("status", "planned").order("date").order("start_time").limit(6),
    supabase
      .from("matches")
      .select("id, opponent, score_for, score_against, team:teams(name, category), matchday:matchdays!inner(id, date, title)")
      .not("score_for", "is", null)
      .gte("matchday.date", weekAgo).lt("matchday.date", today)
      .order("date", { foreignTable: "matchday", ascending: false }),
  ]);
  const matchdays = (mds ?? []) as unknown as Md[];
  const trainings = (trs ?? []) as unknown as Tr[];
  const results = (res ?? []) as unknown as Result[];

  return (
    <>
      <PageHeader title="Inicio" subtitle={formatDate(today, { weekday: "long" })} />
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Atletas activos" value={players ?? 0} />
        <Stat label="Equipos" value={teams ?? 0} />
        <Stat label="Próximas jornadas" value={matchdays.length} />
        <Stat label="Entrenamientos planificados" value={trainings.length} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Próximas jornadas" action={<LinkButton href="/matchdays/new" variant="secondary">+ Jornada</LinkButton>}>
          {matchdays.length === 0 ? (
            <Empty>Sin jornadas próximas.</Empty>
          ) : (
            <ul className="divide-y divide-border">
              {matchdays.map((m) => {
                const c = m.matches.flatMap((x) => x.callups);
                const pend = c.filter((x) => x.status === "pending").length;
                const conf = c.filter((x) => x.status === "confirmed").length;
                const confirmedPlayerIds = new Set(c.filter((x) => x.status === "confirmed").map((x) => x.player_id));
                const transportByPlayer = new Map(m.matchday_transport.map((t) => [t.player_id, t.transport]));
                const bus = [...confirmedPlayerIds].filter((id) => transportByPlayer.get(id) === "bus").length;
                return (
                  <li key={m.id} className="py-2.5">
                    <Link href={`/matchdays/${m.id}`} className="flex items-center justify-between gap-2 hover:underline">
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
        <Card title="Próximos entrenamientos" action={<LinkButton href="/trainings" variant="secondary">Planificador</LinkButton>}>
          {trainings.length === 0 ? (
            <Empty>Sin entrenamientos planificados.</Empty>
          ) : (
            <ul className="divide-y divide-border">
              {trainings.map((t) => (
                <li key={t.id} className="py-2.5">
                  <Link href={`/trainings/${t.id}`} className="flex items-center justify-between gap-2 text-sm hover:underline">
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
                  <Link href={r.matchday ? `/matchdays/${r.matchday.id}` : "#"} className="flex flex-wrap items-center justify-between gap-2 text-sm hover:underline">
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
