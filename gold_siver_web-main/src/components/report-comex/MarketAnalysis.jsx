import React from 'react';
import { useTranslation } from 'react-i18next';
import './MarketAnalysis.css';

const MarketAnalysis = ({ data }) => {
  const { t } = useTranslation();

  if (!data) return null;

  const { atr, ma200, ma50, price } = data;
  const stoploss = atr?.suggested_stoploss;

  return (
    <div className="market-analysis-container">
      <div className="analysis-header">
        <span className="analysis-title">{t('MarketAnalysis.title')}</span>
      </div>

      <div className="market-summary-grid">
        {/* Volatility Card */}
        <div className="market-card">
          <span className="card-label">{t('MarketAnalysis.volatility')}</span>
          <div className="atr-value-container">
            <span className="atr-value">{atr?.value}</span>
            <span className="atr-percent">({atr?.atr_percent}%)</span>
          </div>
          <div className={`volatility-badge ${atr?.volatility_level?.toLowerCase()}`}>
            {t('MarketAnalysis.volatilityLevel')}: {atr?.volatility_level}
          </div>
        </div>

        {/* Moving Averages Card */}
        <div className="market-card">
          <span className="card-label">{t('MarketAnalysis.technicalIndicators')}</span>
          <div className="ma-grid">
            <div className="ma-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#ffffff', fontSize: '11px', fontWeight: '700' }}>MA50:</span>
              <span style={{ fontSize: '18px', fontWeight: '800', fontFamily: 'JetBrains Mono, monospace', color: '#ff4d4f' }}>{ma50}</span>
            </div>
            <div className="ma-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#ffffff', fontSize: '11px', fontWeight: '700' }}>MA200:</span>
              <span style={{ fontSize: '18px', fontWeight: '800', fontFamily: 'JetBrains Mono, monospace', color: '#ff4d4f' }}>{ma200}</span>
            </div>
          </div>
          <div className="price-tag">
            {t('MarketAnalysis.currentPrice')}: <strong>{price}</strong>
          </div>
        </div>

        {/* Suggested Stoploss Card */}
        <div className="market-card stoploss-card">
          <span className="card-label">{t('MarketAnalysis.stoplossTitle')}</span>
          <div className="stoploss-grid">
            <div className="sl-item">
              <span className="sl-label">{t('MarketAnalysis.shortStoploss')}</span>
              <span className="sl-value">{stoploss?.['1x_atr']}</span>
            </div>
            <div className="sl-item">
              <span className="sl-label">{t('MarketAnalysis.standardStoploss')}</span>
              <span className="sl-value highlight-green">{stoploss?.['1_5x_atr']}</span>
            </div>
            <div className="sl-item">
              <span className="sl-label">{t('MarketAnalysis.wideStoploss')}</span>
              <span className="sl-value">{stoploss?.['2x_atr']}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="analysis-footer">
        <div className="implication-box">
          <span className="footer-label">{t('MarketAnalysis.tradingImplication')}</span>
          <p className="implication-text">{atr?.trading_implication}</p>
        </div>
        <div className="description-box">
          <span className="footer-label">{t('MarketAnalysis.description')}</span>
          <p className="description-text">{atr?.description}</p>
        </div>
      </div>
    </div>
  );
};

export default MarketAnalysis;
