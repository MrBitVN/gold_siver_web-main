import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import './GlobalComparisonPage.css';
import USDHistoryChart from "../components/exchange-rate/USDHistoryChart";
import BlackMarketExchangeRateTable from "../components/exchange-rate/BlackMarketExchangeRateTable";
import { useExchangeRate } from "../hooks/useExchangeRate";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { UseGoldOneDayPrices } from "../hooks/UseGoldOneDayPrices";
import GoldPriceDashboard from "../components/GoldPriceDashboard";
import AnalysisGoldSilverTable from "../components/tradingview/AnalysisGoldSilverTable";
import FilterBar from "../components/filter-bar/FilterBar";
import LineXauXagChart from "../components/tradingview/LineXauXagChart";

const GlobalComparisonPage = () => {
  const [data, setData] = useState([]);
  const [activeTab, setActiveTab] = useState('VÀNG');
  const [loading, setLoading] = useState(true);
  const [updateTime, setUpdateTime] = useState("");
  // thêm 
  const [exchangeRates, setExchangeRates] = useState(null);
  const [blackMarketLoading, setBlackMarketLoading] = useState(true);
  const [blackMarketError, setBlackMarketError] = useState(null);
  const { processedData: exchangeRateData } = useExchangeRate();
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showComparison, setShowComparison] = useState(true);

  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();

  const urlParts = location.pathname.split('/').filter(Boolean);
  const isTongHop = urlParts[0] === 'tong-hop';
  const typeFromPath = isTongHop ? urlParts[1] : null;
  const [dayFromPath, monthFromPath, yearFromPath, hourFromPath, minuteFromPath] = isTongHop ? urlParts.slice(2) : [];

  const filterOptions = useMemo(() => ({
    day: params.day || dayFromPath,
    month: params.month || monthFromPath,
    year: params.year || yearFromPath,
    hour: params.hour || hourFromPath,
    minute: params.minute || minuteFromPath,
    region: params.region || "Vietnam",
    type: params.type || typeFromPath || "gold",
  }), [params, dayFromPath, monthFromPath, yearFromPath, hourFromPath, minuteFromPath, typeFromPath]);

  const {
    error,
    displayedPrices,
    loadingProgress,
    availableCountries,
    fomo,
  } = UseGoldOneDayPrices(filterOptions);

  const [uiFilter, setUiFilter] = useState({
    sortBy: "reputation",
    sortOrder: "desc",
    distanceKm: "20",
  });

  const handleFilterChange = (next) => {
    const nextType = next.type || "gold";
    const datePart =
      next.day && next.month && next.year && next.hour && next.minute
        ? `/${next.day}/${next.month}/${next.year}/${next.hour}/${next.minute}`
        : "";
    navigate(`/tong-hop/${nextType}${datePart}`);
  };


  useEffect(() => {
    const fetchBlackMarketRates = async () => {
      try {
        setBlackMarketLoading(true);
        setBlackMarketError(null);

        const response = await axios.get(
          "https://api_gold.thinkdiff.us/tygia_chogia_vn"
        );

        if (Array.isArray(response?.data?.data?.data)) {
          setExchangeRates(response.data.data.data);
        } else {
          setBlackMarketError("Không tìm thấy dữ liệu tỷ giá");
        }
      } catch (error) {
        console.error("Error fetching black market rates:", error);
        setBlackMarketError("Không thể tải dữ liệu tỷ giá");
      } finally {
        setBlackMarketLoading(false);
      }
    };

    fetchBlackMarketRates();
  }, []);

  const getCountryCode = (c) => {
    const codes = {
      'USA': 'us', 'VIETNAM': 'vn', 'ENGLAND': 'gb', 'RUSSIAN': 'ru',
      'SOUTH KOREA': 'kr', 'UAE': 'ae', 'TRUNGQUOC': 'cn', 'INDIA': 'in', 'JAPAN': 'jp'
    };
    return codes[c.toUpperCase()] || 'un';
  };

  const fetchPipeline = async () => {
    setLoading(true);
    try {
      const resDays = await axios.get('https://api_gold.thinkdiff.us/all_day_save_price');
      if (!resDays.data?.data?.length) throw new Error("No day data");

      const latestDay = resDays.data.data[resDays.data.data.length - 1].dirname;
      const resFiles = await axios.get(`https://api_gold.thinkdiff.us/all_json_1_day/${latestDay}`);
      if (!resFiles.data?.data?.length) throw new Error("No file data");

      const latestLink = resFiles.data.data[resFiles.data.data.length - 1].link;
      const pathSuffix = latestLink.split('/vang247_xyz/')[1];
      const resDetail = await axios.get(`https://api_gold.thinkdiff.us/view_full_data_json/${pathSuffix}`);

      const fullData = resDetail.data?.data || {};
      const listServer = fullData.list_server || [];

      // XỬ LÝ THỜI GIAN: CHỈ LẤY NGÀY-THÁNG-NĂM (VÍ DỤ: 2026-01-26T... -> 26-01-2026)
      if (listServer.length > 0) {
        let rawTime = listServer[0]?.data?.data?.fetched_at || listServer[0]?.items?.[0]?.fetched_at || "";
        if (rawTime) {
          const datePart = rawTime.includes("T") ? rawTime.split("T")[0] : rawTime.split(" ")[0];
          if (datePart.includes("-") && datePart.indexOf("-") === 4) {
            const [y, m, d] = datePart.split("-");
            setUpdateTime(`${d}-${m}-${y}`);
          } else {
            setUpdateTime(datePart.replace(/\//g, "-"));
          }
        }
      }

      // Lấy tỷ giá USD duy nhất làm mẫu số chung
      let globalUsdRate = 26447;
      const rateData = fullData.chogia_vn?.data || [];
      const usdRateObj = rateData.find(r => r.code === "USD");
      if (usdRateObj) globalUsdRate = usdRateObj.sell;

      let results = [];
      if (Array.isArray(listServer)) {
        listServer.forEach(server => {
          const country = server.quoc_gia || "";
          const items = server.items || server.data?.data?.items;

          if (Array.isArray(items)) {
            items.forEach(item => {
              const name = (item.name || server.name || "").toUpperCase();
              const purity = (item.purity || "").toLowerCase();
              const isVang = item.TYPE === "VANG";
              const isBac = item.TYPE === "BAC";

              // LỌC CHUẨN: VÀNG 9999/24K VÀ BẠC 1KG
              let isPassFilter = false;
              if (isVang && (purity === "9999" || purity === "24k")) isPassFilter = true;
              if (isBac && purity === "1kg_bac_999") isPassFilter = true;

              if (!isPassFilter) return;

              // Phân tách sàn Việt Nam và Quốc tế
              if (country.toLowerCase() === "vietnam" || name.includes("PHÚ QUÝ") || name.includes("BTMC")) {
                if ((isVang && name.includes("BTMC")) || (isBac && name.includes("PHÚ QUÝ"))) {
                  const row = calculatePrice(
                    country,
                    name,
                    isVang ? "VÀNG" : "BẠC",
                    item,
                    server,
                    globalUsdRate
                  );

                  if (row) results.push(row);

                }
              } else if (country !== "") {
                const row = calculatePrice(
                  country,
                  name,
                  isVang ? "VÀNG" : "BẠC",
                  item,
                  server,
                  globalUsdRate
                );

                if (row) results.push(row);

              }
            });
          }
        });
      }
      setData(results);
      setLoading(false);
    } catch (err) {
      console.error("Lỗi tải API:", err);
      setLoading(false);
    }
  };

  const calculatePrice = (country, name, type, item, server, globalUsdRate) => {
    const sellVnd = item.sell ? Number(item.sell) : 0;
    const rateUSD = globalUsdRate || 26447;

    if (!sellVnd) return null;

    let gramWeight = 37.5; // mặc định vàng VN

    if (type === "BẠC") {
      gramWeight = 1000; // bạc 1kg
    }

    const priceUsdOz =
      (sellVnd / gramWeight) * 31.1034768 / rateUSD;

    return {
      country: country.toUpperCase(),
      name: item.product || name,
      type,
      price: priceUsdOz,
    };
  };

  // CHỈ CHẠY 1 LẦN KHI LOAD TRANG
  useEffect(() => {
    fetchPipeline();
    // Không sử dụng setInterval ở đây để bảo mật
  }, []);
  const filteredAndSortedData = useMemo(() => {
    return data
      .filter(item => item && item.type === activeTab)
      .sort((a, b) => b.price - a.price);
  }, [data, activeTab]);


  return (
    <>
      <div>
        <FilterBar
          filterOptions={filterOptions}
          onFilterChange={handleFilterChange}
          uiFilter={uiFilter}
          setUiFilter={setUiFilter}
          availableCountries={availableCountries}
          showAnalysis={showAnalysis}
          onToggleAnalysis={setShowAnalysis}
          showComparison={showComparison}
          onToggleComparison={setShowComparison}
        />
        {!showComparison && (
          <>
            {!showAnalysis && (
              <GoldPriceDashboard
                loading={loading}
                error={error}
                displayedPrices={displayedPrices}
                filterOptions={filterOptions}
                onFilterChange={handleFilterChange}
                loadingProgress={loadingProgress}
                availableCountries={availableCountries}
                showAnalysis={true}
                onToggleAnalysis={() => { }}
                exchangeRateUSD={fomo?.ty_gia_usd}
                uiFilter={uiFilter}
                setUiFilter={setUiFilter}
                showFilterBar={false}
              />
            )}

            {showAnalysis && (
              <AnalysisGoldSilverTable />
            )}
          </>
        )}
      </div>
      {showComparison && (
        <div style={containerStyle}>
          <h2 style={titleStyle}>Báo Cáo Giá Vàng Bạc của các Quốc Gia</h2>

          <div style={timeBox}>
            Cập nhật lúc: <span style={{ color: '#f1c40f' }}>{updateTime || "---"}</span>
          </div>

          <div style={tabContainer}>
            <button style={activeTab === 'VÀNG' ? activeGoldTab : inactiveTab} onClick={() => setActiveTab('VÀNG')}> VÀNG</button>
            <button style={activeTab === 'BẠC' ? activeSilverTab : inactiveTab} onClick={() => setActiveTab('BẠC')}> BẠC</button>
          </div>

          {loading ? (
            <div style={msgStyle}>Đang tải dữ liệu an toàn...</div>
          ) : (
            <div style={gridStyle}>
              {filteredAndSortedData.map((item, idx) => (
                <div key={idx} style={cardStyle(item.type)}>
                  <div style={headerRow}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <img src={`https://flagcdn.com/w40/${getCountryCode(item.country)}.png`} style={flagStyle} alt="flag" />
                      <span style={countryNameStyle}>{item.country}</span>
                    </div>
                    <div style={typeTag(item.type)}>{item.type}</div>
                  </div>
                  <div style={brandStyle}>{item.name}</div>
                  <div style={priceRow}>
                    <span style={labelStyle}>Quy đổi:</span>
                    <span style={priceValue(item.type)}>
                      {item.price > 0 ? item.price.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "---"}
                    </span>
                    <span style={unitStyle}>USD/oz</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {/* ===== BLACK MARKET SECTION ===== */}
      <div className="black-market-exchange-rate-section">
        <div className="black-market-section-grid">

          {/* Cột trái: Biểu đồ USD */}
          <div className="black-market-chart-column">
            <USDHistoryChart data={exchangeRateData} />
          </div>

          {/* Cột phải: Bảng tỷ giá */}
          <div className="black-market-table-column">
            {blackMarketLoading ? (
              <div className="black-market-loading">
                <p>Đang tải dữ liệu...</p>
              </div>
            ) : blackMarketError ? (
              <div className="black-market-error">
                <p>{blackMarketError}</p>
              </div>
            ) : (
              <BlackMarketExchangeRateTable exchangeRates={exchangeRates} />
            )}
          </div>

        </div>
        {/* ===== XAU/XAG RATIO CHART ===== */}
        <div style={{
          background: "#0a0a0a",
          padding: "30px 10px"
        }}>
          <h2 style={{
            color: "#f1c40f",
            textAlign: "center",
            marginBottom: "20px"
          }}>
            Tỷ lệ Vàng / Bạc (XAU/XAG)
          </h2>

          <LineXauXagChart />
        </div>
      </div>
    </>

  );
};

// --- STYLES GIỮ NGUYÊN ---
const containerStyle = { backgroundColor: '#0a0a0a', minHeight: '100vh', padding: '20px' };
const titleStyle = { color: '#f1c40f', textAlign: 'center', marginBottom: '5px', fontSize: '22px', fontWeight: 'bold' };
const timeBox = { color: '#888', textAlign: 'center', marginBottom: '30px', fontSize: '14px' };
const tabContainer = { display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '40px' };
const inactiveTab = { backgroundColor: '#1a1a1a', color: '#666', border: '1px solid #333', padding: '10px 30px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };
const activeGoldTab = { ...inactiveTab, backgroundColor: '#f1c40f', color: '#000', border: '1px solid #f1c40f' };
const activeSilverTab = { ...inactiveTab, backgroundColor: '#bdc3c7', color: '#000', border: '1px solid #bdc3c7' };
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', maxWidth: '1200px', margin: '0 auto' };
const cardStyle = (type) => ({ backgroundColor: '#161616', border: '1px solid #333', borderRadius: '12px', padding: '20px', borderTop: `4px solid ${type === 'VÀNG' ? '#f1c40f' : '#bdc3c7'}` });
const headerRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' };
const flagStyle = { width: '22px' };
const countryNameStyle = { color: '#888', fontSize: '11px', fontWeight: 'bold' };
const typeTag = (t) => ({ color: t === 'VÀNG' ? '#f1c40f' : '#bdc3c7', fontSize: '10px', fontWeight: 'bold' });
const brandStyle = { color: '#efefef', fontSize: '12px', marginBottom: '20px', minHeight: '35px' };
const priceRow = { borderTop: '1px solid #222', paddingTop: '15px', display: 'flex', alignItems: 'baseline', gap: '8px' };
const labelStyle = { color: '#666', fontSize: '12px' };
const priceValue = (type) => ({ color: type === 'VÀNG' ? '#f1c40f' : '#bdc3c7', fontSize: '24px', fontWeight: 'bold' });
const unitStyle = { color: '#444', fontSize: '11px' };
const msgStyle = { color: 'white', textAlign: 'center', marginTop: '50px' };

export default GlobalComparisonPage;