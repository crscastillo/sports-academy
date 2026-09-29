import Link from "next/link";
import { notFound } from "next/navigation";
import { getRepositories } from "@/lib/repositories";
import { Card, PageHeader } from "@/components/ui";
import { ConfirmSubmit } from "@/components/client";
import { formatDate } from "@/lib/labels";
import { deleteTraining, updateTraining } from "../actions";
import { TrainingForm, type Training } from "../training-form";

export default async function TrainingPage({ params }: PageProps<"/trainings/[id]">) {
  const { id } = await params;
  const { trainings, teams } = await getRepositories();
  const [training, teamOptions, selectedTeamIds] = await Promise.all([
    trainings.getById(id),
    teams.listBasic(),
    trainings.getTeamIds(id),
  ]);
  if (!training) notFound();
  const t = training as Training;

  return (
    <>
      <PageHeader
        title={`Entrenamiento · ${formatDate(t.date)}`}
        action={<Link href={`/trainings?week=${t.date}`} className="text-sm text-muted-foreground hover:underline">← Planificador</Link>}
      />
      <Card>
        <TrainingForm
          action={updateTraining.bind(null, id)}
          training={t}
          teams={teamOptions}
          selectedTeamIds={selectedTeamIds}
          submitLabel="Guardar cambios"
        />
      </Card>
      <form action={deleteTraining.bind(null, id)} className="mt-4">
        <ConfirmSubmit message="¿Eliminar este entrenamiento?">Eliminar</ConfirmSubmit>
      </form>
    </>
  );
}
