import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatTime, genderLabel } from "@/lib/labels";

type Match = {
  opponent: string; start_time: string | null; court: string | null;
  score_for?: number | null; score_against?: number | null;
  team: { name: string; category: string; gender: string };
};
type Jornada = {
  id: string; title: string | null; date: string; venue: string; address: string | null; is_home: boolean; matches: Match[];
};
type Data = { academy: { name: string }; upcoming: Jornada[]; past: Jornada[] };

export async function generateMetadata({ params }: PageProps<"/a/[slug]">) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase.rpc("guest_get_academy_schedule", { p_slug: slug });
  const d = data as Data | null;
  if (!d) return {};
  return { title: d.academy.name, description: `Jornadas y resultados de ${d.academy.name}.` };
}

function ResultBadge({ m }: { m: Match }) {
  if (m.score_for == null || m.score_against == null) return null;
  const win = m.score_for > m.score_against;
  const tie = m.score_for === m.score_against;
  return (
    <span className={`font-semibold ${tie ? "text-muted-foreground" : win ? "text-green-600" : "text-red-600"}`}>
      {m.score_for}–{m.score_against} {tie ? "➖" : win ? "✅" : "❌"}
    </span>
  );
}

function JornadaCard({ j }: { j: Jornada }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-primary">{formatDate(j.date)}</div>
          <div className="font-semibold">{j.title ?? j.venue}</div>
          <div className="text-sm text-muted-foreground">{j.venue}{j.address ? ` · ${j.address}` : ""}</div>
        </div>
        <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${j.is_home ? "border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-300" : "border-border bg-background text-muted-foreground"}`}>
          {j.is_home ? "En casa" : "Visita"}
        </span>
      </div>
      {j.matches.length > 0 && (
        <ul className="mt-3 space-y-1.5 border-t border-border pt-3 text-sm">
          {j.matches.map((m, i) => (
            <li key={i} className="flex flex-wrap items-center justify-between gap-2">
              <span>
                <span className="rounded-full bg-orange-100 px-1.5 py-0.5 text-xs font-semibold text-orange-800 dark:bg-orange-950 dark:text-orange-300">{m.team.category}</span>{" "}
                {m.team.name} <span className="text-muted-foreground">vs {m.opponent}</span>
                <span className="ml-1 text-xs text-muted-foreground">({genderLabel(m.team.gender)})</span>
              </span>
              <span className="text-xs text-muted-foreground">
                <ResultBadge m={m} />
                {m.score_for == null && (m.start_time ? formatTime(m.start_time) : "Hora por confirmar")}
                {m.court && <> · {m.court}</>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default async function AcademyPublicPage({ params }: PageProps<"/a/[slug]">) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase.rpc("guest_get_academy_schedule", { p_slug: slug });
  if (!data) notFound();
  const d = data as Data;

  return (
    <main className="min-h-screen bg-background">
      <header className="bg-primary p-6 text-white shadow">
        <div className="mx-auto max-w-2xl">
          <div className="text-sm opacity-90">🏀 Academia</div>
          <h1 className="text-2xl font-bold">{d.academy.name}</h1>
        </div>
      </header>

      <div className="mx-auto max-w-2xl space-y-8 px-4 py-6">
        <section>
          <h2 className="mb-3 text-lg font-bold">Próximas jornadas</h2>
          {d.upcoming.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Sin jornadas programadas.</p>
          ) : (
            <div className="space-y-3">{d.upcoming.map((j) => <JornadaCard key={j.id} j={j} />)}</div>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-lg font-bold">Resultados anteriores</h2>
          {d.past.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Aún no hay jornadas anteriores.</p>
          ) : (
            <div className="space-y-3">{d.past.map((j) => <JornadaCard key={j.id} j={j} />)}</div>
          )}
        </section>
      </div>
    </main>
  );
}
