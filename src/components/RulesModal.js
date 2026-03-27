import React, { useEffect } from "react";

const Section = ({ num, title, children }) => (
  <div
    style={{
      marginBottom: 18,
      padding: "14px 16px",
      background: "#f9fafb",
      borderRadius: 10,
      borderLeft: "3px solid #6366f1",
    }}
  >
    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, color: "#111827" }}>
      {num}. {title}
    </div>
    <div style={{ color: "#374151", fontSize: 13, lineHeight: 1.6 }}>{children}</div>
  </div>
);

const Tag = ({ children, color = "#6366f1" }) => (
  <span
    style={{
      display: "inline-block",
      background: color + "18",
      color,
      border: `1px solid ${color}44`,
      borderRadius: 6,
      padding: "1px 7px",
      fontSize: 11,
      fontWeight: 700,
      marginRight: 4,
    }}
  >
    {children}
  </span>
);

const RulesModal = ({ open, onClose }) => {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 50,
      }}
    >
      <div
        style={{
          width: "min(860px, 100%)",
          maxHeight: "90vh",
          overflowY: "auto",
          background: "#fff",
          borderRadius: 16,
          padding: "24px 24px 20px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 20 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 20, color: "#111827" }}>Принципы работы платформы</div>
            <div style={{ color: "#6b7280", fontSize: 13, marginTop: 4 }}>
              Как работает дашборд ERBB — источники данных, логика сигналов и методология.
            </div>
          </div>
          <button
            onClick={() => onClose?.()}
            style={{
              border: "1px solid #e5e7eb",
              background: "#fff",
              borderRadius: 10,
              padding: "6px 14px",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 13,
              flexShrink: 0,
            }}
          >
            Закрыть
          </button>
        </div>

        {/* Sections */}
        <Section num="1" title="Цена ERBB — On-Chain через Uniswap V2">
          Цена токена ERBB читается напрямую из блокчейна Ethereum без посредников.<br /><br />
          <b>Алгоритм:</b>
          <ol style={{ margin: "8px 0 0 18px", padding: 0, lineHeight: 1.9 }}>
            <li>Подключение к Ethereum через публичные RPC (ankr, llamarpc, 1rpc, publicnode, cloudflare) — автоматический переход на следующий при сбое.</li>
            <li>Запрос к <b>Uniswap V2 Factory</b> (<code>getPair</code>) для получения адреса пула ERBB/WETH.</li>
            <li>Вызов <code>getReserves()</code> на паре — получение резервов ERBB и WETH.</li>
            <li>Расчёт цены: <code>цена = reserveWETH / reserveERBB</code> (оба токена 18 decimals).</li>
            <li>Цена в USD = цена в ETH × курс ETH/USD (CoinGecko).</li>
          </ol>
          <div style={{ marginTop: 10 }}>
            <Tag>Обновление каждые 30 сек</Tag>
            <Tag color="#10b981">Только on-chain данные</Tag>
            <Tag color="#f59e0b">Fallback: 5 RPC</Tag>
          </div>
        </Section>

        <Section num="2" title="Торговый сигнал — STRONG BUY / BUY / HOLD / SELL / STRONG SELL">
          Сигнал формируется на backend на основе совокупности факторов и возвращается в поле <code>signal</code>.<br /><br />
          <b>Интерпретация score (финального балла):</b>
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 8, fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f3f4f6" }}>
                <th style={{ textAlign: "left", padding: "6px 10px", borderRadius: "6px 0 0 6px" }}>Сигнал</th>
                <th style={{ textAlign: "left", padding: "6px 10px" }}>Score</th>
                <th style={{ textAlign: "left", padding: "6px 10px", borderRadius: "0 6px 6px 0" }}>Значение</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["STRONG BUY", "> 0.75", "Сильный рост ожидается", "#15803d"],
                ["BUY",         "0.55 – 0.75", "Умеренный позитив", "#16a34a"],
                ["HOLD",        "0.45 – 0.55", "Нейтральная зона, ждать", "#92400e"],
                ["SELL",        "0.25 – 0.45", "Умеренный негатив", "#dc2626"],
                ["STRONG SELL", "< 0.25", "Сильное давление вниз", "#991b1b"],
              ].map(([s, sc, desc, c]) => (
                <tr key={s} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "6px 10px", fontWeight: 700, color: c }}>{s}</td>
                  <td style={{ padding: "6px 10px", fontFamily: "monospace" }}>{sc}</td>
                  <td style={{ padding: "6px 10px", color: "#374151" }}>{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section num="3" title="График динамики цены">
          График строится на основе исторических точек цены, накопленных за текущую сессию.<br /><br />
          — Данные опрашиваются каждые <b>5 секунд</b>.<br />
          — Хранится до <b>60 последних точек</b> (5 минут непрерывного наблюдения).<br />
          — Ось X — время (ЧЧ:ММ:СС), ось Y — цена в единицах токена.<br />
          — При перезагрузке страницы история обнуляется.
        </Section>

        <Section num="4" title="Активные инсайты">
          Инсайты — это структурированные аналитические наблюдения, поступающие с backend (<code>/api/insight</code>).<br /><br />
          <b>Поля каждого инсайта:</b>
          <ul style={{ margin: "8px 0 0 18px", padding: 0, lineHeight: 1.9 }}>
            <li><b>title</b> — суть наблюдения.</li>
            <li><b>impact</b> — ожидаемое влияние на цену или рынок.</li>
            <li><b>confidence</b> — уверенность модели (0–1 или %).</li>
            <li><b>direction</b> — направление: <Tag color="#16a34a">▲ вверх</Tag><Tag color="#dc2626">▼ вниз</Tag><Tag color="#6b7280">— нейтрально</Tag></li>
          </ul>
        </Section>

        <Section num="5" title="Источники данных и надёжность">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f3f4f6" }}>
                <th style={{ textAlign: "left", padding: "6px 10px" }}>Источник</th>
                <th style={{ textAlign: "left", padding: "6px 10px" }}>Данные</th>
                <th style={{ textAlign: "left", padding: "6px 10px" }}>Надёжность</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Ethereum RPC (on-chain)", "Цена ERBB (резервы Uniswap V2)", "★★★★★"],
                ["CoinGecko API", "Курс ETH/USD", "★★★★☆"],
                ["Backend /api/signal", "Торговый сигнал и score", "★★★★☆"],
                ["Backend /api/insight", "Аналитические инсайты", "★★★★☆"],
              ].map(([src, data, rel]) => (
                <tr key={src} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "6px 10px", fontWeight: 600 }}>{src}</td>
                  <td style={{ padding: "6px 10px", color: "#374151" }}>{data}</td>
                  <td style={{ padding: "6px 10px" }}>{rel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section num="6" title="Дисклеймер">
          Дашборд предназначен исключительно для <b>информационных целей</b>. Отображаемые данные, сигналы
          и инсайты <b>не являются индивидуальной инвестиционной рекомендацией</b>.<br /><br />
          Торговля криптовалютами связана с высоким риском. Перед принятием финансовых решений проводите
          собственный анализ (DYOR) и при необходимости консультируйтесь с квалифицированным финансовым советником.
        </Section>
      </div>
    </div>
  );
};

export default RulesModal;
