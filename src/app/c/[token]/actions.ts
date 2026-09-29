"use server";

import { revalidatePath } from "next/cache";
import { getRepositories } from "@/lib/repositories";

export async function respondCallup(
  token: string,
  callupId: string,
  status: "confirmed" | "declined",
  note: string,
) {
  const { matchdays } = await getRepositories();
  const ok = await matchdays.guestRespondCallup(token, callupId, status, note);
  if (!ok) return { ok: false as const };
  revalidatePath(`/c/${token}`);
  return { ok: true as const };
}

export async function setTransport(token: string, playerId: string, transport: "bus" | "own" | "no_go") {
  const { matchdays } = await getRepositories();
  const ok = await matchdays.guestSetTransport(token, playerId, transport);
  if (!ok) return { ok: false as const };
  revalidatePath(`/c/${token}`);
  return { ok: true as const };
}
