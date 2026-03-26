import React from "react";

const normalizeDirection = (direction) => {
  if (typeof direction === "string") {
    const upper = direction.toUpperCase();
    if (upper === "UP") return "UP";
    if (upper === "DOWN") return "DOWN";
  }

  const n = Number(direction);
  if (!Number.isFinite(n)) return "—";
  return n >= 0 ? "UP" : "DOWN";
};

const InsightList = ({ insights }) => {
  const list = Array.isArray(insights) ? insights : [];

  return (
    <div>
      <h3 style={{ marginBottom: 8 }}>Active Insights</h3>

      {list.length === 0 ? (
        <p style={{ color: "#666", marginTop: 0 }}>No active insights</p>
      ) : (
        list.map((insight, idx) => {
          const id = insight?.id ?? insight?.title ?? idx;
          const direction = normalizeDirection(insight?.direction);
          const confidence =
            typeof insight?.confidence === "number"
              ? insight.confidence.toFixed(2)
              : insight?.confidence ?? "—";

          return (
            <div
              key={id}
              style={{
                borderBottom: "1px solid #e5e7eb",
                padding: "10px 0",
              }}
            >
              <div style={{ fontWeight: 700 }}>
                {insight?.title ?? "Untitled insight"}
              </div>
              <div style={{ color: "#374151", fontSize: 13, marginTop: 2 }}>
                Impact: {insight?.impact ?? "—"} | Confidence: {confidence} | Direction:{" "}
                {direction}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default InsightList;

