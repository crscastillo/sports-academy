import Link from "next/link";
import { getRepositories } from "@/lib/repositories";
import { Badge, Card, Empty, Input, PageHeader, Select, Stat } from "@/components/ui";
import { SubmitButton } from "@/components/client";
import { PAYMENT_STATUS, monthLabel, monthStart, shiftMonth, todayISO } from "@/lib/labels";
import { generateMonthPayments, upsertPayment } from "./actions";

export const metadata = { title: "Pagos" };

type PlayerRow = { id: string; first_name: string; last_name: string };
type PaymentRow = { player_id: string; amount: number | null; status: string; paid_at: string | null };

const statusTone = { pending: "amber", paid: "green", waived: "blue" } as const;

export default async function PaymentsPage({ searchParams }: PageProps<"/payments">) {
  const sp = await searchParams;
  const period = monthStart(typeof sp.period === "string" && /^\d{4}-\d{2}/.test(sp.period) ? sp.period : todayISO());

  const { academy: academyRepo, players, payments: paymentsRepo } = await getRepositories();
  const academy = await academyRepo.getSettings();

  if (!academy?.track_payments) {
    return (
      <>
        <PageHeader title="Pagos" subtitle="Seguimiento de cuotas mensuales" />
        <Empty>
          El seguimiento de pagos está desactivado — algunas academias lo llevan en otro sistema. Podés activarlo en{" "}
          <Link href="/settings" className="text-primary underline">Configuración</Link>.
        </Empty>
      </>
    );
  }

  const [playerRows, paymentRows] = await Promise.all([
    players.listActiveNames(),
    paymentsRepo.listForPeriod(period),
  ]);

  const byPlayer = new Map((paymentRows as PaymentRow[]).map((p) => [p.player_id, p]));
  const rows = (playerRows as PlayerRow[]).map((p) => ({ player: p, payment: byPlayer.get(p.id) ?? null }));

  const paid = rows.filter((r) => r.payment?.status === "paid");
  const waived = rows.filter((r) => r.payment?.status === "waived").length;
  const pending = rows.length - paid.length - waived;
  const collected = paid.reduce((sum, r) => sum + (r.payment?.amount ?? 0), 0);

  return (
    <>
      <PageHeader title="Pagos" subtitle="Seguimiento de cuotas mensuales" />

      <div className="mb-4 flex items-center justify-between gap-2">
        <Link href={`/payments?period=${shiftMonth(period, -1)}`} className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-card">← Mes anterior</Link>
        <div className="text-center text-sm font-medium capitalize">
          {monthLabel(period)}
          <Link href="/payments" className="ml-2 text-xs text-primary hover:underline">Este mes</Link>
        </div>
        <Link href={`/payments?period=${shiftMonth(period, 1)}`} className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-card">Mes siguiente →</Link>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Recaudado" value={`₡${collected.toLocaleString("es-CR")}`} />
        <Stat label="Pagados" value={paid.length} tone="text-green-600" />
        <Stat label="Pendientes" value={pending} tone="text-amber-600" />
        <Stat label="Exonerados" value={waived} />
      </div>

      <Card title="Generar cobros del mes" className="mb-6">
        <p className="mb-3 text-sm text-muted-foreground">
          Crea una cuota pendiente para cada atleta activo que todavía no tiene una este mes.
        </p>
        <form action={generateMonthPayments.bind(null, period)} className="flex flex-wrap items-end gap-2">
          <div className="w-40">
            <Input type="number" step="0.01" name="amount" placeholder="Monto" defaultValue={academy.default_monthly_fee ?? ""} />
          </div>
          <SubmitButton variant="secondary">Generar</SubmitButton>
        </form>
      </Card>

      {rows.length === 0 ? (
        <Empty>No hay atletas activos.</Empty>
      ) : (
        <div className="divide-y divide-border rounded-xl border border-border bg-card">
          {rows.map(({ player: p, payment }) => (
            <form
              key={p.id}
              action={upsertPayment.bind(null, p.id, period)}
              className="flex flex-wrap items-center gap-2 px-3 py-2.5"
            >
              <div className="flex min-w-40 flex-1 items-center gap-2">
                <span className="text-sm font-medium">{p.first_name} {p.last_name}</span>
                {payment && <Badge tone={statusTone[payment.status as keyof typeof statusTone] ?? "gray"}>{PAYMENT_STATUS.find((s) => s.value === payment.status)?.label}</Badge>}
              </div>
              <Select name="status" defaultValue={payment?.status ?? "pending"} className="w-36">
                {PAYMENT_STATUS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </Select>
              <div className="w-28">
                <Input type="number" step="0.01" name="amount" placeholder="Monto" defaultValue={payment?.amount ?? academy.default_monthly_fee ?? ""} />
              </div>
              <div className="w-36">
                <Input type="date" name="paid_at" defaultValue={payment?.paid_at ?? ""} />
              </div>
              <SubmitButton variant="secondary" className="!py-1.5 text-xs">Guardar</SubmitButton>
            </form>
          ))}
        </div>
      )}
    </>
  );
}
