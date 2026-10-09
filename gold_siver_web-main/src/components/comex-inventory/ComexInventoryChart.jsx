import React, { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Chart } from "react-chartjs-2";
import { Link } from "react-router-dom";
import { fetchComexInventoryData } from "../../services/comexInventoryService";
import { translateText as autoTranslate } from "../../services/translationService";
import "./ComexInventoryChart.css";
import {
  LogarithmicScale
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  LogarithmicScale
);

function ComexInventoryChart() {
  const { t, i18n } = useTranslation();
  const [goldData, setGoldData] = useState(null);
  const [silverData, setSilverData] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("silver"); // "gold" hoặc "silver" home
  const [marketMetrics, setMarketMetrics] = useState(null);
  const [timeRange, setTimeRange] = useState("30"); // "7", "30", "90", "365", "all"
  const [chartType, setChartType] = useState("line"); // "line", "column", "stackedBar", "scatter"
  const [showChartTypeDropdown, setShowChartTypeDropdown] = useState(false);
  const [unit, setUnit] = useState("oz"); // "oz", "moz", "ton"
  const [translatedAnalysis, setTranslatedAnalysis] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);

  // Hàm tính tỉ lệ tăng/giảm
  const calculatePercentageChange = (currentValue, previousValue) => {
    if (!previousValue || previousValue === 0) return null;
    return ((currentValue - previousValue) / previousValue) * 100;
  };

  // Hàm tính chênh lệch tuyệt đối theo đơn vị hiện tại
  const calculateAbsoluteChange = (currentValue, previousValue) => {
    if (previousValue === null || previousValue === undefined) return null;

    const diffOz = currentValue - previousValue;

    // đổi sang đơn vị đang chọn
    const convertedDiff = convertUnit(diffOz);

    return convertedDiff;
  };

  // Hàm chuyển đổi đơn vị
  const convertUnit = (valueOz) => {
    if (unit === "oz") {
      return valueOz;
    } else if (unit === "moz") {
      // 1 MOZ = 1,000,000 OZ
      return valueOz / 1000000;
    } else if (unit === "ton") {
      // 1 Metric Ton = 32,150.75 OZ
      return valueOz / 32150.75;
    }
    return valueOz;
  };

  // Hàm format số dựa trên đơn vị
  const formatByUnit = (valueOz) => {
    const converted = convertUnit(valueOz);
    if (unit === "moz") {
      return converted.toFixed(2) + " " + t('ComexInventoryChart.millionOZ');
    } else if (unit === "oz") {
      return converted.toLocaleString() + " OZ";
    } else if (unit === "ton") {
      return converted.toFixed(2) + " " + t('ComexInventoryChart.ton');
    }
    return converted.toLocaleString();
  };

  // Fetch dữ liệu khi component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await fetchComexInventoryData();

        // API trả về { goldData, silverData, analysisData }
        const goldDataArray = result.goldData?.data || result.goldData;
        const silverDataArray = result.silverData?.data || result.silverData;
        const latestAnalysis = result.analysisData && result.analysisData.length > 0
          ? result.analysisData[result.analysisData.length - 1]?.comex_analysis
          : null;

        if (goldDataArray && Array.isArray(goldDataArray)) {
          setGoldData(goldDataArray);
        }
        if (silverDataArray && Array.isArray(silverDataArray)) {
          setSilverData(silverDataArray);
        }
        if (latestAnalysis) {
          setAnalysisData(latestAnalysis);
        }

        // Lấy dữ liệu ETF và Market metrics
        if (result.analysisData && result.analysisData.length > 0) {
          const latestData = result.analysisData[result.analysisData.length - 1];
          setMarketMetrics({
            etf: latestData.etf_analysis,
            market: latestData.market
          });
        }

        if (!goldDataArray && !silverDataArray) {
          setError(t('ComexInventoryChart.noData', 'Không có dữ liệu COMEX Inventory từ API'));
        }
      } catch (err) {
        console.error("Error in fetchData:", err);
        setError(t('ComexInventoryChart.fetchError', 'Lỗi khi tải dữ liệu: ') + err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Effect để dịch dữ liệu phân tích khi ngôn ngữ thay đổi hoặc có dữ liệu mới
  useEffect(() => {
    const isVietnamese = (text) => {
      if (!text || typeof text !== 'string') return false;
      const viChars = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;
      return viChars.test(text);
    };

    const translateAnalysis = async () => {
      if (!analysisData) {
        setTranslatedAnalysis(null);
        return;
      }

      const currentLang = i18n.language?.split('-')[0] || 'vi';

      // Nếu là tiếng Việt thì không cần dịch, dùng trực tiếp bản gốc
      if (currentLang === 'vi') {
        setTranslatedAnalysis(null);
        setIsTranslating(false);
        return;
      }

      // Kiểm tra xem dữ liệu hiện tại có phải là tiếng Việt không
      const needsTranslation = 
        isVietnamese(analysisData.phase) || 
        (analysisData.explain && analysisData.explain.some(item => isVietnamese(item))) ||
        isVietnamese(analysisData.comex_explain_text);

      if (!needsTranslation && translatedAnalysis) {
        // Nếu đã dịch rồi và dữ liệu gốc không phải tiếng Việt (hiếm gặp)
        return;
      }

      try {
        setIsTranslating(true);
        console.log(`🌐 [Comex] Translating analysis to: ${currentLang}`);
        const translated = { ...analysisData };

        // Dịch phase
        if (analysisData.phase) {
          translated.phase = await autoTranslate(analysisData.phase, currentLang);
        }

        // Dịch mảng explain
        if (analysisData.explain && Array.isArray(analysisData.explain)) {
          translated.explain = await Promise.all(
            analysisData.explain.map(item => autoTranslate(item, currentLang))
          );
        }

        // Dịch comex_explain_text
        if (analysisData.comex_explain_text) {
          translated.comex_explain_text = await autoTranslate(analysisData.comex_explain_text, currentLang);
        }

        setTranslatedAnalysis(translated);
      } catch (err) {
        console.error("Lỗi dịch dữ liệu COMEX:", err);
      } finally {
        setIsTranslating(false);
      }
    };

    translateAnalysis();
  }, [analysisData, i18n.language]);

  const handleManualTranslate = async () => {
    if (!analysisData) return;
    const currentLang = i18n.language?.split('-')[0] || 'vi';
    if (currentLang === 'vi') return;

    setIsTranslating(true);
    try {
      const translated = { ...analysisData };
      if (analysisData.phase) translated.phase = await autoTranslate(analysisData.phase, currentLang);
      if (analysisData.explain && Array.isArray(analysisData.explain)) {
        translated.explain = await Promise.all(analysisData.explain.map(item => autoTranslate(item, currentLang)));
      }
      if (analysisData.comex_explain_text) {
        translated.comex_explain_text = await autoTranslate(analysisData.comex_explain_text, currentLang);
      }
      setTranslatedAnalysis(translated);
    } catch (err) {
      console.error("Manual translation failed:", err);
    } finally {
      setIsTranslating(false);
    }
  };

  // Sử dụng dữ liệu đã dịch hoặc fallback về dữ liệu gốc
  const finalAnalysisData = translatedAnalysis || analysisData;

  // Xử lý dữ liệu dựa trên tab đang chọn và time range
  const chartData = useMemo(() => {
    const data = activeTab === "gold" ? goldData : silverData;

    if (!data || !Array.isArray(data) || data.length === 0) {
      return { labels: [], datasets: [], percentageChanges: {} };
    }

    // Sort data by date
    const sortedData = [...data].sort((a, b) => {
      const dateA = new Date(a.date || a.dt);
      const dateB = new Date(b.date || b.dt);
      return dateA - dateB;
    });


    // Filter dữ liệu dựa trên time range
    let filteredData = sortedData;
    if (timeRange !== "all") {


      // Lấy đúng số data points mà không tính những ngày không có data
      // Ví dụ: 30 ngày = lấy 30 data points gần nhất
      const dataPointCount = parseInt(timeRange);
      if (sortedData.length > 0) {
        const recentDataCount = Math.min(dataPointCount, sortedData.length);
        filteredData = sortedData.slice(-recentDataCount);
      }
    }

    // Tính tỉ lệ tăng/giảm
    const percentageChanges = {};
    if (sortedData.length > 0) {
      const currentValue = sortedData[sortedData.length - 1]?.value || sortedData[sortedData.length - 1]?.amount || 0;

      // 1 ngày
      if (sortedData.length >= 2) {
        const prev1Day = sortedData[sortedData.length - 2]?.value || sortedData[sortedData.length - 2]?.amount || 0;
        percentageChanges.day1 =
          unit === "ton"
            ? calculateAbsoluteChange(currentValue, prev1Day)
            : calculatePercentageChange(currentValue, prev1Day);

      }

      // 2 ngày
      if (sortedData.length >= 3) {
        const prev2Days = sortedData[sortedData.length - 3]?.value || sortedData[sortedData.length - 3]?.amount || 0;
        percentageChanges.day2 =
          unit === "ton"
            ? calculateAbsoluteChange(currentValue, prev2Days)
            : calculatePercentageChange(currentValue, prev2Days);

      }

      // 3 ngày
      if (sortedData.length >= 4) {
        const prev3Days = sortedData[sortedData.length - 4]?.value || sortedData[sortedData.length - 4]?.amount || 0;
        percentageChanges.day3 =
          unit === "ton"
            ? calculateAbsoluteChange(currentValue, prev3Days)
            : calculatePercentageChange(currentValue, prev3Days);

      }

      // 1 tuần (7 ngày)
      if (sortedData.length >= 8) {
        const prev1Week = sortedData[sortedData.length - 8]?.value || sortedData[sortedData.length - 8]?.amount || 0;
        percentageChanges.week1 =
          unit === "ton"
            ? calculateAbsoluteChange(currentValue, prev1Week)
            : calculatePercentageChange(currentValue, prev1Week);
      }

      // 1 tháng (30 ngày)
      if (sortedData.length >= 31) {
        const prev1Month = sortedData[sortedData.length - 31]?.value || sortedData[sortedData.length - 31]?.amount || 0;
        percentageChanges.month1 =
          unit === "ton"
            ? calculateAbsoluteChange(currentValue, prev1Month)
            : calculatePercentageChange(currentValue, prev1Month);
      }

      // 6 tháng (180 ngày)
      if (sortedData.length >= 181) {
        const prev6Months = sortedData[sortedData.length - 181]?.value || sortedData[sortedData.length - 181]?.amount || 0;
        percentageChanges.month6 =
          unit === "ton"
            ? calculateAbsoluteChange(currentValue, prev6Months)
            : calculatePercentageChange(currentValue, prev6Months);
      }
    }

    // Tạo labels
    const labels = filteredData.map((item, idx) => {
      const date = new Date(item.date || item.dt);
      const d = String(date.getDate()).padStart(2, "0");
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const y = date.getFullYear();

      if (timeRange === "all") {
        if (idx % 2 === 0) {
          return `${y}`;
        }
        return "";
      }
      // Khi "1 năm" (365) - hiển thị tháng/năm
      else if (timeRange === "365") {
        if (idx % 4 === 0) {
          return `${m}/${y}`;
        }
        return "";
      }
      // Khi "7", "30", "90" ngày - hiển thị ngày/tháng
      else {
        return `${d}/${m}`;
      }
    });

    // Lấy giá trị inventory từ field .value
    const inventoryValues = filteredData.map(item => {
      const value = item.value || item.amount || item.inventory || 0;
      return typeof value === 'number' ? value : parseFloat(value) || 0;
    });

    // Tính gradient background
    const maxValue = Math.max(...inventoryValues);
    const minValue = Math.min(...inventoryValues);

    // Chuẩn bị datasets dựa trên chart type
    let datasets = [];


    if (chartType === "line") {
      datasets = [
        {
          type: "line",
          label: activeTab === "gold" ? "COMEX Gold Inventory" : "COMEX Silver Inventory",
          data: inventoryValues,
          borderColor: "#2563eb",
          backgroundColor: "tranparent",
          fill: false,
          tension: 0,
          pointRadius: 0,
          pointBackgroundColor: activeTab === "gold" ? "#FDB913" : "#9CA3AF",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
          pointHoverRadius: 6,
          borderWidth: 2,
        },
      ];
    } else if (chartType === "column") {
      datasets = [
        {
          type: "bar",
          label: activeTab === "gold" ? "COMEX Gold Inventory" : "COMEX Silver Inventory",
          data: inventoryValues,
          backgroundColor: activeTab === "gold" ? "#FDB913" : "#9CA3AF",
          borderColor: "#fff",
          borderWidth: 0,
          barThickness: "flex",
        },
      ];
    } else if (chartType === "stackedBar") {
      datasets = [
        {
          type: "bar",
          label: "Inventory",
          data: inventoryValues,
          backgroundColor: activeTab === "gold" ? "#FDB913" : "#9CA3AF",
          borderColor: activeTab === "gold" ? "#FDB913" : "#9CA3AF",
          borderWidth: 0,
          barThickness: "flex",
          stack: "stack1",
        },
      ];
    } else if (chartType === "scatter") {
      datasets = [
        {
          type: "scatter",
          label: activeTab === "gold" ? "COMEX Gold Inventory" : "COMEX Silver Inventory",
          data: filteredData.map((item, idx) => ({
            x: idx,
            y: inventoryValues[idx]
          })),
          backgroundColor: activeTab === "gold" ? "#FDB913" : "#9CA3AF",
          pointRadius: 5,
          pointHoverRadius: 7,
          showLine: false,
        },
      ];
    }

    // Lấy ngày cập nhật mới nhất từ toàn bộ dữ liệu (không phải filteredData)
    let latestUpdateDate = null;
    if (sortedData.length > 0) {
      const lastItem = sortedData[sortedData.length - 1];
      const date = new Date(lastItem.date || lastItem.dt);
      latestUpdateDate = date;
    }

    return { labels, datasets, filteredData, minValue, maxValue, percentageChanges, latestUpdateDate };
  }, [goldData, silverData, activeTab, timeRange, chartType, unit]);

  // Chart options
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: chartType === "stackedBar" ? undefined : undefined,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: "top",
        labels: {
          color: "#9CA3AF",
          font: { size: 12, weight: "500" },
          padding: 15,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        titleColor: "#fff",
        bodyColor: "#E0E7FF",
        borderColor: "#3B82F6",
        borderWidth: 1,
        padding: 12,
        titleFont: { size: 14, weight: "600" },
        bodyFont: { size: 13 },
        callbacks: {
          title: (context) => {
            const index = context[0].dataIndex;
            if (chartData.filteredData && chartData.filteredData[index]) {
              const item = chartData.filteredData[index];
              const date = new Date(item.date || item.dt);
              const d = String(date.getDate()).padStart(2, "0");
              const m = String(date.getMonth() + 1).padStart(2, "0");
              const y = date.getFullYear();
              return `${d}/${m}/${y}`;
            }
            return "";
          },
          label: (context) => {
            const value = context.parsed.y;
            const assetName = activeTab === "gold" ? t('ComexInventoryChart.gold') : t('ComexInventoryChart.silver');
            const inventoryLabel = t('ComexInventoryChart.inventoryLabel', 'Inventory');
            return `${assetName} ${inventoryLabel}: ${value.toLocaleString()} OZ`;
          },
          afterLabel: (context) => {
            const value = context.parsed.y;
            // Convert OZ to TON: 1 Metric Ton = 32,150.75 OZ
            const valueInTon = (value / 32150.75).toFixed(2);
            let result = `value: ${valueInTon} ${t('ComexInventoryChart.ton')}`;

            const index = context.dataIndex;
            if (chartData.filteredData && chartData.filteredData[index]) {
              const item = chartData.filteredData[index];
              const otherValues = Object.entries(item)
                .filter(([key]) => key !== "date" && key !== "dt" && key !== "value" && key !== "amount")
                .map(([key, value]) => `${key}: ${value}`)
                .join("\n");
              if (otherValues) {
                result += "\n" + otherValues;
              }
            }
            return result;
          },
        },
      },
    },
    scales: {
      y: {
        type: "logarithmic",
        stacked: chartType === "stackedBar",
        beginAtZero: false,
        grid: {
          color: "rgba(148, 163, 184, 0.1)",
          drawBorder: false,
        },
        ticks: {
          color: "#9CA3AF",
          font: { size: 11 },
          callback: (value) => {
            if (value >= 1000000) {
              return (value / 1000000).toFixed(0) + "M";
            }
            return value.toLocaleString();
          },
        },
        title: {
          display: true,
          text: "OZ",
          color: "#9CA3AF",
          font: { size: 12 },
        },
      },
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: "#9CA3AF",
          font: { size: 11 },
          maxRotation: 45,
          minRotation: 0,
        },
      },
    },
  };

  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleChartTypeChange = (type) => {
    setChartType(type);
  };

  // Blocking loading screen removed for instant UI feel

  if (error || (!goldData && !silverData && !isLoading)) {
    return null;
  }

  return (
    <div className="comex-inventory-container">
      <div className="comex-inventory-header">
        <Link to="/comex-inventory" className="comex-header-link">
          <h2>{t('ComexInventoryChart.title')} {t(`ComexInventoryChart.${activeTab}`)}</h2>
          <p className="subtitle">{t('ComexInventoryChart.subtitle')}</p>
        </Link>
      </div>

      {/* Tab Navigation */}
      <div className="comex-tab-navigation">
        <button
          className={`tab-button ${activeTab === "gold" ? "active" : ""}`}
          onClick={() => handleTabChange("gold")}
        >
          <span className="tab-icon gold-icon">🥇</span>
          {t('ComexInventoryChart.gold')}
        </button>
        <button
          className={`tab-button ${activeTab === "silver" ? "active" : ""}`}
          onClick={() => handleTabChange("silver")}
        >
          <span className="tab-icon silver-icon">🥈</span>
          {t('ComexInventoryChart.silver')}
        </button>
        {/* Latest Update Date */}
        {chartData.latestUpdateDate && (
          <div className="latest-update-date">
            {t('ComexInventoryChart.latestUpdate')} {chartData.latestUpdateDate.getDate()}/{chartData.latestUpdateDate.getMonth() + 1}/{chartData.latestUpdateDate.getFullYear()}
          </div>
        )}
      </div>

      {/* Comex Analysis Section */}
      {finalAnalysisData && (
        <div className="comex-analysis-section">
          <div className="analysis-header">
            <span className="analysis-title">
              ⚡️ {t('ComexInventoryChart.analysisTitle')} {t(`ComexInventoryChart.${activeTab}`)}
            </span>
            <div className="analysis-header-actions" style={{ display: 'flex', alignItems: 'center' }}>
              {(!i18n.language || !i18n.language.startsWith('vi')) && (
                <button 
                  className={`manual-translate-btn ${isTranslating ? 'loading' : ''}`}
                  onClick={handleManualTranslate}
                  title="Dịch lại / Re-translate"
                  style={{ 
                    background: 'rgba(59, 130, 246, 0.2)', 
                    border: '1px solid #3b82f6', 
                    color: '#fff',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                  disabled={isTranslating}
                >
                  🌐 {isTranslating ? '...' : (i18n.language?.startsWith('lo') ? 'ແປຄືນ' : 'Translate')}
                </button>
              )}
            </div>
          </div>
          <div className="analysis-grid">
            <div className="analysis-row-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
              <div className="analysis-row" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span className="analysis-label">{t('ComexInventoryChart.score')}</span>
                <div className="score-container" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="score-value" translate="no" style={{ fontSize: '16px', fontWeight: '800', color: '#f8fafc' }}>
                    {finalAnalysisData.score}
                  </span>
                  {finalAnalysisData.score_full && (
                    <span className="score-badge" translate="no" style={{ 
                      background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                      color: '#fff',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '800'
                    }}>
                      {Number(finalAnalysisData.score_full).toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
              
              {/* COMEX Score Breakdown - Separated for better layout */}
              {(finalAnalysisData.score_breakdown || finalAnalysisData.score?.breakdown || analysisData?.score_breakdown || analysisData?.score?.breakdown) && (
                <div className="comex-score-breakdown" style={{ 
                  width: '100%', 
                  background: 'rgba(30, 41, 59, 0.4)', 
                  padding: '12px', 
                  borderRadius: '12px',
                  marginTop: '4px',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
                }}>
                  <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '8px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {t('listApi.scoreBreakdown', 'Chi tiết tính toán')}
                  </div>
                  {(finalAnalysisData.score_breakdown || finalAnalysisData.score?.breakdown || analysisData?.score_breakdown || analysisData?.score?.breakdown).map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '4px' }}>
                      <span style={{ color: '#e0e7ff' }}>{item.reason}</span>
                      <span style={{ color: item.point >= 0 ? '#22c55e' : '#ef4444', fontWeight: 'bold', marginLeft: '10px' }} translate="no">
                        {item.point >= 0 ? '+' : ''}{item.point}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="analysis-row">
              <span className="analysis-label">{t('ComexInventoryChart.phase')}</span>
              <span className="phase-value">"{finalAnalysisData.phase}"</span>
            </div>
            <div className="analysis-row">
              <span className="analysis-label">{t('ComexInventoryChart.ratioRegistered')}</span>
              <span className="analysis-number">{finalAnalysisData.ratio_registered}</span>
            </div>
            <div className="analysis-row">
              <span className="analysis-label">{t('ComexInventoryChart.change1d')}</span>
              <span className={`analysis-number ${finalAnalysisData.change_1d < 0 ? 'negative' : 'positive'}`}>
                {finalAnalysisData.change_1d}
              </span>
            </div>
            <div className="analysis-row">
              <span className="analysis-label">{t('ComexInventoryChart.change5d')}</span>
              <span className={`analysis-number ${finalAnalysisData.change_5d < 0 ? 'negative' : 'positive'}`}>
                {finalAnalysisData.change_5d}
              </span>
            </div>
            <div className="analysis-row">
              <span className="analysis-label">{t('ComexInventoryChart.eligibleChange')}</span>
              <span className={`analysis-number ${finalAnalysisData.eligible_change < 0 ? 'negative' : 'positive'}`}>
                {finalAnalysisData.eligible_change}
              </span>
            </div>
            <div className="analysis-row vertical">
              <span className="analysis-label">{t('ComexInventoryChart.explain')}</span>
              <div className="explain-list">
                {finalAnalysisData.explain?.map((item, idx) => (
                  <div key={idx} className="explain-item">
                    <span className="bullet">▶</span> {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="analysis-row vertical">
              <span className="analysis-label">{t('ComexInventoryChart.comexExplainText')}</span>
              <p className="explain-text">"{finalAnalysisData.comex_explain_text}"</p>
            </div>
          </div>
        </div>
      )}

      {/* Market Intelligence Section */}
      {marketMetrics && (
        <div className="market-intelligence-section">
          <div className="analysis-header">
            <span className="analysis-title">{t('ComexInventoryChart.marketIntelligence')}</span>
          </div>
          <div className="analysis-grid">
            <div className="analysis-row">
              <span className="analysis-label">{t('ComexInventoryChart.dxyTrend')}</span>
              <div className="metric-container">
                <span className="metric-value">{marketMetrics.etf?.dxy?.value}</span>
                <span className={`trend-badge ${marketMetrics.etf?.dxy?.trend?.toUpperCase() === 'UP' ? 'up' : 'down'}`}>
                  {marketMetrics.etf?.dxy?.trend?.toUpperCase() === 'UP' ? '▲' : '▼'} {marketMetrics.etf?.dxy?.trend}
                </span>
              </div>
            </div>
            <div className="analysis-row">
              <span className="analysis-label">{t('ComexInventoryChart.etfChange')}</span>
              <div className="metric-container">
                <span className="metric-value">{marketMetrics.etf?.etf?.value}</span>
                <span className={`change-badge ${marketMetrics.etf?.etf?.change_percent >= 0 ? 'positive' : 'negative'}`}>
                  {marketMetrics.etf?.etf?.change_percent >= 0 ? '+' : ''}{marketMetrics.etf?.etf?.change_percent}%
                </span>
              </div>
            </div>
            <div className="analysis-row">
              <span className="analysis-label">{t('ComexInventoryChart.technicalIndicators')}</span>
              <div className="ma-container">
                <div className="ma-item">
                  <span style={{ color: '#ffffff', fontWeight: '600', marginRight: '5px' }}>MA50:</span>
                  <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>{marketMetrics.market?.ma50}</span>
                </div>
                <div className="ma-item">
                  <span style={{ color: '#ffffff', fontWeight: '600', marginRight: '5px' }}>MA200:</span>
                  <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>{marketMetrics.market?.ma200}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* Unit Converter */}
      <div className="comex-unit-converter">
        <span className="unit-label">{t('ComexInventoryChart.unit')}</span>
        <button
          className={`unit-btn ${unit === "oz" ? "active" : ""}`}
          onClick={() => setUnit("oz")}
        >
          OZ
        </button>
        <button
          className={`unit-btn ${unit === "moz" ? "active" : ""}`}
          onClick={() => setUnit("moz")}
        >
          MOZ
        </button>
        <button
          className={`unit-btn ${unit === "ton" ? "active" : ""}`}
          onClick={() => setUnit("ton")}
        >
          {t('ComexInventoryChart.ton')}
        </button>
      </div>

      {/* Desktop Layout: 2 columns - Left: Values & Percentage Changes, Right: Chart */}
      <div className="comex-desktop-layout">
        {/* Left Column: Values and Percentage Changes */}
        {chartData.filteredData && chartData.filteredData.length > 0 && (
          <div className="comex-left-column">
            {/* Summary Info */}
            <div className="comex-summary">
              <div className="summary-item">
                <span className="summary-label">{t('ComexInventoryChart.highestValue')}</span>
                <span className="summary-value">
                  {formatByUnit(chartData.maxValue)}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">{t('ComexInventoryChart.lowestValue')}</span>
                <span className="summary-value">
                  {formatByUnit(chartData.minValue)}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">{t('ComexInventoryChart.currentValue')}</span>
                <span className="summary-value">
                  {formatByUnit(chartData.filteredData[chartData.filteredData.length - 1]?.value || 0)}
                </span>
              </div>
            </div>

            {/* Percentage Change Display */}
            <div className="percentage-changes-container">
              <h3>{t('ComexInventoryChart.changeRatio')}</h3>
              <div className="percentage-grid">
                {chartData.percentageChanges.day1 !== null && (
                  <div className="percentage-item">
                    <span className="percentage-label">{t('ComexInventoryChart.oneDay')}</span>
                    <span
                      className={`percentage-value ${chartData.percentageChanges.day1 >= 0 ? 'positive' : 'negative'}`}
                    >
                      {chartData.percentageChanges.day1 >= 0 ? '+' : ''}
                      {unit === "ton"
                        ? `${chartData.percentageChanges.day1.toFixed(2)} ${t('ComexInventoryChart.ton')}`
                        : `${chartData.percentageChanges.day1.toFixed(2)}%`}

                    </span>
                  </div>
                )}

                {chartData.percentageChanges.day2 !== null && (
                  <div className="percentage-item">
                    <span className="percentage-label">{t('ComexInventoryChart.twoDay')}</span>
                    <span
                      className={`percentage-value ${chartData.percentageChanges.day2 >= 0 ? 'positive' : 'negative'}`}
                    >
                      {chartData.percentageChanges.day2 >= 0 ? '+' : ''}
                      {unit === "ton"
                        ? `${chartData.percentageChanges.day2.toFixed(2)} ${t('ComexInventoryChart.ton')}`
                        : `${chartData.percentageChanges.day2.toFixed(2)}%`}

                    </span>
                  </div>
                )}

                {chartData.percentageChanges.day3 !== null && (
                  <div className="percentage-item">
                    <span className="percentage-label">{t('ComexInventoryChart.threeDay')}</span>
                    <span
                      className={`percentage-value ${chartData.percentageChanges.day3 >= 0 ? 'positive' : 'negative'}`}
                    >
                      {chartData.percentageChanges.day3 >= 0 ? '+' : ''}
                      {unit === "ton"
                        ? `${chartData.percentageChanges.day3.toFixed(2)} ${t('ComexInventoryChart.ton')}`
                        : `${chartData.percentageChanges.day3.toFixed(2)}%`}

                    </span>
                  </div>
                )}

                {chartData.percentageChanges.week1 !== null && (
                  <div className="percentage-item">
                    <span className="percentage-label">{t('ComexInventoryChart.oneWeek')}</span>
                    <span
                      className={`percentage-value ${chartData.percentageChanges.week1 >= 0 ? 'positive' : 'negative'}`}
                    >
                      {chartData.percentageChanges.week1 >= 0 ? '+' : ''}
                      {unit === "ton"
                        ? `${chartData.percentageChanges.week1.toFixed(2)} ${t('ComexInventoryChart.ton')}`
                        : `${chartData.percentageChanges.week1.toFixed(2)}%`}

                    </span>
                  </div>
                )}

                {chartData.percentageChanges.month1 !== null && (
                  <div className="percentage-item">
                    <span className="percentage-label">{t('ComexInventoryChart.oneMonth')}</span>
                    <span
                      className={`percentage-value ${chartData.percentageChanges.month1 >= 0 ? 'positive' : 'negative'}`}
                    >
                      {chartData.percentageChanges.month1 >= 0 ? '+' : ''}
                      {unit === "ton"
                        ? `${chartData.percentageChanges.month1.toFixed(2)} ${t('ComexInventoryChart.ton')}`
                        : `${chartData.percentageChanges.month1.toFixed(2)}%`}

                    </span>
                  </div>
                )}

                {chartData.percentageChanges.month6 !== null && (
                  <div className="percentage-item">
                    <span className="percentage-label">{t('ComexInventoryChart.sixMonth')}</span>
                    <span
                      className={`percentage-value ${chartData.percentageChanges.month6 >= 0 ? 'positive' : 'negative'}`}
                    >
                      {chartData.percentageChanges.month6 >= 0 ? '+' : ''}
                      {unit === "ton"
                        ? `${chartData.percentageChanges.month6.toFixed(2)} ${t('ComexInventoryChart.ton')}`
                        : `${chartData.percentageChanges.month6.toFixed(2)}%`}

                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Right Column: Chart */}
        <div className="comex-right-column">
          {/* Time Range Filter */}
          <div className="comex-time-range">
            {["7", "30", "90", "365", "all"].map((range) => (
              <button
                key={range}
                className={`time-range-btn ${timeRange === range ? "active" : ""}`}
                onClick={() => handleTimeRangeChange(range)}
              >
                {range === "7" && t('ComexInventoryChart.sevenDays')}
                {range === "30" && t('ComexInventoryChart.thirtyDays')}
                {range === "90" && t('ComexInventoryChart.ninetyDays')}
                {range === "365" && t('ComexInventoryChart.oneYear')}
                {range === "all" && t('ComexInventoryChart.allData')}
              </button>
            ))}

            {/* Chart Type Dropdown */}
            <div className="comex-chart-type-dropdown">
              <button
                className="chart-type-trigger"
                onClick={() => setShowChartTypeDropdown(!showChartTypeDropdown)}
              >
                <span className="chart-type-icon">
                  {chartType === "line" && "📈"}
                  {chartType === "column" && "📊"}
                  {chartType === "stackedBar" && "📑"}
                  {chartType === "scatter" && "💫"}
                </span>
                <span className="chart-type-label">
                  {chartType === "line" && t('ComexInventoryChart.lineChart')}
                  {chartType === "column" && t('ComexInventoryChart.column')}
                  {chartType === "stackedBar" && t('ComexInventoryChart.stackedBar')}
                  {chartType === "scatter" && t('ComexInventoryChart.scatter')}
                </span>
                <span className="dropdown-arrow">▼</span>
              </button>

              {showChartTypeDropdown && (
                <div className="chart-type-menu">
                  <div
                    className={`chart-type-option ${chartType === "line" ? "active" : ""}`}
                    onClick={() => {
                      handleChartTypeChange("line");
                      setShowChartTypeDropdown(false);
                    }}
                  >
                    <span className="chart-type-icon">📈</span> {t('ComexInventoryChart.lineChart')}
                  </div>
                  <div
                    className={`chart-type-option ${chartType === "column" ? "active" : ""}`}
                    onClick={() => {
                      handleChartTypeChange("column");
                      setShowChartTypeDropdown(false);
                    }}
                  >
                    <span className="chart-type-icon">📊</span> {t('ComexInventoryChart.column')}
                  </div>
                  <div
                    className={`chart-type-option ${chartType === "stackedBar" ? "active" : ""}`}
                    onClick={() => {
                      handleChartTypeChange("stackedBar");
                      setShowChartTypeDropdown(false);
                    }}
                  >
                    <span className="chart-type-icon">📑</span> {t('ComexInventoryChart.stackedBar')}
                  </div>
                  <div
                    className={`chart-type-option ${chartType === "scatter" ? "active" : ""}`}
                    onClick={() => {
                      handleChartTypeChange("scatter");
                      setShowChartTypeDropdown(false);
                    }}
                  >
                    <span className="chart-type-icon">💫</span> {t('ComexInventoryChart.scatter')}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Chart Container */}
          <div className="comex-chart-wrapper">

            {chartData.datasets.length > 0 ? (
              <Chart type="line" data={chartData} options={options} />
            ) : (
              <div className="no-data">
                <p>{t('ComexInventoryChart.noDataFor', 'Không có dữ liệu cho')} {activeTab === "gold" ? t('ComexInventoryChart.goldLabel', 'Vàng') : t('ComexInventoryChart.silverLabel', 'Bạc')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ComexInventoryChart;
