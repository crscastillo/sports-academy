import type { SupabaseServerClient } from "./types";

export type CoachFields = { full_name: string; email: string | null; phone: string | null; type: string };

export class CoachesRepository {
  constructor(private readonly supabase: SupabaseServerClient) {}

  /** id/full_name/is_default — the shape reused by team and matchday coach-assignment dropdowns. */
  async listForAssignment() {
    const { data } = await this.supabase.from("coaches").select("id, full_name, is_default").order("full_name");
    return data ?? [];
  }

  /** Full roster for the coaches management page, optionally filtered by type. */
  async listFull(type?: string) {
    let query = this.supabase.from("coaches").select("id, full_name, email, phone, type, is_default").order("full_name");
    if (type) query = query.eq("type", type);
    const { data } = await query;
    return data ?? [];
  }

  async getDefault() {
    const { data } = await this.supabase.from("coaches").select("full_name").eq("is_default", true).maybeSingle();
    return data;
  }

  async getEmailById(id: string) {
    const { data, error } = await this.supabase.from("coaches").select("full_name, email").eq("id", id).single();
    if (error || !data) throw new Error("Entrenador no encontrado");
    return data;
  }

  async create(fields: CoachFields) {
    const { error } = await this.supabase.from("coaches").insert(fields);
    if (error) throw new Error(error.message);
  }

  async update(id: string, fields: CoachFields) {
    const { error } = await this.supabase.from("coaches").update(fields).eq("id", id);
    if (error) throw new Error(error.message);
  }

  async delete(id: string) {
    const { error } = await this.supabase.from("coaches").delete().eq("id", id);
    if (error) throw new Error(error.message);
  }

  async setDefault(id: string) {
    await this.supabase.from("coaches").update({ is_default: false }).eq("is_default", true);
    const { error } = await this.supabase.from("coaches").update({ is_default: true }).eq("id", id);
    if (error) throw new Error(error.message);
  }

  async unsetDefault(id: string) {
    const { error } = await this.supabase.from("coaches").update({ is_default: false }).eq("id", id);
    if (error) throw new Error(error.message);
  }

  /** Invites a coach as staff, using their own email/name — throws if they have none. */
  async invite(id: string) {
    const { full_name, email } = await this.getEmailById(id);
    if (!email) throw new Error("Agregá un correo antes de invitar");
    const { error } = await this.supabase.from("staff").upsert({ email, full_name });
    if (error) throw new Error(error.message);
  }
}
