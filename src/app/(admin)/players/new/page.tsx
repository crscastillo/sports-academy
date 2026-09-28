import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, PageHeader } from "@/components/ui";
import { createPlayer } from "../actions";
import { PlayerForm } from "../player-form";

export const metadata = { title: "Nuevo atleta" };

export default async function NewPlayerPage({ searchParams }: PageProps<"/players/new">) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: teams } = await supabase.from("teams").select("id, name, category").order("category");
  const preselected = typeof sp.team === "string" ? [sp.team] : [];
  return (
    <>
      <PageHeader title="Nuevo atleta" action={<Link href="/players" className="text-sm text-muted hover:underline">← Atletas</Link>} />
      <Card>
        <PlayerForm action={createPlayer} teams={teams ?? []} selectedTeamIds={preselected} submitLabel="Registrar atleta" />
      </Card>
    </>
  );
}
