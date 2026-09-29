import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge, Empty, LinkButton, PageHeader } from "@/components/ui";
import { formatDate, todayISO } from "@/lib/labels";

export const metadata = { title: "Jornadas" };

type Row = {
  id: string; title: string | null; date: string; venue: string; address: string | null; is_home: boolean;
  matches: { id: string; team: { category: string } | null; callups: { status: string; transport: string | null }[] }[];
};

function MatchdayCard({ m }: { m: Row }) {
  const callups = m.matches.flatMap((x) => x.callups);
  const confirmed = callups.filter((c) => c.status === "confirmed").length;
  const pending = callups.filter((c) => c.status === "pending").length;
  const bus = callups.filter((c) => c.status === "confirmed" && c.transport === "bus").length;
  const cats = [...new Set(m.matches.map((x) => x.team?.category).filter(Boolean))];
  return (
    <Link href={`/matchdays/${m.id}`} className="block rounded-xl border border-border bg-card p-4 shadow-sm hover:border-primary">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-primary">{formatDate(m.date)}</div>
          <div className="font-semibold">{m.title ?? m.venue}</div>
          <div className="text-sm text-muted-foreground">{m.venue}{m.address ? ` · ${m.address}` : ""}</div>
        </div>
        {m.is_home ? <Badge tone="brand">En casa</Badge> : <Badge>Visita</Badge>}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
        <Badge tone="blue">{m.matches.length} partidos</Badge>
        {cats.map((c) => <Badge key={c}>{c}</Badge>)}
        {callups.length > 0 && (
          <>
            <Badge tone="green">{confirmed} confirmados</Badge>
            {pending > 0 && <Badge tone="amber">{pending} pendientes</Badge>}
            {bus > 0 && <Badge>🚌 {bus}</Badge>}
          </>
        )}
      </div>
    </Link>
  );
}

export default async function MatchdaysPage() {
  const supabase = await createClient();
  const today = todayISO();
  const select = "id, title, date, venue, address, is_home, matches(id, team:teams(category), callups(status, transport))";
  const [{ data: upcoming }, { data: past }] = await Promise.all([
    supabase.from("matchdays").select(select).gte("date", today).order("date"),
    supabase.from("matchdays").select(select).lt("date", today).order("date", { ascending: false }).limit(20),
  ]);

  return (
    <>
      <PageHeader title="Jornadas" subtitle="Partidos, convocatorias y transporte" action={<LinkButton href="/matchdays/new">+ Nueva jornada</LinkButton>} />
      <h2 className="mb-3 font-semibold">Próximas</h2>
      {!upcoming?.length ? (
        <Empty>No hay jornadas programadas.</Empty>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">{(upcoming as unknown as Row[]).map((m) => <MatchdayCard key={m.id} m={m} />)}</div>
      )}
      {!!past?.length && (
        <>
          <h2 className="mb-3 mt-8 font-semibold">Anteriores</h2>
          <div className="grid gap-3 opacity-90 md:grid-cols-2">{(past as unknown as Row[]).map((m) => <MatchdayCard key={m.id} m={m} />)}</div>
        </>
      )}
    </>
  );
}
