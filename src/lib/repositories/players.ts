import type { SupabaseServerClient } from "./types";
import { must } from "./util";

const LIST_SELECT =
  "id, first_name, last_name, jersey_number, national_id, birth_date, height_cm, positions, active, gender, avatar_url, team_players(team:teams(id, name, category, gender))";

export type PlayerFields = {
  first_name: string;
  last_name: string;
  jersey_number: number | null;
  national_id: string | null;
  birth_date: string | null;
  gender: string | null;
  profile: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  wingspan_cm: number | null;
  positions: string[];
  guardian_name: string | null;
  guardian_phone: string | null;
  active: boolean;
};

export class PlayersRepository {
  constructor(private readonly supabase: SupabaseServerClient) {}

  /** Full roster with each player's team memberships (players list page). */
  async listWithTeams() {
    const { data } = await this.supabase.from("players").select(LIST_SELECT).order("last_name");
    return data ?? [];
  }

  async listActiveIds() {
    const { data } = await this.supabase.from("players").select("id").eq("active", true);
    return data ?? [];
  }

  /** Cheap head-count (no rows fetched) for the dashboard stat tile. */
  async countActive() {
    const { count } = await this.supabase.from("players").select("id", { count: "exact", head: true }).eq("active", true);
    return count ?? 0;
  }

  /** id + name only, for payment rows. */
  async listActiveNames() {
    const { data } = await this.supabase.from("players").select("id, first_name, last_name").eq("active", true).order("last_name");
    return data ?? [];
  }

  /** Active players with just the fields needed for team-eligibility checks. */
  async listActiveForEligibility() {
    const { data } = await this.supabase
      .from("players")
      .select("id, first_name, last_name, jersey_number, birth_date, positions, gender")
      .eq("active", true)
      .order("last_name");
    return data ?? [];
  }

  async getById(id: string) {
    const { data } = await this.supabase.from("players").select("*").eq("id", id).single();
    return data;
  }

  async getTeamIds(playerId: string) {
    const { data } = await this.supabase.from("team_players").select("team_id").eq("player_id", playerId);
    return (data ?? []).map((r) => r.team_id as string);
  }

  async getCallupHistory(playerId: string) {
    const { data } = await this.supabase
      .from("callups")
      .select("id, status, attended, match:matches(opponent, matchday:matchdays(id, date, venue))")
      .eq("player_id", playerId);
    return data ?? [];
  }

  async create(fields: PlayerFields) {
    const { data, error } = await this.supabase.from("players").insert(fields).select("id").single();
    if (error) throw new Error(this.friendly(error.message));
    return data.id as string;
  }

  async update(id: string, fields: PlayerFields | (PlayerFields & { avatar_url: string })) {
    const { error } = await this.supabase.from("players").update(fields).eq("id", id);
    if (error) throw new Error(this.friendly(error.message));
  }

  async setAvatarUrl(id: string, avatarUrl: string) {
    await this.supabase.from("players").update({ avatar_url: avatarUrl }).eq("id", id);
  }

  async delete(id: string) {
    must(await this.supabase.from("players").delete().eq("id", id));
  }

  async syncTeams(playerId: string, teamIds: string[]) {
    await this.supabase.from("team_players").delete().eq("player_id", playerId);
    if (teamIds.length) {
      await this.supabase.from("team_players").insert(teamIds.map((team_id) => ({ team_id, player_id: playerId })));
    }
  }

  private async getAcademyId() {
    const { data } = await this.supabase.from("academies").select("id").single();
    return data?.id as string | undefined;
  }

  /** Uploads (overwriting) a player's avatar and returns its cache-busted public URL, or undefined if no file was given. */
  async uploadAvatar(playerId: string, file: File | FormDataEntryValue | null) {
    if (!(file instanceof File) || file.size === 0) return undefined;
    const academyId = await this.getAcademyId();
    if (!academyId) return undefined;

    const path = `${academyId}/${playerId}`;
    const { error } = await this.supabase.storage
      .from("player-photos")
      .upload(path, file, { upsert: true, contentType: file.type || "application/octet-stream" });
    if (error) throw new Error(error.message);
    const { data } = this.supabase.storage.from("player-photos").getPublicUrl(path);
    return `${data.publicUrl}?t=${Date.now()}`;
  }

  async removeAvatar(playerId: string) {
    const academyId = await this.getAcademyId();
    if (!academyId) return;
    await this.supabase.storage.from("player-photos").remove([`${academyId}/${playerId}`]);
  }

  private friendly(msg: string) {
    return msg.includes("players_national_id_key") ? "Ya existe un atleta con esa cédula." : msg;
  }
}
