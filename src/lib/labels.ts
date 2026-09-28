export const GENDERS = [
  { value: "male", label: "Masculino" },
  { value: "female", label: "Femenino" },
  { value: "mixed", label: "Mixto" },
] as const;

export const genderLabel = (g?: string | null) =>
  GENDERS.find((x) => x.value === g)?.label ?? "—";

export const POSITIONS = [
  { value: "PG", label: "Base (PG)" },
  { value: "SG", label: "Escolta (SG)" },
  { value: "SF", label: "Alero (SF)" },
  { value: "PF", label: "Ala-pívot (PF)" },
  { value: "C", label: "Pívot (C)" },
] as const;

export const TRAINING_STATUS = [
  { value: "planned", label: "Planificado" },
  { value: "completed", label: "Realizado" },
  { value: "cancelled", label: "Cancelado" },
] as const;

export const trainingStatusLabel = (s?: string | null) =>
  TRAINING_STATUS.find((x) => x.value === s)?.label ?? "—";

export const CALLUP_STATUS: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  declined: "No asiste",
};

export const TRANSPORT: Record<string, string> = {
  bus: "Buseta",
  own: "Medios propios",
};

export const DONATION_KINDS = [
  { value: "snack_bar", label: "Soda" },
  { value: "sale", label: "Ventas" },
  { value: "other", label: "Otros" },
] as const;

export const donationKindLabel = (k?: string | null) =>
  DONATION_KINDS.find((x) => x.value === k)?.label ?? "—";

export function formatDate(d?: string | null, opts?: Intl.DateTimeFormatOptions) {
  if (!d) return "—";
  const [y, m, day] = d.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, day).toLocaleDateString("es-CR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    ...opts,
  });
}

export const formatTime = (t?: string | null) => (t ? t.slice(0, 5) : "—");

export function ageOn(birth?: string | null, on = new Date()) {
  if (!birth) return null;
  const b = new Date(birth + "T00:00:00");
  let age = on.getFullYear() - b.getFullYear();
  const m = on.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && on.getDate() < b.getDate())) age--;
  return age;
}

export function todayISO() {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}
