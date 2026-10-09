import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import "./WhaleSignal.css";

const CHANGE_APIS = {
  gold: "https://api_gold.thinkdiff.us/gold_whale_change_signal",
  silver: "https://api_gold.thinkdiff.us/silver_whale_change_signal",
};

const META = {
  gold: { name: "GOLD", icon: "🥇", accent: "#ffd700" },
  silver: { name: "SILVER", icon: "🥈", accent: "#c0c0c0" },
};

const formatNum = (n) => {
  if (n === undefined || n === null) return "—";
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (abs >= 1000) return (n / 1000).toFixed(1) + "k";
  return Number(n).toFixed(2);
};

const shortAddr = (addr) => addr || "—";

const SIGNAL_COLOR = { BUY: "#4caf50", SELL: "#f44336", WAIT: "#ffcc00" };
const SIGNAL_ICON  = { BUY: "📈", SELL: "📉", WAIT: "⏳" };

const SIGNAL_ROW_COLOR = {
  FLIP_TO_LONG:  "#4caf50",
  FLIP_TO_SHORT: "#f44336",
  SCALE_IN:      "#81c784",
  SCALE_OUT:     "#e57373",
  ABSORPTION:    "#ffcc00",
};

/* ── Wallet List (inline, always expanded) ── */
const WalletList = ({ wallets }) => {
  const { t } = useTranslation();
  if (!wallets || wallets.length === 0)
    return <div className="wsm-empty">{t('WhaleSignal.noWalletData', 'No wallet data available')}</div>;

  return (
    <div className="wsm-list">
      {wallets.map((w, i) => {
        const netBias = w.total_long - w.total_short;
        const biasColor = netBias > 0 ? "#4caf50" : netBias < 0 ? "#f44336" : "#aaa";
        return (
          <div key={i} className="wsm-wallet">
            <div className="wsm-wallet-header">
              <span className="wsm-addr">{shortAddr(w.address)}</span>
              <div className="wsm-wallet-stats">
                <span style={{ color: "#4caf50" }}>L: {formatNum(w.total_long)}</span>
                <span style={{ color: "#f44336" }}>S: {formatNum(w.total_short)}</span>
                <span style={{ color: biasColor }}>Net: {netBias > 0 ? "+" : ""}{formatNum(netBias)}</span>
              </div>
            </div>
            {w.timeline?.length > 0 && (
              <div className="wsm-timeline">
                <div className="wsm-timeline-head">
                  <span>Time</span><span>Signal</span><span>Long</span><span>Short</span><span>Net</span>
                </div>
                {w.timeline.map((row, j) => {
                  const sc = SIGNAL_ROW_COLOR[row.signal] ?? "#aaa";
                  const time = row.time ? row.time.replace("+00:00", "").replace("T", " ") : "—";
                  return (
                    <div key={j} className="wsm-timeline-row">
                      <span className="wsm-time">{time}</span>
                      <span style={{ color: sc, fontWeight: 600 }}>{row.signal}</span>
                      <span style={{ color: "#4caf50" }}>{formatNum(row.long_size)}</span>
                      <span style={{ color: "#f44336" }}>{formatNum(row.short_size)}</span>
                      <span style={{ color: row.net_flow >= 0 ? "#4caf50" : "#f44336" }}>
                        {row.net_flow > 0 ? "+" : ""}{formatNum(row.net_flow)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

/* ── Change Signal Card ── */
const ChangeSignalCard = ({ type, data, t }) => {
  const meta = META[type];
  const [showDetail, setShowDetail] = useState(false);
  if (!data) return null;

  const { market_signal, market_strength_index: msi, total_long_volume: lv, total_short_volume: sv, wallets } = data;
  const sigColor = SIGNAL_COLOR[market_signal] ?? "#aaa";
  const msiColor = msi > 0 ? "#4caf50" : msi < 0 ? "#f44336" : "#ffcc00";
  const total    = lv + sv || 1;
  const longPct  = (lv / total) * 100;
  const shortPct = (sv / total) * 100;

  return (
    <div className="wsc-card" style={{ "--accent": meta.accent }}>
      <div className="wsc-header">
        <span className="wsc-title" style={{ color: meta.accent }}>{meta.icon} {meta.name}</span>
        <span className="wsc-signal" style={{ color: sigColor }}>
          {SIGNAL_ICON[market_signal] ?? ""} {market_signal}
        </span>
      </div>

      <div className="wsc-msi-row">
        <span className="wsc-msi-label">{t("WhaleSignal.strengthIndex")}</span>
        <span className="wsc-msi-value" style={{ color: msiColor }}>
          {msi > 0 ? "+" : ""}{msi}
          <span className="wsc-msi-hint" style={{ color: msiColor }}>
            {msi > 0 ? ` ${t("WhaleSignal.expectUp")}` : msi < 0 ? ` ${t("WhaleSignal.expectDown")}` : ` ${t("WhaleSignal.neutral")}`}
          </span>
        </span>
      </div>

      <div className="wsc-vol-section">
        <div className="wsc-vol-labels">
          <span style={{ color: "#4caf50" }}>{t("WhaleSignal.longChange")} {formatNum(lv)}</span>
          <span style={{ color: "#888", fontSize: "9px" }}>{t("WhaleSignal.last10Days")}</span>
          <span style={{ color: "#f44336" }}>{t("WhaleSignal.shortChange")} {formatNum(sv)}</span>
        </div>
        <div className="wsc-vol-bar">
          <div className="wsc-vol-long"  style={{ width: `${longPct}%` }} />
          <div className="wsc-vol-short" style={{ width: `${shortPct}%` }} />
        </div>
      </div>

      <button
        className="wsc-detail-btn"
        style={{ borderColor: meta.accent, color: meta.accent }}
        onClick={() => setShowDetail((v) => !v)}
      >
        {showDetail ? "▲" : "▼"} {t("WhaleSignal.detail")} ({wallets?.length ?? 0})
      </button>

      {showDetail && <WalletList wallets={wallets} accent={meta.accent} />}
    </div>
  );
};

const WhaleSignal = () => {
  const { t } = useTranslation();
  const [changeData, setChangeData] = useState({ gold: null, silver: null });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [goldChg, silverChg] = await Promise.all([
          fetch(CHANGE_APIS.gold).then((r) => r.json()),
          fetch(CHANGE_APIS.silver).then((r) => r.json()),
        ]);
        setChangeData({ gold: goldChg?.data ?? null, silver: silverChg?.data ?? null });
        setLastUpdate(new Date().toLocaleTimeString());
      } catch (e) {
        console.warn("WhaleSignal fetch error", e);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
    const interval = setInterval(fetchAll, 60 * 1000); // 1 minute
    return () => clearInterval(interval);
  }, []);

  if (!changeData.gold && !changeData.silver) {
    return null;
  }

  return (
    <div className="ws-wrapper">
      <div className="ws-panel-title">
        🐋 {t("WhaleSignal.title")}
        {lastUpdate && <span className="ws-panel-updated">{t("WhaleSignal.updated")}: {lastUpdate}</span>}
      </div>
      {loading ? (
        <div className="ws-loading">🐋 {t("WhaleSignal.loading")}</div>
      ) : (
        <>
          <div className="wsc-section-title">{t("WhaleSignal.sectionTitle")}</div>
          <div className="wsc-grid">
            <ChangeSignalCard type="gold"   data={changeData.gold}   t={t} />
            <ChangeSignalCard type="silver" data={changeData.silver} t={t} />
          </div>
        </>
      )}
    </div>
  );
};

export default WhaleSignal;
