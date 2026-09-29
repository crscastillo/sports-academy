import Link from "next/link";
import { getRepositories } from "@/lib/repositories";
import { Card, PageHeader } from "@/components/ui";
import { todayISO } from "@/lib/labels";
import { paths } from "@/lib/paths";
import { createTraining } from "../actions";
import { TrainingForm } from "../training-form";

export const metadata = { title: "Nuevo entrenamiento" };

export default async function NewTrainingPage({ params, searchParams }: PageProps<"/[academySlug]/trainings/new">) {
  const { academySlug } = await params;
  const sp = await searchParams;
  const date = typeof sp.date === "string" ? sp.date : todayISO();
  const { teams } = await getRepositories();
  const teamOptions = await teams.listBasic();
  return (
    <>
      <PageHeader title="Nuevo entrenamiento" action={<Link href={paths.trainings.list(academySlug)} className="text-sm text-muted-foreground hover:underline">← Entrenamientos</Link>} />
      <Card>
        <TrainingForm action={createTraining} teams={teamOptions} submitLabel="Guardar" isNew defaultDate={date} />
      </Card>
    </>
  );
}
