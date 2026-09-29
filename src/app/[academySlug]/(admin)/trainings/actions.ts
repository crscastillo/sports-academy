"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getRepositories } from "@/lib/repositories";
import { paths } from "@/lib/paths";
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
  const { trainings, academy } = await getRepositories();
  const base = fields(fd);
  const teamIds = list(fd, "team_id");
  const repeat = Math.min(Math.max(num(fd, "repeat_weeks") ?? 0, 0), 26);

  const rows = Array.from({ length: repeat + 1 }, (_, i) => ({ ...base, date: addDays(base.date, i * 7) }));
  const created = await trainings.create(rows);
  await trainings.linkTeams(created.map((t) => t.id), teamIds);

  const slug = await academy.getSlug();
  revalidatePath(paths.trainings.list(slug));
  redirect(repeat > 0 ? `${paths.trainings.list(slug)}?week=${base.date}` : paths.trainings.detail(slug, created[0].id));
}

export async function updateTraining(id: string, fd: FormData) {
  const { trainings, academy } = await getRepositories();
  await trainings.update(id, fields(fd));
  await trainings.setTeams(id, list(fd, "team_id"));
  const slug = await academy.getSlug();
  revalidatePath(paths.trainings.list(slug));
  revalidatePath(paths.trainings.detail(slug, id));
}

export async function deleteTraining(id: string) {
  const { trainings, academy } = await getRepositories();
  await trainings.delete(id);
  const slug = await academy.getSlug();
  revalidatePath(paths.trainings.list(slug));
  redirect(paths.trainings.list(slug));
}
