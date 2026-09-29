import { ageAchievedThisYear, categoryAgeCap } from "@/lib/labels";

/**
 * Whether a player can be assigned to a team, based on age and gender.
 * Age: eligible if the category's cap is at least the age the player achieves this
 * calendar year (turning 13 this year means U13+; having turned 13 last year means U14+).
 * Gender: eligible if the team is mixed, the player has no gender set, or they match.
 */
export function isPlayerEligibleForTeam(
  player: { birth_date?: string | null; gender?: string | null },
  team: { category: string; gender?: string | null }
) {
  const age = ageAchievedThisYear(player.birth_date);
  const cap = categoryAgeCap(team.category);
  const ageOk = cap == null || age == null || cap >= age;
  const genderOk = !player.gender || team.gender === "mixed" || team.gender === player.gender;
  return ageOk && genderOk;
}
