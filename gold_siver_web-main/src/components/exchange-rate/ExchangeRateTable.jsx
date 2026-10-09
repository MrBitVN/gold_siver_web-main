import React from "react";
import { useTranslation } from "react-i18next";
import { formatCurrency, getCurrencyName, getCurrencyFlag } from "../../utils/exchangeRateHelper";
import "./ExchangeRateTable.css";

/**
 * Component hiển thị bảng tỷ giá ngoại tệ
 * @param {Object} props
 * @param {Object} props.exchangeRates - Dữ liệu tỷ giá của ngày được chọn { "USD": { buy, sell }, ... }
 * @param {Object} props.previousRates - Dữ liệu tỷ giá ngày trước (để tính thay đổi)
 */
const ExchangeRateTable = ({ exchangeRates, previousRates }) => {
  const { t } = useTranslation();
  if (!exchangeRates || Object.keys(exchangeRates).length === 0) {
    return (
      <div className="exchange-rate-table-empty">
        <p>{t('exchangeRateTable.noData')}</p>
      </div>
    );
  }

  // Tính toán thay đổi cho mỗi currency
  const getPriceChange = (currency, current) => {
    if (!previousRates || !previousRates[currency]) {
      return { buyChange: null, sellChange: null };
    }

    const previous = previousRates[currency];
    const buyChange = current.buy !== null && previous.buy !== null
      ? current.buy - previous.buy
      : null;
    const sellChange = current.sell !== null && previous.sell !== null
      ? current.sell - previous.sell
      : null;

    return { buyChange, sellChange };
  };

  // Render icon thay đổi
  const renderChangeIcon = (change) => {
    if (change === null || change === undefined) return null;
    if (change > 0) {
      return <span className="change-icon up">▲</span>;
    } else if (change < 0) {
      return <span className="change-icon down">▼</span>;
    } else {
      return <span className="change-icon neutral">─</span>;
    }
  };

  // Sắp xếp currencies: USD và USD_TUDO lên đầu, sau đó theo alphabet
  const sortedCurrencies = Object.keys(exchangeRates).sort((a, b) => {
    if (a === "USD") return -1;
    if (b === "USD") return 1;
    if (a === "USD_TUDO") return -1;
    if (b === "USD_TUDO") return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="exchange-rate-table-card">
      <div className="table-header">
        <h2 className="table-title">{t('exchangeRateTable.title')}</h2>
      </div>
      <div className="table-wrapper">
        <table className="exchange-rate-table">
          <thead>
            <tr>
              <th>{t('exchangeRateTable.currencyCode')}</th>
              <th>{t('exchangeRateTable.currencyName')}</th>
              <th>{t('exchangeRateTable.buy')}</th>
              <th>{t('exchangeRateTable.sell')}</th>
              <th>{t('exchangeRateTable.change')}</th>
            </tr>
          </thead>
          <tbody>
            {sortedCurrencies.map((currency) => {
              const rate = exchangeRates[currency];
              const { buyChange, sellChange } = getPriceChange(currency, rate);
              // Chỉ hiển thị chênh lệch giá BÁN (sellChange)
              const displayChange = sellChange;

              return (
                <tr key={currency}>
                  <td className="currency-code-cell">
                    <div className="currency-flag-wrapper">
                      {getCurrencyFlag(currency, 24)}
                      <span className="currency-code">{currency}</span>
                    </div>
                  </td>
                  <td className="currency-name">{getCurrencyName(currency)}</td>
                  <td className="price-buy">
                    {rate.buy !== null ? formatCurrency(rate.buy) : "N/A"}
                  </td>
                  <td className="price-sell">
                    {rate.sell !== null ? formatCurrency(rate.sell) : "N/A"}
                  </td>
                  <td className="price-change">
                    {displayChange !== null && displayChange !== undefined ? (
                      <div className="change-wrapper">
                        {renderChangeIcon(displayChange)}
                        <span className={`change-value ${displayChange > 0 ? "up" : displayChange < 0 ? "down" : "neutral"}`}>
                          {formatCurrency(Math.abs(displayChange))}
                        </span>
                      </div>
                    ) : (
                      <span className="change-na">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExchangeRateTable;

