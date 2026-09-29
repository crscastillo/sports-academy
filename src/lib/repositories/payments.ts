import type { SupabaseServerClient } from "./types";

export class PaymentsRepository {
  constructor(private readonly supabase: SupabaseServerClient) {}

  async listForPeriod(period: string) {
    const { data } = await this.supabase.from("payments").select("player_id, amount, status, paid_at").eq("period", period);
    return data ?? [];
  }

  async listPlayerIdsForPeriod(period: string) {
    const { data } = await this.supabase.from("payments").select("player_id").eq("period", period);
    return data ?? [];
  }

  async upsert(fields: {
    academy_id: string;
    player_id: string;
    period: string;
    status: string;
    amount: number | null;
    paid_at: string | null;
    notes: string | null;
  }) {
    const { error } = await this.supabase.from("payments").upsert(fields, { onConflict: "player_id,period" });
    if (error) throw new Error(error.message);
  }

  async insertMany(rows: { academy_id: string; player_id: string; period: string; amount: number | null; status: "pending" }[]) {
    if (rows.length === 0) return;
    const { error } = await this.supabase.from("payments").insert(rows);
    if (error) throw new Error(error.message);
  }
}
