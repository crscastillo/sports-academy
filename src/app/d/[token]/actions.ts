"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function pledgeDonation(
  token: string,
  itemId: string,
  input: { parentName: string; playerName: string; phone: string; quantity: number; note: string },
) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("guest_pledge_donation", {
    p_token: token,
    p_item_id: itemId,
    p_parent_name: input.parentName,
    p_player_name: input.playerName.trim() || null,
    p_phone: input.phone.trim() || null,
    p_quantity: input.quantity,
    p_note: input.note.trim() || null,
  });
  if (error || !data) return { ok: false as const };
  revalidatePath(`/d/${token}`);
  return { ok: true as const };
}
