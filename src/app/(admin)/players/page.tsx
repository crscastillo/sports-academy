import { createClient } from "@/lib/supabase/server";
import { LinkButton, PageHeader } from "@/components/ui";
import { PlayersTable, type Row } from "./players-table";

export const metadata = { title: "Atletas" };

export default async function PlayersPage() {
  const supabase = await createClient();
  const [{ data }, { data: teams }] = await Promise.all([
    supabase
      .from("players")
      .select("id, first_name, last_name, jersey_number, national_id, birth_date, height_cm, positions, active, gender, team_players(team:teams(id, name, category))")
      .order("last_name"),
    supabase.from("teams").select("id, name, category").order("category"),
  ]);
  const players = (data ?? []) as unknown as Row[];

  return (
    <>
      <PageHeader title="Atletas" action={<LinkButton href="/players/new">+ Nuevo atleta</LinkButton>} />
      <PlayersTable players={players} teams={teams ?? []} />
    </>
  );
}
