import React from 'react';
import { useTranslation } from 'react-i18next';
import './ComexVolumeAnalysis.css';

const ComexVolumeAnalysis = ({ data }) => {
  const { t } = useTranslation();

  if (!data) return null;

  const { changes, explain, flow, phantich_luong_giaodich_comex, score, timhieu } = data;

  return (
    <div className="comex-volume-analysis-container">
      <div className="analysis-header">
        <span className="analysis-title">{t('ComexVolumeAnalysis.title')}</span>
      </div>

      <div className="analysis-summary-grid">
        <div className="analysis-card">
          <span className="card-label">{t('ComexVolumeAnalysis.flow')}</span>
          <span className={`card-value flow-badge ${flow?.toLowerCase()}`}>
            {flow}
          </span>
        </div>
        <div className="analysis-card">
          <span className="card-label">{t('ComexVolumeAnalysis.score')}</span>
          <div className="score-container">
            <span className="score-number">{score}</span>
            <span className="score-badge">/ 10</span>
          </div>
        </div>
        <div className="analysis-card wide">
          <span className="card-label">{t('ComexVolumeAnalysis.insight')}</span>
          <p className="insight-text">"{timhieu}"</p>
        </div>
      </div>

      <div className="volume-changes-section">
        <span className="section-subtitle">{t('ComexVolumeAnalysis.volumeChanges')}</span>
        <div className="changes-grid">
          {Object.entries(changes || {}).map(([key, value]) => (
            <div key={key} className="change-item">
              <span className="change-label">{key.toUpperCase()}</span>
              <span className={`change-value ${value < 0 ? 'negative' : 'positive'}`}>
                {value > 0 ? '+' : ''}{value}%
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="analysis-details-grid">
        <div className="detail-box">
          <span className="section-subtitle">{t('ComexVolumeAnalysis.explain')}</span>
          <div className="explain-list">
            {explain?.map((item, idx) => (
              <div key={idx} className="explain-item">
                <span className="bullet">▶</span> {item}
              </div>
            ))}
          </div>
        </div>
        <div className="detail-box">
          <span className="section-subtitle">{t('ComexVolumeAnalysis.systemAnalysis')}</span>
          <div className="system-text-container">
            <p className="system-analysis-text">{phantich_luong_giaodich_comex}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComexVolumeAnalysis;
