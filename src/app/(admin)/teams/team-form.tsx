import { Field, Input, Select } from "@/components/ui";
import { SubmitButton } from "@/components/client";
import { CATEGORIES, GENDERS } from "@/lib/labels";

export type Team = {
  id: string;
  name: string;
  category: string;
  gender: string;
  season: string | null;
  coach_id: string | null;
};

export type CoachOption = { id: string; full_name: string };

export function TeamForm({
  action, team, coaches = [], submitLabel, compact = false,
}: { action: (fd: FormData) => Promise<void>; team?: Team; coaches?: CoachOption[]; submitLabel: string; compact?: boolean }) {
  return (
    <form action={action} className={compact ? "grid gap-3" : "grid gap-3 sm:grid-cols-2 lg:grid-cols-5"}>
      <Field label="Nombre">
        <Input name="name" required defaultValue={team?.name} placeholder="Ej. U13 Femenino A" />
      </Field>
      <Field label="Categoría">
        <Select name="category" required defaultValue={team?.category ?? ""}>
          <option value="" disabled>Elegir categoría</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
      </Field>
      <Field label="Género">
        <Select name="gender" defaultValue={team?.gender ?? "mixed"}>
          {GENDERS.map((g) => (
            <option key={g.value} value={g.value}>{g.label}</option>
          ))}
        </Select>
      </Field>
      <Field label="Temporada">
        <Input name="season" defaultValue={team?.season ?? ""} placeholder="2026" />
      </Field>
      <Field label="Entrenador">
        <Select name="coach_id" defaultValue={team?.coach_id ?? ""}>
          <option value="">Sin entrenador asignado</option>
          {coaches.map((c) => (
            <option key={c.id} value={c.id}>{c.full_name}</option>
          ))}
        </Select>
      </Field>
      <div className={compact ? "" : "sm:col-span-2 lg:col-span-5"}>
        <SubmitButton>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
