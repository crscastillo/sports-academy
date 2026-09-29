import type { SupabaseServerClient } from "./types";

export class StaffRepository {
  constructor(private readonly supabase: SupabaseServerClient) {}

  async list() {
    const { data } = await this.supabase.from("staff").select("email, full_name, created_at").order("created_at");
    return data ?? [];
  }

  /** Just the emails, for cheap "is this coach already invited?" lookups. */
  async listEmails() {
    const { data } = await this.supabase.from("staff").select("email");
    return data ?? [];
  }

  async add(email: string, fullName: string | null) {
    const { error } = await this.supabase.from("staff").upsert({ email, full_name: fullName });
    if (error) throw new Error(error.message);
  }

  async remove(email: string) {
    await this.supabase.from("staff").delete().eq("email", email);
  }
}
