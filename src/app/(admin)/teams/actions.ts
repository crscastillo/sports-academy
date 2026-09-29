"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getRepositories } from "@/lib/repositories";
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
  const { teams } = await getRepositories();
  const id = await teams.create(teamFields(fd));
  revalidatePath("/teams");
  redirect(`/teams/${id}`);
}

export async function updateTeam(id: string, fd: FormData) {
  const { teams } = await getRepositories();
  await teams.update(id, teamFields(fd));
  revalidatePath(`/teams/${id}`);
  revalidatePath("/teams");
}

export async function deleteTeam(id: string) {
  const { teams } = await getRepositories();
  await teams.delete(id);
  revalidatePath("/teams");
  redirect("/teams");
}

export async function addPlayersToTeam(teamId: string, fd: FormData) {
  const { teams } = await getRepositories();
  await teams.addPlayers(teamId, list(fd, "player_id"));
  revalidatePath(`/teams/${teamId}`);
}

export async function removePlayerFromTeam(teamId: string, playerId: string) {
  const { teams } = await getRepositories();
  await teams.removePlayer(teamId, playerId);
  revalidatePath(`/teams/${teamId}`);
}
