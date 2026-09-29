import { getRepositories } from "@/lib/repositories";
import { Card, Field, Input, PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/client";
import { updateAgeThresholds, updatePaymentSettings } from "./actions";

export const metadata = { title: "Configuración" };

export default async function SettingsPage() {
  const { academy: academyRepo } = await getRepositories();
  const academy = await academyRepo.getSettings();

  return (
    <>
      <PageHeader title="Configuración" subtitle="Reglas de la academia" />

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
