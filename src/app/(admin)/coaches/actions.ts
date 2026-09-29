"use server";

import { revalidatePath } from "next/cache";
import { getRepositories } from "@/lib/repositories";
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
  const { coaches } = await getRepositories();
  await coaches.create(coachFields(fd));
  revalidatePath("/coaches");
}

export async function updateCoach(id: string, fd: FormData) {
  const { coaches } = await getRepositories();
  await coaches.update(id, coachFields(fd));
  revalidatePath("/coaches");
}

export async function deleteCoach(id: string) {
  const { coaches } = await getRepositories();
  await coaches.delete(id);
  revalidatePath("/coaches");
}

export async function setDefaultCoach(id: string) {
  const { coaches } = await getRepositories();
  await coaches.setDefault(id);
  revalidatePath("/coaches");
  revalidatePath("/teams");
}

export async function unsetDefaultCoach(id: string) {
  const { coaches } = await getRepositories();
  await coaches.unsetDefault(id);
  revalidatePath("/coaches");
  revalidatePath("/teams");
}

export async function inviteCoach(id: string) {
  const { coaches } = await getRepositories();
  await coaches.invite(id);
  revalidatePath("/coaches");
  revalidatePath("/staff");
}
