import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchCandlestickData } from "../../services/historyService";
import { filterDataByTimeRange } from "../../utils/timeRangeHelper";
import SingleCandlestickChartWithPopup from "./SingleCandlestickChartWithPopup";
import TimeRangeFilter from "./TimeRangeFilter";
import "./CandlestickCharts.css";
import ChartWithPopup from "./DoubleLineChartPopUp";
/**
 * Component chính: Biểu đồ Lịch sử Giá (Candlestick)
 * Hiển thị 3 biểu đồ nến:
 * 1. SJC Tự do
 * 2. Vàng Nguyên liệu
 * 3. Tỷ giá USD/VND
 */
const CandlestickCharts = () => {
  const [type, setType] = useState('gold')
  // State quản lý dữ liệu GỐC (toàn bộ lịch sử)
  const [fullChartData, setFullChartData] = useState({
    sjcData: [],
    nguyenLieuData: [],
    usdData: [],
    buyDataMaterial: [],
    sellDataMaterial: [],
    buyDataHistoryGooonusBTMC: [],
    sellDataHistoryGooonusBTMC: [],
    buyDataHistoryGooonusBTMH: [],
    sellDataHistoryGooonusBTMH: [],
    buyDataHistoryGooonusDOJI: [],
    sellDataHistoryGooonusDOJI: [],
    buyDataHistoryGooonusMIHONG: [],
    sellDataHistoryGooonusMIHONG: [],
    buyDataHistoryGooonusNGOCTHAM: [],
    sellDataHistoryGooonusNGOCTHAM: [],
    buyDataHistoryGooonusPNJ: [],
    sellDataHistoryGooonusPNJ: [],
    buyDataHistoryGooonusVANGPHUQUY: [],
    sellDataHistoryGooonusVANGPHUQUY: [],
    buyDataHistoryGooonusBacPhuQuy: [],
    sellDataHistoryGooonusBacPhuQuy: [],
    buyDataHistoryGooonusNhanTronPhuQuy9999: [],
    sellDataHistoryGooonusNhanTronPhuQuy9999: [],
    buyDataHistoryGooonusVangMiengSjc: [],
    sellDataHistoryGooonusVangMiengSjc: [],
    buyDataHistoryGooonusVangTrangSuc99: [],
    sellDataHistoryGooonusVangTrangSuc99: [],
    buyDataHistoryGooonusVangTrangSuc999: [],
    sellDataHistoryGooonusVangTrangSuc999: [],
    buyDataHistoryGooonusVangTrangSuc9999: [],
    sellDataHistoryGooonusVangTrangSuc9999: [],
    buyDataHistoryGooonusVangTrangSuc98: [],
    sellDataHistoryGooonusVangTrangSuc98: [],
    // buyDataHistoryGooonusVangHanQuoc: [],
    // sellDataHistoryGooonusVangHanQuoc: [],
    buyDataHistoryGooonusVangHanQuoc: [], // ✅ Key chuẩn
    sellDataHistoryGooonusVangHanQuoc: [],
    buyDataHistoryGooonusVangSac: [],
    sellDataHistoryGooonusVangSac: [],
    buyDataHistoryGooonusBacSac: [],
    sellDataHistoryGooonusBacSac: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State quản lý khoảng thời gian được chọn (mặc định: 1 tháng)
  const [timeRange, setTimeRange] = useState("ALL");

  const [searchParams] = useSearchParams();
  const chartParam = searchParams.get('chart');

  // Fetch dữ liệu từ API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchCandlestickData();
        setFullChartData(data); // Lưu toàn bộ dữ liệu gốc
        setError(null);
      } catch (err) {
        console.error("Error loading candlestick data:", err);
        setError("Không thể tải dữ liệu biểu đồ. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const displayedChartData = useMemo(() => {
    if (!fullChartData.sjcData) {
      return {
        sjcData: [],
        nguyenLieuData: [],
        usdData: [],
        buyDataMaterial: [],
        sellDateMaterial: [],
        buyDataHistoryGooonusBTMC: [],
        sellDataHistoryGooonusBTMC: [],
        buyDataHistoryGooonusBTMH: [],
        sellDataHistoryGooonusBTMH: [],
        buyDataHistoryGooonusDOJI: [],
        sellDataHistoryGooonusDOJI: [],
        buyDataHistoryGooonusMIHONG: [],
        sellDataHistoryGooonusMIHONG: [],
        buyDataHistoryGooonusNGOCTHAM: [],
        sellDataHistoryGooonusNGOCTHAM: [],
        buyDataHistoryGooonusPNJ: [],
        sellDataHistoryGooonusPNJ: [],
        buyDataHistoryGooonusVANGPHUQUY: [],
        sellDataHistoryGooonusVANGPHUQUY: [],
        buyDataHistoryGooonusBacPhuQuy: [],
        sellDataHistoryGooonusBacPhuQuy: [],
        buyDataHistoryGooonusNhanTronPhuQuy9999: [],
        sellDataHistoryGooonusNhanTronPhuQuy9999: [],
        buyDataHistoryGooonusVangMiengSjc: [],
        sellDataHistoryGooonusVangMiengSjc: [],
        buyDataHistoryGooonusVangTrangSuc99: [],
        sellDataHistoryGooonusVangTrangSuc99: [],
        buyDataHistoryGooonusVangTrangSuc999: [],
        sellDataHistoryGooonusVangTrangSuc999: [],
        buyDataHistoryGooonusVangTrangSuc9999: [],
        sellDataHistoryGooonusVangTrangSuc9999: [],
        buyDataHistoryGooonusVangTrangSuc98: [],
        sellDataHistoryGooonusVangTrangSuc98: [],
        buyDataHistoryGooonusVangHanQuoc: [],
        sellDataHistoryGooonusVangHanQuoc: [],
        buyDataHistoryGooonusVangSac: [],
        sellDataHistoryGooonusVangSac: [],
        buyDataHistoryGooonusBacSac: [],
        sellDataHistoryGooonusBacSac: [],
      };
    }

    return {
      sjcData: filterDataByTimeRange(fullChartData.sjcData, timeRange),
      nguyenLieuData: filterDataByTimeRange(
        fullChartData.nguyenLieuData,
        timeRange
      ),
      usdData: filterDataByTimeRange(fullChartData.usdData, timeRange),
      buyDataMaterial: filterDataByTimeRange(
        fullChartData.buyDataMaterial,
        timeRange
      ),
      sellDataMaterial: filterDataByTimeRange(
        fullChartData.sellDataMaterial,
        timeRange
      ),

      buyDataHistoryGooonusBTMC: filterDataByTimeRange(
        fullChartData.buyDataHistoryGooonusBTMC,
        timeRange
      ),
      sellDataHistoryGooonusBTMC: filterDataByTimeRange(
        fullChartData.sellDataHistoryGooonusBTMC,
        timeRange
      ),

      buyDataHistoryGooonusBTMH: filterDataByTimeRange(
        fullChartData.buyDataHistoryGooonusBTMH,
        timeRange
      ),
      sellDataHistoryGooonusBTMH: filterDataByTimeRange(
        fullChartData.sellDataHistoryGooonusBTMH,
        timeRange
      ),

      buyDataHistoryGooonusDOJI: filterDataByTimeRange(
        fullChartData.buyDataHistoryGooonusDOJI,
        timeRange
      ),
      sellDataHistoryGooonusDOJI: filterDataByTimeRange(
        fullChartData.sellDataHistoryGooonusDOJI,
        timeRange
      ),

      buyDataHistoryGooonusMIHONG: filterDataByTimeRange(
        fullChartData.buyDataHistoryGooonusMIHONG,
        timeRange
      ),
      sellDataHistoryGooonusMIHONG: filterDataByTimeRange(
        fullChartData.sellDataHistoryGooonusMIHONG,
        timeRange
      ),

      buyDataHistoryGooonusNGOCTHAM: filterDataByTimeRange(
        fullChartData.buyDataHistoryGooonusNGOCTHAM,
        timeRange
      ),
      sellDataHistoryGooonusNGOCTHAM: filterDataByTimeRange(
        fullChartData.sellDataHistoryGooonusNGOCTHAM,
        timeRange
      ),

      buyDataHistoryGooonusPNJ: filterDataByTimeRange(
        fullChartData.buyDataHistoryGooonusPNJ,
        timeRange
      ),
      sellDataHistoryGooonusPNJ: filterDataByTimeRange(
        fullChartData.sellDataHistoryGooonusPNJ,
        timeRange
      ),

      buyDataHistoryGooonusVANGPHUQUY: filterDataByTimeRange(
        fullChartData.buyDataHistoryGooonusVANGPHUQUY,
        timeRange
      ),
      sellDataHistoryGooonusVANGPHUQUY: filterDataByTimeRange(
        fullChartData.sellDataHistoryGooonusVANGPHUQUY,
        timeRange
      ),

      buyDataHistoryGooonusBacPhuQuy: filterDataByTimeRange(
        fullChartData.buyDataHistoryGooonusBacPhuQuy,
        timeRange
      ),
      sellDataHistoryGooonusBacPhuQuy: filterDataByTimeRange(
        fullChartData.sellDataHistoryGooonusBacPhuQuy,
        timeRange
      ),
      buyDataHistoryGooonusNhanTronPhuQuy9999: filterDataByTimeRange(
        fullChartData.buyDataHistoryGooonusNhanTronPhuQuy9999,
        timeRange
      ),
      sellDataHistoryGooonusNhanTronPhuQuy9999: filterDataByTimeRange(
        fullChartData.sellDataHistoryGooonusNhanTronPhuQuy9999,
        timeRange
      ),

      buyDataHistoryGooonusVangMiengSjc: filterDataByTimeRange(
        fullChartData.buyDataHistoryGooonusVangMiengSjc,
        timeRange
      ),
      sellDataHistoryGooonusVangMiengSjc: filterDataByTimeRange(
        fullChartData.sellDataHistoryGooonusVangMiengSjc,
        timeRange
      ),
      buyDataHistoryGooonusVangTrangSuc99: filterDataByTimeRange(
        fullChartData.buyDataHistoryGooonusVangTrangSuc99,
        timeRange
      ),
      sellDataHistoryGooonusVangTrangSuc99: filterDataByTimeRange(
        fullChartData.sellDataHistoryGooonusVangTrangSuc99,
        timeRange
      ),
      buyDataHistoryGooonusVangTrangSuc999: filterDataByTimeRange(
        fullChartData.buyDataHistoryGooonusVangTrangSuc999,
        timeRange
      ),
      sellDataHistoryGooonusVangTrangSuc999: filterDataByTimeRange(
        fullChartData.sellDataHistoryGooonusVangTrangSuc999,
        timeRange
      ),
      buyDataHistoryGooonusVangTrangSuc9999: filterDataByTimeRange(
        fullChartData.buyDataHistoryGooonusVangTrangSuc9999,
        timeRange
      ),
      sellDataHistoryGooonusVangTrangSuc9999: filterDataByTimeRange(
        fullChartData.sellDataHistoryGooonusVangTrangSuc9999,
        timeRange
      ),
      buyDataHistoryGooonusVangTrangSuc98: filterDataByTimeRange(
        fullChartData.buyDataHistoryGooonusVangTrangSuc98,
        timeRange
      ),
      sellDataHistoryGooonusVangTrangSuc98: filterDataByTimeRange(
        fullChartData.sellDataHistoryGooonusVangTrangSuc98,
        timeRange
      ),

      buyDataHistoryGooonusVangHanQuoc: filterDataByTimeRange(
        fullChartData.buyDataHistoryGooonusVangHanQuoc,
        timeRange
      ),
      sellDataHistoryGooonusVangHanQuoc: filterDataByTimeRange(
        fullChartData.sellDataHistoryGooonusVangHanQuoc,
        timeRange
      ),
      buyDataHistoryGooonusVangSac: filterDataByTimeRange(
        fullChartData.buyDataHistoryGooonusVangSac,
        timeRange
      ),
      sellDataHistoryGooonusVangSac: filterDataByTimeRange(
        fullChartData.sellDataHistoryGooonusVangSac,
        timeRange
      ),
      buyDataHistoryGooonusBacSac: filterDataByTimeRange(
        fullChartData.buyDataHistoryGooonusBacSac,
        timeRange
      ),
      sellDataHistoryGooonusBacSac: filterDataByTimeRange(
        fullChartData.sellDataHistoryGooonusBacSac,
        timeRange
      ),
    };
  }, [fullChartData, timeRange]);

  // Render loading
  if (loading) {
    return (
      <div className="candlestick-section">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Đang tải biểu đồ lịch sử giá...</p>
        </div>
      </div>
    );
  }

  // Render error
  if (error) {
    return (
      <div className="candlestick-section">
        <div className="error-container">
          <p className="error-message">⚠️ {error}</p>
        </div>
      </div>
    );
  }

  const chartList = [
    {
      type: "gold",
      key: "DataMaterial",
      title: "Lịch sử vàng kím tín từ năm 2009",
    },
    {
      type: "gold",
      key: "DataHistoryGooonusBTMC",
      title: "History 1 Năm BTMC",
    },
    {
      type: "gold",
      key: "DataHistoryGooonusBTMH",
      title: "History 1 Năm BTMH",
    },
    {
      type: "gold",
      key: "DataHistoryGooonusDOJI",
      title: "History 1 Năm DOJI",
    },
    {
      type: "gold",
      key: "DataHistoryGooonusMIHONG",
      title: "History 1 Năm MIHONG",
    },
    {
      type: "gold",
      key: "DataHistoryGooonusNGOCTHAM",
      title: "History 1 Năm NGOCTHAM",
    },
    { type: "gold", key: "DataHistoryGooonusPNJ", title: "History 1 Năm PNJ" },
    {
      type: "silver",
      key: "DataHistoryGooonusBacPhuQuy",
      title: "History Bac Phu Quy",
    },
    {
      type: "gold",
      key: "DataHistoryGooonusVANGPHUQUY",
      title: "History 1 Năm VANGPHUQUY",
    },
    {
      type: "gold",
      key: "DataHistoryGooonusVangHanQuoc",
      title: "History Vàng koreagoldx.co.kr",
    },
    {
      type: "gold",
      key: "DataHistoryGooonusVangSac",
      title: "History Vàng SACOMBANK SBJ",
    },
    {
      type: "gold",
      key: "DataHistoryGooonusBacSac",
      title: "History Bạc SACOMBANK",
    },
    // { type: "gold", key: 'DataHistoryGooonusNhanTronPhuQuy9999', title: 'Nhẫn tròn phú quý 9999' },
    // { type: "gold", key: 'DataHistoryGooonusVangMiengSjc', title: 'Vàng miếng SJC' },
    // { type: "gold", key: 'DataHistoryGooonusVangTrangSuc98', title: 'Vàng trang sức 98' },
    // { type: "gold", key: 'DataHistoryGooonusVangTrangSuc99', title: 'Vàng trang sức 99' },
    // { type: "gold", key: 'DataHistoryGooonusVangTrangSuc999', title: 'Vàng trang sức 999' },
    // { type: "gold", key: 'DataHistoryGooonusVangTrangSuc9999', title: 'Vàng trang sức 9999' },
  ];
  console.log(
    "Vang Han Quoc buyData:",
    displayedChartData.buyDataHistoryGooonusVangHanQuoc
  );
  console.log(
    "Vang Han Quoc sellData:",
    displayedChartData.sellDataHistoryGooonusVangHanQuoc
  );

  return (
    <div className="candlestick-section">
      <div className="section-header">
        <h2 className="section-title">📈 BIỂU ĐỒ LỊCH SỬ GIÁ</h2>
        <p className="section-subtitle">
          Biểu đồ nến (Candlestick) hiển thị lịch sử biến động giá
        </p>
      </div>
      <div style={{ margin: '10px 0' }}>
        <button
          className={`btn-type ${type === "gold" ? 'btn-active' : ''}`}
          onClick={() => setType("gold")}
        >
          Vàng
        </button>
        <button
          className={`btn-type ${type === "silver" ? 'btn-active' : ''}`}
          style={{ marginLeft: '20px' }}
          onClick={() => setType("silver")}
        >
          Bạc
        </button>
      </div>
      {/* Bộ lọc thời gian */}
      <TimeRangeFilter activeRange={timeRange} onRangeChange={setTimeRange} />

      <div className="charts-grid">
        {/* Biểu đồ 1: SJC Tự do */}
        <SingleCandlestickChartWithPopup
          data={displayedChartData.sjcData}
          title="SJC Tự do"
          timeRange={timeRange}
          setTimeRange={setTimeRange}
          chartKey="sjc"
          initialIsOpen={chartParam === "sjc"}
        />

        {/* Biểu đồ 2: Vàng Nguyên liệu */}
        <SingleCandlestickChartWithPopup
          data={displayedChartData.nguyenLieuData}
          title="Vàng Nguyên liệu"
          timeRange={timeRange}
          setTimeRange={setTimeRange}
          chartKey="nguyenLieu"
          initialIsOpen={chartParam === "nguyenLieu"}
        />

        {/* Biểu đồ 3: Tỷ giá USD/VND */}
        <SingleCandlestickChartWithPopup
          data={displayedChartData.usdData}
          title="Tỷ giá USD/VND"
          timeRange={timeRange}
          setTimeRange={setTimeRange}
          chartKey="usd"
          initialIsOpen={chartParam === "usd"}
        />

        {/* <SingleCandlestickChart
          data={displayedChartData.vangHanQuocData || []}
          title="Vàng Hàn Quốc"
        /> */}

        {/* Biểu đồ: Lịch sử vàng nguyên liệu */}
        {chartList
          .filter((c) => c.type === type)
          .map((chart) => (
            <ChartWithPopup
              key={chart.key}
              allData={displayedChartData}
              buyData={displayedChartData[`buy${chart.key}`]}
              sellData={displayedChartData[`sell${chart.key}`]}
              keyIndex={chart.key}
              title={chart.title}
              time={timeRange}
              initialIsOpen={chartParam === chart.key}
            />
          ))}
      </div>
    </div>
  );
};

export default CandlestickCharts;
