"use server";

import { revalidatePath } from "next/cache";
import { getRepositories } from "@/lib/repositories";

export async function pledgeDonation(
  token: string,
  itemId: string,
  input: { parentName: string; playerName: string; phone: string; quantity: number; note: string },
) {
  const { donations } = await getRepositories();
  const ok = await donations.guestPledge(token, itemId, input);
  if (!ok) return { ok: false as const };
  revalidatePath(`/d/${token}`);
  return { ok: true as const };
}
