import Link from "next/link";
import { Card, PageHeader } from "@/components/ui";
import { getRepositories } from "@/lib/repositories";
import { todayISO } from "@/lib/labels";
import { createMatchday } from "../actions";
import { MatchdayForm } from "../matchday-form";

export const metadata = { title: "Nueva jornada" };

export default async function NewMatchdayPage() {
  const { coaches } = await getRepositories();
  const coachOptions = await coaches.listForAssignment();
  return (
    <>
      <PageHeader title="Nueva jornada" action={<Link href="/matchdays" className="text-sm text-muted-foreground hover:underline">← Jornadas</Link>} />
      <Card>
        <MatchdayForm action={createMatchday} coaches={coachOptions} submitLabel="Crear jornada" defaultDate={todayISO()} />
      </Card>
    </>
  );
}
