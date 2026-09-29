"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getRepositories } from "@/lib/repositories";
import { paths } from "@/lib/paths";
import { bool, num, str } from "@/lib/form";

export async function updateSlug(fd: FormData) {
  const { academy } = await getRepositories();
  const oldSlug = await academy.getSlug();
  const slug = (str(fd, "slug") ?? "").trim().toLowerCase();
  try {
    await academy.updateSlug(slug);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    redirect(`${paths.settings.list(oldSlug)}?error=${encodeURIComponent(message)}`);
  }
  redirect(paths.settings.list(slug));
}

export async function updatePaymentSettings(fd: FormData) {
  const { academy } = await getRepositories();
  await academy.updatePaymentSettings({
    track_payments: bool(fd, "track_payments"),
    default_monthly_fee: num(fd, "default_monthly_fee"),
  });
  const slug = await academy.getSlug();
  revalidatePath(paths.settings.list(slug));
  revalidatePath(paths.payments.list(slug));
}

export async function updateAgeThresholds(fd: FormData) {
  const { academy } = await getRepositories();
  await academy.updateAgeThresholds({
    age_eligibility_min: num(fd, "age_eligibility_min") ?? 0,
    age_eligibility_max: num(fd, "age_eligibility_max"),
  });
  revalidatePath(paths.settings.list(await academy.getSlug()));
}
