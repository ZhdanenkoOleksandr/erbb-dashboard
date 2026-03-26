import React, { useEffect } from "react";

const RulesModal = ({ open, onClose }) => {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 50,
      }}
    >
      <div
        style={{
          width: "min(820px, 100%)",
          background: "#fff",
          borderRadius: 16,
          padding: 18,
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>Правила платформы</div>
            <div style={{ color: "#6b7280", fontSize: 12, marginTop: 4 }}>
              Кратко о том, как отображаются данные в дашборде.
            </div>
          </div>
          <button
            onClick={() => onClose?.()}
            style={{
              border: "1px solid #e5e7eb",
              background: "#fff",
              borderRadius: 10,
              padding: "6px 10px",
              cursor: "pointer",
            }}
          >
            Закрыть
          </button>
        </div>

        <div style={{ marginTop: 12, color: "#111827", lineHeight: 1.45 }}>
          <div style={{ marginBottom: 10 }}>
            <b>1) Цена ERBB</b>
            <div style={{ color: "#374151", fontSize: 13, marginTop: 4 }}>
              Дашборд читает цену напрямую с контракта ERBB через Ethers.js (view-методы). Затем строится
              график динамики на основе последних обновлений.
            </div>
          </div>

          <div style={{ marginBottom: 10 }}>
            <b>2) Сигналы (STRONG BUY / BUY / HOLD / SELL)</b>
            <div style={{ color: "#374151", fontSize: 13, marginTop: 4 }}>
              Сигнал и score приходят с backend. Они отражают результат логики/моделей, которые формируют
              рекомендацию по ERBB.
            </div>
          </div>

          <div style={{ marginBottom: 10 }}>
            <b>3) Активные инсайды</b>
            <div style={{ color: "#374151", fontSize: 13, marginTop: 4 }}>
              Инсайды отображаются списком и обновляются с backend. Поля <b>impact</b>, <b>confidence</b> и
              <b> direction</b> помогают понять, насколько и в каком направлении ожидается влияние.
            </div>
          </div>

          <div style={{ marginBottom: 0 }}>
            <b>4) Важно</b>
            <div style={{ color: "#374151", fontSize: 13, marginTop: 4 }}>
              Этот дашборд предназначен для информационных целей и не является индивидуальной финансовой
              рекомендацией. Перед принятием решений убедитесь, что данные и методика корректны.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RulesModal;

