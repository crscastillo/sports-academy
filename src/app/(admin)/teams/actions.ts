"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { list, str } from "@/lib/form";

function teamFields(fd: FormData) {
  return {
    name: str(fd, "name") ?? "",
    category: str(fd, "category") ?? "",
    gender: str(fd, "gender") ?? "mixed",
    season: str(fd, "season"),
    coach_id: str(fd, "coach_id"),
  };
}

export async function createTeam(fd: FormData) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("teams").insert(teamFields(fd)).select("id").single();
  if (error) throw new Error(error.message);
  revalidatePath("/teams");
  redirect(`/teams/${data.id}`);
}

export async function updateTeam(id: string, fd: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("teams").update(teamFields(fd)).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/teams/${id}`);
  revalidatePath("/teams");
}

export async function deleteTeam(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("teams").delete().eq("id", id);
  if (error) throw new Error("No se puede eliminar: el equipo tiene partidos asociados.");
  revalidatePath("/teams");
  redirect("/teams");
}

export async function addPlayersToTeam(teamId: string, fd: FormData) {
  const ids = list(fd, "player_id");
  if (ids.length === 0) return;
  const supabase = await createClient();
  const { error } = await supabase
    .from("team_players")
    .upsert(ids.map((player_id) => ({ team_id: teamId, player_id })), { ignoreDuplicates: true });
  if (error) throw new Error(error.message);
  revalidatePath(`/teams/${teamId}`);
}

export async function removePlayerFromTeam(teamId: string, playerId: string) {
  const supabase = await createClient();
  await supabase.from("team_players").delete().eq("team_id", teamId).eq("player_id", playerId);
  revalidatePath(`/teams/${teamId}`);
}
