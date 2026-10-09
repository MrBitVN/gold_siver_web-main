import React, { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useNavigate } from "react-router-dom";
import {
  fetchVang247SingleFile,
  getVang247FileUrl,
} from "../services/allVang247Service";


ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
);

const SHFEChart = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [fullData, setFullData] = useState([]);
  const [displayData, setDisplayData] = useState([]);
  const [activeFilter, setActiveFilter] = useState("1M");

  const formatLabelByFilter = (time, filter) => {
    const d = new Date(time);
    if (filter === "1W" || filter === "1M") {
      return `${d.getDate()}/${d.getMonth() + 1}`;
    }
    if (filter === "1Y") {
      return `${d.getMonth() + 1}/${d.getFullYear()}`;
    }
    if (typeof filter === "number") {
      return `Thg ${d.getMonth() + 1}`;
    }
    return d.getFullYear().toString();
  };

  const filterData = (filter) => {
    if (!fullData.length) return;
    const sorted = [...fullData].sort((a, b) => a.time - b.time);
    const latestDate = new Date(sorted[sorted.length - 1].time);
    let filtered = [];
    if (filter === "ALL") {
      filtered = sorted;
    } else if (filter === "1W") {
      const start = new Date(latestDate);
      start.setDate(start.getDate() - 7);
      filtered = sorted.filter(item => new Date(item.time) >= start);
    } else if (filter === "1M") {
      const start = new Date(latestDate);
      start.setMonth(start.getMonth() - 1);
      filtered = sorted.filter(item => new Date(item.time) >= start);
    } else if (filter === "1Y") {
      const start = new Date(latestDate);
      start.setFullYear(start.getFullYear() - 1);
      filtered = sorted.filter(item => new Date(item.time) >= start);
    } else if (typeof filter === "number") {
      filtered = sorted.filter(
        item => new Date(item.time).getFullYear() === filter
      );
    }
    setActiveFilter(filter);
    setDisplayData(filtered);
  };
  //Đoạn code Cũ
  // useEffect(() => {
  //   const fetchData = async () => {
  //     setLoading(true);
  //     setError(null);

  //     try {
  //       // bắt đầu từ hôm nay
  //       let currentDate = new Date();
  //       let filesData = null;

  //       // lùi ngày cho tới khi có dữ liệu
  //       while (!filesData) {
  //         const day = String(currentDate.getDate()).padStart(2, '0');
  //         const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  //         const year = currentDate.getFullYear();

  //         const days = `${day}_${month}_${year}`;

  //         try {
  //           const resFiles = await fetch(
  //             `https://api_gold.thinkdiff.us/all_json_1_day/${days}`
  //           );
  //           const data = await resFiles.json();

  //           if (data && Array.isArray(data.data) && data.data.length > 0) {
  //             filesData = data;
  //             break;
  //           } else {
  //             currentDate.setDate(currentDate.getDate() - 1);
  //           }
  //         } catch (err) {
  //           console.warn(`Không thể fetch dữ liệu ngày ${days}:`, err);
  //           currentDate.setDate(currentDate.getDate() - 1);
  //         }
  //       }

  //       if (!filesData) {
  //         throw new Error("Không tìm thấy file dữ liệu");
  //       }

  //       // --- lấy file mới nhất theo modified_time ---
  //       const latestFile = filesData.data.reduce((latest, current) => {
  //         const t1 = new Date(latest.modified_time.split('/').reverse().join('-'));
  //         const t2 = new Date(current.modified_time.split('/').reverse().join('-'));
  //         return t2 > t1 ? current : latest;
  //       });

  //       const fileName = latestFile.link
  //       .split("/")
  //       .pop()
  //       .replace(".json", "");
  //       const [d, m, y, h, min] = fileName
  //         .split('_')
  //         .map(v => parseInt(v, 10));
  //       const fileUrl = getVang247FileUrl(d, m, y, h, min);
  //       if (!fileUrl) {
  //         throw new Error("Invalid parameters when building Vang247 file URL");
  //       }
  //       const res = await fetchVang247SingleFile(fileUrl);
  //       const data = res.data?.bieudo?.[4]?.data;
  //       if (!data || !data.length) {
  //         throw new Error("File SHFE không có dữ liệu biểu đồ");
  //       }
  //       setFullData(data);
  //     } catch (err) {
  //       setError(err.message || "Lỗi khi tải dữ liệu");
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchData();
  // }, []);
  //Đoạn mới chỉnh sửa cho lùi tối đa 7 ngày
  useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        "https://api_gold.thinkdiff.us/china_silver_futures"
      );

      if (!res.ok) {
        throw new Error("Không gọi được API");
      }

      const result = await res.json();

      // tuỳ cấu trúc API mới, bạn chỉnh lại chỗ này
      const data = result?.data;

      if (!data || !data.length) {
        throw new Error("Không có dữ liệu");
      }

      setFullData(data);
    } catch (err) {
      setError(err.message || "Lỗi khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, []);

  useEffect(() => {
    if (fullData.length) {
      filterData("1M");
    }
  }, [fullData]);

  const availableYears = useMemo(() => {
    const years = fullData.map(item => new Date(item.time).getFullYear());
    return [...new Set(years)].sort((a, b) => a - b);
  }, [fullData]);

  const chartData = useMemo(() => {
    if (!displayData.length) return null;
    return {
      labels: displayData.map(item =>
        formatLabelByFilter(item.time, activeFilter)
      ),
      datasets: [
        {
          label: t('SHFEChart.chartLabel'),
          data: displayData.map(item => item.usd),
          borderColor: "#f59e0b",
          backgroundColor: "rgba(245,158,11,0.25)",
          fill: true,
          tension: 0.4,
          pointRadius: 0,
        },
      ],
    };
  }, [displayData, activeFilter]);

  const getLastUsdOfDay = (data) => {
    if (!data || !data.length) return null;
    const lastItem = data[data.length - 1];
    return { usd: lastItem.usd, time: lastItem.time };
  };

  const lastUsdInfo = useMemo(() => {
    return getLastUsdOfDay(displayData);
  }, [displayData]);

  function getDaysInCurrentMonth() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  }

  const daysInMonth = getDaysInCurrentMonth();
  const compareOptions = [
    { label: t('SHFEChart.oneDay'), days: 1 },
    { label: t('SHFEChart.twoDay'), days: 2 },
    { label: t('SHFEChart.threeDay'), days: 3 },
    { label: t('SHFEChart.oneWeek'), days: 7 },
    { label: t('SHFEChart.oneMonth'), days: daysInMonth },
    { label: t('SHFEChart.sixMonth'), days: daysInMonth * 6 },
  ];

  const getLastUsdByDate = (data, targetDate) => {
    if (!data || !data.length) return null;
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);
    const sameDayData = data.filter(item => {
      const d = new Date(item.time);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === target.getTime();
    });
    if (!sameDayData.length) return null;
    return sameDayData[sameDayData.length - 1];
  };

  const compareResults = useMemo(() => {
    if (!fullData.length) return [];
    const sorted = [...fullData].sort((a, b) => a.time - b.time);
    const latest = sorted[sorted.length - 1];
    const latestDate = new Date(latest.time);
    const todayLast = getLastUsdByDate(sorted, latestDate);
    if (!todayLast) return [];
    return compareOptions
      .map(opt => {
        const pastDate = new Date(latestDate);
        pastDate.setDate(pastDate.getDate() - opt.days);
        const pastLast = getLastUsdByDate(sorted, pastDate);
        if (!pastLast) return null;
        const diff = todayLast.usd - pastLast.usd;
        const percent = (diff / pastLast.usd) * 100;
        return {
          label: opt.label,
          diff,
          percent,
          fromUsd: pastLast.usd,
          toUsd: todayLast.usd,
        };
      })
      .filter(Boolean);
  }, [fullData]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: (ctx) => {
            const item = displayData[ctx[0].dataIndex];
            return new Date(item.time).toLocaleString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            });
          },
          label: (ctx) => {
            const item = displayData[ctx.dataIndex];
            const value = item.value;
            const usd = item.usd;
            return [
              `${t('SHFEChart.price')} ${usd.toFixed(2)} ${t('SHFEChart.usd')}`,
              `${t('SHFEChart.value')} ${value}`,
            ];
          },
        },
      },
    },
    scales: {
      y: {
        ticks: {
          callback: (value) => `$${value}`,
          color: "#f59e0b",
        },
        title: {
          display: true,
          text: "USD",
          color: "#f59e0b",
        },
        beginAtZero: true,
        min: 0
      },
      x: {
        ticks: {
          color: "#fff",
        },
      },
    },
  };

  if (loading || error || !chartData || !fullData.length) return null;

  const isMobile = window.innerWidth < 768;
  const isUltraMobile = window.innerWidth <= 480;

  return (
    <div style={{ width: "100%", padding: isUltraMobile ? 2 : (isMobile ? 8 : 16), boxSizing: "border-box" }}>
      <h2 style={{ 
        textAlign: "center", 
        marginBottom: isUltraMobile ? 4 : (isMobile ? 16 : 30), 
        cursor: "pointer",
        fontSize: isUltraMobile ? '10px' : (isMobile ? '16px' : '24px'),
        margin: isUltraMobile ? '2px 0' : (isMobile ? '12px 0' : '0 0 30px 0')
      }}
        onClick={() => navigate("/chart/XOJ26")}
      >
        {t('SHFEChart.title')}
      </h2>

      <div style={{
        background: "rgba(15, 23, 42, 0.55)",
        borderRadius: isUltraMobile ? 6 : (isMobile ? 12 : 18),
        padding: isUltraMobile ? 2 : (isMobile ? 12 : 24),
        border: "1px solid rgba(245, 158, 11, 0.15)",
        boxShadow: "0 25px 50px rgba(0, 0, 0, 0.35)"
      }}>
        {/* Split Layout 50/50 */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: isUltraMobile ? 2 : (isMobile ? 16 : 28),
          marginTop: isUltraMobile ? 2 : (isMobile ? 12 : 20),
          position: "relative"
        }}>
          {/* Divider Line */}
          {!isMobile && <div style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: "50%",
            width: 1,
            background: "linear-gradient(to bottom, transparent, rgba(245, 158, 11, 0.25), transparent)",
            transform: "translateX(-50%)",
            pointerEvents: "none"
          }} />}

          {/* LEFT PANEL */}
          <div style={{ background: "transparent" }}>
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center"
            }}>
              {/* Price Info */}
              {lastUsdInfo && (
                <div
                  style={{
                    width: "100%",
                    padding: isUltraMobile ? 4 : (isMobile ? 12 : 16),
                    background: "linear-gradient(135deg, rgba(45, 45, 10, 0.55), rgba(15, 23, 42, 0.55))",
                    border: "1px solid rgba(245, 158, 11, 0.35)",
                    borderRadius: isUltraMobile ? 4 : (isMobile ? 10 : 14),
                    marginBottom: isUltraMobile ? 4 : (isMobile ? 12 : 16),
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: isUltraMobile ? 2 : 6,
                    boxShadow: "inset 0 0 0 1px rgba(255, 255, 255, 0.03)"
                  }}
                >
                  <div style={{ fontSize: isUltraMobile ? 8 : (isMobile ? 12 : 15), fontWeight: 500, color: "#9ca3af", textAlign: "center" }}>
                    {t('SHFEChart.priceLabel')}
                  </div>
                  <div style={{ fontSize: isUltraMobile ? 12 : (isMobile ? 20 : 26), fontWeight: 800, color: "#f59e0b", letterSpacing: "0.5px", textShadow: "0 0 14px rgba(245, 158, 11, 0.45)" }}>
                    {lastUsdInfo.usd.toFixed(2)} <span style={{ fontSize: isUltraMobile ? 8 : (isMobile ? 12 : 16), fontWeight: 500, color: "#9ca3af", marginLeft: 4 }}>USD</span>
                  </div>
                  <div style={{ fontSize: isUltraMobile ? 7 : (isMobile ? 11 : 15), color: "#9ca3af", opacity: 0.9, textAlign: "center" }}>
                    {new Date(lastUsdInfo.time).toLocaleString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </div>
                </div>
              )}

              {/* Tỉ lệ thay đổi */}
              <div style={{ width: "100%" }}>
                <label style={{
                  color: "#fff3b0",
                  fontSize: isUltraMobile ? 9 : (isMobile ? 14 : 18),
                  fontWeight: 600,
                  margin: isUltraMobile ? "2px 0" : (isMobile ? "8px 0" : "14px 0"),
                  display: "block",
                  textAlign: "center"
                }}>
                  {t('SHFEChart.changeRatio')}
                </label>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isUltraMobile ? "repeat(2, 1fr)" : (isMobile ? "repeat(auto-fit, minmax(100px, 1fr))" : "repeat(auto-fit, minmax(140px, 1fr))"),
                    gap: isUltraMobile ? 3 : (isMobile ? 10 : 14),
                    width: "100%",
                    padding: isUltraMobile ? 4 : (isMobile ? 12 : 18),
                    background: "rgba(30, 41, 59, 0.45)",
                    border: "1px solid rgba(245, 158, 11, 0.25)",
                    borderRadius: isUltraMobile ? 4 : (isMobile ? 10 : 14)
                  }}
                >
                  {compareResults.map(item => {
                    const isUp = item.percent >= 0;
                    return (
                      <div
                        key={item.label}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          padding: isUltraMobile ? "3px 4px" : (isMobile ? "10px 8px" : "14px 12px"),
                          background: "rgba(15, 23, 42, 0.45)",
                          borderRadius: isUltraMobile ? 4 : (isMobile ? 8 : 12),
                          border: "1px solid rgba(245, 158, 11, 0.25)",
                          transition: "all 0.25s ease",
                          cursor: "pointer"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-2px)";
                          e.currentTarget.style.borderColor = "rgba(245, 158, 11, 0.6)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.borderColor = "rgba(245, 158, 11, 0.25)";
                        }}
                      >
                        <div style={{ fontSize: isUltraMobile ? 6 : (isMobile ? 10 : 12), color: "#9ca3af", marginBottom: isUltraMobile ? 1 : (isMobile ? 4 : 6) }}>
                          {item.label}
                        </div>
                        <div style={{
                          fontSize: isUltraMobile ? 8 : (isMobile ? 14 : 18),
                          fontWeight: 700,
                          color: isUp ? "#22c55e" : "#ef4444"
                        }}>
                          {item.percent.toFixed(2)} %
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Filters */}
              <div style={{ display: "flex", gap: isUltraMobile ? 2 : (isMobile ? 6 : 8), marginTop: isUltraMobile ? 4 : (isMobile ? 12 : 20), marginBottom: isUltraMobile ? 2 : (isMobile ? 8 : 12), flexWrap: "wrap", justifyContent: "center", width: "100%" }}>
                {["1W", "1M", "1Y", "ALL"].map(f => (
                  <button
                    key={f}
                    onClick={() => filterData(f)}
                    style={{
                      padding: isUltraMobile ? "3px 5px" : (isMobile ? "6px 10px" : "8px 15px"),
                      margin: isUltraMobile ? "1px" : (isMobile ? "3px" : "5px"),
                      borderRadius: "8px",
                      border: "none",
                      cursor: "pointer",
                      background: activeFilter === f ? "#f59e0b" : "#494A50",
                      color: activeFilter === f ? "#000" : "#FFF",
                      fontWeight: activeFilter === f ? "bold" : "normal",
                      fontSize: isUltraMobile ? '7px' : (isMobile ? '12px' : '14px'),
                      transition: "all 0.3s ease"
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {/* Year Range */}
              {availableYears.length > 0 && (
                <div style={{ width: "100%", padding: isUltraMobile ? "0 2px" : (isMobile ? "0 8px" : "0 12px"), textAlign: "center", marginTop: isUltraMobile ? 2 : (isMobile ? 8 : 12) }}>
                  <input
                    type="range"
                    min={Math.min(...availableYears)}
                    max={Math.max(...availableYears)}
                    value={typeof activeFilter === "number" ? activeFilter : availableYears[0]}
                    onChange={(e) => filterData(Number(e.target.value))}
                    style={{ width: "100%" }}
                  />
                  <div style={{ marginTop: isUltraMobile ? 2 : (isMobile ? 4 : 8), fontWeight: "bold", color: "#f59e0b", fontSize: isUltraMobile ? '8px' : (isMobile ? '12px' : '14px') }}>
                    {t('SHFEChart.yearLabel')} {typeof activeFilter === "number" ? activeFilter : activeFilter}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div style={{ background: "transparent" }}>
            <div style={{ height: isUltraMobile ? "120px" : (isMobile ? "300px" : "520px"), width: "100%", padding: isUltraMobile ? 2 : (isMobile ? 10 : 20) }}>
              <Line data={chartData} options={options} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SHFEChart;