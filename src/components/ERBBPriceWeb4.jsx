import React, { useEffect, useRef, useState } from "react";
import { useERBBUniswapPrice } from "../hooks/useERBBUniswapPrice";

/* ─── keyframes injected once ─── */
const STYLE_ID = "erbb-web4-styles";
if (!document.getElementById(STYLE_ID)) {
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
    @keyframes erbb-glow-pulse {
      0%, 100% { box-shadow: 0 0 8px #00d4ff44, 0 0 24px #00d4ff22, inset 0 0 12px #00d4ff08; }
      50%       { box-shadow: 0 0 16px #00d4ff88, 0 0 48px #00d4ff44, inset 0 0 24px #00d4ff18; }
    }
    @keyframes erbb-border-glow {
      0%, 100% { border-color: #00d4ff33; }
      50%       { border-color: #00d4ff99; }
    }
    @keyframes erbb-spin {
      to { transform: rotate(360deg); }
    }
    @keyframes erbb-value-flash {
      0%   { color: #00d4ff; text-shadow: 0 0 12px #00d4ffcc; }
      100% { color: #e2e8f0; text-shadow: 0 0 4px #00d4ff44; }
    }
    @keyframes erbb-float {
      0%, 100% { transform: translateY(0px); }
      50%       { transform: translateY(-3px); }
    }
    @keyframes erbb-scanline {
      0%   { background-position: 0 0; }
      100% { background-position: 0 4px; }
    }
  `;
  document.head.appendChild(s);
}

/* ─── helpers ─── */
function fmt(n, decimals = 8) {
  if (n == null) return "—";
  if (n < 0.000001) return n.toExponential(4);
  return n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function fmtUsd(n) {
  if (n == null) return "—";
  if (n < 0.01) return "$" + n.toFixed(8);
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
}

/* ─── sub-components ─── */
function Loader() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div
        style={{
          width: 18,
          height: 18,
          border: "2px solid #00d4ff33",
          borderTopColor: "#00d4ff",
          borderRadius: "50%",
          animation: "erbb-spin 0.8s linear infinite",
          flexShrink: 0,
        }}
      />
      <span style={{ color: "#00d4ff99", fontSize: 13, letterSpacing: 2 }}>
        FETCHING ON-CHAIN DATA…
      </span>
    </div>
  );
}

function PriceRow({ label, value, accent = "#00d4ff", flashing }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 16px",
        borderRadius: 10,
        background: "rgba(0,212,255,0.03)",
        border: "1px solid rgba(0,212,255,0.10)",
        marginBottom: 8,
        animation: "erbb-border-glow 3s ease-in-out infinite",
      }}
    >
      <span
        style={{
          fontSize: 11,
          letterSpacing: 2,
          color: "#64748b",
          fontFamily: "monospace",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      <span
        key={value}
        style={{
          fontSize: 15,
          fontWeight: 700,
          fontFamily: "monospace",
          color: accent,
          textShadow: `0 0 8px ${accent}88`,
          animation: flashing ? "erbb-value-flash 1s ease-out forwards" : "none",
        }}
      >
        {value}
      </span>
    </div>
  );
}

/* ─── main component ─── */
export function ERBBPriceWeb4() {
  const { erbbInEth, erbbInUsd, ethUsd, loading, noLiquidity, error } =
    useERBBUniswapPrice();

  // Flash effect on price update
  const prevEthRef = useRef(null);
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    if (erbbInEth != null && prevEthRef.current !== erbbInEth) {
      prevEthRef.current = erbbInEth;
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 1000);
      return () => clearTimeout(t);
    }
  }, [erbbInEth]);

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #0a0f1e 0%, #0d1526 50%, #0a1628 100%)",
        border: "1px solid rgba(0,212,255,0.2)",
        borderRadius: 16,
        padding: "20px 24px",
        position: "relative",
        overflow: "hidden",
        animation: "erbb-glow-pulse 4s ease-in-out infinite",
        marginBottom: 20,
      }}
    >
      {/* scanline overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,212,255,0.015) 2px, rgba(0,212,255,0.015) 4px)",
          pointerEvents: "none",
          animation: "erbb-scanline 4s linear infinite",
        }}
      />

      {/* corner accents */}
      {["topLeft", "topRight", "bottomLeft", "bottomRight"].map((pos) => (
        <div
          key={pos}
          style={{
            position: "absolute",
            width: 12,
            height: 12,
            ...(pos.includes("top") ? { top: 8 } : { bottom: 8 }),
            ...(pos.includes("Left") ? { left: 8 } : { right: 8 }),
            borderTop: pos.includes("top") ? "1px solid #00d4ff88" : "none",
            borderBottom: pos.includes("bottom") ? "1px solid #00d4ff88" : "none",
            borderLeft: pos.includes("Left") ? "1px solid #00d4ff88" : "none",
            borderRight: pos.includes("Right") ? "1px solid #00d4ff88" : "none",
          }}
        />
      ))}

      {/* header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: loading ? "#64748b" : "#00d4ff",
              boxShadow: loading ? "none" : "0 0 8px #00d4ff, 0 0 16px #00d4ff88",
              animation: loading ? "none" : "erbb-glow-pulse 2s ease-in-out infinite",
            }}
          />
          <span
            style={{
              fontSize: 11,
              letterSpacing: 3,
              color: "#00d4ffcc",
              fontFamily: "monospace",
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            ERBB / UNISWAP V2
          </span>
        </div>
        <span
          style={{
            fontSize: 9,
            letterSpacing: 2,
            color: "#334155",
            fontFamily: "monospace",
          }}
        >
          ON-CHAIN · 30s
        </span>
      </div>

      {/* content */}
      {loading ? (
        <Loader />
      ) : noLiquidity ? (
        <div
          style={{
            textAlign: "center",
            padding: "16px 0",
            color: "#f59e0b",
            fontSize: 13,
            letterSpacing: 2,
            fontFamily: "monospace",
            textShadow: "0 0 8px #f59e0b88",
          }}
        >
          ⚠ NO LIQUIDITY POOL FOUND
        </div>
      ) : error ? (
        <div
          style={{
            textAlign: "center",
            padding: "12px 0",
            color: "#ef444499",
            fontSize: 11,
            letterSpacing: 1,
            fontFamily: "monospace",
          }}
        >
          RPC ERROR · {String(error).slice(0, 60)}
        </div>
      ) : (
        <div style={{ animation: "erbb-float 6s ease-in-out infinite" }}>
          <PriceRow
            label="ERBB / ETH"
            value={fmt(erbbInEth) + " Ξ"}
            accent="#00d4ff"
            flashing={flash}
          />
          <PriceRow
            label="ERBB / USD"
            value={fmtUsd(erbbInUsd)}
            accent="#7c3aed"
            flashing={flash}
          />
          <PriceRow
            label="ETH  / USD"
            value={ethUsd != null ? "$" + ethUsd.toLocaleString("en-US") : "—"}
            accent="#10b981"
          />
        </div>
      )}

      {/* footer */}
      {!loading && !error && !noLiquidity && (
        <div
          style={{
            marginTop: 12,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: 9,
              letterSpacing: 2,
              color: "#1e3a5f",
              fontFamily: "monospace",
            }}
          >
            UNISWAP V2 · RESERVE RATIO
          </span>
          <span
            style={{
              fontSize: 9,
              letterSpacing: 1,
              color: "#1e3a5f",
              fontFamily: "monospace",
            }}
          >
            ETH/USD · COINGECKO
          </span>
        </div>
      )}
    </div>
  );
}

export default ERBBPriceWeb4;
