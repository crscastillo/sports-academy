import type { SupabaseServerClient } from "./types";
import { must } from "./util";

const CARD_SELECT =
  "id, title, date, venue, address, is_home, coach:coaches(full_name), matches(id, team:teams(category), callups(status, player_id)), matchday_transport(player_id, transport)";

const DASHBOARD_SELECT =
  "id, title, date, venue, is_home, matches(callups(status, player_id)), matchday_transport(player_id, transport)";

const DETAIL_MATCH_SELECT = `id, opponent, start_time, court, score_for, score_against, notes,
  team:teams(id, name, category, gender, team_players(player:players(id, first_name, last_name, jersey_number, active))),
  callups(id, status, guest_note, responded_at, attended, player:players(id, first_name, last_name, jersey_number, guardian_phone))`;

export type MatchdayFields = {
  title: string | null;
  date: string;
  venue: string;
  address: string | null;
  is_home: boolean;
  notes: string | null;
  coach_id: string | null;
};

export class MatchdaysRepository {
  constructor(private readonly supabase: SupabaseServerClient) {}

  // ---------- Lists ----------
  async listUpcomingCards(todayISO: string) {
    const { data } = await this.supabase.from("matchdays").select(CARD_SELECT).gte("date", todayISO).order("date");
    return data ?? [];
  }

  async listPastCards(todayISO: string, limit: number) {
    const { data } = await this.supabase.from("matchdays").select(CARD_SELECT).lt("date", todayISO).order("date", { ascending: false }).limit(limit);
    return data ?? [];
  }

  async listUpcomingForDashboard(todayISO: string, limit: number) {
    const { data } = await this.supabase.from("matchdays").select(DASHBOARD_SELECT).gte("date", todayISO).order("date").limit(limit);
    return data ?? [];
  }

  /** Scored matches (any matchday) in a date range, for the "last week's results" dashboard card. */
  async listRecentScores(fromISO: string, toISO: string) {
    const { data } = await this.supabase
      .from("matches")
      .select("id, opponent, score_for, score_against, team:teams(name, category), matchday:matchdays!inner(id, date, title)")
      .not("score_for", "is", null)
      .gte("matchday.date", fromISO)
      .lt("matchday.date", toISO)
      .order("date", { foreignTable: "matchday", ascending: false });
    return data ?? [];
  }

  // ---------- Detail ----------
  async getById(id: string) {
    const { data } = await this.supabase.from("matchdays").select("*").eq("id", id).single();
    return data;
  }

  async getMatches(matchdayId: string) {
    const { data } = await this.supabase.from("matches").select(DETAIL_MATCH_SELECT).eq("matchday_id", matchdayId).order("start_time", { nullsFirst: false });
    return data ?? [];
  }

  async getBusTrips(matchdayId: string) {
    const { data } = await this.supabase.from("bus_trips").select("*").eq("matchday_id", matchdayId).order("departure_time");
    return data ?? [];
  }

  async getDonationLists(matchdayId: string) {
    const { data } = await this.supabase.from("donation_lists").select("id, title").eq("matchday_id", matchdayId);
    return data ?? [];
  }

  async getTransport(matchdayId: string) {
    const { data } = await this.supabase.from("matchday_transport").select("player_id, transport").eq("matchday_id", matchdayId);
    return data ?? [];
  }

  // ---------- Mutations: matchdays ----------
  async create(fields: MatchdayFields) {
    const { data, error } = await this.supabase.from("matchdays").insert(fields).select("id").single();
    if (error) throw new Error(error.message);
    return data.id as string;
  }

  async update(id: string, fields: MatchdayFields) {
    must(await this.supabase.from("matchdays").update(fields).eq("id", id));
  }

  async delete(id: string) {
    must(await this.supabase.from("matchdays").delete().eq("id", id));
  }

  async regenerateShareToken(id: string) {
    must(await this.supabase.from("matchdays").update({ share_token: crypto.randomUUID() }).eq("id", id));
  }

  // ---------- Mutations: matches ----------
  async addMatch(matchdayId: string, fields: { team_id: string; opponent: string; start_time: string | null; court: string | null }) {
    const { data, error } = await this.supabase.from("matches").insert({ matchday_id: matchdayId, ...fields }).select("id").single();
    if (error) throw new Error(error.message);
    return data.id as string;
  }

  async updateMatch(matchId: string, fields: { opponent: string; start_time: string | null; court: string | null; score_for: number | null; score_against: number | null; notes: string | null }) {
    must(await this.supabase.from("matches").update(fields).eq("id", matchId));
  }

  async deleteMatch(matchId: string) {
    must(await this.supabase.from("matches").delete().eq("id", matchId));
  }

  // ---------- Mutations: call-ups ----------
  async callUpPlayers(matchId: string, playerIds: string[]) {
    if (playerIds.length === 0) return;
    must(
      await this.supabase
        .from("callups")
        .upsert(playerIds.map((player_id) => ({ match_id: matchId, player_id })), { onConflict: "match_id,player_id", ignoreDuplicates: true }),
    );
  }

  async removeCallup(callupId: string) {
    must(await this.supabase.from("callups").delete().eq("id", callupId));
  }

  /** Updates one match's response; clears a stale matchday-wide "no voy" if this overwrites it. */
  async setCallupResponse(callupId: string, matchdayId: string, status: string) {
    const { data: callup } = await this.supabase.from("callups").select("player_id").eq("id", callupId).single();
    must(
      await this.supabase
        .from("callups")
        .update({ status, responded_at: status === "pending" ? null : new Date().toISOString() })
        .eq("id", callupId),
    );
    if (callup) {
      await this.supabase
        .from("matchday_transport")
        .update({ transport: null })
        .eq("matchday_id", matchdayId)
        .eq("player_id", callup.player_id)
        .eq("transport", "no_go");
    }
  }

  async setAttendance(callupId: string, attended: boolean | null) {
    must(await this.supabase.from("callups").update({ attended }).eq("id", callupId));
  }

  /** One transport choice per player per matchday; "no_go" also declines every match that day. */
  async setPlayerTransport(playerId: string, matchdayId: string, transport: string | null) {
    must(
      await this.supabase
        .from("matchday_transport")
        .upsert({ matchday_id: matchdayId, player_id: playerId, transport, responded_at: new Date().toISOString() }, { onConflict: "matchday_id,player_id" }),
    );
    if (transport === "no_go") {
      const { data: callups } = await this.supabase
        .from("callups")
        .select("id, match:matches!inner(matchday_id)")
        .eq("player_id", playerId)
        .eq("match.matchday_id", matchdayId);
      const ids = (callups ?? []).map((c) => c.id);
      if (ids.length) {
        await this.supabase.from("callups").update({ status: "declined", responded_at: new Date().toISOString() }).in("id", ids);
      }
    }
  }

  // ---------- Mutations: bus trips ----------
  async addBusTrip(matchdayId: string, fields: {
    label: string; departure_place: string | null; departure_time: string | null; return_time: string | null;
    capacity: number | null; driver: string | null; driver_phone: string | null; cost: number | null; notes: string | null;
  }) {
    must(await this.supabase.from("bus_trips").insert({ matchday_id: matchdayId, ...fields }));
  }

  async deleteBusTrip(tripId: string) {
    must(await this.supabase.from("bus_trips").delete().eq("id", tripId));
  }

  // ---------- Guest (share-token) ----------
  async guestGetCallups(token: string) {
    const { data } = await this.supabase.rpc("guest_get_callups", { p_token: token });
    return data;
  }

  async guestRespondCallup(token: string, callupId: string, status: "confirmed" | "declined", note: string) {
    const { data, error } = await this.supabase.rpc("guest_respond_callup", {
      p_token: token,
      p_callup_id: callupId,
      p_status: status,
      p_note: note.trim() || null,
    });
    return !error && Boolean(data);
  }

  async guestSetTransport(token: string, playerId: string, transport: "bus" | "own" | "no_go") {
    const { data, error } = await this.supabase.rpc("guest_set_transport", { p_token: token, p_player_id: playerId, p_transport: transport });
    return !error && Boolean(data);
  }
}
