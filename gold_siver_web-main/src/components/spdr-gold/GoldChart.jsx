import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Tooltip,
    Legend
} from "chart.js";
import { FaChartBar } from "react-icons/fa";
import { FaChartLine } from "react-icons/fa6";
import { MdOutlineTableChart } from "react-icons/md";
import { useTranslation } from "react-i18next";
import { Chart } from "react-chartjs-2";
import { useLocation, useNavigate } from "react-router-dom";
import zoomPlugin from "chartjs-plugin-zoom";
import _ from "lodash";
import { useMemo, useState, useEffect } from "react";
import "./GoldChart.css";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Tooltip,
    Legend,
    zoomPlugin
);

const TIME_RANGES = [
    { label: "day7", days: 7, urlParam: "7" },
    { label: "day30", days: 30, urlParam: "30" },
    { label: "day90", days: 90, urlParam: "90" },
    { label: "year1", days: 365, urlParam: "365" },
    { label: "all", days: 9999, urlParam: "all" }
];

const formatNumber = (num) => new Intl.NumberFormat('en-US').format(num);

const btnStyle = (isActive) => ({
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '6px',
    backgroundColor: '#f0f2f5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    border: `1px solid ${isActive ? '#007bff' : '#ddd'}`,
    color: isActive ? '#007bff' : '#666'
});

function GoldChart() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const [typeChart, setTypeChart] = useState('bar');
    const [dataGoldTrust, setDataGoldTrust] = useState(null);
    const [loading, setLoading] = useState(true);

    const searchParams = new URLSearchParams(location.search);
    const activeDurationParam = searchParams.get("duration") || "7";
    const activeRange = TIME_RANGES.find(r => r.urlParam === activeDurationParam) || TIME_RANGES[0];
    const selectedDays = activeRange.days;

    // LẤY DATA TRỰC TIẾP TỪ API
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await fetch("https://api_gold.thinkdiff.us/spdr_mua_ban");
                const result = await response.json();
                // Cấu trúc API mới: result.data.data.dates
                if (result && result.data && result.data.data) {
                    setDataGoldTrust(result.data);
                }
            } catch (error) {
                console.error("Lỗi khi lấy dữ liệu vàng:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const { chartLabels, datasets, rawFilteredData } = useMemo(() => {
        if (!dataGoldTrust?.data?.dates) {
            return { chartLabels: [], datasets: [], rawFilteredData: [] };
        }

        let allDates = _.cloneDeep(dataGoldTrust.data.dates);
        // Sắp xếp ngày tăng dần để vẽ biểu đồ
        allDates.sort((a, b) => new Date(a.dt) - new Date(b.dt));

        const enrichedData = allDates.map((item, index) => {
            const prevAmount = index === 0 ? item.amount : allDates[index - 1].amount;
            const calculatedChange = item.change !== undefined ? item.change : (item.amount - prevAmount);
            return {
                ...item,
                calculatedChange: calculatedChange,
                displayHoldings: item.amount - (Math.abs(calculatedChange) * 10)
            };
        });

        const filteredData = selectedDays >= 9999 ? enrichedData : enrichedData.slice(-selectedDays);

        const labels = filteredData.map((item) => {
            const date = new Date(item.dt);
            const d = String(date.getDate()).padStart(2, "0");
            const m = String(date.getMonth() + 1).padStart(2, "0");
            const y = date.getFullYear();
            return selectedDays <= 30 ? `${d}/${m}` : `${d}/${m}/${y}`;
        });

        const chartDatasets = [
            {
                type: "line",
                label: t("goldChart.changeRate"),
                data: filteredData.map(item => item.calculatedChange),
                borderColor: "#39CF96",
                backgroundColor: "#39CF96",
                yAxisID: "y1",
                tension: 0.3,
                pointRadius: 2,
                order: 1
            },
            {
                type: "bar",
                label: t("goldChart.tableChange"),
                data: filteredData.map(item => Math.abs(item.calculatedChange) * 10),
                backgroundColor: filteredData.map(item => item.calculatedChange >= 0 ? "#39CF96" : "#E74C3C"),
                yAxisID: "y2",
                stack: "stack1",
                barThickness: "flex",
                order: 2
            },
            {
                type: "bar",
                label: t("goldChart.avgHolding"),
                data: filteredData.map(item => item.amount - (Math.abs(item.calculatedChange) * 10)),
                backgroundColor: "#FFF443",
                yAxisID: "y2",
                stack: "stack1",
                barThickness: "flex",
                order: 3
            }
        ];

        return { chartLabels: labels, datasets: chartDatasets, rawFilteredData: filteredData };
    }, [dataGoldTrust, selectedDays]);

    const handleTimeRangeChange = (param) => {
        const params = new URLSearchParams(location.search);
        params.set("duration", param);
        navigate(`${location.pathname}?${params.toString()}`, { replace: true });
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        scales: {
            y1: { position: "left", title: { display: true, text: `${t("goldChart.tableChange")} (${t("goldChart.unit")})`, color: "white" }, grid: { drawOnChartArea: false } },
            y2: { position: "right", title: { display: true, text: `${t("goldChart.avgHolding")} (${t("goldChart.unit")})`, color: "white" }, grid: { drawOnChartArea: false } }
        },
        plugins: {
            tooltip: {
                callbacks: {
                    title: (items) => {
                        const dt = rawFilteredData[items[0].dataIndex]?.dt;
                        return dt ? new Date(dt).toLocaleDateString("vi-VN") : "";
                    },
                    label: (context) => {
                        const rawItem = rawFilteredData[context.dataIndex];
                        const label = context.dataset.label;
                        if (label === t("goldChart.avgHolding")) {
                            return `${t("goldChart.avgHolding")}: ${rawItem.amount} ${t("goldChart.unit")} (${rawItem.calculatedChange >= 0 ? "+" : ""}${rawItem.calculatedChange.toFixed(2)})`;
                        }
                        if (label === t("goldChart.tableChange")) {
                            return `${t("goldChart.tableChange")}: ${Math.abs(rawItem.calculatedChange).toFixed(2)} ${t("goldChart.unit")}`;
                        }
                        return `${label}: ${context.raw}`;
                    }
                }
            }
        }
    };

    if (loading) return <div className="loading-container"><div className="spinner" /><p>{t("goldChart.loading")}</p></div>;
    if (!dataGoldTrust) return <div className="loading-container">{t("goldChart.error")}</div>;

    // TÍNH TOÁN THỐNG KÊ
    const latestHolding = rawFilteredData[rawFilteredData.length - 1]?.amount || 0;
    const getPrevHolding = (days) => rawFilteredData[rawFilteredData.length - 1 - days]?.amount;
    const calcPercent = (curr, prev) => (prev ? ((curr - prev) / prev) * 100 : null);

    const percentageChanges = {
        day1: calcPercent(latestHolding, getPrevHolding(1)),
        day2: calcPercent(latestHolding, getPrevHolding(2)),
        day3: calcPercent(latestHolding, getPrevHolding(3)),
        day4: calcPercent(latestHolding, getPrevHolding(4)),
        week1: calcPercent(latestHolding, getPrevHolding(7)),
    };

    const dailyBuySell = (() => {
        const latest = rawFilteredData[rawFilteredData.length - 1];
        const prev = rawFilteredData[rawFilteredData.length - 2];
        if (!latest || !prev) return null;
        const changeTon = latest.amount - prev.amount;
        const usdValue = (Math.abs(changeTon) / 31.1034768) * 1_000_000 * (latest.gold_price || 0);
        return { isBuy: changeTon > 0, isZero: changeTon === 0, valueBillionUSD: usdValue / 1_000_000_000 };
    })();

    return (
        <div>
            <div style={{ margin: "40px 0 20px", display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                <h4 style={{ fontSize: "1.8rem", fontWeight: 700, color: "#ffd700", textAlign: "center", margin: 0 }}>
                    {t("goldChart.title")}
                </h4>
                <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginBottom: "20px" }}>
                    <button
                        style={btnStyle(typeChart === 'bar')}
                        onClick={() => setTypeChart('bar')}>
                        <FaChartBar style={{ marginRight: "5px" }} /> {t("common.bar") || "Bar"}
                    </button>
                    <button
                        style={btnStyle(typeChart === 'line')}
                        onClick={() => setTypeChart('line')}>
                        <FaChartLine style={{ marginRight: "5px" }} /> {t("common.line") || "Line"}
                    </button>
                    <button
                        style={btnStyle(typeChart === 'table')}
                        onClick={() => setTypeChart('table')}>
                        <MdOutlineTableChart style={{ marginRight: "5px" }} /> {t("common.table") || "Table"}
                    </button>
                </div>
            </div>

            <div className="gc-main-box">
                <div className={`gc-split-layout ${typeChart === 'table' ? 'is-table-mode' : ''}`}>
                    <div className="gc-left-panel">
                        <div className="gc-toolbar">
                            <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", padding: "10px 0" }}>
                                {TIME_RANGES.map(range => (
                                    <button key={range.urlParam} onClick={() => handleTimeRangeChange(range.urlParam)}
                                        style={{ padding: "8px 15px", margin: "5px", borderRadius: "8px", border: "none", cursor: "pointer", background: activeRange.urlParam === range.urlParam ? "#FFF443" : "#494A50", color: activeRange.urlParam === range.urlParam ? "#000" : "#FFF", fontWeight: activeRange.urlParam === range.urlParam ? "bold" : "normal" }}>
                                        {t(`goldChart.${range.label}`)}
                                    </button>
                                ))}
                            </div>
                            <label className="gc-label">{t("goldChart.changeRate")}</label>
                            <div className="gc-percentage-bar">
                                {[{ key: "day1", label: "day1" }, { key: "day2", label: "day2" }, { key: "day3", label: "day3" }, { key: "day4", label: "day4" }, { key: "week1", label: "week1" }].map(({ key, label }) => (
                                    percentageChanges[key] != null && (
                                        <div key={key} className={`gc-percent-item ${percentageChanges[key] >= 0 ? "up" : "down"}`}>
                                            <span className="label">{t(`goldChart.${label}`)}</span>
                                            <span className="value">{percentageChanges[key] >= 0 ? "+" : ""}{percentageChanges[key].toFixed(2)}%</span>
                                        </div>
                                    )
                                ))}
                            </div>
                            <div className="gc-avg-box">
                                <label className="gc-label2">{t("goldChart.avgHolding")}</label>
                                <div className="gc-avg-value">{formatNumber(_.meanBy(rawFilteredData, 'amount').toFixed(2))} <span>{t("goldChart.unit")}</span></div>
                                <div className="gc-avg-sub">{t("goldChart.inRange")} {t(`goldChart.${activeRange.label}`)}</div>
                            </div>
                            <div className="gc-update-box">
                                <label className="gc-label2">{t("goldChart.lastUpdate")}</label>
                                <div className="gc-update-item">{rawFilteredData[rawFilteredData.length - 1]?.dt}</div>
                            </div>
                            {dailyBuySell && (
                                <div className="gc-avg-box">
                                    <label className="gc-label2">{dailyBuySell.isZero ? t("goldChart.noTrade") : dailyBuySell.isBuy ? t("goldChart.buyNet") : t("goldChart.sellNet")}</label>
                                    <div className="gc-avg-value" style={{ color: dailyBuySell.isZero ? "#B2B2B2" : dailyBuySell.isBuy ? "#39CF96" : "#E74C3C" }}>
                                        {dailyBuySell.isZero ? t("goldChart.noUsd") : `${dailyBuySell.isBuy ? "+" : "-"}${dailyBuySell.valueBillionUSD.toFixed(2)} ${t("goldChart.billionUsd")}`}
                                    </div>
                                    <div className="gc-avg-sub">{t("goldChart.changeNote")}</div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="gc-right-panel">
                        {typeChart === "bar" && <div style={{ height: "520px", padding: "20px" }}><Chart data={{ labels: chartLabels, datasets: datasets }} options={options} /></div>}
                        {typeChart === "line" && <div style={{ height: "520px", padding: "20px" }}><Chart data={{ labels: chartLabels, datasets: [datasets[0]] }} options={options} /></div>}
                        {typeChart === "table" && (
                            <div className="gc-table-container">
                                <table className="gc-custom-table">
                                    <thead>
                                        <tr>
                                            <th>{t("goldChart.tableDate")}</th>
                                            <th>{t("goldChart.tableQty")}</th>
                                            <th>{t("goldChart.tableChange")}</th>
                                            <th>{t("goldChart.tablePrice")}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[...rawFilteredData].reverse().map((item, idx) => (
                                            <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.03)" }}>
                                                <td style={{ textAlign: "left" }}>{item.dt}</td>
                                                <td>{formatNumber(item.amount)}</td>
                                                <td style={{ color: item.calculatedChange > 0 ? "#39CF96" : (item.calculatedChange < 0 ? "#E74C3C" : "#ccc") }}>
                                                    {item.calculatedChange > 0 ? "+" : ""}{item.calculatedChange.toFixed(2)}
                                                </td>
                                                <td>{formatNumber(item.gold_price)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default GoldChart;