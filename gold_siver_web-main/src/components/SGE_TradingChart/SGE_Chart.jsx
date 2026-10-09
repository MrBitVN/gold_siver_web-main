import React, { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Bar, getElementAtEvent } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { fetchBlackMarketExchangeRates } from "../../services/blackMarketExchangeRateService";
import { fetchAllGoldPrices } from "../../services/goldService";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const SGEChart = () => {
  const { t } = useTranslation();
  const [time, setTime] = useState(() => {
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
    };
  });
  const [chartDataState, setChartDataState] = useState(null);
  const [fullData, setFullData] = useState([]);
  const [filteredChartData, setFilteredChartData] = useState([]); // State for filtered data
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [rateCNYtoVND, setRateCNYtoVND] = useState(null);
  const [rateUSDtoVND, setRateUSDtoVND] = useState(null);
  const [displayCurrency, setDisplayCurrency] = useState("CNY");
  const [datasetIndex, setdatasetIndex] = useState(0);
  const [showOunce, setShowOunce] = useState(true);
  const [showBillion, setShowBillion] = useState(false);
  
  // State mới để lưu giá SGE ngày cuối cùng
  const [latestSGEPrices, setLatestSGEPrices] = useState({ gold: null, silver: null, date: null });
  const [averagePrices, setAveragePrices] = useState({ gold: null, silver: null });

  const chartRef = useRef();
  const Ounce_IN_GRAM = 31.1034768;

  // --- Hàm tính giá trị trung bình từ mảng hợp đồng ---
  const calculateDailyAverage = (contracts, type) => {
    if (!contracts || contracts.length === 0) return 0;
    
    let total = 0;
    let count = 0;

    contracts.forEach(item => {
        // Ưu tiên dùng giá đóng cửa, nếu không có thì dùng giá mở cửa
        const price = Number(item.close_price) || Number(item.open_price);
        if (price > 0) {
            total += price;
            count++;
        }
    });

    return count > 0 ? total / count : 0;
  };

  // Fetch dữ liệu theo tháng
  useEffect(() => {
    fetch(`https://api_gold.thinkdiff.us/shanghai_gold_exchange/${time.year}/${time.month}`)
      .then((res) => res.json())
      .then((resData) => {
        if (resData.status === "success" && Array.isArray(resData.tong_toanbo)) {
          setFullData(resData.tong_toanbo);
          setSelectedDetails(null);

          const filteredData = resData.tong_toanbo.filter(item =>
            (Number(item.tong_vang) > 0 || Number(item.tong_bac) > 0 || Number(item.tongkhac) > 0)
          );

          // ---  Lấy ngày cuối cùng có dữ liệu ---
          if (filteredData.length > 0) {
            const lastDayData = filteredData[filteredData.length - 1]; // Phần tử cuối cùng
            
            // Tính trung bình giá CNY gốc
            const avgGoldCNY = calculateDailyAverage(lastDayData.vang, 'gold');
            const avgSilverCNY = calculateDailyAverage(lastDayData.bac, 'silver');

            setLatestSGEPrices({
                gold: avgGoldCNY,
                silver: avgSilverCNY,
                date: lastDayData.ngay
            });
          } else {
             setLatestSGEPrices({ gold: null, silver: null, date: null });
          }
          // ------------------------------------------------

          setChartDataState({
            labels: filteredData.map(item => {
              const parts = item.ngay.split('-');
              return `${parts[2]}/${parts[1]}`;
            }),
            datasets: [
              { label: t('SGEChart.goldCNY'), data: filteredData.map(item => Number(item.tong_vang) || 0), backgroundColor: "#f1c40f", yAxisID: 'y' },
              { label: t('SGEChart.silverCNY'), data: filteredData.map(item => Number(item.tong_bac) || 0), backgroundColor: "#bdc3c7", yAxisID: 'y' },
              { label: t('SGEChart.otherCNY'), data: filteredData.map(item => Number(item.tongkhac) || 0), backgroundColor: "#2ecc71", yAxisID: 'y1' }
            ]
          });
        }
      })
      .catch((err) => {
        console.warn("SGE fetch error:", err);
        setFullData([]);
      });
  }, [time]);


  const loadExchangeRates = async () => {
    const data = await fetchBlackMarketExchangeRates();
    if (!data) return;

    const cny = data.find(i => i.code === "CNY");
    const usd = data.find(i => i.code === "USD");

    if (cny) setRateCNYtoVND(cny.sell);
    if (usd) setRateUSDtoVND(usd.sell);
  };

  useEffect(() => {
    loadExchangeRates();
  }, []);

  // Fetch and calculate average gold and silver prices 
  // useEffect(() => {
  //   const loadAveragePrices = async () => {
  //     try {
  //       const pricesData = await fetchAllGoldPrices();
  //       if (!pricesData || pricesData.length === 0) return;

  //       let goldPrices = [];
  //       let silverPrices = [];

  //       pricesData.forEach(vendor => {
  //         if (vendor.items && Array.isArray(vendor.items)) {
  //           vendor.items.forEach(item => {
  //             const itemName = (item.name || item.type || '').toLowerCase();
  //             const vendorName = (vendor.name || '').toLowerCase();
  //             if (itemName.includes('gold') || itemName.includes('vàng') || vendorName.includes('gold') || vendorName.includes('vang')) {
  //               if (item.sell_price && !isNaN(Number(item.sell_price))) {
  //                 goldPrices.push(Number(item.sell_price));
  //               }
  //             }
  //             if (itemName.includes('silver') || itemName.includes('bạc') || itemName.includes('bac') || vendorName.includes('silver')) {
  //               if (item.sell_price && !isNaN(Number(item.sell_price))) {
  //                 silverPrices.push(Number(item.sell_price));
  //               }
  //             }
  //           });
  //         }
  //       });

  //       const avgGold = goldPrices.length > 0 ? goldPrices.reduce((sum, price) => sum + price, 0) / goldPrices.length : null;
  //       const avgSilver = silverPrices.length > 0 ? silverPrices.reduce((sum, price) => sum + price, 0) / silverPrices.length : null;

  //       setAveragePrices({ gold: avgGold, silver: avgSilver });
  //     } catch (error) {
  //       console.error('Error loading average prices:', error);
  //     }
  //   };

  //   loadAveragePrices();
  // }, []);

  const onChartClick = (event) => {
    const { current: chart } = chartRef;
    if (!chart) return;

    const element = getElementAtEvent(chart, event);
    if (element.length > 0) {
      const { index, datasetIndex } = element[0]; 
      const dayLabel = chart.data.labels[index];

      const dayData = fullData.find(item => {
        const parts = item.ngay.split('-');
        return `${parts[2]}/${parts[1]}` === dayLabel;
      });

      if (dayData) {
        let combined = [];
        if (datasetIndex === 0) combined = dayData.vang || [];
        else if (datasetIndex === 1) combined = dayData.bac || [];
        else if (datasetIndex === 2) combined = dayData.kim_loai_khac || [];

        setSelectedDetails({
          date: dayData.ngay,
          contracts: combined
        });
        setdatasetIndex(datasetIndex);
      }
    }
  };
  
  const convertMoney = (amountCNY) => {
    if (!amountCNY) return 0;
    if (displayCurrency === "CNY") return amountCNY;
    if (displayCurrency === "VND") {
      if (!rateCNYtoVND) return 0;
      let result = amountCNY * rateCNYtoVND;
      if (datasetIndex === 0) result *= 37.5;
      return result;
    }
    if (displayCurrency === "USD") {
      if (!rateCNYtoVND || !rateUSDtoVND) return 0;
      const vnd = amountCNY * rateCNYtoVND;
      return vnd / rateUSDtoVND;
    }
    return 0;
  };

  const getColumnTitle = (baseTitle, datasetIndex, showOunce ) => {
    if (datasetIndex === 0) return <>{baseTitle} <br /> {showOunce ? "(Ounce)" : `(${t('SGEChart.volume')} / ${t('common.volume')})`}</>;
    if (datasetIndex === 1) return <>{baseTitle} <br /> {showOunce ? "(Ounce)" : `(${t('SGEChart.volume')} / Kg)`}</>;
    return baseTitle;
  };

  const calculateOuncePrice = (price, datasetIndex) => {
    if (!price) return 0;
    let priceInCNY = price;
    if (datasetIndex === 0) priceInCNY = price * Ounce_IN_GRAM ;
    else if (datasetIndex === 1) priceInCNY = price * Ounce_IN_GRAM / 1000;

    if (showOunce) return (rateCNYtoVND && rateUSDtoVND) ? (priceInCNY * rateCNYtoVND) / rateUSDtoVND : 0;
    if (displayCurrency === "CNY") return priceInCNY;
    if (displayCurrency === "VND") return rateCNYtoVND ? priceInCNY * rateCNYtoVND : 0;
    if (displayCurrency === "USD") return (rateCNYtoVND && rateUSDtoVND) ? (priceInCNY * rateCNYtoVND) / rateUSDtoVND : 0;
    return priceInCNY;
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: "#fff" } },
    },
    scales: {
      x: { ticks: { color: "#94a3b8" } },
      y: { position: 'left', ticks: { color: "#f1c40f" } },
      y1: { position: 'right', ticks: { color: "#2ecc71" }, grid: { display: false } }
    }
  };

  // --- Hàm convert riêng cho giá SGE (CNY -> USD/Ounce) ---
  const convertSGE_CNY_To_USD_Ounce = (cnyPrice, type) => {
      if (!cnyPrice || !rateCNYtoVND || !rateUSDtoVND) return 0;
      
      // 1. CNY -> VND -> USD
      const priceVND = cnyPrice * rateCNYtoVND;
      const priceUSD = priceVND / rateUSDtoVND;

      // 2. Convert unit to Ounce
      // Vàng SGE gốc là CNY/Gram -> * 31.1035
      // Bạc SGE gốc là CNY/Kg -> / 1000 * 31.1035
      if (type === 'gold') {
          return priceUSD * Ounce_IN_GRAM;
      } else {
          return (priceUSD / 1000) * Ounce_IN_GRAM;
      }
  };

  if (!fullData || fullData.length === 0) return null;

  return (
    <div style={{ background: "#05111d", color: "#fff", padding: "20px", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginBottom: "20px" }}>
        <button onClick={() => setTime(p => p.month === 1 ? {year: p.year-1, month: 12} : {year: p.year, month: p.month-1})} style={btnStyle}>{t('SGEChart.previous')}</button>
        <h2 style={{ color: "#f1c40f" }}>{t('SGEChart.title')} {time.month}/{time.year}</h2>
        <button onClick={() => setTime(p => p.month === 12 ? {year: p.year+1, month: 1} : {year: p.year, month: p.month+1})} style={btnStyle}>{t('SGEChart.next')}</button>
      </div>

      {/* --- GIÁ SGE NGÀY CUỐI CÙNG --- */}
      <div style={{ textAlign: "center", marginBottom: "20px", padding: "10px" }}>
          <div>
             {/* có thể để tiêu đề phụ ở đây nếu muốn */}
          </div>
          <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "24px", color: "#94a3b8", marginBottom: "5px" }}>
                  {t('SGEChart.avgClosingPrice')} <span style={{color: "#fff", fontWeight: "bold"}}>{latestSGEPrices.date ? latestSGEPrices.date.split("-").reverse().join("/") : t('SGEChart.loading')}</span>
              </div>
              <div style={{ display: "flex", gap: "20px", alignItems: "center", textAlign: "center", justifyContent: "center" }}>
                  <div>
                      <span style={{ color: "#f1c40f", fontWeight: "bold", fontSize: "20px" }}>
                          {t('SGEChart.gold')}: {convertSGE_CNY_To_USD_Ounce(latestSGEPrices.gold, 'gold').toLocaleString(undefined, {maximumFractionDigits: 2})} <span style={{fontSize: "14px"}}>{t('SGEChart.perOunce')}</span>
                      </span>
                  </div>
                  <div>
                      <span style={{ color: "#bdc3c7", fontWeight: "bold", fontSize: "20px" }}>
                          {t('SGEChart.silver')}: {convertSGE_CNY_To_USD_Ounce(latestSGEPrices.silver, 'silver').toLocaleString(undefined, {maximumFractionDigits: 2})} <span style={{fontSize: "14px"}}>{t('SGEChart.perOunce')}</span>
                      </span>
                  </div>
              </div>
          </div>
      </div>
      {/* -------------------------------------------------- */}

      <div style={{ height: "400px", background: "#101929", padding: "20px", borderRadius: "8px", marginBottom: "30px", position: "relative" }}>
        {chartDataState && <Bar ref={chartRef} data={chartDataState} options={options} onClick={onChartClick} />}
      </div>

      {/* BẢNG DỮ LIỆU CHI TIẾT */}
      {selectedDetails && (
        <div style={{ background: "#101929", padding: "20px", borderRadius: "8px", border: "1px solid #1e293b" }}>
          <h3 style={{ color: "#3498db" }}>
            {t('SGEChart.detailsDay')}{" "}
            <span style={{ color: "red" }}>
              {selectedDetails.date.split("-").reverse().join("/")}
            </span>
          </h3>

          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginBottom: "10px" }}>
            {showOunce
              ? (
                <button
                  key="USD"
                  onClick={() => setDisplayCurrency("USD")}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    border: "1px solid #334155",
                    background: displayCurrency === "USD" ? "#3498db" : "#1e293b",
                    color: "#fff",
                    cursor: "pointer"
                  }}
                >
                  USD
                </button>
              )
              : ["CNY", "VND", "USD"].map(cur => (
                <button
                  key={cur}
                  onClick={() => setDisplayCurrency(cur)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    border: "1px solid #334155",
                    background: displayCurrency === cur ? "#3498db" : "#1e293b",
                    color: "#fff",
                    cursor: "pointer"
                  }}
                >
                  {cur}
                </button>
              ))
            }

            {/* Nút toggle Ounce */}
            <button
              onClick={() => {
                setShowOunce(!showOunce);
                if (!showOunce) setDisplayCurrency("USD"); // bật Ounce → mặc định USD
              }}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                border: "1px solid #334155",
                background: showOunce ? "#10b981" : "#1e293b",
                color: "#fff",
                cursor: "pointer"
              }}
            >
              {showOunce ? t('SGEChart.oneOunce') : t('SGEChart.original')}
            </button>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px" }}>
              <thead>
                <tr style={{ background: "#172a45", color: "#94a3b8" }}>
                  <th style={thStyle}>{t('SGEChart.contract')}</th>
                  <th style={thStyle}>{t('SGEChart.direction')}</th>
                  <th style={thStyle}>{t('SGEChart.volume')}</th>
                  <th style={thStyle}>{getColumnTitle(t('SGEChart.openPrice'), datasetIndex, showOunce)}</th>
                  <th style={thStyle}>{getColumnTitle(t('SGEChart.closePrice'), datasetIndex, showOunce)}</th>
                  <th style={thStyle}>{getColumnTitle(t('SGEChart.changePrice'), datasetIndex, showOunce)}</th>
                  <th style={thStyle}>{t('SGEChart.percentage')}</th>
                  <th style={thStyle}>{getColumnTitle(t('SGEChart.highPrice'), datasetIndex, showOunce)}</th>
                  <th style={thStyle}>{getColumnTitle(t('SGEChart.lowPrice'), datasetIndex, showOunce)}</th>
                  <th style={thStyle}>{t('SGEChart.openInterest')}</th>
                  <th style={thStyle}>{getColumnTitle(t('SGEChart.avgPrice'), datasetIndex, showOunce)}</th>
                  <th style={thStyle}>
                    {t('SGEChart.totalValue')}
                    <button
                      onClick={() => setShowBillion(!showBillion)}
                      style={{
                        marginLeft: 8,
                        padding: "2px 6px",
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      {showBillion ? t('SGEChart.usd') : t('SGEChart.billion')}
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {selectedDetails.contracts.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #1e293b" }}>
                    <td style={{...tdStyle, color: "#fff"}}>{item.Contract}</td>          
                    <td style={{
                      ...tdStyle,
                      color: (item.Direction || "") === "Long to Short" ? '#e74c3c' : 
                            (item.Direction || "") === "Short to Long" ? '#2ecc71' : '#94a3b8'
                    }}>
                      {item.Direction === "" ? "—" : item.Direction}
                    </td>
                    <td style={tdStyle}>{Number(item.volume || 0).toLocaleString()}</td>
                    <td style={tdStyle}>
                      {item.open_price
                        ? (showOunce
                            ? calculateOuncePrice(Number(item.open_price), datasetIndex)
                            : convertMoney(Number(item.open_price))
                          ).toLocaleString(undefined, { maximumFractionDigits: displayCurrency === "USD" ? 2 : 0 })
                          + ` ${showOunce ? "USD" : displayCurrency}`
                        : "—"
                      }
                    </td>
                    <td style={tdStyle}>
                      {item.close_price
                        ? (showOunce
                            ? calculateOuncePrice(Number(item.close_price), datasetIndex)
                            : convertMoney(Number(item.close_price))
                          ).toLocaleString(undefined, { maximumFractionDigits: displayCurrency === "USD" ? 2 : 0 })
                          + ` ${showOunce ? "USD" : displayCurrency}`
                        : "—"
                      }
                    </td>
                    <td style={tdStyle}>
                      {item.change_price
                        ? (showOunce
                            ? calculateOuncePrice(Number(item.change_price), datasetIndex)
                            : convertMoney(Number(item.change_price))
                          ).toLocaleString(undefined, { maximumFractionDigits: displayCurrency === "USD" ? 2 : 0 })
                          + ` ${showOunce ? "USD" : displayCurrency}`
                        : "—"
                      }
                    </td>
                    <td style={tdStyle}>{item.change_pct ? `${Number(item.change_pct).toFixed(2)}%` : "—"}</td>
                    <td style={tdStyle}>
                      {item.high_price
                        ? (showOunce
                            ? calculateOuncePrice(Number(item.high_price), datasetIndex)
                            : convertMoney(Number(item.high_price))
                          ).toLocaleString(undefined, { maximumFractionDigits: displayCurrency === "USD" ? 2 : 0 })
                          + ` ${showOunce ? "USD" : displayCurrency}`
                        : "—"
                      }
                    </td>
                    <td style={tdStyle}>
                      {item.low_price
                        ? (showOunce
                            ? calculateOuncePrice(Number(item.low_price), datasetIndex)
                            : convertMoney(Number(item.low_price))
                          ).toLocaleString(undefined, { maximumFractionDigits: displayCurrency === "USD" ? 2 : 0 })
                          + ` ${showOunce ? "USD" : displayCurrency}`
                        : "—"
                      }
                    </td>
                    <td style={tdStyle}>{Number(item.open_interest || 0).toLocaleString()}</td>
                    <td style={tdStyle}>
                      {item.high_price && item.low_price
                        ? (() => {
                            const new_avg_price = (Number(item.high_price) + Number(item.low_price)) / 2;
                            const displayValue = showOunce
                                ? calculateOuncePrice(new_avg_price, datasetIndex)
                                : convertMoney(new_avg_price);
                            return displayValue.toLocaleString(undefined, { maximumFractionDigits: displayCurrency === "USD" ? 2 : 0 })
                              + ` ${showOunce ? "USD" : displayCurrency}`;
                          })()
                        : "—"
                      }
                    </td>
                    <td style={{ ...tdStyle, color: "#f1c40f", fontWeight: "bold" }}>
                      {item.tong_tien_cny
                        ? (() => {
                            const value = showOunce
                              ? calculateOuncePrice(Number(item.tong_tien_cny), datasetIndex)
                              : convertMoney(Number(item.tong_tien_cny));
                            // Ngưỡng không chia
                            const THRESHOLD = 5_556_757.26;
                            // Nếu KHÔNG bật tỷ USD hoặc giá trị nhỏ hơn ngưỡng
                            if (!showBillion || value < THRESHOLD) {
                              return (
                                value.toLocaleString(undefined, {
                                  maximumFractionDigits: 2,
                                }) + ` ${showOunce ? "USD" : displayCurrency}`
                              );
                            }
                            // Hiển thị tỷ USD
                            const billionValue = value / 1_000_000_000;
                            return (
                              billionValue.toLocaleString(undefined, {
                                minimumFractionDigits: value >= 1_000_000_000 ? 2 : 4,
                                maximumFractionDigits: value >= 1_000_000_000 ? 2 : 4,
                              }) + ` ${t('SGEChart.billion1')} ${showOunce ? "USD" : displayCurrency}`
                            );
                          })()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const btnStyle = { padding: "8px 16px", background: "#172a45", color: "#fff", border: "1px solid #3498db", borderRadius: "4px", cursor: "pointer" };
const thStyle = { padding: "12px", textAlign: "left", borderBottom: "1px solid #1e293b" };
const tdStyle = { padding: "10px", borderBottom: "1px solid #1e293b" };

export default SGEChart;