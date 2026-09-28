"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { bool, list, num, str } from "@/lib/form";

function playerFields(fd: FormData) {
  return {
    first_name: str(fd, "first_name") ?? "",
    last_name: str(fd, "last_name") ?? "",
    jersey_number: num(fd, "jersey_number"),
    national_id: str(fd, "national_id"),
    birth_date: str(fd, "birth_date"),
    gender: str(fd, "gender"),
    profile: str(fd, "profile"),
    height_cm: num(fd, "height_cm"),
    weight_kg: num(fd, "weight_kg"),
    wingspan_cm: num(fd, "wingspan_cm"),
    positions: list(fd, "positions"),
    guardian_name: str(fd, "guardian_name"),
    guardian_phone: str(fd, "guardian_phone"),
    active: fd.has("active_present") ? bool(fd, "active") : true,
  };
}

function friendly(msg: string) {
  return msg.includes("players_national_id_key") ? "Ya existe un atleta con esa cédula." : msg;
}

async function syncTeams(playerId: string, teamIds: string[]) {
  const supabase = await createClient();
  await supabase.from("team_players").delete().eq("player_id", playerId);
  if (teamIds.length) {
    await supabase.from("team_players").insert(teamIds.map((team_id) => ({ team_id, player_id: playerId })));
  }
}

export async function createPlayer(fd: FormData) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("players").insert(playerFields(fd)).select("id").single();
  if (error) throw new Error(friendly(error.message));
  await syncTeams(data.id, list(fd, "team_id"));
  revalidatePath("/players");
  redirect(`/players/${data.id}`);
}

export async function updatePlayer(id: string, fd: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("players").update(playerFields(fd)).eq("id", id);
  if (error) throw new Error(friendly(error.message));
  await syncTeams(id, list(fd, "team_id"));
  revalidatePath("/players");
  revalidatePath(`/players/${id}`);
  redirect("/players");
}

export async function deletePlayer(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("players").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/players");
  redirect("/players");
}
