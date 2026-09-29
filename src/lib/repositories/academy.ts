import type { SupabaseServerClient } from "./types";
import { must } from "./util";
import { DEFAULT_AGE_THRESHOLDS, type AgeThresholds } from "@/lib/eligibility";

export class AcademyRepository {
  constructor(private readonly supabase: SupabaseServerClient) {}

  /** The single row visible under RLS for the signed-in staff member's academy. */
  async getSettings() {
    const { data } = await this.supabase.from("academies").select("*").single();
    return data;
  }

  async getAgeThresholds(): Promise<AgeThresholds> {
    const { data } = await this.supabase.from("academies").select("age_eligibility_min, age_eligibility_max").single();
    if (!data) return DEFAULT_AGE_THRESHOLDS;
    return { min: data.age_eligibility_min, max: data.age_eligibility_max };
  }

  private async getCurrentId() {
    const { data } = await this.supabase.from("academies").select("id").single();
    return data?.id as string | undefined;
  }

  async updateVisibility(isPublic: boolean) {
    const id = await this.getCurrentId();
    if (!id) return;
    must(await this.supabase.from("academies").update({ is_public: isPublic }).eq("id", id));
  }

  async updatePaymentSettings(fields: { track_payments: boolean; default_monthly_fee: number | null }) {
    const id = await this.getCurrentId();
    if (!id) return;
    must(await this.supabase.from("academies").update(fields).eq("id", id));
  }

  async updateAgeThresholds(fields: { age_eligibility_min: number; age_eligibility_max: number | null }) {
    const id = await this.getCurrentId();
    if (!id) return;
    must(await this.supabase.from("academies").update(fields).eq("id", id));
  }

  /** True if the signed-in user is registered staff for their academy. */
  async isStaff() {
    const { data } = await this.supabase.rpc("is_staff");
    return Boolean(data);
  }

  async createAcademy(academyName: string | null, fullName: string | null) {
    const { error } = await this.supabase.rpc("create_academy", { p_academy_name: academyName, p_full_name: fullName });
    if (error) throw new Error(error.message);
  }
}
