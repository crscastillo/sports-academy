import { Badge, Button, Card, Empty, Field, Input, PageHeader, Select } from "@/components/ui";
import { ConfirmSubmit, SubmitButton } from "@/components/client";
import { FilterPills } from "@/components/elements/filter-pills";
import { ResponsiveDialog } from "@/components/elements/responsive-dialog";
import { getRepositories } from "@/lib/repositories";
import { COACH_TYPES, coachTypeLabel } from "@/lib/labels";
import { paths } from "@/lib/paths";
import { createCoach, deleteCoach, inviteCoach, setDefaultCoach, unsetDefaultCoach, updateCoach } from "./actions";

export const metadata = { title: "Entrenadores" };

export default async function CoachesPage({ params, searchParams }: PageProps<"/[academySlug]/coaches">) {
  const { academySlug } = await params;
  const sp = await searchParams;
  const type = typeof sp.type === "string" ? sp.type : "";

  const { coaches, staff, teams } = await getRepositories();
  const [coachRows, staffList, teamRows] = await Promise.all([coaches.listFull(type), staff.listEmails(), teams.listNamesWithCoach()]);

  const staffEmails = new Set(staffList.map((s) => s.email.toLowerCase()));
  const teamsByCoach = new Map<string, string[]>();
  for (const t of teamRows) {
    if (!t.coach_id) continue;
    teamsByCoach.set(t.coach_id, [...(teamsByCoach.get(t.coach_id) ?? []), t.name]);
  }

  return (
    <>
      <PageHeader
        title="Entrenadores"
        subtitle="Personal técnico y acceso a la plataforma"
        action={
          <ResponsiveDialog trigger={<Button>+ Nuevo entrenador</Button>} title="Nuevo entrenador">
            <form action={createCoach} className="grid gap-3">
              <Field label="Nombre"><Input name="full_name" required /></Field>
              <Field label="Tipo">
                <Select name="type" defaultValue="head">
                  {COACH_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </Select>
              </Field>
              <Field label="Correo" hint="Necesario para invitarlo"><Input type="email" name="email" /></Field>
              <Field label="Teléfono"><Input name="phone" /></Field>
              <SubmitButton>Agregar entrenador</SubmitButton>
            </form>
          </ResponsiveDialog>
        }
      />
      <div className="mb-4">
        <FilterPills options={[{ value: "", label: "Todos" }, ...COACH_TYPES]} value={type} basePath={paths.coaches.list(academySlug)} param="type" />
      </div>

      {!coachRows.length ? (
        <Empty>Aún no hay entrenadores.</Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {coachRows.map((c) => {
            const invited = c.email ? staffEmails.has(c.email.toLowerCase()) : false;
            const teamNames = teamsByCoach.get(c.id) ?? [];
            return (
              <Card key={c.id}>
                <form action={updateCoach.bind(null, c.id)} className="grid gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <Field label="Nombre" className="flex-1"><Input name="full_name" required defaultValue={c.full_name} /></Field>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <Badge tone="brand">{coachTypeLabel(c.type)}</Badge>
                      {c.is_default && <Badge tone="amber">★ Predeterminado</Badge>}
                      {invited ? (
                        <Badge tone="green">Con acceso</Badge>
                      ) : c.email ? (
                        <Badge tone="amber">Sin invitar</Badge>
                      ) : null}
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Field label="Tipo">
                      <Select name="type" defaultValue={c.type}>
                        {COACH_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </Select>
                    </Field>
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
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {invited ? (
                      <span className="text-xs text-muted-foreground">Ya puede ingresar con su correo</span>
                    ) : c.email ? (
                      <form action={inviteCoach.bind(null, c.id)}>
                        <SubmitButton variant="secondary" className="!py-1.5 text-xs">Invitar</SubmitButton>
                      </form>
                    ) : (
                      <span className="text-xs text-muted-foreground">Agregá un correo para invitar</span>
                    )}
                    <form action={(c.is_default ? unsetDefaultCoach : setDefaultCoach).bind(null, c.id)}>
                      <SubmitButton variant="secondary" className="!py-1.5 text-xs">
                        {c.is_default ? "Quitar predeterminado" : "Hacer predeterminado"}
                      </SubmitButton>
                    </form>
                  </div>
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
