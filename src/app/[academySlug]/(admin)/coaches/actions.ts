"use server";

import { revalidatePath } from "next/cache";
import { getRepositories } from "@/lib/repositories";
import { paths } from "@/lib/paths";
import { str } from "@/lib/form";

function coachFields(fd: FormData) {
  return {
    full_name: str(fd, "full_name") ?? "",
    email: str(fd, "email")?.toLowerCase() ?? null,
    phone: str(fd, "phone"),
    type: str(fd, "type") ?? "head",
  };
}

export async function createCoach(fd: FormData) {
  const { coaches, academy } = await getRepositories();
  await coaches.create(coachFields(fd));
  revalidatePath(paths.coaches.list(await academy.getSlug()));
}

export async function updateCoach(id: string, fd: FormData) {
  const { coaches, academy } = await getRepositories();
  await coaches.update(id, coachFields(fd));
  revalidatePath(paths.coaches.list(await academy.getSlug()));
}

export async function deleteCoach(id: string) {
  const { coaches, academy } = await getRepositories();
  await coaches.delete(id);
  revalidatePath(paths.coaches.list(await academy.getSlug()));
}

export async function setDefaultCoach(id: string) {
  const { coaches, academy } = await getRepositories();
  await coaches.setDefault(id);
  const slug = await academy.getSlug();
  revalidatePath(paths.coaches.list(slug));
  revalidatePath(paths.teams.list(slug));
}

export async function unsetDefaultCoach(id: string) {
  const { coaches, academy } = await getRepositories();
  await coaches.unsetDefault(id);
  const slug = await academy.getSlug();
  revalidatePath(paths.coaches.list(slug));
  revalidatePath(paths.teams.list(slug));
}

export async function inviteCoach(id: string) {
  const { coaches, academy } = await getRepositories();
  await coaches.invite(id);
  const slug = await academy.getSlug();
  revalidatePath(paths.coaches.list(slug));
  revalidatePath(paths.staff.list(slug));
}
