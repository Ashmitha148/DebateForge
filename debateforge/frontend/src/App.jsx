import { useState } from "react";
import "./App.css";
import Landing from "./components/Landing";
import Arena from "./components/Arena";
import Report from "./components/Report";
import { callDebate, downloadDebatePDF } from "./api/debate";
import { saveDebate } from "./utils/history";

const MAX_ROUNDS = 5;

export default function App() {
  const [screen, setScreen] = useState("land"); // land | arena | report
  const [topic, setTopic] = useState("");
  const [mode, setMode] = useState("medium");
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [round, setRound] = useState(0);
  const [loading, setLoading] = useState(false);
  const [cq, setCq] = useState(null);
  const [fallacies, setFallacies] = useState([]);
  const [total, setTotal] = useState(0);
  const [count, setCount] = useState(0);
  const [err, setErr] = useState("");
  const [pdfLoad, setPdfLoad] = useState(false);

  async function start() {
    if (!topic.trim()) return;
    setScreen("arena");
    setLoading(true);
    setErr("");
    try {
      const ai = await callDebate(
        topic,
        mode,
        "Start the debate. Give your first counterargument.",
        [],
      );
      setMsgs([{ role: "ai", text: ai.argument, fallacy: null }]);
      setCq(ai.counterquestion);
      setRound(1);
    } catch (e) {
      setErr(e.message);
    }
    setLoading(false);
  }

  async function send() {
    if (!input.trim() || loading || round >= MAX_ROUNDS) return;
    const txt = input.trim();
    setInput("");
    setErr("");

    const userMsg = { role: "user", text: txt };
    const updated = [...msgs, userMsg];
    setMsgs(updated);
    setLoading(true);

    try {
      const history = updated.map((m) => ({ role: m.role, text: m.text }));
      const ai = await callDebate(topic, mode, txt, history);

      setMsgs((prev) => {
        const arr = [...prev];
        arr[arr.length - 1] = {
          ...arr[arr.length - 1],
          score: ai.strength_score,
        };
        return [...arr, { role: "ai", text: ai.argument, fallacy: ai.fallacy }];
      });

      setCq(ai.counterquestion);
      if (ai.fallacy) setFallacies((prev) => [...prev, ai.fallacy.name]);
      setTotal((prev) => prev + ai.strength_score);
      setCount((prev) => prev + 1);

      const nextRound = round + 1;
      setRound(nextRound);
      if (nextRound >= MAX_ROUNDS) {
        const updatedFallacies = ai.fallacy
          ? [...fallacies, ai.fallacy.name]
          : fallacies;
        const updatedTotal = total + ai.strength_score;
        const updatedCount = count + 1;
        const finishedRoundScores = [
          ...userMsgs.map((m) => m.score),
          ai.strength_score,
        ];

        const finalUserMsg = { ...userMsg, score: ai.strength_score };
        const finalAiMsg = {
          role: "ai",
          text: ai.argument,
          fallacy: ai.fallacy,
        };
        const fullTranscript = [...msgs, finalUserMsg, finalAiMsg];

        saveDebate({
          topic,
          mode,
          finalScore: Math.round((updatedTotal / updatedCount) * 10),
          fallacies: updatedFallacies,
          roundScores: finishedRoundScores,
          messages: fullTranscript,
        });

        setTimeout(() => setScreen("report"), 600);
      }
    } catch (e) {
      setErr(e.message);
    }
    setLoading(false);
  }

  async function handleDownloadPDF() {
    setPdfLoad(true);
    setErr("");
    try {

      const userMsgs = msgs.filter((m) => m.role === "user" && m.score);
      const finalScore = count > 0 ? Math.round((total / count) * 10) : 0;

      await downloadDebatePDF({
        topic,
        mode,
        finalScore,
        avgScore: count > 0 ? total / count : 0,
        fallacies,
        messages: msgs.map((m) => ({
          role: m.role,
          text: m.text,
          score: m.score || null,
          fallacy: m.fallacy ? m.fallacy.name : null,
        })),
        roundScores: userMsgs.map((m) => m.score),
      });
    } catch (e) {
      setErr(e.message);
    }
    setPdfLoad(false);
  }

  function restart() {
    setScreen("land");
    setTopic("");
    setMsgs([]);
    setInput("");
    setRound(0);
    setCq(null);
    setFallacies([]);
    setTotal(0);
    setCount(0);
    setErr("");
  }

  function reopenDebate(entry) {
    setTopic(entry.topic);
    setMode(entry.mode);
    setFallacies(entry.fallacies || []);
    setMsgs(entry.messages || []);
    const sum = (entry.roundScores || []).reduce((a, b) => a + b, 0);
    setTotal(sum);
    setCount(entry.roundScores?.length || 0);
    setScreen("report");
  }

  const avg = count > 0 ? (total / count).toFixed(1) : "—";
  const userMsgs = msgs.filter((m) => m.role === "user" && m.score);
  const finalScore = count > 0 ? Math.round((total / count) * 10) : 0;

  if (screen === "land") {
    return (
      <Landing
        topic={topic}
        setTopic={setTopic}
        mode={mode}
        setMode={setMode}
        onStart={start}
        onReopen={reopenDebate}
      />
    );
  }

  if (screen === "report") {
    return (
      <Report
        topic={topic}
        mode={mode}
        umsgs={userMsgs}
        fallacies={fallacies}
        finalScore={finalScore}
        err={err}
        pdfLoad={pdfLoad}
        onRestart={restart}
        onDownloadPDF={handleDownloadPDF}
      />
    );
  }

  return (
    <Arena
      topic={topic}
      mode={mode}
      msgs={msgs}
      input={input}
      setInput={setInput}
      round={round}
      loading={loading}
      cq={cq}
      fallacies={fallacies}
      avg={avg}
      err={err}
      onSend={send}
    />
  );
}
