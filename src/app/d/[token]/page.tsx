import { notFound } from "next/navigation";
import { getRepositories } from "@/lib/repositories";
import { formatDate } from "@/lib/labels";
import { DonationBoard, type GuestItem } from "./donation-board";

export const metadata = { title: "Lista de donaciones", robots: { index: false } };

type Data = {
  list: { title: string; description: string | null; is_open: boolean };
  matchday: { date: string; venue: string; address: string | null } | null;
  items: GuestItem[];
};

export default async function GuestDonationPage({ params }: PageProps<"/d/[token]">) {
  const { token } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(token)) notFound();
  const { donations } = await getRepositories();
  const data = await donations.guestGetList(token);
  if (!data) notFound();
  const d = data as Data;

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <header className="mb-5 rounded-2xl bg-primary p-5 text-white shadow">
        <div className="text-sm opacity-90">🏀 Soda y ventas</div>
        <h1 className="text-2xl font-bold">{d.list.title}</h1>
        {d.matchday && (
          <div className="mt-1 text-sm">
            {formatDate(d.matchday.date, { weekday: "long" })} · {d.matchday.venue}
          </div>
        )}
        {d.list.description && <p className="mt-2 rounded-lg bg-white/15 p-2 text-sm">{d.list.description}</p>}
      </header>
      {!d.list.is_open && (
        <p className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          Esta lista ya está cerrada. ¡Gracias a todos!
        </p>
      )}
      <DonationBoard token={token} items={d.items} isOpen={d.list.is_open} />
    </main>
  );
}
