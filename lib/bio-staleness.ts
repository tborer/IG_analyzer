// Detects an unchanged bio across consecutive audits. Pure and DB-agnostic:
// the caller supplies the current bio text and prior bios (most recent
// first) already fetched from storage.
export type BioStalenessResult = {
  streak: number;
  note: string;
};

const MIN_STREAK_TO_FLAG = 3;

function normalize(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function checkBioStaleness(
  currentBio: string,
  priorBiosMostRecentFirst: string[]
): BioStalenessResult | null {
  const current = normalize(currentBio);
  let streak = 1; // the current audit counts as one
  for (const prior of priorBiosMostRecentFirst) {
    if (normalize(prior) === current) {
      streak++;
    } else {
      break;
    }
  }

  if (streak < MIN_STREAK_TO_FLAG) return null;

  return {
    streak,
    note: `This bio hasn't changed across your last ${streak} audits. A dynamic bio — updated with your current city, project, or what you're up to — signals an active life; a static one signals nothing's happening.`,
  };
}
