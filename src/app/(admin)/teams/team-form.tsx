import { Field, Input, Select } from "@/components/ui";
import { SubmitButton } from "@/components/client";
import { GENDERS } from "@/lib/labels";

export type Team = {
  id: string;
  name: string;
  category: string;
  gender: string;
  season: string | null;
  coach: string | null;
};

export function TeamForm({ action, team, submitLabel, compact = false }: { action: (fd: FormData) => Promise<void>; team?: Team; submitLabel: string; compact?: boolean }) {
  return (
    <form action={action} className={compact ? "grid gap-3" : "grid gap-3 sm:grid-cols-2 lg:grid-cols-5"}>
      <Field label="Nombre">
        <Input name="name" required defaultValue={team?.name} placeholder="Ej. U13 Femenino A" />
      </Field>
      <Field label="Categoría">
        <Input name="category" required defaultValue={team?.category} placeholder="U13" list="categories" />
        <datalist id="categories">
          {["U9", "U11", "U13", "U15", "U17", "U19", "Mayor"].map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
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
        <Input name="coach" defaultValue={team?.coach ?? ""} />
      </Field>
      <div className={compact ? "" : "sm:col-span-2 lg:col-span-5"}>
        <SubmitButton>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
