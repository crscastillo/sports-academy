import { Field, Input, Select, Textarea } from "@/components/ui";
import { SubmitButton } from "@/components/client";

export type Matchday = {
  id: string;
  title: string | null;
  date: string;
  venue: string;
  address: string | null;
  is_home: boolean;
  notes: string | null;
  share_token: string;
  coach_id: string | null;
};

export type CoachOption = { id: string; full_name: string; is_default?: boolean };

export function MatchdayForm({
  action, matchday, coaches = [], submitLabel, defaultDate,
}: { action: (fd: FormData) => Promise<void>; matchday?: Matchday; coaches?: CoachOption[]; submitLabel: string; defaultDate?: string }) {
  // New matchdays default to the academy's default coach; editing keeps the matchday's own coach as-is.
  const defaultCoachId = matchday ? matchday.coach_id ?? "" : coaches.find((c) => c.is_default)?.id ?? "";
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <Field label="Título (opcional)"><Input name="title" defaultValue={matchday?.title ?? ""} placeholder="Jornada 5 · Liga Metropolitana" /></Field>
      <Field label="Fecha"><Input type="date" name="date" required defaultValue={matchday?.date ?? defaultDate} /></Field>
      <Field label="Sede"><Input name="venue" required defaultValue={matchday?.venue ?? ""} placeholder="Gimnasio Municipal" /></Field>
      <Field label="Dirección"><Input name="address" defaultValue={matchday?.address ?? ""} placeholder="200 m norte del parque…" /></Field>
      <Field label="Entrenador a cargo">
        <Select name="coach_id" defaultValue={defaultCoachId}>
          <option value="">Sin entrenador asignado</option>
          {coaches.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
        </Select>
      </Field>
      <Field label="Notas" className="sm:col-span-2"><Textarea name="notes" rows={2} defaultValue={matchday?.notes ?? ""} placeholder="Uniforme blanco, llegar 45 min antes…" /></Field>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="is_home" defaultChecked={matchday?.is_home} className="accent-[var(--brand)]" />
        Jornada en casa (habilita soda y ventas, oculta transporte)
      </label>
      <div className="sm:col-span-2"><SubmitButton>{submitLabel}</SubmitButton></div>
    </form>
  );
}
