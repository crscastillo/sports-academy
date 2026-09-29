"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getRepositories } from "@/lib/repositories";
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

export async function createPlayer(fd: FormData) {
  const { players } = await getRepositories();
  const id = await players.create(playerFields(fd));
  await players.syncTeams(id, list(fd, "team_id"));
  const avatarUrl = await players.uploadAvatar(id, fd.get("avatar"));
  if (avatarUrl) await players.setAvatarUrl(id, avatarUrl);
  revalidatePath("/players");
  redirect(`/players/${id}`);
}

export async function updatePlayer(id: string, fd: FormData) {
  const { players } = await getRepositories();
  const avatarUrl = await players.uploadAvatar(id, fd.get("avatar"));
  await players.update(id, { ...playerFields(fd), ...(avatarUrl ? { avatar_url: avatarUrl } : {}) });
  await players.syncTeams(id, list(fd, "team_id"));
  revalidatePath("/players");
  revalidatePath(`/players/${id}`);
  redirect("/players");
}

export async function deletePlayer(id: string) {
  const { players } = await getRepositories();
  await players.removeAvatar(id);
  await players.delete(id);
  revalidatePath("/players");
  redirect("/players");
}
