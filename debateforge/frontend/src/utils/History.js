const KEY = "debateforge_history";
const MAX_SAVED = 20; // keep storage from growing forever

/**
 * Saves a completed debate to localStorage.
 * Newest debates appear first.
 */
export function saveDebate({
  topic,
  mode,
  finalScore,
  fallacies,
  roundScores,
  messages,
}) {
  const entry = {
    id: Date.now().toString(36),
    topic,
    mode,
    finalScore,
    fallacies,
    fallacyCount: fallacies.length,
    roundScores,
    messages, // store messages exactly as-is, scores already attached
    date: new Date().toISOString(),
  };

  const existing = getHistory();
  const updated = [entry, ...existing].slice(0, MAX_SAVED);

  try {
    localStorage.setItem(KEY, JSON.stringify(updated));
  } catch {
    // localStorage full or unavailable — fail silently, not critical
  }

  return entry;
}

/**
 * Returns all saved debates, newest first.
 */
export function getHistory() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Clears all saved debate history.
 */
export function clearHistory() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
