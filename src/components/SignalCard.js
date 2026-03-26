import React from "react";

const SignalCard = ({ signal, score }) => {
  const normalizedSignal = typeof signal === "string" ? signal : "HOLD";
  const upper = normalizedSignal.toUpperCase();

  let color = "#999";
  if (upper.includes("BUY")) color = "#16a34a";
  if (upper.includes("SELL")) color = "#dc2626";

  const normalizedScore = typeof score === "number" ? score : Number(score);
  const scoreText = Number.isFinite(normalizedScore) ? normalizedScore.toFixed(2) : "—";

  return (
    <div
      style={{
        padding: "16px 20px",
        border: `2px solid ${color}`,
        borderRadius: "12px",
        marginBottom: "12px",
        background: "rgba(0,0,0,0.02)",
      }}
    >
      <h2 style={{ margin: 0, color }}>{normalizedSignal}</h2>
      <p style={{ margin: "8px 0 0", fontSize: 14 }}>
        Score: {scoreText}
      </p>
    </div>
  );
};

export default SignalCard;

