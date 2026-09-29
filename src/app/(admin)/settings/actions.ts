"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { bool, num } from "@/lib/form";

export async function updatePaymentSettings(fd: FormData) {
  const supabase = await createClient();
  const { data: academy } = await supabase.from("academies").select("id").single();
  if (!academy) return;

  const { error } = await supabase
    .from("academies")
    .update({ track_payments: bool(fd, "track_payments"), default_monthly_fee: num(fd, "default_monthly_fee") })
    .eq("id", academy.id);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
  revalidatePath("/payments");
}

export async function updateAgeThresholds(fd: FormData) {
  const supabase = await createClient();
  const { data: academy } = await supabase.from("academies").select("id").single();
  if (!academy) return;

  const min = num(fd, "age_eligibility_min") ?? 0;
  const max = num(fd, "age_eligibility_max");

  const { error } = await supabase
    .from("academies")
    .update({ age_eligibility_min: min, age_eligibility_max: max })
    .eq("id", academy.id);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}
