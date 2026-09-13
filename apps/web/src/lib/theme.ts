/**
 * Guest and editor palette from the couple's boy/girl answer.
 * Null is mint (`unset`). The API never returns that name; it is only a
 * data-theme value.
 */

export type BabyGender = "boy" | "girl" | null;
export type ThemeName = "boy" | "girl" | "unset";

export function themeFromGender(gender: BabyGender | undefined): ThemeName {
  if (gender === "boy" || gender === "girl") return gender;
  return "unset";
}
