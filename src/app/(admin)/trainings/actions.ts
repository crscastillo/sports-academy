"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { list, num, str } from "@/lib/form";

function fields(fd: FormData) {
  return {
    date: str(fd, "date") ?? "",
    start_time: str(fd, "start_time"),
    end_time: str(fd, "end_time"),
    location: str(fd, "location"),
    status: str(fd, "status") ?? "planned",
    plan: str(fd, "plan"),
    notes: str(fd, "notes"),
    observations: str(fd, "observations"),
  };
}

function addDays(iso: string, days: number) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

export async function createTraining(fd: FormData) {
  const supabase = await createClient();
  const base = fields(fd);
  const teamIds = list(fd, "team_id");
  const repeat = Math.min(Math.max(num(fd, "repeat_weeks") ?? 0, 0), 26);

  const rows = Array.from({ length: repeat + 1 }, (_, i) => ({ ...base, date: addDays(base.date, i * 7) }));
  const { data, error } = await supabase.from("trainings").insert(rows).select("id");
  if (error) throw new Error(error.message);

  if (teamIds.length) {
    const links = data.flatMap((t) => teamIds.map((team_id) => ({ training_id: t.id, team_id })));
    const { error: e2 } = await supabase.from("training_teams").insert(links);
    if (e2) throw new Error(e2.message);
  }
  revalidatePath("/trainings");
  redirect(repeat > 0 ? `/trainings?week=${base.date}` : `/trainings/${data[0].id}`);
}

export async function updateTraining(id: string, fd: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("trainings").update(fields(fd)).eq("id", id);
  if (error) throw new Error(error.message);
  await supabase.from("training_teams").delete().eq("training_id", id);
  const teamIds = list(fd, "team_id");
  if (teamIds.length) {
    await supabase.from("training_teams").insert(teamIds.map((team_id) => ({ training_id: id, team_id })));
  }
  revalidatePath("/trainings");
  revalidatePath(`/trainings/${id}`);
}

export async function deleteTraining(id: string) {
  const supabase = await createClient();
  await supabase.from("trainings").delete().eq("id", id);
  revalidatePath("/trainings");
  redirect("/trainings");
}
