import { Field, Input, Select, Textarea } from "@/components/ui";
import { AvatarPicker, SubmitButton } from "@/components/client";
import { GENDERS, POSITIONS } from "@/lib/labels";

export type Player = {
  id: string;
  first_name: string;
  last_name: string;
  jersey_number: number | null;
  national_id: string | null;
  birth_date: string | null;
  gender: string | null;
  profile: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  wingspan_cm: number | null;
  positions: string[];
  guardian_name: string | null;
  guardian_phone: string | null;
  active: boolean;
  avatar_url: string | null;
};

type TeamOpt = { id: string; name: string; category: string };

export function PlayerForm({
  action, player, teams, selectedTeamIds = [], submitLabel,
}: {
  action: (fd: FormData) => Promise<void>;
  player?: Player;
  teams: TeamOpt[];
  selectedTeamIds?: string[];
  submitLabel: string;
}) {
  const sel = new Set(selectedTeamIds);
  return (
    <form action={action} className="space-y-6">
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Foto</legend>
        <AvatarPicker defaultUrl={player?.avatar_url} />
      </fieldset>

      <fieldset className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <legend className="mb-2 text-sm font-semibold">Datos personales</legend>
        <Field label="Nombre"><Input name="first_name" required defaultValue={player?.first_name} /></Field>
        <Field label="Apellidos"><Input name="last_name" required defaultValue={player?.last_name} /></Field>
        <Field label="Cédula"><Input name="national_id" defaultValue={player?.national_id ?? ""} placeholder="1-2345-6789" /></Field>
        <Field label="Fecha de nacimiento"><Input type="date" name="birth_date" defaultValue={player?.birth_date ?? ""} /></Field>
        <Field label="Género">
          <Select name="gender" defaultValue={player?.gender ?? ""}>
            <option value="">—</option>
            {GENDERS.filter((g) => g.value !== "mixed").map((g) => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="Número (dorsal)"><Input type="number" min={0} max={99} name="jersey_number" defaultValue={player?.jersey_number ?? ""} /></Field>
        <Field label="Encargado"><Input name="guardian_name" defaultValue={player?.guardian_name ?? ""} /></Field>
        <Field label="Teléfono encargado"><Input type="tel" name="guardian_phone" defaultValue={player?.guardian_phone ?? ""} /></Field>
      </fieldset>

      <fieldset className="grid gap-3 sm:grid-cols-3">
        <legend className="mb-2 text-sm font-semibold">Medidas</legend>
        <Field label="Estatura (cm)"><Input type="number" step="0.1" name="height_cm" defaultValue={player?.height_cm ?? ""} /></Field>
        <Field label="Peso (kg)"><Input type="number" step="0.1" name="weight_kg" defaultValue={player?.weight_kg ?? ""} /></Field>
        <Field label="Envergadura (cm)"><Input type="number" step="0.1" name="wingspan_cm" defaultValue={player?.wingspan_cm ?? ""} /></Field>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Posiciones</legend>
        <div className="flex flex-wrap gap-2">
          {POSITIONS.map((p) => (
            <label key={p.value} className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/10">
              <input type="checkbox" name="positions" value={p.value} defaultChecked={player?.positions?.includes(p.value)} className="accent-[var(--brand)]" />
              {p.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Equipos</legend>
        {teams.length === 0 ? (
          <p className="text-sm text-muted-foreground">Primero creá equipos.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {teams.map((t) => (
              <label key={t.id} className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/10">
                <input type="checkbox" name="team_id" value={t.id} defaultChecked={sel.has(t.id)} className="accent-[var(--brand)]" />
                {t.name} <span className="text-xs text-muted-foreground">{t.category}</span>
              </label>
            ))}
          </div>
        )}
      </fieldset>

      <Field label="Perfil / observaciones">
        <Textarea name="profile" rows={4} defaultValue={player?.profile ?? ""} placeholder="Fortalezas, aspectos a mejorar, historial…" />
      </Field>

      {player && (
        <label className="flex items-center gap-2 text-sm">
          <input type="hidden" name="active_present" value="1" />
          <input type="checkbox" name="active" defaultChecked={player.active} className="accent-[var(--brand)]" />
          Atleta activo
        </label>
      )}

      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}
