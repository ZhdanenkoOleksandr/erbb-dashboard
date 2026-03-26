import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { ethers } from "ethers";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import SignalCard from "./SignalCard";
import InsightList from "./InsightList";
import RulesModal from "./RulesModal";

// ERBB Smart Contract
const ERBB_ADDRESS = "0x5702A4487dA07c827cdE512e2d5969CB430cd839";

// Minimal-but-flexible ABI:
// - price functions are "best-effort" candidates (no-arg view functions)
// - events are optional; if the contract emits them, we update from events
const ERBB_ABI = [
  "function decimals() view returns (uint8)",
  "function getPrice() view returns (uint256)",
  "function price() view returns (uint256)",
  "function currentPrice() view returns (uint256)",
  "function tokenPrice() view returns (uint256)",
  "function getTokenPrice() view returns (uint256)",
  "event PriceUpdated(uint256 price)",
  "event ERBBPriceUpdated(uint256 price)",
];

const PRICE_FUNCTION_CANDIDATES = [
  "getPrice",
  "price",
  "currentPrice",
  "tokenPrice",
  "getTokenPrice",
];

const formatTimeLabel = (ms) => {
  const d = new Date(ms);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
};

const normalizeSignal = (data) => {
  const rawSignal = data?.signal ?? data?.type ?? data?.recommendation ?? data?.name;
  const signal = typeof rawSignal === "string" ? rawSignal : "HOLD";

  const rawScore =
    data?.finalScore ?? data?.score ?? data?.confidence ?? data?.finalScore?.score;
  const finalScore = typeof rawScore === "number" ? rawScore : Number(rawScore);

  return {
    signal,
    finalScore: Number.isFinite(finalScore) ? finalScore : 0,
  };
};

const normalizeInsights = (data) => {
  const list = Array.isArray(data)
    ? data
    : data?.insights ?? data?.data ?? data?.items ?? [];

  return list.map((x, idx) => ({
    id: x?.id ?? x?.title ?? idx,
    title: x?.title ?? x?.headline ?? "Untitled insight",
    impact: x?.impact ?? x?.summary ?? "—",
    confidence: x?.confidence ?? x?.probability ?? "—",
    direction: x?.direction ?? x?.dir ?? x?.trend ?? 0,
  }));
};

const Dashboard = () => {
  const RPC_URL =
    process.env.REACT_APP_RPC_URL ||
    // Public RPC fallback (can rate-limit; override via `REACT_APP_RPC_URL` for production).
    "https://cloudflare-eth.com";

  // Some public RPCs don't support `eth_newFilter` which ethers uses for event subscriptions.
  // We also pass an explicit `chainId` to fully disable network auto-detection (which can fail).
  // Override via `REACT_APP_CHAIN_ID` if ERBB is not on Ethereum mainnet.
  const chainId = Number(process.env.REACT_APP_CHAIN_ID || 1);
  const provider = useMemo(
    () => new ethers.JsonRpcProvider(RPC_URL, chainId, { staticNetwork: true }),
    [RPC_URL, chainId]
  );
  const contract = useMemo(() => new ethers.Contract(ERBB_ADDRESS, ERBB_ABI, provider), [provider]);
  const erbbIface = useMemo(() => new ethers.Interface(ERBB_ABI), []);

  const [tokenDecimals, setTokenDecimals] = useState(18);
  const [signal, setSignal] = useState({ signal: "HOLD", finalScore: 0 });
  const [insights, setInsights] = useState([]);
  const [erbbPrice, setErbbPrice] = useState(null);
  const [priceHistory, setPriceHistory] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [priceError, setPriceError] = useState(null);
  const [rulesOpen, setRulesOpen] = useState(false);
  const lastPriceLogBlockRef = useRef(null);
  const lastEventFallbackFetchTsRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const d = await contract.decimals();
        if (!cancelled) setTokenDecimals(Number(d));
      } catch (e) {
        // If decimals() doesn't exist or call fails, keep default 18.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [contract]);

  const formatRawPrice = (raw) => {
    try {
      const asString = ethers.formatUnits(raw, tokenDecimals); // returns string
      const n = Number(asString);
      return Number.isFinite(n) ? n : null;
    } catch {
      return null;
    }
  };

  const appendPricePoint = (price) => {
    const now = Date.now();
    setPriceHistory((prev) => {
      const next = [...prev, { name: formatTimeLabel(now), price }];
      // Keep chart readable.
      return next.slice(-60);
    });
    setLastUpdate(new Date(now));
  };

  const fetchErbbPriceFromContract = async (debug) => {
    for (const fn of PRICE_FUNCTION_CANDIDATES) {
      try {
        const raw = await contract[fn]();
        if (raw == null) continue;
        const formatted = formatRawPrice(raw);
        if (formatted != null) return formatted;
      } catch (e) {
        // Try next candidate function.
        debug?.contract?.push({
          fn,
          message: e?.message ? String(e.message).slice(0, 180) : "unknown error",
        });
      }
    }
    return null;
  };

  const fetchErbbPriceFromCoinGecko = async (debug) => {
    // CoinGecko free API – no key required, returns USD price by contract address.
    const url =
      `https://api.coingecko.com/api/v3/simple/token_price/ethereum` +
      `?contract_addresses=${ERBB_ADDRESS.toLowerCase()}&vs_currencies=usd`;
    try {
      const res = await axios.get(url, { timeout: 8000 });
      const entry = res?.data?.[ERBB_ADDRESS.toLowerCase()];
      const n = Number(entry?.usd);
      if (Number.isFinite(n) && n > 0) return n;
      debug?.coingecko?.push({ status: "no usd price in response", raw: JSON.stringify(entry) });
    } catch (e) {
      debug?.coingecko?.push({ status: "request failed", message: e?.message?.slice(0, 120) });
    }
    return null;
  };

  const fetchErbbPriceFromBackend = async (debug) => {
    // Last-resort fallback if ABI-based reads don't work on the selected chain/RPC.
    const endpoints = ["/api/price", "/api/erbb-price", "/api/token-price"];

    for (const ep of endpoints) {
      try {
        const res = await axios.get(ep);
        const data = res?.data ?? {};

        const raw =
          data?.price ?? data?.erbbPrice ?? data?.tokenPrice ?? data?.currentPrice ?? data?.value;

        if (raw == null) {
          debug?.backend?.push({ endpoint: ep, status: "no price field in response" });
          continue;
        }

        // If backend returns raw integer units (as string), format it using tokenDecimals.
        if (typeof raw === "string" && /^\d+$/.test(raw)) {
          try {
            const formatted = formatRawPrice(raw);
            if (formatted != null) return formatted;
          } catch {
            // continue
          }
        }

        const n = Number(raw);
        if (Number.isFinite(n)) return n;
        debug?.backend?.push({ endpoint: ep, status: "non-numeric price field" });
      } catch {
        // try next endpoint
        debug?.backend?.push({ endpoint: ep, status: "request failed" });
      }
    }

    return null;
  };

  const EVENT_NAMES = ["PriceUpdated", "ERBBPriceUpdated"];

  const safeGetBlockNumber = async () => {
    try {
      return await provider.getBlockNumber();
    } catch {
      return null;
    }
  };

  const fetchErbbPriceFromEvents = async (debug) => {
    // Poll logs instead of `contract.on(...)` to avoid RPCs that don't support `eth_newFilter`.
    const nowBlock = await safeGetBlockNumber();

    const last = lastPriceLogBlockRef.current;
    // If the RPC doesn't support `eth_blockNumber`, we can't do a relative window.
    // In that case, we fetch from earliest to latest and pick the latest emitted price.
    // We also throttle to avoid hammering the RPC.
    const cooldownMs = 60000;
    const shouldThrottle = nowBlock == null && Date.now() - lastEventFallbackFetchTsRef.current < cooldownMs;
    if (shouldThrottle) return null;

    let fromBlock = 0;
    let toBlock = "latest";

    if (nowBlock == null) {
      // RPC cannot report current block. We'll fetch everything up to `latest`
      // and pick the latest price update.
      lastEventFallbackFetchTsRef.current = Date.now();
      lastPriceLogBlockRef.current = null;
    } else {
      fromBlock = last == null ? Math.max(0, nowBlock - 300) : last + 1;
      toBlock = nowBlock;
      lastPriceLogBlockRef.current = nowBlock;
    }

    let best = null; // { blockNumber, logIndex, priceRaw }

    for (const eventName of EVENT_NAMES) {
      try {
        const topic = erbbIface.getEvent(eventName)?.topicHash;
        if (!topic) continue;

        const logs = await provider.getLogs({
          address: ERBB_ADDRESS,
          fromBlock,
          toBlock,
          topics: [topic],
        });

        if (!logs || logs.length === 0) {
          debug?.events?.push({ eventName, status: "no logs in window" });
        }

        for (const log of logs) {
          const parsed = erbbIface.parseLog(log);
          const priceRaw = parsed?.args?.[0];
          if (priceRaw == null) continue;
          const price = formatRawPrice(priceRaw);
          if (price == null) continue;

          const candidate = { blockNumber: log.blockNumber, logIndex: log.index, price };
          if (
            best == null ||
            candidate.blockNumber > best.blockNumber ||
            (candidate.blockNumber === best.blockNumber && candidate.logIndex > best.logIndex)
          ) {
            best = candidate;
          }
        }
      } catch (e) {
        // Non-fatal: continue to other events.
        debug?.events?.push({
          eventName,
          message: e?.message ? String(e.message).slice(0, 180) : "unknown error",
        });
      }
    }

    return best?.price ?? null;
  };

  useEffect(() => {
    let cancelled = false;

    const fetchSignal = async () => {
      try {
        const res = await axios.get("/api/signal");
        if (!cancelled) setSignal(normalizeSignal(res.data));
      } catch (e) {
        // Non-fatal: keep last known signal.
      }
    };

    const fetchInsights = async () => {
      try {
        const res = await axios.get("/api/insight");
        if (!cancelled) setInsights(normalizeInsights(res.data));
      } catch (e) {
        // Non-fatal: keep last known insights.
      }
    };

    const fetchPrice = async () => {
      try {
        const debug = { coingecko: [], contract: [], events: [], backend: [] };

        // 1) CoinGecko – most reliable source (ERBB has no on-chain price function)
        let formatted = await fetchErbbPriceFromCoinGecko(debug);

        // 2) Fallback: try contract view methods
        if (formatted == null) {
          formatted = await fetchErbbPriceFromContract(debug);
        }

        // 3) Fallback: try events via polling logs
        if (formatted == null) {
          formatted = await fetchErbbPriceFromEvents(debug);
        }

        // 4) Fallback: backend price endpoint (if provided)
        if (formatted == null) {
          formatted = await fetchErbbPriceFromBackend(debug);
        }

        if (!cancelled && formatted != null) {
          setPriceError(null);
          setErbbPrice(formatted);
          appendPricePoint(formatted);
          return;
        }

        if (!cancelled) {
          const cgSummary =
            debug.coingecko.length > 0
              ? `coingecko: ${debug.coingecko[0].status}`
              : "coingecko: no response";

          const contractSummary =
            debug.contract.length > 0
              ? `contract: failed (${debug.contract[debug.contract.length - 1].fn})`
              : "contract: no price functions";

          const backendSummary =
            debug.backend.length > 0
              ? `backend: tried ${debug.backend.length} endpoints`
              : "backend: no debug info";

          setPriceError(`Could not read ERBB price. ${cgSummary}. ${contractSummary}. ${backendSummary}.`);
        }
      } catch (e) {
        if (!cancelled) setPriceError(e?.message ?? "Failed to fetch price");
      }
    };

    // Initial load
    fetchSignal();
    fetchInsights();
    fetchPrice();

    const interval = setInterval(() => {
      fetchSignal();
      fetchInsights();
      fetchPrice();
    }, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [contract, tokenDecimals]);

  return (
    <div style={{ padding: 24, fontFamily: "Arial, sans-serif", maxWidth: 980, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <h1 style={{ marginTop: 0 }}>ERBB Dashboard</h1>
        <button
          onClick={() => setRulesOpen(true)}
          style={{
            border: "1px solid #e5e7eb",
            background: "#fff",
            borderRadius: 12,
            padding: "10px 12px",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          Правила
        </button>
      </div>

      <SignalCard signal={signal.signal} score={signal.finalScore} />

      <div style={{ margin: "12px 0 18px" }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>
          Current ERBB Price:{" "}
          {erbbPrice == null ? "—" : erbbPrice.toFixed(6)}
        </div>
        <div style={{ color: "#6b7280", fontSize: 12, marginTop: 4 }}>
          Last update: {lastUpdate ? lastUpdate.toLocaleString() : "—"}
        </div>
        {priceError ? (
          <div style={{ color: "#b91c1c", fontSize: 12, marginTop: 6 }}>
            Price error: {priceError}
          </div>
        ) : null}
      </div>

      <div style={{ margin: "20px 0", width: "100%", height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={priceHistory}>
            <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
            <XAxis dataKey="name" minTickGap={35} />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="price" stroke="#6366f1" dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <InsightList insights={insights} />

      <RulesModal open={rulesOpen} onClose={() => setRulesOpen(false)} />
    </div>
  );
};

export default Dashboard;

