"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getRepositories } from "@/lib/repositories";
import { paths } from "@/lib/paths";
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
  const { players, academy } = await getRepositories();
  const id = await players.create(playerFields(fd));
  await players.syncTeams(id, list(fd, "team_id"));
  const avatarUrl = await players.uploadAvatar(id, fd.get("avatar"));
  if (avatarUrl) await players.setAvatarUrl(id, avatarUrl);
  const slug = await academy.getSlug();
  revalidatePath(paths.players.list(slug));
  redirect(paths.players.detail(slug, id));
}

export async function updatePlayer(id: string, fd: FormData) {
  const { players, academy } = await getRepositories();
  const avatarUrl = await players.uploadAvatar(id, fd.get("avatar"));
  await players.update(id, { ...playerFields(fd), ...(avatarUrl ? { avatar_url: avatarUrl } : {}) });
  await players.syncTeams(id, list(fd, "team_id"));
  const slug = await academy.getSlug();
  revalidatePath(paths.players.list(slug));
  revalidatePath(paths.players.detail(slug, id));
  redirect(paths.players.list(slug));
}

export async function deletePlayer(id: string) {
  const { players, academy } = await getRepositories();
  await players.removeAvatar(id);
  await players.delete(id);
  const slug = await academy.getSlug();
  revalidatePath(paths.players.list(slug));
  redirect(paths.players.list(slug));
}
