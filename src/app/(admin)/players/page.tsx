import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, Empty, Input, LinkButton, PageHeader, Select } from "@/components/ui";
import { ageOn } from "@/lib/labels";

export const metadata = { title: "Atletas" };

type Row = {
  id: string; first_name: string; last_name: string; jersey_number: number | null; national_id: string | null;
  birth_date: string | null; height_cm: number | null; positions: string[]; active: boolean;
  team_players: { team: { id: string; name: string; category: string } }[];
};

export default async function PlayersPage({ searchParams }: PageProps<"/players">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const team = typeof sp.team === "string" ? sp.team : "";
  const showInactive = sp.inactive === "1";

  const supabase = await createClient();
  let query = supabase
    .from("players")
    .select("id, first_name, last_name, jersey_number, national_id, birth_date, height_cm, positions, active, team_players(team:teams(id, name, category))")
    .order("last_name");
  if (!showInactive) query = query.eq("active", true);
  if (q) {
    const safe = q.replace(/[%,()]/g, " ");
    query = query.or(`first_name.ilike.%${safe}%,last_name.ilike.%${safe}%,national_id.ilike.%${safe}%`);
  }
  const [{ data }, { data: teams }] = await Promise.all([
    query,
    supabase.from("teams").select("id, name, category").order("category"),
  ]);
  let players = (data ?? []) as unknown as Row[];
  if (team) players = players.filter((p) => p.team_players.some((tp) => tp.team?.id === team));

  return (
    <>
      <PageHeader title="Atletas" subtitle={`${players.length} registrados`} action={<LinkButton href="/players/new">+ Nuevo atleta</LinkButton>} />
      <Card className="mb-4">
        <form className="flex flex-wrap items-end gap-2">
          <div className="min-w-48 flex-1"><Input name="q" defaultValue={q} placeholder="Buscar por nombre o cédula" /></div>
          <div className="w-48">
            <Select name="team" defaultValue={team}>
              <option value="">Todos los equipos</option>
              {teams?.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Select>
          </div>
          <label className="flex items-center gap-2 px-2 text-sm">
            <input type="checkbox" name="inactive" value="1" defaultChecked={showInactive} /> Incluir inactivos
          </label>
          <button className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-background">Filtrar</button>
        </form>
      </Card>
      {players.length === 0 ? (
        <Empty>No hay atletas que coincidan.</Empty>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-background text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2">#</th><th className="px-3">Nombre</th><th className="px-3">Cédula</th>
                <th className="px-3">Edad</th><th className="px-3">Estatura</th><th className="px-3">Pos.</th><th className="px-3">Equipos</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p) => (
                <tr key={p.id} className="border-t border-border hover:bg-background/60">
                  <td className="px-3 py-2 font-mono">{p.jersey_number ?? "—"}</td>
                  <td className="px-3">
                    <Link href={`/players/${p.id}`} className="font-medium hover:underline">{p.first_name} {p.last_name}</Link>
                    {!p.active && <span className="ml-2"><Badge tone="red">Inactivo</Badge></span>}
                  </td>
                  <td className="px-3 text-muted-foreground">{p.national_id ?? "—"}</td>
                  <td className="px-3">{ageOn(p.birth_date) ?? "—"}</td>
                  <td className="px-3">{p.height_cm ? `${p.height_cm} cm` : "—"}</td>
                  <td className="px-3">{p.positions.join(", ") || "—"}</td>
                  <td className="px-3">
                    <div className="flex flex-wrap gap-1">
                      {p.team_players.map((tp) => tp.team && <Badge key={tp.team.id} tone="brand">{tp.team.name}</Badge>)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
