import Link from "next/link";
import { getRepositories } from "@/lib/repositories";
import { Badge, LinkButton, PageHeader } from "@/components/ui";
import { formatDate, formatTime, todayISO, trainingStatusLabel } from "@/lib/labels";

export const metadata = { title: "Entrenamientos" };

type Row = {
  id: string; date: string; start_time: string | null; end_time: string | null; location: string | null;
  status: string; plan: string | null; notes: string | null;
  training_teams: { team: { id: string; name: string; category: string } }[];
};

function mondayOf(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const dow = (dt.getUTCDay() + 6) % 7;
  dt.setUTCDate(dt.getUTCDate() - dow);
  return dt.toISOString().slice(0, 10);
}
function shift(iso: string, days: number) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

const DAY_NAMES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export default async function TrainingsPage({ searchParams }: PageProps<"/trainings">) {
  const sp = await searchParams;
  const today = todayISO();
  const weekParam = typeof sp.week === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.week) ? sp.week : today;
  const start = mondayOf(weekParam);
  const end = shift(start, 6);

  const { trainings } = await getRepositories();
  const [week, recent] = await Promise.all([
    trainings.listInRange(start, end),
    trainings.listRecentCompleted(10),
  ]);
  const rows = week as unknown as Row[];
  const done = recent as unknown as Row[];

  return (
    <>
      <PageHeader title="Entrenamientos" subtitle="Planificador semanal y registro" action={<LinkButton href={`/trainings/new?date=${start < today && today <= end ? today : start}`}>+ Nuevo entrenamiento</LinkButton>} />

      <div className="mb-3 flex items-center justify-between gap-2">
        <Link href={`/trainings?week=${shift(start, -7)}`} className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-card">← Semana anterior</Link>
        <div className="text-center text-sm font-medium">
          {formatDate(start, { weekday: undefined, year: undefined })} – {formatDate(end, { weekday: undefined })}
          <Link href="/trainings" className="ml-2 text-xs text-primary hover:underline">Hoy</Link>
        </div>
        <Link href={`/trainings?week=${shift(start, 7)}`} className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-card">Semana siguiente →</Link>
      </div>

      <div className="grid gap-2 md:grid-cols-7">
        {DAY_NAMES.map((name, i) => {
          const day = shift(start, i);
          const items = rows.filter((r) => r.date === day);
          return (
            <div key={day} className={`min-h-28 rounded-xl border bg-card p-2 ${day === today ? "border-primary" : "border-border"}`}>
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="font-semibold">{name} {Number(day.slice(8))}</span>
                <Link href={`/trainings/new?date=${day}`} className="rounded px-1 text-muted-foreground hover:bg-background" aria-label="Agregar">+</Link>
              </div>
              <div className="space-y-1.5">
                {items.map((t) => (
                  <Link key={t.id} href={`/trainings/${t.id}`} className={`block rounded-lg border p-2 text-xs hover:border-primary ${t.status === "cancelled" ? "border-border opacity-50 line-through" : t.status === "completed" ? "border-green-300 bg-green-50 dark:border-green-900 dark:bg-green-950" : "border-border bg-background"}`}>
                    <div className="font-semibold">{formatTime(t.start_time)}{t.end_time ? `–${formatTime(t.end_time)}` : ""}</div>
                    <div className="truncate">{t.training_teams.map((tt) => tt.team?.category).filter(Boolean).join(", ") || "Sin categoría"}</div>
                    {t.location && <div className="truncate text-muted-foreground">{t.location}</div>}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <h2 className="mb-3 mt-8 font-semibold">Últimos entrenamientos realizados</h2>
      {done.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aún no hay entrenamientos marcados como realizados.</p>
      ) : (
        <div className="space-y-2">
          {done.map((t) => (
            <Link key={t.id} href={`/trainings/${t.id}`} className="block rounded-xl border border-border bg-card p-3 hover:border-primary">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium">{formatDate(t.date)}</span>
                <span className="text-muted-foreground">{formatTime(t.start_time)}</span>
                {t.training_teams.map((tt) => tt.team && <Badge key={tt.team.id} tone="brand">{tt.team.name}</Badge>)}
                <span className="ml-auto"><Badge tone="green">{trainingStatusLabel(t.status)}</Badge></span>
              </div>
              {t.notes && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{t.notes}</p>}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
