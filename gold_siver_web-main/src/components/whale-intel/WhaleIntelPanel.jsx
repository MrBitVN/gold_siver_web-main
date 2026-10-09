import React, { useEffect, useState } from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import { useTranslation } from 'react-i18next';
import { translateText } from '../../utils/translate';
import 'react-circular-progressbar/dist/styles.css';
import './WhaleIntelPanel.css';

import { Modal, Spin, Table } from 'antd';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { FaHistory } from 'react-icons/fa';
import { safeJsonFetch } from '../../utils/apiHelper';


const formatToVNTime = (timeStr, lang = 'vi') => {
  if (!timeStr) return '';
  try {
    const date = new Date(timeStr);
    if (isNaN(date.getTime())) return timeStr;
    return date.toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).replace(/\//g, '-');
  } catch (e) {
    return timeStr;
  }
};

const APIS = {
  silver: 'https://api_gold.thinkdiff.us/silver_whale_intel',
  gold: 'https://api_gold.thinkdiff.us/gold_whale_intel',
  bitcoin: 'https://api_gold.thinkdiff.us/btc_whale_intel',
  oil: 'https://api_gold.thinkdiff.us/oil_whale_intel',
};

const HISTORY_APIS = {
  silver: 'https://api_gold.thinkdiff.us/phantich_silver_history',
  gold: 'https://api_gold.thinkdiff.us/phantich_gold_history',
  bitcoin: 'https://api_gold.thinkdiff.us/phantich_bitcoin_history',
  oil: 'https://api_gold.thinkdiff.us/phantich_oil_history',
};

const getConfidenceColor = (score) => {
  if (score >= 60) return '#4caf50';
  if (score >= 40) return '#ffcc00';
  return '#f44336';
};

const formatNum = (n) => {
  if (n === undefined || n === null) return '—';
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (abs >= 1000) return (n / 1000).toFixed(1) + 'k';
  return Number(n).toFixed(2);
};

// ---- Sub-components ----

const FlowBars = ({ flow, t }) => {
  if (!flow) return null;
  const { long_add, long_reduce, short_add, short_reduce } = flow;

  // 2 cột chồng nhau: xanh lá (dương) trên, đỏ (âm) dưới
  const cols = [
    {
      label: t('WhaleIntel.longChange'),
      positive: long_add,
      negative: long_reduce,
    },
    {
      label: t('WhaleIntel.shortChange'),
      positive: short_reduce,
      negative: short_add,
    },
  ];

  const maxPositive = Math.max(...cols.map((c) => c.positive), 1);
  const maxNegative = Math.max(...cols.map((c) => c.negative), 1);
  const MAX_PX = 80;
  const HALF = MAX_PX / 2;
  return (
    <div>
      <div className="whale-flow-title">{t('WhaleIntel.flowTitle')}</div>
      <div
        style={{
          display: 'flex',
          gap: 16,
          alignItems: 'flex-end',
          justifyContent: 'center',
        }}
      >
        {cols.map((col, i) => {
          const posH = Math.max((col.positive / maxPositive) * MAX_PX, 2);
          const negH = Math.max((col.negative / maxNegative) * MAX_PX, 2);
          return (
            <div
              key={i}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: 9, color: '#4caf50', marginBottom: 2 }}>
                {formatNum(col.positive)}
              </span>
              <div
                style={{
                  height: MAX_PX,
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* PHẦN TRÊN (xanh) */}
                <div
                  style={{
                    height: HALF,
                    display: 'flex',
                    alignItems: 'flex-end',
                  }}
                >
                  <div
                    style={{
                      height: (col.positive / maxPositive) * HALF,
                      background: '#4caf50',
                      width: '100%',
                      borderRadius: '4px 4px 0 0',
                    }}
                  />
                </div>

                {/* PHẦN DƯỚI (đỏ) */}
                <div style={{ height: HALF }}>
                  <div
                    style={{
                      height: (col.negative / maxNegative) * HALF,
                      background: '#f44336',
                      width: '100%',
                      borderRadius: '0 0 4px 4px',
                    }}
                  />
                </div>
              </div>
              <span style={{ fontSize: 9, color: '#f44336', marginTop: 2 }}>
                -{formatNum(col.negative)}
              </span>
              <span style={{ fontSize: 10, color: '#aaa', marginTop: 4 }}>
                {col.label}
              </span>
            </div>
          );
        })}
      </div>
      <div
        style={{ fontSize: 9, color: '#666', marginTop: 6, lineHeight: 1.6 }}
      >
        <span style={{ color: '#4caf50' }}>■</span>{' '}
        {t('WhaleIntel.flowLongAdd')} / {t('WhaleIntel.flowShortReduce')}
        {'  '}
        <span style={{ color: '#f44336' }}>■</span>{' '}
        {t('WhaleIntel.flowLongReduce')} / {t('WhaleIntel.flowShortAdd')}
      </div>
    </div>
  );
};

const TopMoves = ({ moves, t }) => {
  if (!moves?.length) return null;

  // Filter moves to ensure each type appears only once
  const uniqueMoves = moves.reduce((acc, move) => {
    if (!acc.some((m) => m.change_type === move.change_type)) {
      acc.push(move);
    }
    return acc;
  }, []);

  return (
    <div>
      <div className="whale-moves-title">{t('WhaleIntel.topMovesTitle')}</div>
      {uniqueMoves.slice(0, 5).map((m, i) => {
        const key = `change_${m.change_type}`;
        const label = t(`WhaleIntel.${key}`, {
          defaultValue: m.change_type?.replace(/_/g, ' '),
        });
        const isPositive = [
          'long_added',
          'new_long',
          'short_reduced',
          'exit_short',
          'flip_short_to_long',
        ].includes(m.change_type);
        const color = isPositive ? '#4caf50' : '#f44336';
        const entry = m.new?.entryPrice || m.old?.entryPrice;
        const link = m.new?.link_wallet || m.old?.link_wallet;
        return (
          <div key={i} className="whale-move-item">
            <span className="whale-move-type" style={{ color }}>
              {label}
            </span>
            <span className="whale-move-size">
              {formatNum(m.abs_delta_size)}
            </span>
            {entry && (
              <span style={{ fontSize: 9, color: '#90caf9' }}>
                ${Number(entry).toFixed(1)}
              </span>
            )}
            <a
              href={link || '#'}
              target="_blank"
              rel="noreferrer"
              className="whale-move-addr"
              onClick={(e) => e.stopPropagation()}
            >
              {(m.address || '').slice(0, 8)}…
            </a>
          </div>
        );
      })}
    </div>
  );
};

const ScoreBreakdown = ({ breakdown, prediction, scoreFull, t }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  if (!breakdown || breakdown.length === 0) return null;

  const range = prediction?.price_range_next_week || prediction?.ir_price_range_next_week;
  const forecast = prediction?.forecast || prediction?.forecast_next_week;

  return (
    <div className="score-breakdown-container">
      <div
        className="breakdown-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span>{t('WhaleIntel.scoreBreakdown')}</span>
        <span className={`arrow ${isExpanded ? 'up' : 'down'}`}>{isExpanded ? '▲' : '▼'}</span>
      </div>

      {isExpanded && (
        <div className="breakdown-list">
          {range && (
            <div className="breakdown-item" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', marginBottom: '8px' }}>
              <span className="item-point pos" style={{ minWidth: '45px', fontSize: '8px', background: 'rgba(76, 175, 80, 0.2)', padding: '2px 4px', borderRadius: '3px', textAlign: 'center' }}>{t('WhaleIntel.nextWeekShort')}</span>
              <span className="item-reason" style={{ color: '#ffd700', fontWeight: 'bold', fontSize: '10px' }}>
                {t('WhaleIntel.predictionTitle')}: {forecast} ({range.high} - {range.low})
              </span>
            </div>
          )}
          {breakdown.map((item, i) => (
            <div key={i} className="breakdown-item">
              <span className={`item-point ${item.point >= 0 ? 'pos' : 'neg'}`}>
                {item.point >= 0 ? `+${item.point}` : item.point}
              </span>
              <span className="item-reason">{item.reason}</span>
            </div>
          ))}
          {scoreFull !== undefined && (
            <div className="score-full-row">
              <span className="label">SCORE FULL:</span>
              <span className="val">{scoreFull}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ComexAnalysis = ({ comex, volume, t }) => {
  if (!comex && !volume) return null;

  return (
    <div className="comex-analysis-container tech-section-card">
      <div className="tech-title">{t('comex.title')}</div>

      {comex && (
        <div className="comex-sub-section">
          <div className="comex-stats-grid">
            <div className="stat-item">
              <span className="stat-label">1D:</span>
              <span className={`stat-val ${comex.change_1d >= 0 ? 'pos' : 'neg'}`}>
                {comex.change_1d?.toFixed(2)}%
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">5D:</span>
              <span className={`stat-val ${comex.change_5d >= 0 ? 'pos' : 'neg'}`}>
                {comex.change_5d?.toFixed(2)}%
              </span>
            </div>
          </div>
          {comex.comex_explain_text && (
            <div className="comex-explain-box">
              {comex.comex_explain_text}
            </div>
          )}
        </div>
      )}

      {volume && (
        <div className="comex-sub-section" style={{ marginTop: 8 }}>
          <div className="tech-subtitle-mini">VOLUME ANALYSIS</div>
          <div className="comex-stats-grid">
            <div className="stat-item">
              <span className="stat-label">FLOW:</span>
              <span className="stat-val" style={{ color: '#90caf9' }}>{volume.flow}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">SCORE:</span>
              <span className="stat-val" style={{ color: volume.score >= 0 ? '#4caf50' : '#f44336' }}>
                {volume.score}
              </span>
            </div>
          </div>
          {volume.phantich_luong_giaodich_comex && (
            <div className="comex-explain-box volume">
              {volume.phantich_luong_giaodich_comex}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const SmartMoneyAnalysis = ({ smartMoney, t }) => {
  if (!smartMoney) return null;

  return (
    <div className="smart-money-container tech-section-card">
      <div className="tech-title">{t('WhaleIntel.smartMoneyTitle')}</div>
      <div className="smart-money-header">
        <span className={`flow-badge ${smartMoney.flow?.toLowerCase().includes('distribution') ? 'bearish' : 'bullish'}`}>
          {smartMoney.flow}
        </span>
        <span className="flow-score">SCORE: {smartMoney.score}</span>
      </div>
      {smartMoney.changes && (
        <div className="flow-changes">
          {smartMoney.changes}
        </div>
      )}
    </div>
  );
};

const SqueezeAnalysis = ({ squeeze, t }) => {
  if (!squeeze) return null;

  return (
    <div className="squeeze-analysis-container tech-section-card">
      <div className="tech-title">{t('WhaleIntel.squeezeTitle')}</div>
      <div className="squeeze-header">
        <span className={`squeeze-level ${squeeze.level?.toLowerCase().includes('high') ? 'high' : 'medium'}`}>
          {squeeze.level}
        </span>
      </div>
      {squeeze.explain_text && (
        <div className="squeeze-explain">
          {squeeze.explain_text}
        </div>
      )}
    </div>
  );
};

const TreasuryAnalysis = ({ text, analysis, t }) => {
  if (!text && !analysis) return null;

  return (
    <div className="treasury-analysis-container tech-section-card">
      <div className="tech-title">{t('WhaleIntel.treasuryTitle')}</div>
      <div className="treasury-content">
        {text && <div className="treasury-text">📌 {text}</div>}
        {analysis && <div className="treasury-explain">💡 {analysis}</div>}
      </div>
    </div>
  );
};

const VpaAnalysis = ({ vpa, t }) => {

  const { i18n } = useTranslation();
  const [translatedVpa, setTranslatedVpa] = useState(null);

  useEffect(() => {
    const translateVpa = async () => {
      if (!vpa || i18n.language === 'vi') {
        setTranslatedVpa(null);
        return;
      }
      try {
        const currentLang = i18n.language?.split('-')[0] || 'vi';
        const translated = { ...vpa };
        if (vpa.behavior) {
          translated.behavior = { ...vpa.behavior };
          if (vpa.behavior.text) translated.behavior.text = await translateText(vpa.behavior.text, 'vi', currentLang);
          if (vpa.behavior.fake_reason) translated.behavior.fake_reason = await translateText(vpa.behavior.fake_reason, 'vi', currentLang);
        }
        if (vpa.vpa_data?.detail) {
          translated.vpa_data = { ...vpa.vpa_data, detail: { ...vpa.vpa_data.detail } };
          for (const [key, data] of Object.entries(vpa.vpa_data.detail)) {
            if (data.explain) {
              translated.vpa_data.detail[key] = {
                ...data,
                explain: await translateText(data.explain, 'vi', currentLang)
              };
            }
          }
        }
        setTranslatedVpa(translated);
      } catch (e) {
        console.error("VPA translation error:", e);
      }
    };
    translateVpa();
  }, [vpa, i18n.language]);

  const finalVpa = translatedVpa || vpa;
  if (!finalVpa) return null;

  const { behavior, vpa_data } = finalVpa;
  const details = vpa_data?.detail ? Object.entries(vpa_data.detail) : [];

  return (
    <div className="vpa-analysis-container">
      <div className="tech-title">{t('WhaleIntel.sgeTitle')}</div>

      {behavior && (
        <div className="vpa-behavior">
          <div className="behavior-header">
            <span className="behavior-label">{behavior.label}</span>
            {behavior.is_fake_signal && (
              <span className="fake-badge">⚠️ {t('listApi.signal_fake')}</span>
            )}
          </div>
          {behavior.fake_reason && (
            <div className="behavior-reason">{behavior.fake_reason}</div>
          )}
          {behavior.text && (
            <div className="behavior-text">{behavior.text}</div>
          )}
        </div>
      )}

      {details.length > 0 && (
        <div className="vpa-details-table">
          <div className="vpa-table-header">
            <span>{t('listApi.time', 'Time')}</span>
            <span>Price%</span>
            <span>Vol%</span>
            <span>{t('listApi.score', 'Score')}</span>
          </div>
          {details.map(([key, data]) => (
            <div key={key} className="vpa-table-row">
              <div className="row-main">
                <span className="col-time">{key.replace('_', ' ')}</span>
                <span className={`col-price ${data.price_change_pct >= 0 ? 'pos' : 'neg'}`}>
                  {data.price_change_pct?.toFixed(2)}%
                </span>
                <span className={`col-vol ${data.volume_change_pct >= 0 ? 'pos' : 'neg'}`}>
                  {data.volume_change_pct?.toFixed(2)}%
                </span>
                <span className="col-score">{data.final_score}</span>
              </div>
              {data.explain && <div className="row-explain">{data.explain}</div>}
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 10, textAlign: 'right' }}>
        <a
          href="https://metalinvest.cloud/#/shanghai-gold-exchange-turnover"
          target="_blank"
          rel="noreferrer"
          className="detail-link"
        >
          {t('WhaleIntel.viewSgeDetail')} →
        </a>
      </div>
    </div>
  );
};

const VolatilityATR = ({ atr, prediction, coin, t }) => {
  if (!atr) return null;

  const range = prediction?.price_range_next_week || prediction?.ir_price_range_next_week;

  return (
    <div className="atr-analysis-container">
      <div className="tech-title">| {t('WhaleIntel.tradingSignificance')}</div>
      <div className="atr-header">
        <div className="atr-main">
          <span className="atr-val">{atr.value}</span>
          <span className={`atr-level-badge ${atr.volatility_level?.toLowerCase()}`}>
            {atr.volatility_level}
          </span>
        </div>
        <div className="atr-pct">{atr.atr_percent}% {t('WhaleIntel.ofPrice', 'OF PRICE')}</div>
      </div>

      {atr.trading_implication && (
        <div className="atr-implication">
          {atr.trading_implication.split('\n\n')[0]}
        </div>
      )}

      {range && (
        <div style={{ marginTop: 12, marginBottom: 12, padding: '10px', background: 'rgba(255, 215, 0, 0.05)', borderRadius: 8, border: '1px solid rgba(255, 215, 0, 0.15)' }}>
          <div style={{ fontSize: 10, color: '#ffd700', marginBottom: 6, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {t('WhaleIntel.predictionTitle')}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 8, color: '#aaa', textTransform: 'uppercase' }}>{t('WhaleIntel.high')}</span>
              <span style={{ fontSize: 13, fontWeight: 'bold', color: '#4caf50' }}>{range.high}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 8, color: '#aaa', textTransform: 'uppercase' }}>{t('WhaleIntel.low')}</span>
              <span style={{ fontSize: 13, fontWeight: 'bold', color: '#f44336' }}>{range.low}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 8, color: '#aaa', textTransform: 'uppercase' }}>{t('WhaleIntel.expectedMove')}</span>
              <span style={{ fontSize: 13, fontWeight: 'bold', color: '#ffcc00' }}>±{range.expected_move}</span>
            </div>
          </div>
        </div>
      )}

      <div className="tech-subtitle" style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '8px', fontWeight: '600' }}>
        {t('WhaleIntel.stoplossTitle')}
      </div>
      <div className="suggested-sl-grid">
        <div className="sl-item">
          <span className="sl-label">1X ATR</span>
          <span className="sl-val">{atr.suggested_stoploss?.['1x_atr']}</span>
        </div>
        <div className="sl-item">
          <span className="sl-label">1.5X ATR</span>
          <span className="sl-val">{atr.suggested_stoploss?.['1_5x_atr']}</span>
        </div>
        <div className="sl-item">
          <span className="sl-label">2X ATR</span>
          <span className="sl-val">{atr.suggested_stoploss?.['2x_atr']}</span>
        </div>
      </div>
    </div>
  );
};

const RiskManagement = ({ risk, positionSize, t }) => {
  if (!risk) return null;
  const riskLabel = t(`WhaleIntel.risk_${risk.level?.toLowerCase()}`, { defaultValue: risk.level });

  return (
    <div className="risk-mgmt-container">
      <div className="tech-title">{t('WhaleIntel.riskTitle')}</div>
      <div className="risk-summary">
        <div className="risk-level">
          <span className="label">{t('listApi.riskLevel', 'RISK LEVEL')}:</span>
          <span className={`val risk-${risk.level?.toLowerCase()}`}>{riskLabel}</span>
        </div>
        <div className="pos-size">
          <span className="label">{t('listApi.posSize', 'POS SIZE')}:</span>
          <span className="val">{positionSize}</span>
        </div>
      </div>
      {risk.description && <div className="risk-desc">{risk.description}</div>}
      {risk.explanation && (
        <div className="risk-explanation">
          {risk.explanation.split('👉')[0]}
        </div>
      )}
    </div>
  );
};

const TradeAdvice = ({ trade, signalQuality, t }) => {
  if (!trade) return null;

  return (
    <div className="trade-advice-container">
      <div className="tech-title">{t('WhaleIntel.tradeSignalTitle')}</div>
      <div className="signal-grid">
        <div className="sig-item">
          <span className="sig-label">{t('listApi.entrySignal', 'ENTRY SIGNAL')}</span>
          <span className={`sig-val sig-${trade.entry_signal?.toLowerCase()}`}>
            {trade.entry_signal}
          </span>
        </div>
        <div className="sig-item">
          <span className="sig-label">{t('WhaleIntel.quality', 'QUALITY')}</span>
          <span className="sig-val" style={{ color: '#90caf9' }}>{signalQuality}</span>
        </div>
        <div className="sig-item">
          <span className="sig-label">{t('WhaleIntel.stoploss', 'STOPLOSS')}</span>
          <span className="sig-val val-bearish">{trade.stoploss}</span>
        </div>
      </div>
    </div>
  );
};

const MovingAverages = ({ market, coin, t }) => {
  if (!market?.ma50 && !market?.ma200) return null;

  return (
    <div className="ma-analysis-container">
      <div className="tech-title">{t('WhaleIntel.maTitle')}</div>
      <div className="ma-grid">
        <div className="ma-item">
          <span className="ma-label">MA 50:</span>
          <span className="ma-val">{market.ma50}</span>
        </div>
        <div className="ma-item">
          <span className="ma-label">MA 200:</span>
          <span className="ma-val">{market.ma200}</span>
        </div>
      </div>
      <div style={{ marginTop: 8, textAlign: 'right' }}>
        <a
          href={`https://metalinvest.cloud/#/duong-trung-binh/${coin === 'SILVER' ? 'silver' : (coin === 'GOLD' ? 'gold' : coin.toLowerCase())}`}
          target="_blank"
          rel="noreferrer"
          className="detail-link"
          style={{ fontSize: '10px' }}
        >
          {t('WhaleIntel.viewMaDetail')} →
        </a>
      </div>
    </div>
  );
};

const TechAnalysis = ({ tech, prediction, vpa, tradeData, coin, t }) => {
  const [translatedData, setTranslatedData] = useState(null);
  const { i18n } = useTranslation();

  useEffect(() => {
    const translateAllData = async () => {
      const currentLang = i18n.language?.split('-')[0] || 'vi';
      if (currentLang === 'vi') {
        setTranslatedData(null);
        return;
      }

      try {
        const actualTradeData = Array.isArray(tradeData) ? tradeData[0] : tradeData;
        const market = actualTradeData?.market;
        const score = actualTradeData?.score;

        let currentPrediction = prediction;
        if (!currentPrediction && market?.price && market?.atr?.value) {
          const currentPrice = market.price;
          const atr = market.atr.value;
          const scoreVal = score?.value || 0;

          const expectedMove = atr * 1.5;
          const high = currentPrice + expectedMove;
          const low = currentPrice - expectedMove;

          let forecast = 'neutral';
          if (scoreVal >= 8) forecast = 'strong_bullish';
          else if (scoreVal >= 5) forecast = 'bullish';
          else if (scoreVal <= 2) forecast = 'strong_bearish';
          else if (scoreVal <= 4) forecast = 'bearish';

          currentPrediction = {
            forecast,
            price_range_next_week: {
              high: high.toFixed(2),
              low: low.toFixed(2),
              expected_move: expectedMove.toFixed(2)
            },
            explain: `Dự báo dựa trên biến động ATR (${atr}) và điểm số tín hiệu (${scoreVal}). Khoảng biến động dự kiến ±${expectedMove.toFixed(2)}.`
          };
        }

        const translated = {
          tech: tech ? { ...tech } : null,
          prediction: currentPrediction ? { ...currentPrediction } : null,
          comex: actualTradeData?.comex_analysis ? { ...actualTradeData.comex_analysis } : null,
          comexVolume: actualTradeData?.comex_volume_analysis ? { ...actualTradeData.comex_volume_analysis } : null,
          squeeze: actualTradeData?.squeeze_probability ? { ...actualTradeData.squeeze_probability } : null,
          smartMoney: actualTradeData?.slv_smart_money ? { ...actualTradeData.slv_smart_money } : null,
          treasuryText: actualTradeData?.text_bao_laisat,
          treasuryAnalysis: actualTradeData?.text_phantich_laisat
        };

        if (tech?.ma_analysis?.explain) {
          const newExplain = {};
          for (const [k, v] of Object.entries(tech.ma_analysis.explain)) {
            newExplain[k] = await translateText(v, 'vi', currentLang);
          }
          translated.tech.ma_analysis.explain = newExplain;
        }

        if (tech?.trend) translated.tech.trend = await translateText(tech.trend, 'vi', currentLang);
        if (prediction?.explain) translated.prediction.explain = await translateText(prediction.explain, 'vi', currentLang);
        if (prediction?.forecast) translated.prediction.forecast = await translateText(prediction.forecast, 'vi', currentLang);

        if (translated.comex?.comex_explain_text) {
          translated.comex.comex_explain_text = await translateText(translated.comex.comex_explain_text, 'vi', currentLang);
        }
        if (translated.comexVolume?.phantich_luong_giaodich_comex) {
          translated.comexVolume.phantich_luong_giaodich_comex = await translateText(translated.comexVolume.phantich_luong_giaodich_comex, 'vi', currentLang);
        }
        if (translated.squeeze?.explain_text) {
          translated.squeeze.explain_text = await translateText(translated.squeeze.explain_text, 'vi', currentLang);
        }
        if (translated.smartMoney?.changes) {
          translated.smartMoney.changes = await translateText(translated.smartMoney.changes, 'vi', currentLang);
        }
        if (translated.treasuryText) {
          translated.treasuryText = await translateText(translated.treasuryText, 'vi', currentLang);
        }
        if (translated.treasuryAnalysis) {
          translated.treasuryAnalysis = await translateText(translated.treasuryAnalysis, 'vi', currentLang);
        }

        setTranslatedData(translated);
      } catch (e) {
        console.error("Tech translation error:", e);
      }
    };
    translateAllData();
  }, [tech, prediction, tradeData, i18n.language]);

  const actualTradeData = Array.isArray(tradeData) ? tradeData[0] : tradeData;
  const finalTech = translatedData?.tech || tech;
  let finalPrediction = translatedData?.prediction || prediction;
  const finalComex = translatedData?.comex || actualTradeData?.comex_analysis;
  const finalComexVol = translatedData?.comexVolume || actualTradeData?.comex_volume_analysis;
  const finalSqueeze = translatedData?.squeeze || actualTradeData?.squeeze_probability;
  const finalSmartMoney = translatedData?.smartMoney || actualTradeData?.slv_smart_money;
  const finalTreasuryText = translatedData?.treasuryText || actualTradeData?.text_bao_laisat;
  const finalTreasuryAnalysis = translatedData?.treasuryAnalysis || actualTradeData?.text_phantich_laisat;

  const market = actualTradeData?.market;
  const score = actualTradeData?.score;
  const trade = actualTradeData?.trade;
  const signalQuality = actualTradeData?.signal_quality;

  // Fallback prediction if not translated or provided
  if (!finalPrediction && market?.price && market?.atr?.value) {
    const currentPrice = market.price;
    const atr = market.atr.value;
    const scoreVal = score?.value || 0;

    const expectedMove = atr * 1.5;
    const high = currentPrice + expectedMove;
    const low = currentPrice - expectedMove;

    let forecast = 'neutral';
    if (scoreVal >= 8) forecast = 'strong_bullish';
    else if (scoreVal >= 5) forecast = 'bullish';
    else if (scoreVal <= 2) forecast = 'strong_bearish';
    else if (scoreVal <= 4) forecast = 'bearish';

    finalPrediction = {
      forecast,
      price_range_next_week: {
        high: high.toFixed(2),
        low: low.toFixed(2),
        expected_move: expectedMove.toFixed(2)
      },
      explain: `Dự báo dựa trên biến động ATR (${atr}) và điểm số tín hiệu (${scoreVal}). Khoảng biến động dự kiến ±${expectedMove.toFixed(2)}.`
    };
  }

  const maExplains = finalTech?.ma_analysis?.explain ? Object.values(finalTech.ma_analysis.explain) : [];

  const finalBreakdown =
    finalTech?.score?.breakdown ||
    score?.breakdown ||
    actualTradeData?.phantich_kythuat?.score?.breakdown ||
    actualTradeData?.score_full?.breakdown;

  const finalScoreFull = score?.score_full || finalTech?.score_full || actualTradeData?.score_full;

  return (
    <div className="whale-tech-analysis">
      <TradeAdvice trade={trade} signalQuality={signalQuality} t={t} />
      <RiskManagement risk={trade?.risk_usd} positionSize={trade?.position_size} t={t} />
      <ComexAnalysis comex={finalComex} volume={finalComexVol} t={t} />
      <SmartMoneyAnalysis smartMoney={finalSmartMoney} t={t} />
      <SqueezeAnalysis squeeze={finalSqueeze} t={t} />
      <TreasuryAnalysis text={finalTreasuryText} analysis={finalTreasuryAnalysis} t={t} />
      <VolatilityATR atr={market?.atr} prediction={finalPrediction} coin={coin} t={t} />
      <MovingAverages market={market} coin={coin} t={t} />

      {finalTech && (
        <div className="tech-section">
          <div className="tech-title">{t('WhaleIntel.techTitle', 'TECHNICAL ANALYSIS')}</div>
          <div className="tech-row">
            <span className="tech-label">{t('WhaleIntel.techTrend', 'Trend')}:</span>
            <span className={`tech-val ${finalTech.trend?.toLowerCase().includes('up') ? 'val-bullish' : 'val-bearish'}`}>
              {finalTech.trend}
            </span>
          </div>
          <div className="tech-row">
            <span className="tech-label">{t('WhaleIntel.techScore', 'Score')}:</span>
            <span className="tech-val" style={{ color: (finalTech.score >= 0 || score?.value >= 0) ? '#4caf50' : '#f44336' }}>
              {finalTech.score || score?.value}
            </span>
          </div>

          {(finalTech.ma_analysis?.breakout_level || finalTech.ma_analysis?.cross_signal) && (
            <div className="tech-row-sub">
              {finalTech.ma_analysis.breakout_level && (
                <div className="sub-item">
                  <span className="sub-label">BREAKOUT:</span>
                  <span className="sub-val">{finalTech.ma_analysis.breakout_level}</span>
                </div>
              )}
              {finalTech.ma_analysis.cross_signal && (
                <div className="sub-item">
                  <span className="sub-label">CROSS:</span>
                  <span className="sub-val">{finalTech.ma_analysis.cross_signal}</span>
                </div>
              )}
            </div>
          )}

          {maExplains.length > 0 && (
            <div className="tech-explains">
              {maExplains.map((txt, i) => (
                <div key={i} className="explain-item">• {txt}</div>
              ))}
            </div>
          )}

          <ScoreBreakdown
            breakdown={finalBreakdown}
            prediction={finalPrediction}
            scoreFull={finalScoreFull}
            t={t}
          />
        </div>
      )}

      <VpaAnalysis vpa={vpa} t={t} />

      {finalPrediction && (
        <div className="prediction-section tech-section-card">
          <div className="tech-title">{t('WhaleIntel.predictionTitle')}</div>
          {(() => {
            const forecastStr = finalPrediction.forecast?.toLowerCase() || finalPrediction.forecast_next_week?.toLowerCase() || '';
            let trendClass = 'neutral';
            if (forecastStr.includes('tăng') || forecastStr.includes('bull') || forecastStr.includes('up')) {
              trendClass = (forecastStr.includes('mạnh') || forecastStr.includes('strong')) ? 'strong-bullish' : 'bullish';
            } else if (forecastStr.includes('giảm') || forecastStr.includes('bear') || forecastStr.includes('down')) {
              trendClass = (forecastStr.includes('mạnh') || forecastStr.includes('strong')) ? 'strong-bearish' : 'bearish';
            }

            const displayForecast = finalPrediction.forecast || finalPrediction.forecast_next_week;
            return (
              <div className={`forecast-badge forecast-${trendClass}`}>
                {t(`WhaleIntel.bias_${displayForecast?.toLowerCase()}`, displayForecast)}
              </div>
            );
          })()}

          {(() => {
            const range = finalPrediction.price_range_next_week || finalPrediction.ir_price_range_next_week;
            if (!range) return null;
            return (
              <div className="price-range-grid">
                <div className="range-item">
                  <span className="range-label">{t('WhaleIntel.high')}</span>
                  <span className="range-val val-bullish">{range.high}</span>
                </div>
                <div className="range-item">
                  <span className="range-label">{t('WhaleIntel.low')}</span>
                  <span className="range-val val-bearish">{range.low}</span>
                </div>
                <div className="range-item" style={{ gridColumn: 'span 2' }}>
                  <span className="range-label">{t('WhaleIntel.expectedMove')}</span>
                  <span className="range-val" style={{ color: '#ffcc00' }}>±{range.expected_move}</span>
                </div>
              </div>
            );
          })()}

          {finalPrediction.explain && (
            <div className="prediction-reason">
              {finalPrediction.explain}
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: 10, textAlign: 'right' }}>
        <a
          href="https://metalinvest.cloud/#/rsi-chart"
          target="_blank"
          rel="noreferrer"
          className="detail-link"
        >
          {t('WhaleIntel.viewDetail')} →
        </a>
      </div>
    </div>
  );
};

const CoinCard = ({ coin, data, t, onShowHistory }) => {
  if (!data) return null;
  const { sentiment, market_regime, flow, top_moves, whale_intelligence, phantich_kythuat, next_week_prediction, vpa_analysis, sge_analysis, comex_analysis, comex_volume_analysis, slv_smart_money, squeeze_probability, text_bao_laisat, text_phantich_laisat } =
    data;

  const confidence =
    whale_intelligence?.confidence ?? sentiment?.confidence_score ?? 0;
  const dirBias = whale_intelligence?.direction_bias || sentiment?.bias;
  const marketState = whale_intelligence?.market_state || market_regime?.regime;
  const riskMode = whale_intelligence?.risk_mode;
  const longPressure =
    whale_intelligence?.pressure?.long_pressure ?? sentiment?.long_net;
  const shortPressure =
    whale_intelligence?.pressure?.short_pressure ?? sentiment?.short_net;

  const color = getConfidenceColor(confidence);

  // Dùng t() với fallback key
  const biasText = t(`WhaleIntel.bias_${dirBias}`, {
    defaultValue: dirBias || '—',
  });
  const biasColor =
    dirBias === 'bullish'
      ? '#4caf50'
      : dirBias === 'bearish'
        ? '#f44336'
        : '#ffcc00';

  const regimeText = t(`WhaleIntel.regime_${marketState}`, {
    defaultValue: marketState?.replace(/_/g, ' ') || '—',
  });
  const signalText = t(`WhaleIntel.signal_${market_regime?.signal}`, {
    defaultValue: market_regime?.signal?.replace(/_/g, ' ') || '—',
  });

  const riskKey =
    riskMode === 'NORMAL'
      ? 'risk_normal'
      : riskMode === 'HIGH'
        ? 'risk_high'
        : null;
  const riskText = riskKey ? t(`WhaleIntel.${riskKey}`) : riskMode || '—';
  const riskColor =
    riskMode === 'NORMAL'
      ? '#4caf50'
      : riskMode === 'HIGH'
        ? '#f44336'
        : '#ffcc00';

  return (
    <div className="whale-card" style={{ position: 'relative' }}>
      <button
        className="history-btn"
        onClick={() => onShowHistory(coin)}
        title={t('WhaleIntel.historyTitle')}
        style={{
          position: 'absolute', top: 12, right: 12,
          background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 14,
          display: 'flex', alignItems: 'center', transition: 'color 0.2s', padding: 0, zIndex: 10
        }}
        onMouseOver={e => e.currentTarget.style.color = '#90caf9'}
        onMouseOut={e => e.currentTarget.style.color = '#555'}
      >
        <FaHistory />
      </button>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span className="whale-coin-label">{t(`WhaleIntel.${coin}`)}</span>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <span
            style={{
              fontSize: 9,
              color: '#aaa',
              textAlign: 'center',
              maxWidth: 70,
            }}
          >
            {t('WhaleIntel.confidenceTitle')}
          </span>
          <div style={{ width: 60, height: 60 }}>
            <CircularProgressbar
              value={confidence}
              text={`${confidence.toFixed(0)}%`}
              styles={buildStyles({
                textSize: '26px',
                textColor: color,
                pathColor: color,
                trailColor: 'rgba(255,255,255,0.08)',
                pathTransitionDuration: 0.5,
              })}
            />
          </div>
        </div>
      </div>
      <div className="whale-confidence-label">{t('WhaleIntel.confidence')}</div>

      <div className="whale-info-row">
        <span className="whale-info-key">{t('WhaleIntel.trend')}</span>
        <span className="whale-info-val" style={{ color: biasColor }}>
          {biasText}
        </span>
      </div>
      <div className="whale-info-row">
        <span className="whale-info-key">{t('WhaleIntel.marketState')}</span>
        <span className="whale-info-val val-neutral" style={{ fontSize: 10 }}>
          {regimeText}
        </span>
      </div>
      <div className="whale-info-row">
        <span className="whale-info-key">{t('WhaleIntel.signal')}</span>
        <span
          className="whale-info-val"
          style={{ fontSize: 10, color: '#90caf9' }}
        >
          {signalText}
        </span>
      </div>
      <div className="whale-info-row">
        <span className="whale-info-key">{t('WhaleIntel.risk')}</span>
        <span
          className="whale-info-val"
          style={{ color: riskColor, fontSize: 10 }}
        >
          {riskText}
        </span>
      </div>
      <div className="whale-info-row">
        <span className="whale-info-key">{t('WhaleIntel.longPct')}</span>
        <span className="whale-info-val val-bullish">
          {sentiment?.long_pct?.toFixed(1)}%
        </span>
      </div>
      <div className="whale-info-row">
        <span className="whale-info-key">{t('WhaleIntel.shortPct')}</span>
        <span className="whale-info-val val-bearish">
          {sentiment?.short_pct?.toFixed(1)}%
        </span>
      </div>
      <div className="whale-info-row">
        <span className="whale-info-key">{t('WhaleIntel.longPressure')}</span>
        <span className="whale-info-val val-bullish" style={{ fontSize: 10 }}>
          {formatNum(longPressure)}
        </span>
      </div>
      <div className="whale-info-row">
        <span className="whale-info-key">{t('WhaleIntel.shortPressure')}</span>
        <span className="whale-info-val val-bearish" style={{ fontSize: 10 }}>
          {formatNum(shortPressure)}
        </span>
      </div>

      {/* Phân tích kỹ thuật & Dự báo */}
      <TechAnalysis
        tech={phantich_kythuat}
        prediction={next_week_prediction || phantich_kythuat?.next_week_prediction}
        vpa={vpa_analysis || sge_analysis}
        tradeData={data}
        coin={coin}
        t={t}
      />
      <TopMoves moves={top_moves} t={t} />

      {/* Kết luận & thời gian đánh giá */}
      <div
        style={{
          marginTop: 8,
          padding: '8px 10px',
          background: 'rgba(255,255,255,0.04)',
          borderRadius: 8,
          borderLeft: `3px solid ${color}`,
        }}
      >
        <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>
          {t('WhaleIntel.conclusion')}
        </div>
        <div style={{ fontSize: 12, fontWeight: 'bold', color: biasColor }}>
          {regimeText} — {biasText}
        </div>
        <div style={{ fontSize: 10, color: '#90caf9', marginTop: 2 }}>
          {signalText}
        </div>
      </div>

      {/* Thời gian đánh giá */}
      {(whale_intelligence?.time_check || data?.meta?.evaluation_window) && (
        <div
          style={{ marginTop: 6, fontSize: 9, color: '#555', lineHeight: 1.6 }}
        >
          {whale_intelligence?.time_check && (
            <div>
              ⏱ {t('WhaleIntel.timeCheck')}: {whale_intelligence.time_check}
            </div>
          )}
          {data?.meta?.evaluation_window?.old_time && (
            <div>
              📂 {t('WhaleIntel.evalFrom')}:{' '}
              {data.meta.evaluation_window.old_time}
            </div>
          )}
          {data?.meta?.evaluation_window?.new_time && (
            <div>
              📂 {t('WhaleIntel.evalTo')}:{' '}
              {data.meta.evaluation_window.new_time}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const HistoryModal = ({ visible, onClose, coin, t }) => {
  const [loading, setLoading] = useState(true);
  const [historyData, setHistoryData] = useState([]);

  useEffect(() => {
    if (visible && coin) {
      setLoading(true);
      safeJsonFetch(HISTORY_APIS[coin.toLowerCase()])
        .then(data => {
          const list = Array.isArray(data) ? data : (data.data || []);

          const processed = list.slice(0, 100).reverse().map(item => {
            const pred = item.phantich_kythuat?.next_week_prediction || item.next_week_prediction;
            const range = pred?.ir_price_range_next_week || pred?.price_range_next_week;
            const vnTime = formatToVNTime(item.time);

            return {
              time: vnTime.split(' ')[1] || '',
              fullTime: vnTime,
              score: item.score?.value || 0,
              price: item.market?.price || 0,
              signal: item.signal_quality || '—',
              forecast: pred?.forecast_next_week || '—',
              high: range?.high || '—',
              low: range?.low || '—',
              expected: range?.expected_move || '—'
            };
          });
          setHistoryData(processed);
        })
        .catch(e => console.error('History fetch error', e))
        .finally(() => setLoading(false));
    }
  }, [visible, coin]);

  const columns = [
    { title: t('WhaleIntel.historyTime'), dataIndex: 'fullTime', key: 'time', width: 140 },
    { title: t('WhaleIntel.historyPrice'), dataIndex: 'price', key: 'price', render: v => <span style={{ color: '#ffcc00' }}>{v}</span> },
    {
      title: t('WhaleIntel.techTrend', 'Xu hướng'),
      dataIndex: 'forecast',
      key: 'forecast',
      render: v => {
        const color = v === 'BULLISH' ? '#4caf50' : (v === 'BEARISH' ? '#f44336' : '#ffcc00');
        return <span style={{ color, fontSize: 10, fontWeight: 'bold' }}>{v}</span>;
      }
    },
    { title: t('WhaleIntel.high', 'Cao'), dataIndex: 'high', key: 'high', render: v => <span style={{ color: '#4caf50' }}>{v}</span> },
    { title: t('WhaleIntel.low', 'Thấp'), dataIndex: 'low', key: 'low', render: v => <span style={{ color: '#f44336' }}>{v}</span> },
    { title: '±', dataIndex: 'expected', key: 'expected', render: v => <span style={{ color: '#90caf9' }}>{v}</span> },
    { title: t('WhaleIntel.historyScore'), dataIndex: 'score', key: 'score', render: v => <span style={{ color: v > 0 ? '#4caf50' : '#f44336' }}>{v}</span> },
  ];

  return (
    <Modal
      title={`${t('WhaleIntel.historyTitle')} - ${coin ? t(`WhaleIntel.${coin.toLowerCase()}`) : ''}`}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      centered
      className="whale-history-modal"
      styles={{ body: { backgroundColor: '#0d1117', padding: '20px' } }}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}><Spin tip={t('WhaleIntel.loadingHistory')} /></div>
      ) : (
        <div style={{ color: '#fff' }}>
          <div style={{ height: 300, marginBottom: 20 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="time" stroke="#888" fontSize={10} />
                <YAxis yAxisId="left" stroke="#4caf50" fontSize={10} />
                <YAxis yAxisId="right" orientation="right" stroke="#ffcc00" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', fontSize: 11 }}
                  itemStyle={{ fontSize: 11 }}
                />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="score" stroke="#4caf50" name={t('WhaleIntel.historyScore')} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="price" stroke="#ffcc00" name={t('WhaleIntel.historyPrice')} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <Table
            dataSource={historyData.slice().reverse()}
            columns={columns}
            pagination={{ pageSize: 5 }}
            size="small"
            rowKey="fullTime"
            className="history-table-dark"
          />
        </div>
      )}
    </Modal>
  );
};

// ---- Main component ----

const WhaleIntelPanel = () => {
  const { t, i18n } = useTranslation();
  const [intelData, setIntelData] = useState({
    silver: null,
    gold: null,
    bitcoin: null,
    oil: null,
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [historyCoin, setHistoryCoin] = useState(null);
  const [historyVisible, setHistoryVisible] = useState(false);

  const showHistory = (coin) => {
    setHistoryCoin(coin);
    setHistoryVisible(true);
  };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [silverRes, goldRes, bitcoinRes, oilRes] = await Promise.all([
          safeJsonFetch(APIS.silver),
          safeJsonFetch(APIS.gold),
          safeJsonFetch(APIS.bitcoin),
          safeJsonFetch(APIS.oil),
        ]);

        setIntelData({
          silver: silverRes?.data,
          gold: goldRes?.data,
          bitcoin: bitcoinRes?.data,
          oil: oilRes?.data,
        });
        setLastUpdate(new Date().toLocaleTimeString(i18n.language?.startsWith('vi') ? 'vi-VN' : 'en-US'));
      } catch (e) {
        console.warn('WhaleIntelPanel fetch error', e);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
    const interval = setInterval(fetchAll, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const hasAnyData = Object.values(intelData).some(Boolean);
  if (!loading && !hasAnyData) return null;

  return (
    <div className="whale-intel-panel">
      <div className="whale-intel-title">
        🐋 {t('WhaleIntel.title')}
        {lastUpdate && (
          <span style={{ fontSize: 10, color: '#666', marginLeft: 8 }}>
            {t('WhaleIntel.updated')}: {lastUpdate}
          </span>
        )}
      </div>
      {loading ? (
        <div className="whale-loading">{t('WhaleIntel.loading')}</div>
      ) : (
        <div className="whale-intel-grid">
          <CoinCard coin="gold" data={intelData.gold} t={t} onShowHistory={showHistory} />
          <CoinCard coin="silver" data={intelData.silver} t={t} onShowHistory={showHistory} />
          <CoinCard coin="bitcoin" data={intelData.bitcoin} t={t} onShowHistory={showHistory} />
          <CoinCard coin="oil" data={intelData.oil} t={t} onShowHistory={showHistory} />
        </div>
      )}
      <HistoryModal visible={historyVisible} onClose={() => setHistoryVisible(false)} coin={historyCoin} t={t} />
    </div>
  );
};

export default WhaleIntelPanel;
