"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function respondCallup(
  token: string,
  callupId: string,
  status: "confirmed" | "declined",
  transport: "bus" | "own" | null,
  note: string,
) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("guest_respond_callup", {
    p_token: token,
    p_callup_id: callupId,
    p_status: status,
    p_transport: transport,
    p_note: note.trim() || null,
  });
  if (error || !data) return { ok: false as const };
  revalidatePath(`/c/${token}`);
  return { ok: true as const };
}
