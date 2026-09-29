import { getRepositories } from "@/lib/repositories";
import { LinkButton, PageHeader } from "@/components/ui";
import { paths } from "@/lib/paths";
import { PlayersTable, type Row } from "./players-table";

export const metadata = { title: "Atletas" };

export default async function PlayersPage({ params }: PageProps<"/[academySlug]/players">) {
  const { academySlug } = await params;
  const { players, teams } = await getRepositories();
  const [data, teamOptions] = await Promise.all([players.listWithTeams(), teams.listBasic()]);
  const playerRows = data as unknown as Row[];

  return (
    <>
      <PageHeader title="Atletas" action={<LinkButton href={paths.players.new(academySlug)}>+ Nuevo atleta</LinkButton>} />
      <PlayersTable players={playerRows} teams={teamOptions} />
    </>
  );
}
