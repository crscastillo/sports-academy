"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { num, str } from "@/lib/form";

function paymentPath(period: string) {
  return `/payments?period=${period}`;
}

export async function upsertPayment(playerId: string, period: string, fd: FormData) {
  const supabase = await createClient();
  const { data: academy } = await supabase.from("academies").select("id").single();
  if (!academy) return;

  const status = str(fd, "status") ?? "pending";
  const { error } = await supabase.from("payments").upsert(
    {
      academy_id: academy.id,
      player_id: playerId,
      period,
      status,
      amount: num(fd, "amount"),
      paid_at: status === "paid" ? (str(fd, "paid_at") ?? new Date().toISOString().slice(0, 10)) : str(fd, "paid_at"),
      notes: str(fd, "notes"),
    },
    { onConflict: "player_id,period" }
  );
  if (error) throw new Error(error.message);
  revalidatePath(paymentPath(period));
}

export async function generateMonthPayments(period: string, fd: FormData) {
  const supabase = await createClient();
  const { data: academy } = await supabase.from("academies").select("id, default_monthly_fee").single();
  if (!academy) return;

  const [{ data: players }, { data: existing }] = await Promise.all([
    supabase.from("players").select("id").eq("active", true),
    supabase.from("payments").select("player_id").eq("period", period),
  ]);
  const existingIds = new Set((existing ?? []).map((p) => p.player_id));
  const amount = num(fd, "amount") ?? academy.default_monthly_fee ?? null;
  const missing = (players ?? []).filter((p) => !existingIds.has(p.id));
  if (missing.length === 0) return;

  const { error } = await supabase.from("payments").insert(
    missing.map((p) => ({ academy_id: academy.id, player_id: p.id, period, amount, status: "pending" as const }))
  );
  if (error) throw new Error(error.message);
  revalidatePath(paymentPath(period));
}
