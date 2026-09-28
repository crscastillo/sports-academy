"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { num, str } from "@/lib/form";

function must<T extends { error: { message: string } | null }>(res: T) {
  if (res.error) throw new Error(res.error.message);
  return res;
}

const refresh = (listId: string) => {
  revalidatePath(`/donations/${listId}`);
  revalidatePath("/donations");
};

export async function createDonationList(fd: FormData) {
  const supabase = await createClient();
  const { data } = must(
    await supabase
      .from("donation_lists")
      .insert({ title: str(fd, "title") ?? "Lista de donaciones", description: str(fd, "description"), matchday_id: str(fd, "matchday_id") })
      .select("id")
      .single(),
  );
  revalidatePath("/donations");
  redirect(`/donations/${data!.id}`);
}

export async function updateDonationList(id: string, fd: FormData) {
  const supabase = await createClient();
  must(
    await supabase
      .from("donation_lists")
      .update({ title: str(fd, "title") ?? "Lista de donaciones", description: str(fd, "description"), matchday_id: str(fd, "matchday_id") })
      .eq("id", id),
  );
  refresh(id);
}

export async function toggleDonationList(id: string, isOpen: boolean) {
  const supabase = await createClient();
  must(await supabase.from("donation_lists").update({ is_open: isOpen }).eq("id", id));
  refresh(id);
}

export async function deleteDonationList(id: string) {
  const supabase = await createClient();
  must(await supabase.from("donation_lists").delete().eq("id", id));
  revalidatePath("/donations");
  redirect("/donations");
}

export async function addDonationItem(listId: string, fd: FormData) {
  const supabase = await createClient();
  must(
    await supabase.from("donation_items").insert({
      list_id: listId,
      name: str(fd, "name") ?? "",
      kind: str(fd, "kind") ?? "snack_bar",
      quantity_needed: Math.max(1, num(fd, "quantity_needed") ?? 1),
      unit: str(fd, "unit"),
      notes: str(fd, "notes"),
    }),
  );
  refresh(listId);
}

export async function deleteDonationItem(itemId: string, listId: string) {
  const supabase = await createClient();
  must(await supabase.from("donation_items").delete().eq("id", itemId));
  refresh(listId);
}

export async function deletePledge(pledgeId: string, listId: string) {
  const supabase = await createClient();
  must(await supabase.from("donation_pledges").delete().eq("id", pledgeId));
  refresh(listId);
}
