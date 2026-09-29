"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getRepositories } from "@/lib/repositories";
import { bool, list, num, str } from "@/lib/form";

const refresh = (matchdayId: string) => {
  revalidatePath(`/matchdays/${matchdayId}`);
  revalidatePath("/matchdays");
  revalidatePath("/");
};

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
  const { matchdays } = await getRepositories();
  const id = await matchdays.create(matchdayFields(fd));
  refresh(id);
  redirect(`/matchdays/${id}`);
}

export async function updateMatchday(id: string, fd: FormData) {
  const { matchdays } = await getRepositories();
  await matchdays.update(id, matchdayFields(fd));
  refresh(id);
}

export async function deleteMatchday(id: string) {
  const { matchdays } = await getRepositories();
  await matchdays.delete(id);
  revalidatePath("/matchdays");
  redirect("/matchdays");
}

export async function regenerateShareToken(id: string) {
  const { matchdays } = await getRepositories();
  await matchdays.regenerateShareToken(id);
  refresh(id);
}

// ---------- Matches ----------
export async function addMatch(matchdayId: string, fd: FormData) {
  const teamId = str(fd, "team_id");
  if (!teamId) throw new Error("Seleccioná un equipo");
  const { matchdays, teams } = await getRepositories();
  const matchId = await matchdays.addMatch(matchdayId, {
    team_id: teamId,
    opponent: str(fd, "opponent") ?? "Por definir",
    start_time: str(fd, "start_time"),
    court: str(fd, "court"),
  });
  if (bool(fd, "call_all")) {
    const playerIds = await teams.getActiveRosterIds(teamId);
    if (playerIds.length) await matchdays.callUpPlayers(matchId, playerIds);
  }
  refresh(matchdayId);
}

export async function updateMatch(matchId: string, matchdayId: string, fd: FormData) {
  const { matchdays } = await getRepositories();
  await matchdays.updateMatch(matchId, {
    opponent: str(fd, "opponent") ?? "Por definir",
    start_time: str(fd, "start_time"),
    court: str(fd, "court"),
    score_for: num(fd, "score_for"),
    score_against: num(fd, "score_against"),
    notes: str(fd, "notes"),
  });
  refresh(matchdayId);
}

export async function deleteMatch(matchId: string, matchdayId: string) {
  const { matchdays } = await getRepositories();
  await matchdays.deleteMatch(matchId);
  refresh(matchdayId);
}

// ---------- Call-ups ----------
export async function callUpPlayers(matchId: string, matchdayId: string, fd: FormData) {
  const { matchdays } = await getRepositories();
  await matchdays.callUpPlayers(matchId, list(fd, "player_id"));
  refresh(matchdayId);
}

export async function removeCallup(callupId: string, matchdayId: string) {
  const { matchdays } = await getRepositories();
  await matchdays.removeCallup(callupId);
  refresh(matchdayId);
}

export async function setCallupResponse(callupId: string, matchdayId: string, fd: FormData) {
  const { matchdays } = await getRepositories();
  await matchdays.setCallupResponse(callupId, matchdayId, str(fd, "status") ?? "pending");
  refresh(matchdayId);
}

export async function setAttendance(callupId: string, matchdayId: string, attended: boolean | null) {
  const { matchdays } = await getRepositories();
  await matchdays.setAttendance(callupId, attended);
  refresh(matchdayId);
}

// One transport choice per player per matchday (not per match). "no_go" also
// declines every match the player is called up to that day.
export async function setPlayerTransport(playerId: string, matchdayId: string, fd: FormData) {
  const { matchdays } = await getRepositories();
  await matchdays.setPlayerTransport(playerId, matchdayId, str(fd, "transport"));
  refresh(matchdayId);
}

// ---------- Bus trips ----------
export async function addBusTrip(matchdayId: string, fd: FormData) {
  const { matchdays } = await getRepositories();
  await matchdays.addBusTrip(matchdayId, {
    label: str(fd, "label") ?? "Buseta",
    departure_place: str(fd, "departure_place"),
    departure_time: str(fd, "departure_time"),
    return_time: str(fd, "return_time"),
    capacity: num(fd, "capacity"),
    driver: str(fd, "driver"),
    driver_phone: str(fd, "driver_phone"),
    cost: num(fd, "cost"),
    notes: str(fd, "notes"),
  });
  refresh(matchdayId);
}

export async function deleteBusTrip(tripId: string, matchdayId: string) {
  const { matchdays } = await getRepositories();
  await matchdays.deleteBusTrip(tripId);
  refresh(matchdayId);
}

// ---------- Donation list shortcut ----------
export async function createDonationListForMatchday(matchdayId: string) {
  const { donations } = await getRepositories();
  const id = await donations.createForMatchday(matchdayId);
  revalidatePath("/donations");
  redirect(`/donations/${id}`);
}
