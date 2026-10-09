import React, { useState, useEffect } from "react";
import { formatCurrency } from "../../utils/exchangeRateHelper";
import "./BlackMarketExchangeRateTable.css";

/**
 * Format số với dấu phẩy và 2 số thập phân
 * @param {number|null} amount - Số tiền cần format
 * @returns {string} Số tiền đã được format (không có phần thập phân)
 */
const formatCurrencyInteger = (amount) => {
  if (amount === null || amount === undefined) return "N/A";
  return new Intl.NumberFormat("vi-VN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Component hiển thị giá với animation phần thập phân
 */
const AnimatedPrice = ({ value, className }) => {
  const [decimalPart, setDecimalPart] = useState("00");
  
  useEffect(() => {
    // Tạo hiệu ứng "nhảy loạn xạ" cho 2 số thập phân
    const interval = setInterval(() => {
      // Random 2 số từ 00-99
      const randomDecimal = Math.floor(Math.random() * 100).toString().padStart(2, '0');
      setDecimalPart(randomDecimal);
    }, 2000); // Mỗi 2 giây thay đổi một lần

    return () => clearInterval(interval);
  }, []);

  if (value === null || value === undefined) {
    return <span>N/A</span>;
  }

  const integerPart = formatCurrencyInteger(value);
  
  return (
    <span className={`animated-price ${className || ""}`}>
      {integerPart},{decimalPart}
    </span>
  );
};

/**
 * @param {Object} props
 * @param {Array} props.exchangeRates - Mảng dữ liệu tỷ giá từ API chogia_vn.data
 */
const BlackMarketExchangeRateTable = ({ exchangeRates }) => {
  if (!exchangeRates || !Array.isArray(exchangeRates) || exchangeRates.length === 0) {
    return (
      <div className="black-market-exchange-rate-table-empty">
        <p>Không có dữ liệu tỷ giá</p>
      </div>
    );
  }

  // Lấy URL icon quốc kỳ
  const getFlagUrl = (code) => {
    if (!code) return null;
    const codeLower = code.toLowerCase();
    return `https://vang247.xyz/icon_tygia/${codeLower}.png`;
  };

  return (
    <div className="black-market-exchange-rate-table-card">
      <div className="table-header">
        <h2 className="table-title">Tỷ Giá Ngoại Tệ Chợ Đen</h2>
      </div>
      <div className="table-wrapper">
        <table className="black-market-exchange-rate-table">
          <thead>
            <tr>
              <th>Mã NT & Quốc Kỳ</th>
              <th>Tên Ngoại Tệ</th>
              <th>Mua Vào</th>
              <th>Bán Ra</th>
            </tr>
          </thead>
          <tbody>
            {exchangeRates.map((item, index) => {
              const flagUrl = getFlagUrl(item.code);
              
              return (
                <tr key={item.code || index}>
                  <td className="currency-code-cell">
                    <div className="currency-flag-wrapper">
                      {flagUrl ? (
                        <img 
                          src={flagUrl} 
                          alt={item.code || ""} 
                          className="currency-flag"
                          onError={(e) => {
                            // Fallback nếu ảnh không load được
                            e.target.style.display = "none";
                          }}
                        />
                      ) : null}
                      <span className="currency-code">{item.code || "N/A"}</span>
                    </div>
                  </td>
                  <td className="currency-name">{item.name || "N/A"}</td>
                  <td className="price-buy">
                    {item.buy !== null && item.buy !== undefined ? (
                      <AnimatedPrice value={item.buy} />
                    ) : (
                      "N/A"
                    )}
                  </td>
                  <td className="price-sell">
                    {item.sell !== null && item.sell !== undefined ? (
                      <AnimatedPrice value={item.sell} />
                    ) : (
                      "N/A"
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

export default BlackMarketExchangeRateTable;
