import type { SupabaseServerClient } from "./types";
import { must } from "./util";

export class DonationsRepository {
  constructor(private readonly supabase: SupabaseServerClient) {}

  async listWithProgress() {
    const { data } = await this.supabase
      .from("donation_lists")
      .select("id, title, is_open, created_at, matchday:matchdays(date, venue), donation_items(quantity_needed, donation_pledges(quantity))")
      .order("created_at", { ascending: false });
    return data ?? [];
  }

  async getById(id: string) {
    const { data } = await this.supabase.from("donation_lists").select("*, matchday:matchdays(id, date, venue)").eq("id", id).single();
    return data;
  }

  async getItems(listId: string) {
    const { data } = await this.supabase
      .from("donation_items")
      .select("id, name, kind, quantity_needed, unit, notes, sort_order, donation_pledges(id, parent_name, player_name, phone, quantity, note)")
      .eq("list_id", listId)
      .order("kind")
      .order("sort_order")
      .order("name");
    return data ?? [];
  }

  /** Home matchdays a new/edited list can be linked to. */
  async listLinkableMatchdays(upcomingOnly: boolean, todayISO?: string) {
    let query = this.supabase.from("matchdays").select("id, title, date, venue").eq("is_home", true);
    query = upcomingOnly && todayISO ? query.gte("date", todayISO).order("date") : query.order("date", { ascending: false }).limit(30);
    const { data } = await query;
    return data ?? [];
  }

  async create(fields: { title: string; description: string | null; matchday_id: string | null }) {
    const { data, error } = await this.supabase.from("donation_lists").insert(fields).select("id").single();
    if (error) throw new Error(error.message);
    return data.id as string;
  }

  /** Quick-create a "Soda y ventas" list from a matchday's own title/venue/date. */
  async createForMatchday(matchdayId: string) {
    const { data: md } = await this.supabase.from("matchdays").select("title, date, venue").eq("id", matchdayId).single();
    const title = `Soda y ventas · ${md?.title ?? md?.venue ?? ""} ${md?.date ?? ""}`.trim();
    const { data, error } = await this.supabase.from("donation_lists").insert({ matchday_id: matchdayId, title }).select("id").single();
    if (error) throw new Error(error.message);
    return data.id as string;
  }

  async update(id: string, fields: { title: string; description: string | null; matchday_id: string | null }) {
    must(await this.supabase.from("donation_lists").update(fields).eq("id", id));
  }

  async setOpen(id: string, isOpen: boolean) {
    must(await this.supabase.from("donation_lists").update({ is_open: isOpen }).eq("id", id));
  }

  async delete(id: string) {
    must(await this.supabase.from("donation_lists").delete().eq("id", id));
  }

  async addItem(listId: string, fields: { name: string; kind: string; quantity_needed: number; unit: string | null; notes: string | null }) {
    must(await this.supabase.from("donation_items").insert({ list_id: listId, ...fields }));
  }

  async deleteItem(itemId: string) {
    must(await this.supabase.from("donation_items").delete().eq("id", itemId));
  }

  async deletePledge(pledgeId: string) {
    must(await this.supabase.from("donation_pledges").delete().eq("id", pledgeId));
  }

  // ---------- Guest (share-token) ----------
  async guestGetList(token: string) {
    const { data } = await this.supabase.rpc("guest_get_donation_list", { p_token: token });
    return data;
  }

  async guestPledge(
    token: string,
    itemId: string,
    input: { parentName: string; playerName: string; phone: string; quantity: number; note: string },
  ) {
    const { data, error } = await this.supabase.rpc("guest_pledge_donation", {
      p_token: token,
      p_item_id: itemId,
      p_parent_name: input.parentName,
      p_player_name: input.playerName.trim() || null,
      p_phone: input.phone.trim() || null,
      p_quantity: input.quantity,
      p_note: input.note.trim() || null,
    });
    return !error && Boolean(data);
  }
}
