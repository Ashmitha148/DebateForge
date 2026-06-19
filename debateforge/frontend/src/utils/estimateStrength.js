/**
 * Estimates argument strength locally as the user types — no API call needed.
 * This is a lightweight heuristic just for live visual feedback;
 * the real score still comes from the AI after sending.
 */
export function estimateStrength(text) {
  if (!text || text.trim().length < 3) return 0;

  const t = text.trim();
  let score = 20; // base score for attempting an argument

  // Length signal — longer, developed arguments tend to be stronger
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length > 8) score += 15;
  if (words.length > 18) score += 15;
  if (words.length > 30) score += 10;

  // Evidence signals — numbers, studies, named sources
  if (/\d/.test(t)) score += 10; // contains a number/stat
  if (/study|research|data|report|survey|according to|source/i.test(t))
    score += 15;

  // Reasoning connectors — shows structured logic
  if (/because|therefore|since|due to|as a result|this means/i.test(t))
    score += 10;

  // Hedge/weak language — reduces confidence
  if (/maybe|i guess|i think|kind of|sort of|not sure/i.test(t)) score -= 10;

  // All caps or excessive punctuation — emotional, not logical
  if (/!{2,}|\?{2,}/.test(t)) score -= 5;

  return Math.max(0, Math.min(100, score));
}
