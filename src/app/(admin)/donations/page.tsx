import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, Empty, Field, Input, PageHeader, Select } from "@/components/ui";
import { SubmitButton } from "@/components/client";
import { formatDate, todayISO } from "@/lib/labels";
import { createDonationList } from "./actions";

export const metadata = { title: "Donaciones" };

type Row = {
  id: string; title: string; is_open: boolean; created_at: string;
  matchday: { date: string; venue: string } | null;
  donation_items: { quantity_needed: number; donation_pledges: { quantity: number }[] }[];
};

export default async function DonationsPage() {
  const supabase = await createClient();
  const [{ data }, { data: homeDays }] = await Promise.all([
    supabase
      .from("donation_lists")
      .select("id, title, is_open, created_at, matchday:matchdays(date, venue), donation_items(quantity_needed, donation_pledges(quantity))")
      .order("created_at", { ascending: false }),
    supabase.from("matchdays").select("id, title, date, venue").eq("is_home", true).gte("date", todayISO()).order("date"),
  ]);
  const lists = (data ?? []) as unknown as Row[];

  return (
    <>
      <PageHeader title="Donaciones" subtitle="Listas de soda y ventas para jornadas en casa" />
      <Card title="Nueva lista" className="mb-6">
        <form action={createDonationList} className="grid gap-3 sm:grid-cols-3">
          <Field label="Título"><Input name="title" required placeholder="Soda jornada 12 de octubre" /></Field>
          <Field label="Jornada en casa (opcional)">
            <Select name="matchday_id" defaultValue="">
              <option value="">— Ninguna —</option>
              {homeDays?.map((m) => <option key={m.id} value={m.id}>{formatDate(m.date, { weekday: undefined })} · {m.title ?? m.venue}</option>)}
            </Select>
          </Field>
          <Field label="Descripción"><Input name="description" placeholder="Entregar en la soda antes de las 8am" /></Field>
          <div><SubmitButton>Crear lista</SubmitButton></div>
        </form>
      </Card>
      {lists.length === 0 ? (
        <Empty>No hay listas todavía.</Empty>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {lists.map((l) => {
            const need = l.donation_items.reduce((s, i) => s + i.quantity_needed, 0);
            const got = l.donation_items.reduce((s, i) => s + Math.min(i.quantity_needed, i.donation_pledges.reduce((a, p) => a + p.quantity, 0)), 0);
            const pct = need ? Math.round((got / need) * 100) : 0;
            return (
              <Link key={l.id} href={`/donations/${l.id}`} className="block rounded-xl border border-line bg-surface p-4 shadow-sm hover:border-brand">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold">{l.title}</div>
                    <div className="text-sm text-muted">{l.matchday ? `${formatDate(l.matchday.date)} · ${l.matchday.venue}` : "Sin jornada"}</div>
                  </div>
                  {l.is_open ? <Badge tone="green">Abierta</Badge> : <Badge>Cerrada</Badge>}
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-canvas">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-1 text-xs text-muted">{l.donation_items.length} artículos · {pct}% cubierto</div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
