import { useEffect, useRef, useState } from "react";
import { ethers } from "ethers";

const ERBB_ADDRESS   = "0x5702A4487dA07c827cdE512e2d5969CB430cd839";
const WETH_ADDRESS   = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const FACTORY_ADDRESS = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
const RPC_URLS = [
  "https://rpc.ankr.com/eth",
  "https://eth.llamarpc.com",
  "https://1rpc.io/eth",
  "https://ethereum.publicnode.com",
  "https://cloudflare-eth.com",
];
const REFRESH_MS     = 30_000;

const FACTORY_ABI = [
  "function getPair(address tokenA, address tokenB) external view returns (address pair)",
];

const PAIR_ABI = [
  "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
  "function token0() external view returns (address)",
];

const ETH_USD_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd";
const COINGECKO_TOKEN_URL =
  `https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${ERBB_ADDRESS.toLowerCase()}&vs_currencies=usd,eth`;
const CMC_API_KEY =
  process.env.REACT_APP_CMC_API_KEY || "878c7b3927504821b23dd8e805f9d726";
const CMC_URL =
  `https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?address=${ERBB_ADDRESS.toLowerCase()}&convert=USD`;

async function fetchEthUsd() {
  try {
    const res = await fetch(ETH_USD_URL, { signal: AbortSignal.timeout(6000) });
    const json = await res.json();
    const n = Number(json?.ethereum?.usd);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

async function fetchCoinGeckoPrice() {
  try {
    const res = await fetch(COINGECKO_TOKEN_URL, { signal: AbortSignal.timeout(8000) });
    const json = await res.json();
    const entry = json?.[ERBB_ADDRESS.toLowerCase()];
    const usd = Number(entry?.usd);
    const eth = Number(entry?.eth);
    if (Number.isFinite(usd) && usd > 0) {
      return { erbbInUsd: usd, erbbInEth: Number.isFinite(eth) && eth > 0 ? eth : null };
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchCMCPrice() {
  try {
    const res = await fetch(CMC_URL, {
      headers: { "X-CMC_PRO_API_KEY": CMC_API_KEY },
      signal: AbortSignal.timeout(8000),
    });
    const json = await res.json();
    // Response: { data: { "TOKEN_SYMBOL": [{ quote: { USD: { price } } }] } }
    const entries = json?.data ? Object.values(json.data) : [];
    for (const list of entries) {
      const item = Array.isArray(list) ? list[0] : list;
      const usd = Number(item?.quote?.USD?.price);
      if (Number.isFinite(usd) && usd > 0) return { erbbInUsd: usd, erbbInEth: null };
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchOnChainPriceWithRpc(rpcUrl) {
  const provider = new ethers.JsonRpcProvider(rpcUrl, 1, { staticNetwork: true });

  const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);
  const pairAddress = await factory.getPair(ERBB_ADDRESS, WETH_ADDRESS);

  if (!pairAddress || pairAddress === ethers.ZeroAddress) {
    return { erbbInEth: null, noLiquidity: true };
  }

  const pair = new ethers.Contract(pairAddress, PAIR_ABI, provider);
  const [reserves, token0] = await Promise.all([
    pair.getReserves(),
    pair.token0(),
  ]);

  const erbbIsToken0 = token0.toLowerCase() === ERBB_ADDRESS.toLowerCase();
  const reserveERBB = erbbIsToken0 ? reserves[0] : reserves[1];
  const reserveWETH = erbbIsToken0 ? reserves[1] : reserves[0];

  if (reserveERBB === 0n) {
    return { erbbInEth: null, noLiquidity: true };
  }

  const erbbInEth =
    Number(ethers.formatUnits(reserveWETH, 18)) /
    Number(ethers.formatUnits(reserveERBB, 18));

  return { erbbInEth, noLiquidity: false };
}

async function fetchOnChainPrice() {
  let lastError;
  for (const rpcUrl of RPC_URLS) {
    try {
      return await fetchOnChainPriceWithRpc(rpcUrl);
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError;
}

export function useERBBUniswapPrice() {
  const [state, setState] = useState({
    erbbInEth: null,
    erbbInUsd: null,
    ethUsd:    null,
    loading:   true,
    noLiquidity: false,
    error:     null,
  });

  const intervalRef = useRef(null);
  const mountedRef  = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const run = async () => {
      try {
        const [onChain, ethUsd] = await Promise.all([
          fetchOnChainPrice(),
          fetchEthUsd(),
        ]);

        if (!mountedRef.current) return;

        // If Uniswap V2 has no pool, fall back to CoinGecko → CMC
        if (onChain.noLiquidity) {
          const [cg, cmc] = await Promise.all([fetchCoinGeckoPrice(), fetchCMCPrice()]);
          if (!mountedRef.current) return;
          const result = cg || cmc;
          const src = cg ? "coingecko" : cmc ? "coinmarketcap" : null;
          if (result) {
            setState({
              erbbInEth: result.erbbInEth,
              erbbInUsd: result.erbbInUsd,
              ethUsd,
              loading: false,
              noLiquidity: false,
              error: null,
              source: src,
            });
            return;
          }
          setState((prev) => ({ ...prev, loading: false, noLiquidity: true, error: null }));
          return;
        }

        const { erbbInEth } = onChain;
        const erbbInUsd = erbbInEth != null && ethUsd != null ? erbbInEth * ethUsd : null;

        setState({
          erbbInEth,
          erbbInUsd,
          ethUsd,
          loading: false,
          noLiquidity: false,
          error: null,
          source: "uniswap-v2",
        });
      } catch (e) {
        if (!mountedRef.current) return;
        setState((prev) => ({
          ...prev,
          loading: false,
          error: e?.message ?? "fetch failed",
        }));
      }
    };

    run();
    intervalRef.current = setInterval(run, REFRESH_MS);

    return () => {
      mountedRef.current = false;
      clearInterval(intervalRef.current);
    };
  }, []);

  return state;
}
