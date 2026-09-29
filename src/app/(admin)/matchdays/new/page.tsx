import Link from "next/link";
import { Card, PageHeader } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/labels";
import { createMatchday } from "../actions";
import { MatchdayForm } from "../matchday-form";

export const metadata = { title: "Nueva jornada" };

export default async function NewMatchdayPage() {
  const supabase = await createClient();
  const { data: coaches } = await supabase.from("coaches").select("id, full_name, is_default").order("full_name");
  return (
    <>
      <PageHeader title="Nueva jornada" action={<Link href="/matchdays" className="text-sm text-muted-foreground hover:underline">← Jornadas</Link>} />
      <Card>
        <MatchdayForm action={createMatchday} coaches={coaches ?? []} submitLabel="Crear jornada" defaultDate={todayISO()} />
      </Card>
    </>
  );
}
