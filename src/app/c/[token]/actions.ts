"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getRepositories } from "@/lib/repositories";

const GUARDIAN_COOKIE = "sa_guardian";
const GUARDIAN_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export async function setGuardian(token: string, name: string, playerIds: string[]) {
  const cleanName = name.trim().slice(0, 120);
  if (!cleanName) return { ok: false as const };

  const { matchdays } = await getRepositories();
  const data = await matchdays.guestGetCallups(token);
  if (!data) return { ok: false as const };
  const rosterIds = new Set((data as { players: { player_id: string }[] }).players.map((p) => p.player_id));
  const validIds = playerIds.filter((id) => rosterIds.has(id));
  if (validIds.length === 0) return { ok: false as const };

  (await cookies()).set(GUARDIAN_COOKIE, JSON.stringify({ name: cleanName, playerIds: validIds }), {
    maxAge: GUARDIAN_MAX_AGE,
    path: "/c",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  revalidatePath(`/c/${token}`);
  return { ok: true as const };
}

export async function clearGuardian(token: string) {
  (await cookies()).delete({ name: GUARDIAN_COOKIE, path: "/c" });
  revalidatePath(`/c/${token}`);
  return { ok: true as const };
}

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
