"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
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
  const supabase = await createClient();
  const { error } = await supabase.from("coaches").insert(coachFields(fd));
  if (error) throw new Error(error.message);
  revalidatePath("/coaches");
}

export async function updateCoach(id: string, fd: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("coaches").update(coachFields(fd)).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/coaches");
}

export async function deleteCoach(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("coaches").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/coaches");
}

export async function setDefaultCoach(id: string) {
  const supabase = await createClient();
  await supabase.from("coaches").update({ is_default: false }).eq("is_default", true);
  const { error } = await supabase.from("coaches").update({ is_default: true }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/coaches");
  revalidatePath("/teams");
}

export async function unsetDefaultCoach(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("coaches").update({ is_default: false }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/coaches");
  revalidatePath("/teams");
}

export async function inviteCoach(id: string) {
  const supabase = await createClient();
  const { data: coach, error: coachError } = await supabase
    .from("coaches")
    .select("full_name, email")
    .eq("id", id)
    .single();
  if (coachError || !coach) throw new Error("Entrenador no encontrado");
  if (!coach.email) throw new Error("Agregá un correo antes de invitar");

  const { error } = await supabase.from("staff").upsert({ email: coach.email, full_name: coach.full_name });
  if (error) throw new Error(error.message);
  revalidatePath("/coaches");
  revalidatePath("/staff");
}
