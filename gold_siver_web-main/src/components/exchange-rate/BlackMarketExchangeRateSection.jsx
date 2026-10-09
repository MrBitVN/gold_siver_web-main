import React, { useState, useEffect } from "react";
import USDHistoryChart from "./USDHistoryChart";
import BlackMarketExchangeRateTable from "./BlackMarketExchangeRateTable";
import { fetchBlackMarketExchangeRates } from "../../services/blackMarketExchangeRateService";
import { useExchangeRate } from "../../hooks/useExchangeRate";
import "./BlackMarketExchangeRateSection.css";


const BlackMarketExchangeRateSection = () => {
  const [exchangeRates, setExchangeRates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Hook lấy dữ liệu tỷ giá USD cho biểu đồ
  const { processedData: exchangeRateData } = useExchangeRate();

  // Fetch dữ liệu tỷ giá chợ đen
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchBlackMarketExchangeRates();
        if (data) {
          setExchangeRates(data);
        } else {
          setError("Không tìm thấy dữ liệu tỷ giá");
        }
      } catch (err) {
        console.error("Error loading black market exchange rates:", err);
        setError("Không thể tải dữ liệu tỷ giá");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (!loading && !exchangeRates && (!exchangeRateData || Object.keys(exchangeRateData).length === 0)) {
    return null;
  }

  return (
    <div className="black-market-exchange-rate-section">
      <div className="black-market-section-grid">
        {/* Cột trái: Biểu đồ USD (70%) */}
        <div className="black-market-chart-column">
          <USDHistoryChart data={exchangeRateData} />
        </div>

        {/* Cột phải: Bảng tỷ giá (30%) */}
        {exchangeRates && (
          <div className="black-market-table-column">
            <BlackMarketExchangeRateTable exchangeRates={exchangeRates} />
          </div>
        )}
      </div>
    </div>
  );
};

export default BlackMarketExchangeRateSection;

