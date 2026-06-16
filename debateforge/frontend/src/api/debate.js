const API = import.meta.env.VITE_API || "http://localhost:8000";

const MODE_INSTRUCTIONS = {
  easy: "Be a bit gentle. Still push back but don't be too harsh.",
  medium: "Be sharp and direct. Don't give up ground easily.",
  hard: "Be very tough. Attack every weak point you find.",
};

function buildPrompt(topic, mode, userArg, history) {
  const hist = history
    .map((m) => `${m.role === "user" ? "Human" : "DebateBot"}: ${m.text}`)
    .join("\n");

  return `You are DebateBot. Your job is to argue against what the user says.

Topic: "${topic}"
Your style: ${mode} — ${MODE_INSTRUCTIONS[mode]}

Full conversation so far (remember all of this):
${hist || "This is the opening round."}

User just said: "${userArg}"

Rules:
- Use simple everyday English. Write like you are texting a friend.
- Short sentences. No big words. No formal language.
- Be confident and direct but easy to understand.
- Max 3 short sentences for your argument.
- Keep fallacy explanation simple too.
- Counterquestion should be casual and easy.

Reply ONLY with valid JSON (no markdown, no extra text):
{
  "argument": "your simple 2-3 sentence reply",
  "fallacy": { "name": "Fallacy Name", "explanation": "simple explanation" } or null,
  "counterquestion": "one simple casual question",
  "strength_score": 6
}`;
}

function parseDebateReply(rawText) {
  try {
    const clean = rawText.replace(/```json|```/g, "").trim();
    const match = clean.match(/\{[\s\S]*\}/);
    return JSON.parse(match ? match[0] : clean);
  } catch {
    return {
      argument: rawText,
      fallacy: null,
      counterquestion: null,
      strength_score: 5,
    };
  }
}

/**
 * Sends the user's argument + full debate history to the backend,
 * and returns the parsed AI response: { argument, fallacy, counterquestion, strength_score }
 */
export async function callDebate(topic, mode, userArg, history) {
  const prompt = buildPrompt(topic, mode, userArg, history);

  const res = await fetch(`${API}/debate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic, user_argument: prompt }),
  });

  if (!res.ok) {
    throw new Error("Backend is offline — run: uvicorn main:app --reload");
  }

  const data = await res.json();
  return parseDebateReply(data.reply);
}

/**
 * Requests a PDF report from the backend and triggers a browser download.
 */
export async function downloadDebatePDF({
  topic,
  mode,
  finalScore,
  avgScore,
  fallacies,
  messages,
  roundScores,
}) {
  const res = await fetch(`${API}/export-pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      topic,
      mode,
      final_score: finalScore,
      avg_score: avgScore,
      fallacies,
      messages,
      round_scores: roundScores,
    }),
  });

  if (!res.ok) throw new Error("PDF failed — check backend terminal");

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "debateforge.pdf";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
