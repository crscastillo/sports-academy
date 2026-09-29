import { getRepositories } from "@/lib/repositories";
import { Card, Field, Input, PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/client";
import { updateAgeThresholds, updatePaymentSettings, updateSlug } from "./actions";

export const metadata = { title: "Configuración" };

export default async function SettingsPage({ params, searchParams }: PageProps<"/[academySlug]/settings">) {
  const { academySlug } = await params;
  const sp = await searchParams;
  const error = typeof sp.error === "string" ? sp.error : null;
  const { academy: academyRepo } = await getRepositories();
  const academy = await academyRepo.getSettings();

  return (
    <>
      <PageHeader title="Configuración" subtitle="Reglas de la academia" />

      {error && <p className="mb-6 max-w-lg rounded-lg bg-red-50 p-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{error}</p>}

      <Card title="Enlace de la academia" className="mb-6 max-w-lg">
        <p className="mb-4 text-sm text-muted-foreground">
          Se usa en tus enlaces de administración y en la página pública. Cambiarlo invalida los enlaces que ya compartiste.
        </p>
        <form action={updateSlug} className="grid gap-3 sm:grid-cols-2">
          <Field label="Identificador" hint={`Vista previa: /${academySlug}/dashboard`} className="sm:col-span-2">
            <Input name="slug" required defaultValue={academy?.slug ?? ""} pattern="[a-z0-9]+(-[a-z0-9]+)*" minLength={3} maxLength={40} />
          </Field>
          <div className="sm:col-span-2">
            <SubmitButton>Guardar</SubmitButton>
          </div>
        </form>
      </Card>

      <Card title="Pagos" className="mb-6 max-w-lg">
        <p className="mb-4 text-sm text-muted-foreground">
          Algunas academias llevan el control de pagos en otro sistema (por ejemplo, contabilidad externa).
          Activá esta opción solo si querés llevarlo también acá, en la sección Pagos.
        </p>
        <form action={updatePaymentSettings} className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" name="track_payments" defaultChecked={academy?.track_payments ?? false} className="accent-[var(--brand)]" />
            Llevar el control de pagos en esta app
          </label>
          <Field label="Cuota mensual por defecto" hint="Se usa para prellenar montos nuevos">
            <Input type="number" step="0.01" min={0} name="default_monthly_fee" defaultValue={academy?.default_monthly_fee ?? ""} />
          </Field>
          <div className="sm:col-span-2">
            <SubmitButton>Guardar</SubmitButton>
          </div>
        </form>
      </Card>

      <Card title="Elegibilidad por edad" className="max-w-lg">
        <p className="mb-4 text-sm text-muted-foreground">
          Define cuántas categorías por debajo y por encima de la edad que un atleta cumple este año puede jugar.
          Por ejemplo, con un mínimo de 1, un atleta que cumple 13 años este año puede unirse a U12 o superior.
        </p>
        <form action={updateAgeThresholds} className="grid gap-3 sm:grid-cols-2">
          <Field label="Categorías por debajo" hint="0 = solo su propia categoría o superior">
            <Input type="number" min={0} name="age_eligibility_min" required defaultValue={academy?.age_eligibility_min ?? 1} />
          </Field>
          <Field label="Categorías por encima" hint="Vacío = sin límite">
            <Input type="number" min={0} name="age_eligibility_max" defaultValue={academy?.age_eligibility_max ?? ""} />
          </Field>
          <div className="sm:col-span-2">
            <SubmitButton>Guardar</SubmitButton>
          </div>
        </form>
      </Card>
    </>
  );
}
