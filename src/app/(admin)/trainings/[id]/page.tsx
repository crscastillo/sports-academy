import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, PageHeader } from "@/components/ui";
import { ConfirmSubmit } from "@/components/client";
import { formatDate } from "@/lib/labels";
import { deleteTraining, updateTraining } from "../actions";
import { TrainingForm, type Training } from "../training-form";

export default async function TrainingPage({ params }: PageProps<"/trainings/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: training }, { data: teams }, { data: links }] = await Promise.all([
    supabase.from("trainings").select("*").eq("id", id).single(),
    supabase.from("teams").select("id, name, category").order("category"),
    supabase.from("training_teams").select("team_id").eq("training_id", id),
  ]);
  if (!training) notFound();
  const t = training as Training;

  return (
    <>
      <PageHeader
        title={`Entrenamiento · ${formatDate(t.date)}`}
        action={<Link href={`/trainings?week=${t.date}`} className="text-sm text-muted hover:underline">← Planificador</Link>}
      />
      <Card>
        <TrainingForm
          action={updateTraining.bind(null, id)}
          training={t}
          teams={teams ?? []}
          selectedTeamIds={(links ?? []).map((l) => l.team_id)}
          submitLabel="Guardar cambios"
        />
      </Card>
      <form action={deleteTraining.bind(null, id)} className="mt-4">
        <ConfirmSubmit message="¿Eliminar este entrenamiento?">Eliminar</ConfirmSubmit>
      </form>
    </>
  );
}
