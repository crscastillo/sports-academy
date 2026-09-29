import Link from "next/link";
import { getRepositories } from "@/lib/repositories";
import { Card, PageHeader } from "@/components/ui";
import { paths } from "@/lib/paths";
import { createPlayer } from "../actions";
import { PlayerForm } from "../player-form";

export const metadata = { title: "Nuevo atleta" };

export default async function NewPlayerPage({ params, searchParams }: PageProps<"/[academySlug]/players/new">) {
  const { academySlug } = await params;
  const sp = await searchParams;
  const { teams } = await getRepositories();
  const teamOptions = await teams.listBasic();
  const preselected = typeof sp.team === "string" ? [sp.team] : [];
  return (
    <>
      <PageHeader title="Nuevo atleta" action={<Link href={paths.players.list(academySlug)} className="text-sm text-muted-foreground hover:underline">← Atletas</Link>} />
      <Card>
        <PlayerForm action={createPlayer} teams={teamOptions} selectedTeamIds={preselected} submitLabel="Registrar atleta" />
      </Card>
    </>
  );
}
