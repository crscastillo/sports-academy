"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getRepositories } from "@/lib/repositories";
import { num, str } from "@/lib/form";

const refresh = (listId: string) => {
  revalidatePath(`/donations/${listId}`);
  revalidatePath("/donations");
};

export async function createDonationList(fd: FormData) {
  const { donations } = await getRepositories();
  const id = await donations.create({
    title: str(fd, "title") ?? "Lista de donaciones",
    description: str(fd, "description"),
    matchday_id: str(fd, "matchday_id"),
  });
  revalidatePath("/donations");
  redirect(`/donations/${id}`);
}

export async function updateDonationList(id: string, fd: FormData) {
  const { donations } = await getRepositories();
  await donations.update(id, {
    title: str(fd, "title") ?? "Lista de donaciones",
    description: str(fd, "description"),
    matchday_id: str(fd, "matchday_id"),
  });
  refresh(id);
}

export async function toggleDonationList(id: string, isOpen: boolean) {
  const { donations } = await getRepositories();
  await donations.setOpen(id, isOpen);
  refresh(id);
}

export async function deleteDonationList(id: string) {
  const { donations } = await getRepositories();
  await donations.delete(id);
  revalidatePath("/donations");
  redirect("/donations");
}

export async function addDonationItem(listId: string, fd: FormData) {
  const { donations } = await getRepositories();
  await donations.addItem(listId, {
    name: str(fd, "name") ?? "",
    kind: str(fd, "kind") ?? "snack_bar",
    quantity_needed: Math.max(1, num(fd, "quantity_needed") ?? 1),
    unit: str(fd, "unit"),
    notes: str(fd, "notes"),
  });
  refresh(listId);
}

export async function deleteDonationItem(itemId: string, listId: string) {
  const { donations } = await getRepositories();
  await donations.deleteItem(itemId);
  refresh(listId);
}

export async function deletePledge(pledgeId: string, listId: string) {
  const { donations } = await getRepositories();
  await donations.deletePledge(pledgeId);
  refresh(listId);
}
