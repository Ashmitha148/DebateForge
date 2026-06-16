const MAX = 5;

function scoreTone(s) {
  return s >= 7 ? "#3f6b3f" : s >= 4 ? "#b8862f" : "#b8392f";
}

export default function Report({
  topic,
  mode,
  umsgs,
  fallacies,
  finalScore,
  err,
  pdfLoad,
  onRestart,
  onDownloadPDF,
}) {
  const col =
    finalScore >= 70 ? "#3f6b3f" : finalScore >= 45 ? "#b8862f" : "#b8392f";

  return (
    <div className="verdict-wrap">
      <div className="verdict-top">
        <div>
          <div className="verdict-label">
            final verdict · {MAX} rounds · {mode} mode
          </div>
          <div className="verdict-score" style={{ color: col }}>
            {finalScore}
            <span className="verdict-denom">/100</span>
          </div>
          <div className="verdict-line">
            {finalScore >= 70
              ? "You held your ground — solid arguments all the way through."
              : finalScore >= 45
                ? "Decent showing, but a few weak spots got exposed."
                : "Rough round — your logic had some real gaps."}
          </div>
        </div>
        <div className="verdict-side">
          topic
          <br />
          <b>"{topic}"</b>
          <br />
          flags caught
          <br />
          <b style={{ color: "#b8392f", fontSize: 24 }}>{fallacies.length}</b>
        </div>
      </div>

      <div className="verdict-grid">
        <div className="v-block">
          <div className="v-block-title">
            <span className="dash"></span>Round by round
          </div>
          {umsgs.length > 0 ? (
            umsgs.map((m, i) => (
              <div className="round-line" key={i}>
                <span className="round-line-l">RND {i + 1}</span>
                <div className="round-line-track">
                  <div
                    className="round-line-fill"
                    style={{
                      width: `${m.score * 10}%`,
                      background: scoreTone(m.score),
                    }}
                  />
                </div>
                <span className="round-line-val">{m.score}</span>
              </div>
            ))
          ) : (
            <p className="empty-note">No rounds recorded.</p>
          )}
        </div>

        <div className="v-block">
          <div className="v-block-title">
            <span className="dash"></span>Fallacies thrown
          </div>
          {fallacies.length > 0 ? (
            fallacies.map((f, i) => (
              <span className="fal-pill" key={i}>
                {f}
              </span>
            ))
          ) : (
            <p className="empty-note">Clean fight — no fallacies caught!</p>
          )}
        </div>
      </div>

      {err && <div className="error-strip">⚠ {err}</div>}

      <div className="verdict-actions">
        <button className="btn-outline" onClick={onRestart}>
          ← Rematch
        </button>
        <button className="btn-fill" onClick={onDownloadPDF} disabled={pdfLoad}>
          {pdfLoad ? (
            <>
              <span className="spin" />
              Printing...
            </>
          ) : (
            "↓ Print the scorecard"
          )}
        </button>
      </div>
    </div>
  );
}
