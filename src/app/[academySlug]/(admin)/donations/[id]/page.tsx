import Link from "next/link";
import { notFound } from "next/navigation";
import { getRepositories } from "@/lib/repositories";
import { Badge, Card, Field, Input, PageHeader, Select } from "@/components/ui";
import { ConfirmSubmit, ShareLink, SubmitButton } from "@/components/client";
import { DONATION_KINDS, donationKindLabel, formatDate } from "@/lib/labels";
import { paths } from "@/lib/paths";
import {
  addDonationItem, deleteDonationItem, deleteDonationList, deletePledge, toggleDonationList, updateDonationList,
} from "../actions";

type Item = {
  id: string; name: string; kind: string; quantity_needed: number; unit: string | null; notes: string | null; sort_order: number;
  donation_pledges: { id: string; parent_name: string; player_name: string | null; phone: string | null; quantity: number; note: string | null }[];
};

export default async function DonationListPage({ params }: PageProps<"/[academySlug]/donations/[id]">) {
  const { academySlug, id } = await params;
  const { donations } = await getRepositories();
  const [list, itemsData, homeDays] = await Promise.all([
    donations.getById(id),
    donations.getItems(id),
    donations.listLinkableMatchdays(false),
  ]);
  if (!list) notFound();
  const items = itemsData as unknown as Item[];

  return (
    <>
      <PageHeader
        title={list.title}
        subtitle={list.matchday ? <Link href={paths.matchdays.detail(academySlug, list.matchday.id)} className="hover:underline">{formatDate(list.matchday.date)} · {list.matchday.venue}</Link> : "Sin jornada asociada"}
        action={<Link href={paths.donations.list(academySlug)} className="text-sm text-muted-foreground hover:underline">← Donaciones</Link>}
      />

      <Card title="Link para padres" className="mb-6" action={list.is_open ? <Badge tone="green">Abierta</Badge> : <Badge tone="red">Cerrada</Badge>}>
        <p className="mb-3 text-sm text-muted-foreground">Compartí este enlace en el chat de padres. Cada quien se anota con lo que va a traer. No requiere cuenta.</p>
        <ShareLink path={`/d/${list.share_token}`} label="Copiar link" />
        <form action={toggleDonationList.bind(null, id, !list.is_open)} className="mt-3">
          <SubmitButton variant="secondary">{list.is_open ? "Cerrar lista (no más anotaciones)" : "Reabrir lista"}</SubmitButton>
        </form>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {items.length === 0 && <p className="text-sm text-muted-foreground">Agregá los artículos que se necesitan.</p>}
          {items.map((i) => {
            const got = i.donation_pledges.reduce((s, p) => s + p.quantity, 0);
            const full = got >= i.quantity_needed;
            return (
              <Card key={i.id}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{i.name}</span>
                      <Badge tone={i.kind === "sale" ? "blue" : "brand"}>{donationKindLabel(i.kind)}</Badge>
                    </div>
                    {i.notes && <div className="text-sm text-muted-foreground">{i.notes}</div>}
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone={full ? "green" : "amber"}>{got} / {i.quantity_needed} {i.unit ?? ""}</Badge>
                    <form action={deleteDonationItem.bind(null, i.id, id)}>
                      <ConfirmSubmit message={`¿Eliminar "${i.name}" y sus anotaciones?`}>Eliminar</ConfirmSubmit>
                    </form>
                  </div>
                </div>
                {i.donation_pledges.length > 0 && (
                  <ul className="mt-3 divide-y divide-border rounded-lg border border-border text-sm">
                    {i.donation_pledges.map((p) => (
                      <li key={p.id} className="flex items-center justify-between gap-2 px-3 py-1.5">
                        <span>
                          <strong>{p.quantity}</strong> · {p.parent_name}
                          {p.player_name && <span className="text-muted-foreground"> ({p.player_name})</span>}
                          {p.phone && <span className="text-muted-foreground"> · {p.phone}</span>}
                          {p.note && <span className="block text-xs text-muted-foreground">{p.note}</span>}
                        </span>
                        <form action={deletePledge.bind(null, p.id, id)}>
                          <button className="text-xs text-muted-foreground hover:text-red-600">✕</button>
                        </form>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            );
          })}
        </div>

        <div className="space-y-6">
          <Card title="Agregar artículo">
            <form action={addDonationItem.bind(null, id)} className="grid grid-cols-2 gap-2">
              <Field label="Artículo" className="col-span-2"><Input name="name" required placeholder="Refrescos 2L" /></Field>
              <Field label="Tipo">
                <Select name="kind" defaultValue="snack_bar">
                  {DONATION_KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
                </Select>
              </Field>
              <Field label="Cantidad"><Input type="number" min={1} name="quantity_needed" defaultValue={1} required /></Field>
              <Field label="Unidad"><Input name="unit" placeholder="unid., kg, paquetes" /></Field>
              <Field label="Nota"><Input name="notes" /></Field>
              <div className="col-span-2"><SubmitButton>Agregar</SubmitButton></div>
            </form>
          </Card>
          <Card title="Editar lista">
            <form action={updateDonationList.bind(null, id)} className="space-y-2">
              <Field label="Título"><Input name="title" defaultValue={list.title} required /></Field>
              <Field label="Descripción"><Input name="description" defaultValue={list.description ?? ""} /></Field>
              <Field label="Jornada">
                <Select name="matchday_id" defaultValue={list.matchday_id ?? ""}>
                  <option value="">— Ninguna —</option>
                  {homeDays?.map((m) => <option key={m.id} value={m.id}>{formatDate(m.date, { weekday: undefined })} · {m.title ?? m.venue}</option>)}
                </Select>
              </Field>
              <SubmitButton variant="secondary">Guardar</SubmitButton>
            </form>
          </Card>
          <form action={deleteDonationList.bind(null, id)}>
            <ConfirmSubmit message="¿Eliminar la lista completa?">Eliminar lista</ConfirmSubmit>
          </form>
        </div>
      </div>
    </>
  );
}
