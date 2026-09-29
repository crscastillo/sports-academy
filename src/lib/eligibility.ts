import { ageAchievedThisYear, categoryAgeCap } from "@/lib/labels";

export type AgeThresholds = { min: number; max: number | null };

// Default when an academy hasn't configured its own thresholds yet:
// one bracket of slack below the strict cutoff, no cap above.
export const DEFAULT_AGE_THRESHOLDS: AgeThresholds = { min: 1, max: null };

/**
 * Whether a player can be assigned to a team, based on age and gender.
 * Age: eligible if the category's cap is within [age - min, age + max] of the age the
 * player achieves this calendar year (max null means no upper bound).
 * Gender: eligible if the team is mixed, the player has no gender set, or they match.
 */
export function isPlayerEligibleForTeam(
  player: { birth_date?: string | null; gender?: string | null },
  team: { category: string; gender?: string | null },
  thresholds: AgeThresholds = DEFAULT_AGE_THRESHOLDS
) {
  const age = ageAchievedThisYear(player.birth_date);
  const cap = categoryAgeCap(team.category);
  const ageOk =
    cap == null ||
    age == null ||
    (cap >= age - thresholds.min && (thresholds.max == null || cap <= age + thresholds.max));
  const genderOk = !player.gender || team.gender === "mixed" || team.gender === player.gender;
  return ageOk && genderOk;
}
