import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { AcademyRepository } from "./academy";
import { PlayersRepository } from "./players";
import { TeamsRepository } from "./teams";
import { CoachesRepository } from "./coaches";
import { MatchdaysRepository } from "./matchdays";
import { TrainingsRepository } from "./trainings";
import { DonationsRepository } from "./donations";
import { PaymentsRepository } from "./payments";
import { StaffRepository } from "./staff";
import { PublicRepository } from "./public";

// Wrapped in React's request-scoped cache() so every call within the same render
// (e.g. a layout + a page, or generateMetadata + the page component) shares one
// Supabase client and one instance of each repository, instead of re-creating them.
export const getRepositories = cache(async () => {
  const supabase = await createClient();
  return {
    academy: new AcademyRepository(supabase),
    players: new PlayersRepository(supabase),
    teams: new TeamsRepository(supabase),
    coaches: new CoachesRepository(supabase),
    matchdays: new MatchdaysRepository(supabase),
    trainings: new TrainingsRepository(supabase),
    donations: new DonationsRepository(supabase),
    payments: new PaymentsRepository(supabase),
    staff: new StaffRepository(supabase),
    public: new PublicRepository(supabase),
  };
});

export type { PlayerFields } from "./players";
export type { TeamFields } from "./teams";
export type { CoachFields } from "./coaches";
export type { MatchdayFields } from "./matchdays";
export type { TrainingFields } from "./trainings";
