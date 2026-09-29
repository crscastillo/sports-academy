import type { SupabaseServerClient } from "./types";

const SELECT = "id, date, start_time, end_time, location, status, plan, notes, training_teams(team:teams(id, name, category))";

export type TrainingFields = {
  date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  status: string;
  plan: string | null;
  notes: string | null;
  observations: string | null;
};

export class TrainingsRepository {
  constructor(private readonly supabase: SupabaseServerClient) {}

  async listInRange(start: string, end: string) {
    const { data } = await this.supabase.from("trainings").select(SELECT).gte("date", start).lte("date", end).order("date").order("start_time");
    return data ?? [];
  }

  async listRecentCompleted(limit: number) {
    const { data } = await this.supabase.from("trainings").select(SELECT).eq("status", "completed").order("date", { ascending: false }).limit(limit);
    return data ?? [];
  }

  async listUpcomingPlanned(fromDate: string, limit: number) {
    const { data } = await this.supabase
      .from("trainings")
      .select("id, date, start_time, location, training_teams(team:teams(category))")
      .gte("date", fromDate)
      .eq("status", "planned")
      .order("date")
      .order("start_time")
      .limit(limit);
    return data ?? [];
  }

  async getById(id: string) {
    const { data } = await this.supabase.from("trainings").select("*").eq("id", id).single();
    return data;
  }

  async getTeamIds(trainingId: string) {
    const { data } = await this.supabase.from("training_teams").select("team_id").eq("training_id", trainingId);
    return (data ?? []).map((r) => r.team_id as string);
  }

  async create(rows: TrainingFields[]) {
    const { data, error } = await this.supabase.from("trainings").insert(rows).select("id");
    if (error) throw new Error(error.message);
    return data;
  }

  async linkTeams(trainingIds: string[], teamIds: string[]) {
    if (teamIds.length === 0) return;
    const links = trainingIds.flatMap((training_id) => teamIds.map((team_id) => ({ training_id, team_id })));
    const { error } = await this.supabase.from("training_teams").insert(links);
    if (error) throw new Error(error.message);
  }

  async update(id: string, fields: TrainingFields) {
    const { error } = await this.supabase.from("trainings").update(fields).eq("id", id);
    if (error) throw new Error(error.message);
  }

  async setTeams(trainingId: string, teamIds: string[]) {
    await this.supabase.from("training_teams").delete().eq("training_id", trainingId);
    if (teamIds.length) {
      await this.supabase.from("training_teams").insert(teamIds.map((team_id) => ({ training_id: trainingId, team_id })));
    }
  }

  async delete(id: string) {
    await this.supabase.from("trainings").delete().eq("id", id);
  }
}
