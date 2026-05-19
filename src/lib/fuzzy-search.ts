const WORD_BOUNDARY = /[\s\-_/.,]/;

export function fuzzyScore(
  query: string,
  fields: Array<string | null | undefined>
): number | null {
  const q = query.trim().toLowerCase();
  if (!q) return 0;

  let best: number | null = null;

  for (let i = 0; i < fields.length; i++) {
    const raw = fields[i];
    if (!raw) continue;
    const field = raw.toLowerCase();
    if (!field) continue;

    const fieldRank = fields.length - i;
    const allowSubsequence = i === 0;
    const baseScore = scoreField(q, field, allowSubsequence);
    if (baseScore === null) continue;

    const total = baseScore + fieldRank;
    if (best === null || total > best) best = total;
  }

  return best;
}

function scoreField(
  q: string,
  field: string,
  allowSubsequence: boolean
): number | null {
  if (field === q) return 1000;
  if (field.startsWith(q)) return 800 - Math.min(field.length, 200);

  for (let i = 0; i < field.length; i++) {
    if (i === 0 || WORD_BOUNDARY.test(field[i - 1]!)) {
      if (field.startsWith(q, i)) return 600 - i;
    }
  }

  const idx = field.indexOf(q);
  if (idx !== -1) return 400 - idx;

  if (!allowSubsequence) return null;
  const sub = subsequenceScore(q, field);
  return sub === null ? null : 100 + sub;
}

// Acronym-style: every query char must either start a word or be adjacent
// to the previous match. Rejects loose chains like "desig" inside
// "debounce a fast-changing value with a configurable delay".
function subsequenceScore(q: string, field: string): number | null {
  let qi = 0;
  let score = 0;
  let prevMatch = -2;

  for (let i = 0; i < field.length && qi < q.length; i++) {
    if (field[i] !== q[qi]) continue;

    const isConsecutive = i === prevMatch + 1;
    const isAtWordBoundary = i === 0 || WORD_BOUNDARY.test(field[i - 1]!);
    if (!isConsecutive && !isAtWordBoundary) continue;

    if (isConsecutive) score += 4;
    if (isAtWordBoundary) score += 2;
    score += 1;
    prevMatch = i;
    qi++;
  }

  return qi === q.length ? score : null;
}

export type FuzzyMatch<T> = { item: T; score: number };

export function fuzzySearch<T>(
  query: string,
  items: readonly T[],
  fieldsOf: (item: T) => Array<string | null | undefined>,
  limit?: number
): FuzzyMatch<T>[] {
  const q = query.trim();
  if (!q) {
    const all = items.map((item) => ({ item, score: 0 }));
    return typeof limit === "number" ? all.slice(0, limit) : all;
  }

  const matches: FuzzyMatch<T>[] = [];
  for (const item of items) {
    const score = fuzzyScore(q, fieldsOf(item));
    if (score !== null) matches.push({ item, score });
  }

  matches.sort((a, b) => b.score - a.score);
  return typeof limit === "number" ? matches.slice(0, limit) : matches;
}
