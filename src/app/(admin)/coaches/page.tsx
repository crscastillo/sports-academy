import { Badge, Card, Empty, Field, Input, PageHeader } from "@/components/ui";
import { ConfirmSubmit, SubmitButton } from "@/components/client";
import { createClient } from "@/lib/supabase/server";
import { createCoach, deleteCoach, inviteCoach, updateCoach } from "./actions";

export const metadata = { title: "Entrenadores" };

export default async function CoachesPage() {
  const supabase = await createClient();
  const [{ data: coaches }, { data: staff }, { data: teams }] = await Promise.all([
    supabase.from("coaches").select("id, full_name, email, phone").order("full_name"),
    supabase.from("staff").select("email"),
    supabase.from("teams").select("name, coach_id"),
  ]);

  const staffEmails = new Set((staff ?? []).map((s) => s.email.toLowerCase()));
  const teamsByCoach = new Map<string, string[]>();
  for (const t of teams ?? []) {
    if (!t.coach_id) continue;
    teamsByCoach.set(t.coach_id, [...(teamsByCoach.get(t.coach_id) ?? []), t.name]);
  }

  return (
    <>
      <PageHeader title="Entrenadores" subtitle="Personal técnico y acceso a la plataforma" />
      <Card title="Nuevo entrenador" className="mb-6">
        <form action={createCoach} className="grid gap-3 sm:grid-cols-3">
          <Field label="Nombre"><Input name="full_name" required /></Field>
          <Field label="Correo" hint="Necesario para invitarlo"><Input type="email" name="email" /></Field>
          <Field label="Teléfono"><Input name="phone" /></Field>
          <div className="sm:col-span-3">
            <SubmitButton>Agregar entrenador</SubmitButton>
          </div>
        </form>
      </Card>

      {!coaches?.length ? (
        <Empty>Aún no hay entrenadores.</Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {coaches.map((c) => {
            const invited = c.email ? staffEmails.has(c.email.toLowerCase()) : false;
            const teamNames = teamsByCoach.get(c.id) ?? [];
            return (
              <Card key={c.id}>
                <form action={updateCoach.bind(null, c.id)} className="grid gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <Field label="Nombre" className="flex-1"><Input name="full_name" required defaultValue={c.full_name} /></Field>
                    {invited ? (
                      <Badge tone="green">Con acceso</Badge>
                    ) : c.email ? (
                      <Badge tone="amber">Sin invitar</Badge>
                    ) : null}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Correo" hint="Necesario para invitarlo"><Input type="email" name="email" defaultValue={c.email ?? ""} /></Field>
                    <Field label="Teléfono"><Input name="phone" defaultValue={c.phone ?? ""} /></Field>
                  </div>
                  {teamNames.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {teamNames.map((n) => <Badge key={n}>{n}</Badge>)}
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    <SubmitButton variant="secondary">Guardar</SubmitButton>
                  </div>
                </form>
                <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-3">
                  {invited ? (
                    <span className="text-xs text-muted">Ya puede ingresar con su correo</span>
                  ) : c.email ? (
                    <form action={inviteCoach.bind(null, c.id)}>
                      <SubmitButton variant="secondary" className="!py-1.5 text-xs">Invitar</SubmitButton>
                    </form>
                  ) : (
                    <span className="text-xs text-muted">Agregá un correo para invitar</span>
                  )}
                  <form action={deleteCoach.bind(null, c.id)}>
                    <ConfirmSubmit message="¿Eliminar este entrenador?">Eliminar</ConfirmSubmit>
                  </form>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
