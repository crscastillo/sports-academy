"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function respondCallup(
  token: string,
  callupId: string,
  status: "confirmed" | "declined",
  note: string,
) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("guest_respond_callup", {
    p_token: token,
    p_callup_id: callupId,
    p_status: status,
    p_note: note.trim() || null,
  });
  if (error || !data) return { ok: false as const };
  revalidatePath(`/c/${token}`);
  return { ok: true as const };
}

export async function setTransport(token: string, playerId: string, transport: "bus" | "own") {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("guest_set_transport", {
    p_token: token,
    p_player_id: playerId,
    p_transport: transport,
  });
  if (error || !data) return { ok: false as const };
  revalidatePath(`/c/${token}`);
  return { ok: true as const };
}
