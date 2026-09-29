"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getRepositories } from "@/lib/repositories";
import { paths } from "@/lib/paths";
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
  const { teams, academy } = await getRepositories();
  const id = await teams.create(teamFields(fd));
  const slug = await academy.getSlug();
  revalidatePath(paths.teams.list(slug));
  redirect(paths.teams.detail(slug, id));
}

export async function updateTeam(id: string, fd: FormData) {
  const { teams, academy } = await getRepositories();
  await teams.update(id, teamFields(fd));
  const slug = await academy.getSlug();
  revalidatePath(paths.teams.detail(slug, id));
  revalidatePath(paths.teams.list(slug));
}

export async function deleteTeam(id: string) {
  const { teams, academy } = await getRepositories();
  await teams.delete(id);
  const slug = await academy.getSlug();
  revalidatePath(paths.teams.list(slug));
  redirect(paths.teams.list(slug));
}

export async function addPlayersToTeam(teamId: string, fd: FormData) {
  const { teams, academy } = await getRepositories();
  await teams.addPlayers(teamId, list(fd, "player_id"));
  const slug = await academy.getSlug();
  revalidatePath(paths.teams.detail(slug, teamId));
}

export async function removePlayerFromTeam(teamId: string, playerId: string) {
  const { teams, academy } = await getRepositories();
  await teams.removePlayer(teamId, playerId);
  const slug = await academy.getSlug();
  revalidatePath(paths.teams.detail(slug, teamId));
}
