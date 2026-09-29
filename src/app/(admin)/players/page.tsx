import { getRepositories } from "@/lib/repositories";
import { LinkButton, PageHeader } from "@/components/ui";
import { PlayersTable, type Row } from "./players-table";

export const metadata = { title: "Atletas" };

export default async function PlayersPage() {
  const { players, teams } = await getRepositories();
  const [data, teamOptions] = await Promise.all([players.listWithTeams(), teams.listBasic()]);
  const playerRows = data as unknown as Row[];

  return (
    <>
      <PageHeader title="Atletas" action={<LinkButton href="/players/new">+ Nuevo atleta</LinkButton>} />
      <PlayersTable players={playerRows} teams={teamOptions} />
    </>
  );
}
