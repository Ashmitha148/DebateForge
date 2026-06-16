import { estimateStrength } from "../utils/estimateStrength";
import { useEffect, useRef } from "react";

const MAX = 5;

function liveTone(s) {
  return s >= 65 ? "#3f6b3f" : s >= 35 ? "#b8862f" : "#b8392f";
}

function scoreTone(s) {
  return s >= 7 ? "#3f6b3f" : s >= 4 ? "#b8862f" : "#b8392f";
}

export default function Arena({
  topic,
  mode,
  msgs,
  input,
  setInput,
  round,
  loading,
  cq,
  fallacies,
  avg,
  err,
  onSend,
}) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, loading]);

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }

  return (
    <div className="arena-wrap">
      <div className="arena-top">
        <span className="arena-brand">
          Debate<span className="x">Forge</span>
        </span>
        <span className="arena-topic-tag">"{topic}"</span>
        <div className="round-pips">
          {Array.from({ length: MAX }).map((_, i) => (
            <div
              key={i}
              className={`pip ${i < round - 1 ? "done" : i === round - 1 ? "active" : ""}`}
            />
          ))}
        </div>
      </div>

      <div className="scoreboard">
        <div className="sb-cell">
          <div className="sb-l">Round</div>
          <div className="sb-v">
            {Math.min(round, MAX)}/{MAX}
          </div>
        </div>
        <div className="sb-cell">
          <div className="sb-l">Avg power</div>
          <div
            className="sb-v"
            style={{
              color: avg !== "—" ? scoreTone(parseFloat(avg)) : "#a89e8a",
            }}
          >
            {avg}
          </div>
        </div>
        <div className="sb-cell">
          <div className="sb-l">Flags</div>
          <div className="sb-v" style={{ color: "#b8392f" }}>
            {fallacies.length}
          </div>
        </div>
        <div className="sb-cell">
          <div className="sb-l">Gloves</div>
          <div
            className="sb-v"
            style={{ fontSize: 18, textTransform: "capitalize" }}
          >
            {mode}
          </div>
        </div>
      </div>

      <div className="bout">
        {msgs.map((m, i) => (
          <div key={i} className={`turn ${m.role === "user" ? "you" : ""}`}>
            <div className={`corner ${m.role === "ai" ? "ai" : "you"}`}>
              {m.role === "ai" ? "BOT" : "YOU"}
            </div>
            <div className={`speech ${m.role === "ai" ? "ai" : "you"}`}>
              <p className="speech-text">{m.text}</p>
              {m.role === "user" && m.score && (
                <div className="meter-row">
                  <div className="meter-track">
                    <div
                      className="meter-fill"
                      style={{
                        width: `${m.score * 10}%`,
                        background: scoreTone(m.score),
                      }}
                    />
                  </div>
                  <span className="meter-num">{m.score}/10</span>
                </div>
              )}
              {m.fallacy && (
                <div className="flag-box">
                  <b>⚠ {m.fallacy.name}</b>
                  <span>{m.fallacy.explanation}</span>
                </div>
              )}
              <div className="speech-meta">
                {m.role === "ai"
                  ? `BOT · round ${Math.ceil((i + 1) / 2)}`
                  : `YOU · round ${Math.ceil(i / 2)}`}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="turn">
            <div className="corner ai">BOT</div>
            <div className="thinking-box">
              <div className="tdot" />
              <div className="tdot" />
              <div className="tdot" />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {err && <div className="error-strip">⚠ {err}</div>}

      {cq && round < MAX && !loading && (
        <div className="challenge">
          <span className="challenge-tag">thrown back at you</span>
          <span className="challenge-text">{cq}</span>
        </div>
      )}

      {round < MAX && (
        <>
          <div className="ring-input">
            <textarea
              className="arg-in"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Round ${round + 1} — swing back...`}
              rows={2}
              disabled={loading}
            />
            <button
              className="swing-btn"
              onClick={onSend}
              disabled={loading || !input.trim()}
            >
              {loading ? "..." : "Swing →"}
            </button>
          </div>

          {input.trim().length > 2 && (
            <div className="live-meter">
              <span className="live-meter-label">est. strength</span>
              <div className="live-meter-track">
                <div
                  className="live-meter-fill"
                  style={{
                    width: `${estimateStrength(input)}%`,
                    background: liveTone(estimateStrength(input)),
                  }}
                />
              </div>
              <span
                className="live-meter-val"
                style={{ color: liveTone(estimateStrength(input)) }}
              >
                {estimateStrength(input)}%
              </span>
            </div>
          )}

          <div className="hint-line">
            enter to throw · shift+enter for a new line
          </div>
        </>
      )}
    </div>
  );
}
