import { createClient } from "@/lib/supabase/server";
import { Card, Field, Input, PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/client";
import { updateAgeThresholds } from "./actions";

export const metadata = { title: "Configuración" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: academy } = await supabase.from("academies").select("age_eligibility_min, age_eligibility_max").single();

  return (
    <>
      <PageHeader title="Configuración" subtitle="Reglas de la academia" />
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
