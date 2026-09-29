import { cache } from "react";
import type { SupabaseServerClient } from "./types";

export class PublicRepository {
  constructor(private readonly supabase: SupabaseServerClient) {}

  // Wrapped in React's request-scoped cache() so generateMetadata() and the page
  // component (which both need this) share one RPC call instead of two.
  getAcademySchedule = cache(async (slug: string) => {
    const { data } = await this.supabase.rpc("guest_get_academy_schedule", { p_slug: slug });
    return data;
  });
}
