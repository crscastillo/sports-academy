"use server";

import { revalidatePath } from "next/cache";
import { getRepositories } from "@/lib/repositories";
import { paths } from "@/lib/paths";
import { num, str } from "@/lib/form";

export async function upsertPayment(playerId: string, period: string, fd: FormData) {
  const { academy, payments } = await getRepositories();
  const settings = await academy.getSettings();
  if (!settings) return;

  const status = str(fd, "status") ?? "pending";
  await payments.upsert({
    academy_id: settings.id,
    player_id: playerId,
    period,
    status,
    amount: num(fd, "amount"),
    paid_at: status === "paid" ? (str(fd, "paid_at") ?? new Date().toISOString().slice(0, 10)) : str(fd, "paid_at"),
    notes: str(fd, "notes"),
  });
  revalidatePath(paths.payments.list(settings.slug, period));
}

export async function generateMonthPayments(period: string, fd: FormData) {
  const { academy, players, payments } = await getRepositories();
  const settings = await academy.getSettings();
  if (!settings) return;

  const [activePlayers, existing] = await Promise.all([players.listActiveIds(), payments.listPlayerIdsForPeriod(period)]);
  const existingIds = new Set(existing.map((p) => p.player_id));
  const amount = num(fd, "amount") ?? settings.default_monthly_fee ?? null;
  const missing = activePlayers.filter((p) => !existingIds.has(p.id));
  if (missing.length === 0) return;

  await payments.insertMany(missing.map((p) => ({ academy_id: settings.id, player_id: p.id, period, amount, status: "pending" as const })));
  revalidatePath(paths.payments.list(settings.slug, period));
}
