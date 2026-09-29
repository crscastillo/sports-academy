import type { SupabaseServerClient } from "./types";
import { must } from "./util";

export type TeamFields = {
  name: string;
  category: string;
  gender: string;
  season: string | null;
  coach_id: string | null;
};

export class TeamsRepository {
  constructor(private readonly supabase: SupabaseServerClient) {}

  /** id/name/category(/gender) only — the shape reused by players, matchdays, and trainings forms. */
  async listBasic() {
    const { data } = await this.supabase.from("teams").select("id, name, category, gender").order("category");
    return data ?? [];
  }

  /** Cheap head-count (no rows fetched) for the dashboard stat tile. */
  async count() {
    const { count } = await this.supabase.from("teams").select("id", { count: "exact", head: true });
    return count ?? 0;
  }

  /** Teams list page: with coach name and player count, optionally filtered by gender. */
  async listWithCoachAndCount(gender?: string) {
    let query = this.supabase
      .from("teams")
      .select("id, name, category, gender, season, coach:coaches(full_name), team_players(count)")
      .order("category")
      .order("name");
    if (gender) query = query.eq("gender", gender);
    const { data } = await query;
    return data ?? [];
  }

  async getById(id: string) {
    const { data } = await this.supabase.from("teams").select("*").eq("id", id).single();
    return data;
  }

  /** { name, coach_id } for every team — used to group coaches by the teams they lead. */
  async listNamesWithCoach() {
    const { data } = await this.supabase.from("teams").select("name, coach_id");
    return data ?? [];
  }

  async create(fields: TeamFields) {
    const { data, error } = await this.supabase.from("teams").insert(fields).select("id").single();
    if (error) throw new Error(error.message);
    return data.id as string;
  }

  async update(id: string, fields: TeamFields) {
    must(await this.supabase.from("teams").update(fields).eq("id", id));
  }

  async delete(id: string) {
    const { error } = await this.supabase.from("teams").delete().eq("id", id);
    if (error) throw new Error("No se puede eliminar: el equipo tiene partidos asociados.");
  }

  async getRoster(teamId: string) {
    const { data } = await this.supabase
      .from("team_players")
      .select("player:players(id, first_name, last_name, jersey_number, birth_date, positions, gender)")
      .eq("team_id", teamId);
    return (data ?? []).map((r) => r.player);
  }

  /** Active player ids on a team's roster — used to call up a whole team at once. */
  async getActiveRosterIds(teamId: string) {
    const { data } = await this.supabase
      .from("team_players")
      .select("player_id, player:players!inner(active)")
      .eq("team_id", teamId)
      .eq("player.active", true);
    return (data ?? []).map((r) => r.player_id as string);
  }

  async addPlayers(teamId: string, playerIds: string[]) {
    if (playerIds.length === 0) return;
    const { error } = await this.supabase
      .from("team_players")
      .upsert(playerIds.map((player_id) => ({ team_id: teamId, player_id })), { ignoreDuplicates: true });
    if (error) throw new Error(error.message);
  }

  async removePlayer(teamId: string, playerId: string) {
    await this.supabase.from("team_players").delete().eq("team_id", teamId).eq("player_id", playerId);
  }
}
