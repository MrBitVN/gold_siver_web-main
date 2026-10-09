import React, { useEffect } from 'react';
import { saveToNotificationHistory } from '../tradingview/logger';
import { useTranslation } from "react-i18next";

const ETFMiningNotification = ({ gainNotification, lossNotification, onGainClose, onLossClose }) => {
  const { t } = useTranslation();

  // Gain
  useEffect(() => {
    if (gainNotification) {
      const content = t("etfMining.gainLog", {
        percent: gainNotification.topGainer.changePercent.toFixed(2),
        name: gainNotification.topGainer.name
      });

      saveToNotificationHistory(content, "ETF_GAIN");
    }
  }, [gainNotification]);

  // Loss
  useEffect(() => {
    if (lossNotification) {
      const content = t("etfMining.lossLog", {
        percent: lossNotification.topLoser.changePercent.toFixed(2),
        name: lossNotification.topLoser.name
      });

      saveToNotificationHistory(content, "ETF_LOSS");
    }
  }, [lossNotification]);

  return (
    <>
      <style>{`
        .etf-mining-noti-gain {
          position: fixed;
          bottom: 60px;
          left: 10px;
          padding: 6px 10px;
          border-radius: 6px;
          color: white;
          font-weight: bold;
          font-family: sans-serif;
          z-index: 9997;
          box-shadow: 0 4px 12px rgba(0,0,0,0.5);
          animation: slideInLeft 0.3s ease-out;
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 220px;
          max-width: 280px;
          background: #1a1a1a;
          border-left: 3px solid transparent;
            border: 2px solid #32a852
        }

        .etf-mining-noti-gain.alert {
          background: linear-gradient(135deg, #004d00, #00c853);
          border-left-color: #00ff00;
        }

        .etf-mining-noti-loss {
          position: fixed;
          top: 60px;
          left: 10px;
          padding: 6px 10px;
          border-radius: 6px;
          color: white;
          font-weight: bold;
          font-family: sans-serif;
          z-index: 9997;
          box-shadow: 0 4px 12px rgba(0,0,0,0.5);
          animation: slideInLeft 0.3s ease-out;
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 220px;
          max-width: 280px;
          background: #1a1a1a;
          border-left: 3px solid transparent;
            border: 2px solid  #ff4d4d;
        }

        .etf-mining-noti-loss.alert {
          background: linear-gradient(135deg, #800000, #ff4d4d);
          border-left-color: #ff4d4d;
        }

        .etf-noti-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          padding: 3px 0;
        }

        .etf-noti-label {
          font-size: 9px;
          color: #ffd700;
          font-weight: 800;
          min-width: 110px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .etf-noti-value {
          font-size: 11px;
          font-weight: 700;
          min-width: 55px;
          text-align: right;
        }

        .etf-noti-value.up {
          color: #00ff00;
        }

        .etf-noti-value.down {
          color: #ff4d4d;
        }

        .etf-noti-close {
          position: absolute;
          top: 4px;
          right: 6px;
          cursor: pointer;
          font-size: 14px;
          opacity: 0.7;
          transition: 0.2s;
        }

        .etf-noti-close:hover {
          opacity: 1;
        }

        @keyframes slideInLeft {
          from { transform: translateX(-110%); }
          to { transform: translateX(0); }
        }

        @media (max-width: 480px) {
          .etf-mining-noti-gain,
          .etf-mining-noti-loss {
            position: fixed;
            left: 10px;
            right: 10px;
            min-width: unset;
            max-width: calc(100vw - 20px);
            padding: 6px 8px;
            border-radius: 6px;
            font-size: 11px;
            box-shadow: 0 6px 18px rgba(0,0,0,0.45);
          }
          .etf-noti-label {
            font-size: 9px;
            min-width: 80px;
          }
          .etf-noti-value { font-size: 10px; }
          .etf-noti-close { top: 6px; right: 8px; }
        }
      `}</style>

      {gainNotification && (
        <div className={`etf-mining-noti-gain ${gainNotification.needAlert ? 'alert' : ''}`}>
          <div style={{ position: 'relative', paddingRight: '16px' }}>
            <div className="etf-noti-row">
              <div className="etf-noti-label">
                {t("etfMining.gainLabel")}
              </div>
              <div className="etf-noti-value up">
                +{gainNotification.topGainer.changePercent.toFixed(2)}%
              </div>
            </div>

            <div style={{ fontSize: '9px', color: '#aaa' }}>
              {gainNotification.topGainer.name.substring(0, 30)}
            </div>

            <div className="etf-noti-close" onClick={onGainClose}>
              ✕
            </div>
          </div>
        </div>
      )}

      {lossNotification && (
        <div className={`etf-mining-noti-loss ${lossNotification.needAlert ? 'alert' : ''}`}>
          <div style={{ position: 'relative', paddingRight: '16px' }}>
            <div className="etf-noti-row">
              <div className="etf-noti-label">
                {t("etfMining.lossLabel")}
              </div>
              <div className="etf-noti-value down">
                {lossNotification.topLoser.changePercent.toFixed(2)}%
              </div>
            </div>

            <div style={{ fontSize: '9px', color: '#aaa' }}>
              {lossNotification.topLoser.name.substring(0, 30)}
            </div>

            <div className="etf-noti-close" onClick={onLossClose}>
              ✕
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ETFMiningNotification;
