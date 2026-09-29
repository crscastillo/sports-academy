import { Field, Input, Select, Textarea } from "@/components/ui";
import { SubmitButton } from "@/components/client";
import { TRAINING_STATUS } from "@/lib/labels";

export type Training = {
  id: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  status: string;
  plan: string | null;
  notes: string | null;
  observations: string | null;
};

type TeamOpt = { id: string; name: string; category: string };

export function TrainingForm({
  action, training, teams, selectedTeamIds = [], submitLabel, isNew = false, defaultDate,
}: {
  action: (fd: FormData) => Promise<void>;
  training?: Training;
  teams: TeamOpt[];
  selectedTeamIds?: string[];
  submitLabel: string;
  isNew?: boolean;
  defaultDate?: string;
}) {
  const sel = new Set(selectedTeamIds);
  return (
    <form action={action} className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Field label="Fecha"><Input type="date" name="date" required defaultValue={training?.date ?? defaultDate} /></Field>
        <Field label="Inicio"><Input type="time" name="start_time" defaultValue={training?.start_time?.slice(0, 5) ?? ""} /></Field>
        <Field label="Fin"><Input type="time" name="end_time" defaultValue={training?.end_time?.slice(0, 5) ?? ""} /></Field>
        <Field label="Lugar"><Input name="location" defaultValue={training?.location ?? ""} placeholder="Gimnasio" /></Field>
        <Field label="Estado">
          <Select name="status" defaultValue={training?.status ?? "planned"}>
            {TRAINING_STATUS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </Select>
        </Field>
      </div>

      <fieldset>
        <legend className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Categorías que entrenan</legend>
        <div className="flex flex-wrap gap-2">
          {teams.map((t) => (
            <label key={t.id} className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/10">
              <input type="checkbox" name="team_id" value={t.id} defaultChecked={sel.has(t.id)} className="accent-[var(--brand)]" />
              {t.name} <span className="text-xs text-muted-foreground">{t.category}</span>
            </label>
          ))}
          {teams.length === 0 && <p className="text-sm text-muted-foreground">Primero creá equipos.</p>}
        </div>
      </fieldset>

      <Field label="Planificación (ejercicios, objetivos)">
        <Textarea name="plan" rows={4} defaultValue={training?.plan ?? ""} placeholder="Calentamiento 15', tiro en movimiento 20', 5c5 media cancha…" />
      </Field>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Notas (lo que se realizó)">
          <Textarea name="notes" rows={4} defaultValue={training?.notes ?? ""} />
        </Field>
        <Field label="Observaciones del entrenador">
          <Textarea name="observations" rows={4} defaultValue={training?.observations ?? ""} />
        </Field>
      </div>

      {isNew && (
        <Field label="Repetir semanalmente" hint="Crea copias en las siguientes semanas (mismo día y hora).">
          <Select name="repeat_weeks" defaultValue="0" className="max-w-xs">
            <option value="0">No repetir</option>
            {[1, 2, 3, 4, 6, 8, 12].map((n) => <option key={n} value={n}>{n} semana{n > 1 ? "s" : ""} más</option>)}
          </Select>
        </Field>
      )}

      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}
