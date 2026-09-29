"use server";

import { revalidatePath } from "next/cache";
import { getRepositories } from "@/lib/repositories";
import { bool, num } from "@/lib/form";

export async function updatePaymentSettings(fd: FormData) {
  const { academy } = await getRepositories();
  await academy.updatePaymentSettings({
    track_payments: bool(fd, "track_payments"),
    default_monthly_fee: num(fd, "default_monthly_fee"),
  });
  revalidatePath("/settings");
  revalidatePath("/payments");
}

export async function updateAgeThresholds(fd: FormData) {
  const { academy } = await getRepositories();
  await academy.updateAgeThresholds({
    age_eligibility_min: num(fd, "age_eligibility_min") ?? 0,
    age_eligibility_max: num(fd, "age_eligibility_max"),
  });
  revalidatePath("/settings");
}
