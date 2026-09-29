"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { bool, list, num, str } from "@/lib/form";

const refresh = (matchdayId: string) => {
  revalidatePath(`/matchdays/${matchdayId}`);
  revalidatePath("/matchdays");
  revalidatePath("/");
};

function must<T extends { error: { message: string } | null }>(res: T) {
  if (res.error) throw new Error(res.error.message);
  return res;
}

// ---------- Matchdays ----------
function matchdayFields(fd: FormData) {
  return {
    title: str(fd, "title"),
    date: str(fd, "date") ?? "",
    venue: str(fd, "venue") ?? "",
    address: str(fd, "address"),
    is_home: bool(fd, "is_home"),
    notes: str(fd, "notes"),
    coach_id: str(fd, "coach_id"),
  };
}

export async function createMatchday(fd: FormData) {
  const supabase = await createClient();
  const { data } = must(await supabase.from("matchdays").insert(matchdayFields(fd)).select("id").single());
  refresh(data!.id);
  redirect(`/matchdays/${data!.id}`);
}

export async function updateMatchday(id: string, fd: FormData) {
  const supabase = await createClient();
  must(await supabase.from("matchdays").update(matchdayFields(fd)).eq("id", id));
  refresh(id);
}

export async function deleteMatchday(id: string) {
  const supabase = await createClient();
  must(await supabase.from("matchdays").delete().eq("id", id));
  revalidatePath("/matchdays");
  redirect("/matchdays");
}

export async function regenerateShareToken(id: string) {
  const supabase = await createClient();
  must(await supabase.from("matchdays").update({ share_token: crypto.randomUUID() }).eq("id", id));
  refresh(id);
}

// ---------- Matches ----------
export async function addMatch(matchdayId: string, fd: FormData) {
  const supabase = await createClient();
  const teamId = str(fd, "team_id");
  if (!teamId) throw new Error("Seleccioná un equipo");
  const { data: match } = must(
    await supabase
      .from("matches")
      .insert({
        matchday_id: matchdayId,
        team_id: teamId,
        opponent: str(fd, "opponent") ?? "Por definir",
        start_time: str(fd, "start_time"),
        court: str(fd, "court"),
      })
      .select("id")
      .single(),
  );
  if (bool(fd, "call_all")) {
    const { data: roster } = await supabase
      .from("team_players")
      .select("player_id, player:players!inner(active)")
      .eq("team_id", teamId)
      .eq("player.active", true);
    if (roster?.length) {
      must(await supabase.from("callups").insert(roster.map((r) => ({ match_id: match!.id, player_id: r.player_id }))));
    }
  }
  refresh(matchdayId);
}

export async function updateMatch(matchId: string, matchdayId: string, fd: FormData) {
  const supabase = await createClient();
  must(
    await supabase
      .from("matches")
      .update({
        opponent: str(fd, "opponent") ?? "Por definir",
        start_time: str(fd, "start_time"),
        court: str(fd, "court"),
        score_for: num(fd, "score_for"),
        score_against: num(fd, "score_against"),
        notes: str(fd, "notes"),
      })
      .eq("id", matchId),
  );
  refresh(matchdayId);
}

export async function deleteMatch(matchId: string, matchdayId: string) {
  const supabase = await createClient();
  must(await supabase.from("matches").delete().eq("id", matchId));
  refresh(matchdayId);
}

// ---------- Call-ups ----------
export async function callUpPlayers(matchId: string, matchdayId: string, fd: FormData) {
  const ids = list(fd, "player_id");
  if (!ids.length) return;
  const supabase = await createClient();
  must(
    await supabase
      .from("callups")
      .upsert(ids.map((player_id) => ({ match_id: matchId, player_id })), { onConflict: "match_id,player_id", ignoreDuplicates: true }),
  );
  refresh(matchdayId);
}

export async function removeCallup(callupId: string, matchdayId: string) {
  const supabase = await createClient();
  must(await supabase.from("callups").delete().eq("id", callupId));
  refresh(matchdayId);
}

export async function setCallupResponse(callupId: string, matchdayId: string, fd: FormData) {
  const status = str(fd, "status") ?? "pending";
  const supabase = await createClient();
  const { data: callup } = await supabase.from("callups").select("player_id").eq("id", callupId).single();
  must(
    await supabase
      .from("callups")
      .update({ status, responded_at: status === "pending" ? null : new Date().toISOString() })
      .eq("id", callupId),
  );
  // A specific match's response was just overwritten — a blanket "no voy" no longer applies.
  if (callup) {
    await supabase
      .from("matchday_transport")
      .update({ transport: null })
      .eq("matchday_id", matchdayId)
      .eq("player_id", callup.player_id)
      .eq("transport", "no_go");
  }
  refresh(matchdayId);
}

export async function setAttendance(callupId: string, matchdayId: string, attended: boolean | null) {
  const supabase = await createClient();
  must(await supabase.from("callups").update({ attended }).eq("id", callupId));
  refresh(matchdayId);
}

// One transport choice per player per matchday (not per match). "no_go" also
// declines every match the player is called up to that day.
export async function setPlayerTransport(playerId: string, matchdayId: string, fd: FormData) {
  const transport = str(fd, "transport");
  const supabase = await createClient();
  must(
    await supabase
      .from("matchday_transport")
      .upsert(
        { matchday_id: matchdayId, player_id: playerId, transport, responded_at: new Date().toISOString() },
        { onConflict: "matchday_id,player_id" },
      ),
  );
  if (transport === "no_go") {
    const { data: callups } = await supabase
      .from("callups")
      .select("id, match:matches!inner(matchday_id)")
      .eq("player_id", playerId)
      .eq("match.matchday_id", matchdayId);
    const ids = (callups ?? []).map((c) => c.id);
    if (ids.length) {
      await supabase.from("callups").update({ status: "declined", responded_at: new Date().toISOString() }).in("id", ids);
    }
  }
  refresh(matchdayId);
}

// ---------- Bus trips ----------
export async function addBusTrip(matchdayId: string, fd: FormData) {
  const supabase = await createClient();
  must(
    await supabase.from("bus_trips").insert({
      matchday_id: matchdayId,
      label: str(fd, "label") ?? "Buseta",
      departure_place: str(fd, "departure_place"),
      departure_time: str(fd, "departure_time"),
      return_time: str(fd, "return_time"),
      capacity: num(fd, "capacity"),
      driver: str(fd, "driver"),
      driver_phone: str(fd, "driver_phone"),
      cost: num(fd, "cost"),
      notes: str(fd, "notes"),
    }),
  );
  refresh(matchdayId);
}

export async function deleteBusTrip(tripId: string, matchdayId: string) {
  const supabase = await createClient();
  must(await supabase.from("bus_trips").delete().eq("id", tripId));
  refresh(matchdayId);
}

// ---------- Donation list shortcut ----------
export async function createDonationListForMatchday(matchdayId: string) {
  const supabase = await createClient();
  const { data: md } = await supabase.from("matchdays").select("title, date, venue").eq("id", matchdayId).single();
  const { data } = must(
    await supabase
      .from("donation_lists")
      .insert({ matchday_id: matchdayId, title: `Soda y ventas · ${md?.title ?? md?.venue ?? ""} ${md?.date ?? ""}`.trim() })
      .select("id")
      .single(),
  );
  revalidatePath("/donations");
  redirect(`/donations/${data!.id}`);
}
