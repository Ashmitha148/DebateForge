import { useState, useEffect } from "react";
import { getHistory, clearHistory } from "../utils/history";

const TOPICS = [
  "AI will replace most jobs",
  "Social media is harmful",
  "Remote work is better",
  "Crypto is the future",
  "College degrees are overrated",
];

const MODES = [
  { id: "easy", label: "Easy", sub: "soft jabs" },
  { id: "medium", label: "Medium", sub: "sharp hits" },
  { id: "hard", label: "Hard", sub: "no mercy" },
];

export default function Landing({
  topic,
  setTopic,
  mode,
  setMode,
  onStart,
  onReopen,
}) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  function handleClear() {
    clearHistory();
    setHistory([]);
  }
  return (
    <div className="land">
      <div className="land-top">
        <span className="brand">
          Debate<span className="x">Forge</span>
        </span>
        <span className="stamp">
          EST. TODAY
          <br />5 ROUNDS · NO REFEREE
        </span>
      </div>

      <div className="land-body">
        <div>
          <h1 className="headline">
            Pick a fight
            <br />
            with an <span className="strike">AI</span>
          </h1>
          <p className="lede">
            Throw out any opinion. The bot takes the opposite corner and swings
            back — calling out your weak logic round by round.
          </p>

          <div className="field-group">
            <div>
              <div className="field-tag">
                <b>01</b> Name your claim
              </div>
              <input
                className="topic-input"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Type something you believe..."
                onKeyDown={(e) => e.key === "Enter" && onStart()}
              />
            </div>

            <div className="chip-row">
              {TOPICS.map((t) => (
                <button key={t} className="chip" onClick={() => setTopic(t)}>
                  {t}
                </button>
              ))}
            </div>

            <div>
              <div className="field-tag">
                <b>02</b> Pick the gloves
              </div>
              <div className="ring-row">
                {MODES.map((m) => (
                  <button
                    key={m.id}
                    className={`ring-btn ${mode === m.id ? "on" : ""}`}
                    onClick={() => setMode(m.id)}
                  >
                    {m.label}
                    <small>{m.sub}</small>
                  </button>
                ))}
              </div>
            </div>

            <button
              className="go-btn"
              onClick={onStart}
              disabled={!topic.trim()}
            >
              Step into the ring →
            </button>
          </div>
        </div>

        <div className="preview-card">
          <div className="preview-head">
            <span>LIVE_PREVIEW.LOG</span>
            <span className="preview-dot"></span>
          </div>
          <div className="preview-body">
            <div className="pv-line">
              <span className="pv-tag ai">BOT</span>
              <div>
                <p className="pv-text">
                  That sounds nice, but it falls apart fast. Most remote workers
                  say they feel cut off from the team.
                </p>
                <span className="pv-flag">⚠ hasty generalization</span>
              </div>
            </div>
            <div className="pv-line">
              <span className="pv-tag you">YOU</span>
              <p className="pv-text">
                Stanford ran a study — remote workers were 13% more productive.
              </p>
            </div>
            <div className="pv-score-grid">
              <div className="pv-score-cell">
                <div className="pv-score-v">74</div>
                <div className="pv-score-l">SCORE</div>
              </div>
              <div className="pv-score-cell">
                <div className="pv-score-v">3</div>
                <div className="pv-score-l">FLAGS</div>
              </div>
              <div className="pv-score-cell">
                <div className="pv-score-v">5/5</div>
                <div className="pv-score-l">ROUNDS</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="history-section">
        <div className="history-head">
          <span className="history-title">Past fights</span>
          {history.length > 0 && (
            <button className="history-clear" onClick={handleClear}>
              clear all
            </button>
          )}
        </div>

        {history.length > 0 ? (
          <div className="history-grid">
            {history.map((h) => (
              <div
                className="history-card"
                key={h.id}
                onClick={() => onReopen(h)}
              >
                <div className="history-card-top">
                  <span
                    className="history-score"
                    style={{
                      color:
                        h.finalScore >= 70
                          ? "#3f6b3f"
                          : h.finalScore >= 45
                            ? "#b8862f"
                            : "#b8392f",
                    }}
                  >
                    {h.finalScore}
                  </span>
                  <span className="history-mode">{h.mode}</span>
                </div>
                <p className="history-topic">"{h.topic}"</p>
                <div className="history-meta">
                  {h.fallacyCount} flags ·{" "}
                  {new Date(h.date).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="history-empty">
            <p className="history-empty-line">No battles yet.</p>
            <p className="history-empty-sub">
              Step into the ring above to start your first one.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
