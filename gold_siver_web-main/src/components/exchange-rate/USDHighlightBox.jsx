import React from "react";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "../../utils/exchangeRateHelper";
import { calculatePriceChange } from "../../services/exchangeRateService";
import "./USDHighlightBox.css";

/**
 * Component hộp thông tin nổi bật hiển thị giá USD tự do
 * @param {Object} props
 * @param {Object} props.usdRate - Dữ liệu USD { buy, sell }
 * @param {Object} props.previousUsdRate - Dữ liệu USD ngày trước
 */
const USDHighlightBox = ({ usdRate, previousUsdRate }) => {
  const { t } = useTranslation();
  if (!usdRate) {
    return (
      <div className="usd-highlight-box">
        <div className="usd-box-header">
          <h3>{t('usdHighlightBox.title')}</h3>
        </div>
        <div className="usd-box-content">
          <p className="no-data">{t('usdHighlightBox.noData')}</p>
        </div>
      </div>
    );
  }

  const changes = previousUsdRate
    ? calculatePriceChange(usdRate, previousUsdRate)
    : { buyChange: null, sellChange: null, buyPercent: null, sellPercent: null };

  // Chỉ hiển thị chênh lệch giá BÁN (sellChange)
  const sellChange = changes.sellChange;
  const sellPercent = changes.sellPercent;

  const renderChange = () => {
    if (sellChange === null || sellChange === undefined) return null;
    const isPositive = sellChange > 0;
    const isNegative = sellChange < 0;
    const isNeutral = sellChange === 0;

    return (
      <div className={`change-display ${isPositive ? "up" : isNegative ? "down" : "neutral"}`}>
        <span className="change-icon">
          {isPositive ? "▲" : isNegative ? "▼" : "─"}
        </span>
        <span className="change-value">{formatCurrency(Math.abs(sellChange))}</span>
        {sellPercent !== null && (
          <span className="change-percent">({sellPercent}%)</span>
        )}
      </div>
    );
  };

  return (
    <div className="usd-highlight-box">
      <div className="usd-box-header">
        <h3>{t('usdHighlightBox.title')}</h3>
      </div>
      <div className="usd-box-content">
        <div className="usd-price-row">
          <div className="price-label">{t('usdHighlightBox.buyLabel')}</div>
          <div className="price-value">
            {usdRate.buy !== null ? formatCurrency(usdRate.buy) : "N/A"}
          </div>
        </div>
        <div className="usd-price-row">
          <div className="price-label">{t('usdHighlightBox.sellLabel')}</div>
          <div className="price-value">
            {usdRate.sell !== null ? formatCurrency(usdRate.sell) : "N/A"}
          </div>
          {renderChange()}
        </div>
      </div>
    </div>
  );
};

export default USDHighlightBox;

