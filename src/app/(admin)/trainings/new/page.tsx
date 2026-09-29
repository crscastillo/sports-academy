import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, PageHeader } from "@/components/ui";
import { todayISO } from "@/lib/labels";
import { createTraining } from "../actions";
import { TrainingForm } from "../training-form";

export const metadata = { title: "Nuevo entrenamiento" };

export default async function NewTrainingPage({ searchParams }: PageProps<"/trainings/new">) {
  const sp = await searchParams;
  const date = typeof sp.date === "string" ? sp.date : todayISO();
  const supabase = await createClient();
  const { data: teams } = await supabase.from("teams").select("id, name, category").order("category");
  return (
    <>
      <PageHeader title="Nuevo entrenamiento" action={<Link href="/trainings" className="text-sm text-muted-foreground hover:underline">← Entrenamientos</Link>} />
      <Card>
        <TrainingForm action={createTraining} teams={teams ?? []} submitLabel="Guardar" isNew defaultDate={date} />
      </Card>
    </>
  );
}
