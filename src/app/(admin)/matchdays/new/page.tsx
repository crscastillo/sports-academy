import Link from "next/link";
import { Card, PageHeader } from "@/components/ui";
import { todayISO } from "@/lib/labels";
import { createMatchday } from "../actions";
import { MatchdayForm } from "../matchday-form";

export const metadata = { title: "Nueva jornada" };

export default function NewMatchdayPage() {
  return (
    <>
      <PageHeader title="Nueva jornada" action={<Link href="/matchdays" className="text-sm text-muted-foreground hover:underline">← Jornadas</Link>} />
      <Card>
        <MatchdayForm action={createMatchday} submitLabel="Crear jornada" defaultDate={todayISO()} />
      </Card>
    </>
  );
}
