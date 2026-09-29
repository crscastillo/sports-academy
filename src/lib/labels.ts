export const GENDERS = [
  { value: "male", label: "Masculino" },
  { value: "female", label: "Femenino" },
  { value: "mixed", label: "Mixto" },
] as const;

export const COACH_TYPES = [
  { value: "head", label: "Entrenador principal" },
  { value: "assistant", label: "Asistente" },
  { value: "young_assistant", label: "Asistente de divisiones menores" },
] as const;

export const coachTypeLabel = (t?: string | null) =>
  COACH_TYPES.find((x) => x.value === t)?.label ?? "—";

export const CATEGORIES = [
  ...Array.from({ length: 17 }, (_, i) => `U${i + 8}`), // U8..U24
  "Juegos Nacionales",
  "2da",
  "1era",
  "Master",
] as const;

// Age cap for a "U<n>" category, or null for the open categories (Master, 2da, 1era, Juegos Nacionales).
export function categoryAgeCap(category: string): number | null {
  const m = /^U(\d+)$/.exec(category);
  return m ? Number(m[1]) : null;
}

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

export const PAYMENT_STATUS = [
  { value: "pending", label: "Pendiente" },
  { value: "paid", label: "Pagado" },
  { value: "waived", label: "Exonerado" },
] as const;

export const paymentStatusLabel = (s?: string | null) =>
  PAYMENT_STATUS.find((x) => x.value === s)?.label ?? "—";

export function monthStart(iso: string) {
  return iso.slice(0, 7) + "-01";
}
export function shiftMonth(iso: string, delta: number) {
  const [y, m] = iso.slice(0, 7).split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 10);
}
export function monthLabel(iso: string) {
  const [y, m] = iso.slice(0, 7).split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("es-CR", { month: "long", year: "numeric" });
}

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

// Age a player reaches at some point during `on`'s calendar year (birthday-agnostic),
// which is how youth-sports category cutoffs like "U13" are defined.
export function ageAchievedThisYear(birth?: string | null, on = new Date()) {
  if (!birth) return null;
  const y = Number(birth.slice(0, 4));
  return Number.isFinite(y) ? on.getFullYear() - y : null;
}

export function todayISO() {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}
