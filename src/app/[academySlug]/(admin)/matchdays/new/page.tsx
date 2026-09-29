import Link from "next/link";
import { Card, PageHeader } from "@/components/ui";
import { getRepositories } from "@/lib/repositories";
import { todayISO } from "@/lib/labels";
import { paths } from "@/lib/paths";
import { createMatchday } from "../actions";
import { MatchdayForm } from "../matchday-form";

export const metadata = { title: "Nueva jornada" };

export default async function NewMatchdayPage({ params }: PageProps<"/[academySlug]/matchdays/new">) {
  const { academySlug } = await params;
  const { coaches } = await getRepositories();
  const coachOptions = await coaches.listForAssignment();
  return (
    <>
      <PageHeader title="Nueva jornada" action={<Link href={paths.matchdays.list(academySlug)} className="text-sm text-muted-foreground hover:underline">← Jornadas</Link>} />
      <Card>
        <MatchdayForm action={createMatchday} coaches={coachOptions} submitLabel="Crear jornada" defaultDate={todayISO()} />
      </Card>
    </>
  );
}
