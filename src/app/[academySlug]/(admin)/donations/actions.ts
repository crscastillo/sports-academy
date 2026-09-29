"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getRepositories } from "@/lib/repositories";
import { paths } from "@/lib/paths";
import { num, str } from "@/lib/form";

const refresh = (slug: string, listId: string) => {
  revalidatePath(paths.donations.detail(slug, listId));
  revalidatePath(paths.donations.list(slug));
};

export async function createDonationList(fd: FormData) {
  const { donations, academy } = await getRepositories();
  const id = await donations.create({
    title: str(fd, "title") ?? "Lista de donaciones",
    description: str(fd, "description"),
    matchday_id: str(fd, "matchday_id"),
  });
  const slug = await academy.getSlug();
  revalidatePath(paths.donations.list(slug));
  redirect(paths.donations.detail(slug, id));
}

export async function updateDonationList(id: string, fd: FormData) {
  const { donations, academy } = await getRepositories();
  await donations.update(id, {
    title: str(fd, "title") ?? "Lista de donaciones",
    description: str(fd, "description"),
    matchday_id: str(fd, "matchday_id"),
  });
  refresh(await academy.getSlug(), id);
}

export async function toggleDonationList(id: string, isOpen: boolean) {
  const { donations, academy } = await getRepositories();
  await donations.setOpen(id, isOpen);
  refresh(await academy.getSlug(), id);
}

export async function deleteDonationList(id: string) {
  const { donations, academy } = await getRepositories();
  await donations.delete(id);
  const slug = await academy.getSlug();
  revalidatePath(paths.donations.list(slug));
  redirect(paths.donations.list(slug));
}

export async function addDonationItem(listId: string, fd: FormData) {
  const { donations, academy } = await getRepositories();
  await donations.addItem(listId, {
    name: str(fd, "name") ?? "",
    kind: str(fd, "kind") ?? "snack_bar",
    quantity_needed: Math.max(1, num(fd, "quantity_needed") ?? 1),
    unit: str(fd, "unit"),
    notes: str(fd, "notes"),
  });
  refresh(await academy.getSlug(), listId);
}

export async function deleteDonationItem(itemId: string, listId: string) {
  const { donations, academy } = await getRepositories();
  await donations.deleteItem(itemId);
  refresh(await academy.getSlug(), listId);
}

export async function deletePledge(pledgeId: string, listId: string) {
  const { donations, academy } = await getRepositories();
  await donations.deletePledge(pledgeId);
  refresh(await academy.getSlug(), listId);
}
