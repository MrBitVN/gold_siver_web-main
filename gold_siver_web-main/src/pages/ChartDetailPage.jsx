import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchCandlestickData } from "../services/historyService";
import { filterDataByTimeRange } from "../utils/timeRangeHelper";
import SingleCandlestickChart from "../components/candlestick/SingleCandlestickChart";
import DoubleLineChart from "../components/candlestick/DoubleLineChart";
import TimeRangeFilter from "../components/candlestick/TimeRangeFilter";

const ChartDetailPage = () => {
  const { chartKey } = useParams();
  const navigate = useNavigate();
  const [fullChartData, setFullChartData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState("ALL");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchCandlestickData();
        setFullChartData(data);
        setError(null);
      } catch (err) {
        console.error("Error loading chart data:", err);
        setError("Không thể tải dữ liệu biểu đồ. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const displayedData = useMemo(() => {
    if (!fullChartData || Object.keys(fullChartData).length === 0) return null;

    let data = [];
    let title = "";
    let isDoubleLine = false;

    switch (chartKey) {
      case "sjc":
        data = filterDataByTimeRange(fullChartData.sjcData || [], timeRange);
        title = "SJC Tự do";
        break;
      case "nguyenLieu":
        data = filterDataByTimeRange(fullChartData.nguyenLieuData || [], timeRange);
        title = "Vàng Nguyên liệu";
        break;
      case "usd":
        data = filterDataByTimeRange(fullChartData.usdData || [], timeRange);
        title = "Tỷ giá USD/VND";
        break;
      case "DataMaterial":
        data = {
          buy: filterDataByTimeRange(fullChartData.buyDataMaterial || [], timeRange),
          sell: filterDataByTimeRange(fullChartData.sellDataMaterial || [], timeRange),
        };
        title = "Lịch sử vàng kím tín từ năm 2009";
        isDoubleLine = true;
        break;
      case "DataHistoryGooonusBTMC":
        data = {
          buy: filterDataByTimeRange(fullChartData.buyDataHistoryGooonusBTMC || [], timeRange),
          sell: filterDataByTimeRange(fullChartData.sellDataHistoryGooonusBTMC || [], timeRange),
        };
        title = "History 1 Năm BTMC";
        isDoubleLine = true;
        break;
      case "DataHistoryGooonusBTMH":
        data = {
          buy: filterDataByTimeRange(fullChartData.buyDataHistoryGooonusBTMH || [], timeRange),
          sell: filterDataByTimeRange(fullChartData.sellDataHistoryGooonusBTMH || [], timeRange),
        };
        title = "History 1 Năm BTMH";
        isDoubleLine = true;
        break;
      case "DataHistoryGooonusDOJI":
        data = {
          buy: filterDataByTimeRange(fullChartData.buyDataHistoryGooonusDOJI || [], timeRange),
          sell: filterDataByTimeRange(fullChartData.sellDataHistoryGooonusDOJI || [], timeRange),
        };
        title = "History 1 Năm DOJI";
        isDoubleLine = true;
        break;
      case "DataHistoryGooonusMIHONG":
        data = {
          buy: filterDataByTimeRange(fullChartData.buyDataHistoryGooonusMIHONG || [], timeRange),
          sell: filterDataByTimeRange(fullChartData.sellDataHistoryGooonusMIHONG || [], timeRange),
        };
        title = "History 1 Năm MIHONG";
        isDoubleLine = true;
        break;
      case "DataHistoryGooonusNGOCTHAM":
        data = {
          buy: filterDataByTimeRange(fullChartData.buyDataHistoryGooonusNGOCTHAM || [], timeRange),
          sell: filterDataByTimeRange(fullChartData.sellDataHistoryGooonusNGOCTHAM || [], timeRange),
        };
        title = "History 1 Năm NGOCTHAM";
        isDoubleLine = true;
        break;
      case "DataHistoryGooonusPNJ":
        data = {
          buy: filterDataByTimeRange(fullChartData.buyDataHistoryGooonusPNJ || [], timeRange),
          sell: filterDataByTimeRange(fullChartData.sellDataHistoryGooonusPNJ || [], timeRange),
        };
        title = "History 1 Năm PNJ";
        isDoubleLine = true;
        break;
      case "DataHistoryGooonusVANGPHUQUY":
        data = {
          buy: filterDataByTimeRange(fullChartData.buyDataHistoryGooonusVANGPHUQUY || [], timeRange),
          sell: filterDataByTimeRange(fullChartData.sellDataHistoryGooonusVANGPHUQUY || [], timeRange),
        };
        title = "History 1 Năm VANGPHUQUY";
        isDoubleLine = true;
        break;
      case "DataHistoryGooonusBacPhuQuy":
        data = {
          buy: filterDataByTimeRange(fullChartData.buyDataHistoryGooonusBacPhuQuy || [], timeRange),
          sell: filterDataByTimeRange(fullChartData.sellDataHistoryGooonusBacPhuQuy || [], timeRange),
        };
        title = "History Bac Phu Quy";
        isDoubleLine = true;
        break;
      case "DataHistoryGooonusVangHanQuoc":
        data = {
          buy: filterDataByTimeRange(fullChartData.buyDataHistoryGooonusVangHanQuoc || [], timeRange),
          sell: filterDataByTimeRange(fullChartData.sellDataHistoryGooonusVangHanQuoc || [], timeRange),
        };
        title = "History Vàng koreagoldx.co.kr";
        isDoubleLine = true;
        break;
      case "DataHistoryGooonusVangSac":
        data = {
          buy: filterDataByTimeRange(fullChartData.buyDataHistoryGooonusVangSac || [], timeRange),
          sell: filterDataByTimeRange(fullChartData.sellDataHistoryGooonusVangSac || [], timeRange),
        };
        title = "History Vàng SACOMBANK SBJ";
        isDoubleLine = true;
        break;
      case "DataHistoryGooonusBacSac":
        data = {
          buy: filterDataByTimeRange(fullChartData.buyDataHistoryGooonusBacSac || [], timeRange),
          sell: filterDataByTimeRange(fullChartData.sellDataHistoryGooonusBacSac || [], timeRange),
        };
        title = "History Bạc SACOMBANK";
        isDoubleLine = true;
        break;
      default:
        return null;
    }

    return { data, title, isDoubleLine };
  }, [fullChartData, timeRange, chartKey]);

  if (loading) {
    return (
      <div className="chart-detail-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Đang tải biểu đồ...</p>
        </div>
      </div>
    );
  }

  if (error || !displayedData) {
    return (
      <div className="chart-detail-page">
        <div className="error-container">
          <p className="error-message">⚠️ {error || "Biểu đồ không tồn tại"}</p>
          <button onClick={() => navigate(-1)}>Quay lại</button>
        </div>
      </div>
    );
  }

  return (
    <div className="chart-detail-page" style={{ padding: "20px" }}>
      <div className="section-header">
        <h2 className="section-title">📈 {displayedData.title}</h2>
        <button
          onClick={() => navigate(-1)}
          style={{
            marginBottom: "20px",
            padding: "8px 16px",
            borderRadius: "6px",
            border: "none",
            backgroundColor: "#EF4444",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Quay lại
        </button>
      </div>

      <TimeRangeFilter activeRange={timeRange} onRangeChange={setTimeRange} />

      <div style={{ marginTop: "20px" }}>
        {displayedData.isDoubleLine ? (
          <DoubleLineChart
            buyData={displayedData.data.buy}
            sellData={displayedData.data.sell}
            title={displayedData.title}
            isZoom={true}
          />
        ) : (
          <SingleCandlestickChart
            data={displayedData.data}
            title={displayedData.title}
            timeRange={timeRange}
            setTimeRange={setTimeRange}
          />
        )}
      </div>
    </div>
  );
};

export default ChartDetailPage;
