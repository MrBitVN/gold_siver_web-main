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
import { Chart } from "react-chartjs-2";
import { useLocation, useNavigate } from "react-router-dom";
import zoomPlugin from "chartjs-plugin-zoom";
import annotationPlugin from "chartjs-plugin-annotation";
import _ from "lodash";
import { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import "./SilverChart.css";
import useRealTimeData from "../../hooks/useRealTimeData";
import { getXagUsd } from "../../utils/realTimeHelper";
import { saveToNotificationHistory } from "../tradingview/logger";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Tooltip,
    Legend,
    zoomPlugin,
    annotationPlugin
);

const TIME_RANGES = [
    { label: "day7", days: 7, urlParam: "7" },
    { label: "day30", days: 30, urlParam: "30" },
    { label: "day90", days: 90, urlParam: "90" },
    { label: "year1", days: 365, urlParam: "365" },
    { label: "all", days: 9999, urlParam: "all" }
];

const toMillion = (value, fraction = 2) => {
    if (value == null || isNaN(value)) return 0;
    return (Number(value) / 1_000_000).toFixed(fraction);
}

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

function SilverChart() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const [typeChart, setTypeChart] = useState('bar');
    const [dataSilverTrust, setDataSilverTrust] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState({ show: false, message: "", isStrong: false, fading: false });

    useEffect(() => {
        if (notification.show && notification.message) {
            // Lưu vào lịch sử với nội dung thông báo
            saveToNotificationHistory(notification.message, "SLV_CHART");
        }
    }, [notification.show]); // Chỉ chạy khi trạng thái hiển thị thông báo thay đổi
    // Quản lý trạng thái Hover và Responsive
    const [hoveredLabel, setHoveredLabel] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const searchParams = new URLSearchParams(location.search);
    const activeDurationParam = searchParams.get("duration") || "7";
    const activeRange = TIME_RANGES.find(r => r.urlParam === activeDurationParam) || TIME_RANGES[0];
    const selectedDays = activeRange.days;

    const { liveData } = useRealTimeData();

    const checkNotification = (dataDates) => {
        if (!dataDates || dataDates.length === 0) return;
        const sorted = [...dataDates].sort((a, b) => new Date(a.dt) - new Date(b.dt));
        const latestEntry = sorted[sorted.length - 1];
        const pIndex = latestEntry.chiso_sucmanh || 0;

        const isStrong = pIndex > 0;
        const message = isStrong
            ? t("silverChart.notificationStrong", { value: pIndex.toFixed(2) })
            : t("silverChart.notificationWeak", { value: pIndex.toFixed(2) });

        setNotification({ show: true, message, isStrong, fading: false });

        setTimeout(() => {
            setNotification(prev => ({ ...prev, fading: true }));
            setTimeout(() => {
                setNotification(prev => ({ ...prev, show: false }));
            }, 500);
        }, 4000);
    };

    const fetchData = async () => {
        try {
            const response = await fetch("https://api_gold.thinkdiff.us/iShares_Silver_Trust");
            const result = await response.json();
            if (result && result.data) {
                setDataSilverTrust(result.data);
                checkNotification(result.data.data.dates);
            }
        } catch (error) {
            console.error("Lỗi khi lấy dữ liệu bạc:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);


    const [xagUsd, setXagUsd] = useState(null);

    useEffect(() => {
        const ws = new WebSocket("wss://api-ui.hyperliquid.xyz/ws");

        ws.onopen = () => {
            console.log("Connected to Hyperliquid WS");

            ws.send(
                JSON.stringify({
                    method: "subscribe",
                    subscription: {
                        type: "trades",
                        coin: "@107", // bạc
                    },
                })
            );
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                // kiểm tra dữ liệu trade
                if (data.channel === "trades" && data.data?.length > 0) {
                    const latestTrade = data.data[0];

                    if (latestTrade?.px) {
                        setXagUsd(latestTrade.px); // giá mới nhất
                    }
                }
            } catch (err) {
                console.error("Parse error:", err);
            }
        };

        ws.onerror = (err) => {
            console.error("WebSocket error:", err);
        };

        ws.onclose = () => {
            console.log("WebSocket closed");
        };

        return () => {
            ws.close();
        };
    }, []);

    const { chartLabels, chartDataValues, rawDataFiltered } = useMemo(() => {
        if (!dataSilverTrust?.data?.dates) {
            return { chartLabels: [], chartDataValues: {}, rawDataFiltered: [] };
        }
        let rawDates = _.cloneDeep(dataSilverTrust.data.dates);
        rawDates.sort((a, b) => new Date(a.dt) - new Date(b.dt));
        const filteredDates = selectedDays >= 9999 ? rawDates : rawDates.slice(-selectedDays);

        const labels = [], holding = [], changeVal = [], totalVal = [], rsiVal = [], priceSilver = [], powerIndex = [];

        filteredDates.forEach((item, index) => {
            const date = new Date(item.dt);
            const d = String(date.getDate()).padStart(2, "0");
            const m = String(date.getMonth() + 1).padStart(2, "0");
            const y = date.getFullYear();
            labels.push(selectedDays <= 30 ? `${d}/${m}` : `${d}/${m}/${y}`);
            holding.push(item?.amount || 0);
            changeVal.push(item?.change || 0);
            rsiVal.push(item?.rsi || (index > 0 ? rsiVal[index - 1] : 0));
            totalVal.push(toMillion(item?.total_value_usd));
            priceSilver.push(item?.silver_price ?? (index > 0 ? priceSilver[index - 1] : null));
            powerIndex.push(item?.chiso_sucmanh || (index > 0 ? powerIndex[index - 1] : 0));
        });

        return {
            chartLabels: labels,
            chartDataValues: { holding, changeVal, totalVal, rsiVal, priceSilver, powerIndex },
            rawDataFiltered: filteredDates
        };
    }, [dataSilverTrust, selectedDays]);

    const annotations = useMemo(() => {
        if (!chartLabels.length) return {};
        const pData = chartDataValues.powerIndex;
        const totalPoints = pData.length;

        // Giảm mật độ nhãn trên mobile
        const step = isMobile
            ? Math.max(1, Math.floor(totalPoints / 5))
            : Math.max(1, Math.floor(totalPoints / 7));

        const items = {};

        pData.forEach((val, i) => {
            if (i === totalPoints - 1 || i % step === 0) {
                const isBuy = val <= 0;
                const labelId = `label${i}`;
                const isHovered = hoveredLabel === labelId;

                const dateEnd = chartLabels[i];
                const dateStart = i > 0 ? chartLabels[i - 1] : chartLabels[i];

                // Căn lề X cho mobile và desktop
                let xAdj = 0;
                if (i === 0) xAdj = isMobile ? 35 : 40;
                if (i === totalPoints - 1) xAdj = isMobile ? -35 : -40;

                // Logic lật nhãn Y dựa trên biên độ dữ liệu
                let finalYAdjust = isBuy ? -45 : 45;
                if (val > 1500) finalYAdjust = 50;
                if (val < -8000) finalYAdjust = -50;
                if (isMobile) finalYAdjust = isBuy ? -35 : 35; // Kéo nhãn gần line hơn trên mobile

                // 1. Đường kẻ dọc nối xuống trục
                items[`line${i}`] = {
                    type: 'line',
                    xMin: chartLabels[i],
                    xMax: chartLabels[i],
                    borderColor: isBuy ? 'rgba(50, 205, 50, 0.4)' : 'rgba(255, 68, 68, 0.4)',
                    borderWidth: isHovered ? (isMobile ? 2 : 3) : 1,
                    borderDash: [5, 5],
                    z: 5
                };

                // 2. Nội dung nhãn (Rút gọn tối đa cho mobile)
                const content = isMobile
                    ? [isBuy ? t("silverChart.buyTag") : t("silverChart.sellTag"), `${val.toFixed(0)}`]
                    : [isBuy ? t("silverChart.buyZone") : t("silverChart.sellZone"), `${val.toFixed(2)}`, t("silverChart.fromTo", { start: dateStart, end: dateEnd })];

                items[labelId] = {
                    type: 'label',
                    xValue: chartLabels[i],
                    yValue: val,
                    backgroundColor: isBuy
                        ? (isHovered ? 'rgba(50, 205, 50, 1)' : 'rgba(50, 205, 50, 0.8)')
                        : (isHovered ? 'rgba(255, 68, 68, 1)' : 'rgba(255, 68, 68, 0.8)'),
                    content: content,
                    color: '#fff',
                    font: {
                        size: isMobile ? (isHovered ? 9 : 8) : (isHovered ? 11 : 10),
                        weight: 'bold'
                    },
                    padding: isMobile ? 4 : 6,
                    borderRadius: 4,
                    position: 'center',
                    xAdjust: xAdj,
                    yAdjust: finalYAdjust,
                    z: 10,
                    enter: () => setHoveredLabel(labelId),
                    leave: () => setHoveredLabel(null)
                };
            }
        });

        return items;
    }, [chartLabels, chartDataValues.powerIndex, hoveredLabel, isMobile]);

    const handleTimeRangeChange = (param) => {
        const params = new URLSearchParams(location.search);
        params.set("duration", param);
        navigate(`${location.pathname}?${params.toString()}`, { replace: true });
    };

    const dataBar = {
        labels: chartLabels,
        datasets: [
            { type: "line", label: t("silverChart.change"), data: chartDataValues.changeVal, borderColor: "#ef0808", backgroundColor: "#ef0808", yAxisID: "y2", tension: 0.3, pointRadius: 2, order: 1 },
            { type: "bar", label: t("silverChart.holding"), data: chartDataValues.holding, backgroundColor: "#B2B2B2", yAxisID: "y1", barThickness: "flex", order: 3 },
            { type: "line", label: t("silverChart.silverPrice"), data: chartDataValues.priceSilver, borderColor: "#0c08ef", backgroundColor: "#0c08ef", yAxisID: "y2", tension: 0.3, pointRadius: 2, order: 2 },
        ]
    };

    const dataLineTotalVal = {
        labels: chartLabels,
        datasets: [{
            type: "line", label: t("silverChart.totalValue"), data: chartDataValues.totalVal, borderColor: "#4A8BC2", yAxisID: "yRight", tension: 0.3, pointRadius: 2, fill: true,
            backgroundColor: (context) => {
                const ctx = context.chart.ctx;
                const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                gradient.addColorStop(0, "rgba(74, 139, 194, 0.3)");
                gradient.addColorStop(1, "rgba(74, 139, 194, 0)");
                return gradient;
            }
        }]
    };

    const dataLineChange = {
        labels: chartLabels,
        datasets: [{ type: "line", label: t("silverChart.changeTon"), data: chartDataValues.changeVal, borderColor: "#FF4444", backgroundColor: "#FF4444", yAxisID: "yRight", tension: 0.3, pointRadius: 2, borderDash: [5, 5] }]
    };

    const dataLineHolding = {
        labels: chartLabels,
        datasets: [{
            type: "line", label: t("silverChart.holdingTon"), data: chartDataValues.holding, borderColor: "#1ecdf4", yAxisID: "yRight", tension: 0.3, pointRadius: 2, fill: true,
            backgroundColor: (context) => {
                const ctx = context.chart.ctx;
                const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                gradient.addColorStop(0, "rgba(14, 209, 253, 0.3)");
                gradient.addColorStop(1, "rgba(75, 135, 154, 0)");
                return gradient;
            }
        }]
    };

    const dataLineRSIVal = {
        labels: chartLabels,
        datasets: [
            { type: "line", label: t("silverChart.rsiIndex"), data: chartDataValues.rsiVal, borderColor: "#b80081", yAxisID: "yRight", tension: 0.3, pointRadius: 2, fill: false },
            {
                type: "line",
                label: t("silverChart.powerIndex"),
                data: chartDataValues.powerIndex,
                yAxisID: "yLeft",
                tension: 0.3,
                pointRadius: 2,
                fill: false,
                segment: {
                    borderColor: (ctx) => {
                        const val = (ctx.p0.parsed.y + ctx.p1.parsed.y) / 2;
                        return val > 0 ? "#FF4444" : "#32CD32";
                    }
                }
            }
        ]
    };

    const optionsBar = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        scales: {
            x: { ticks: { color: "gray" }, grid: { display: false }, stacked: true },
            y1: { position: "left", title: { display: true, text: t("silverChart.holdingUnit"), color: "#fff" }, grid: { drawOnChartArea: false } },
            y2: { position: "right", title: { display: true, text: t("silverChart.changePriceUnit"), color: "#fff" }, grid: { color: "#333" } }
        },
        plugins: {
            legend: { labels: { color: '#fff' } },
            zoom: {
                pan: { enabled: location.pathname.includes("quy-dau-tu"), mode: "x" },
                zoom: { wheel: { enabled: location.pathname.includes("quy-dau-tu") }, pinch: { enabled: location.pathname.includes("quy-dau-tu") }, mode: "x" }
            }
        }
    };

    const getSingleLineOption = (title, yAxisID, position = "left", showAnnotation = false) => ({
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        scales: {
            x: { ticks: { color: "gray" }, grid: { display: false } },
            [yAxisID]: { position: position, title: { display: true, text: title, color: "#fff" }, grid: { color: "#333" } }
        },
        plugins: {
            legend: { labels: { color: '#fff' } },
            tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${formatNumber(ctx.parsed.y)}` } },
            annotation: showAnnotation ? { annotations } : undefined,
            zoom: {
                pan: { enabled: location.pathname.includes("quy-dau-tu"), mode: "x" },
                zoom: { wheel: { enabled: location.pathname.includes("quy-dau-tu") }, pinch: { enabled: location.pathname.includes("quy-dau-tu") }, mode: "x" }
            }
        }
    });

    if (loading || !dataSilverTrust) return <div className="loading-container"><div className="spinner" /><p>{t("silverChart.loading")}</p></div>;

    const latestHolding = chartDataValues.holding[chartDataValues.holding.length - 1];
    const averageHolding = _.mean(chartDataValues.holding);
    const latestUpdateDate = chartLabels[chartLabels.length - 1];

    const calcPercentChange = (current, previous) => (previous == null || previous === 0) ? null : ((current - previous) / previous) * 100;
    const percentageChanges = {
        day1: calcPercentChange(latestHolding, chartDataValues.holding[chartDataValues.holding.length - 2]),
        day2: calcPercentChange(latestHolding, chartDataValues.holding[chartDataValues.holding.length - 3]),
        day3: calcPercentChange(latestHolding, chartDataValues.holding[chartDataValues.holding.length - 4]),
        day4: calcPercentChange(latestHolding, chartDataValues.holding[chartDataValues.holding.length - 5]),
        week1: calcPercentChange(latestHolding, chartDataValues.holding[chartDataValues.holding.length - 8]),
    };

    const dailyBuySellUSD = (() => {
        console.log("Gia trị :", xagUsd)
        if (!xagUsd) return null;
        const lastIndex = chartDataValues.changeVal.length - 1;
        const changeTon = chartDataValues.changeVal[lastIndex];
        const usdValue = (Math.abs(changeTon) * 1_000_000 / 31.1034768) * xagUsd;
        return { isBuy: changeTon > 0, isZero: changeTon === 0, valueBillionUSD: usdValue / 1_000_000_000 };
    })();

    return (
        <div style={{ position: 'relative' }}>
            {notification.show && (
                <div style={{
                    position: 'fixed',
                    top: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 9999,
                    backgroundColor: 'rgba(20, 20, 20, 0.65)',
                    backdropFilter: 'blur(6px)',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: `1px solid ${notification.isStrong ? 'rgba(255, 68, 68, 0.5)' : 'rgba(50, 205, 50, 0.5)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    opacity: notification.fading ? 0 : 1,
                    transition: 'opacity 0.5s ease-in-out',
                    pointerEvents: notification.fading ? 'none' : 'auto'
                }}>
                    <span style={{ color: notification.isStrong ? '#FF6666' : '#66FF66', fontWeight: '500', fontSize: '0.85rem' }}>
                        {notification.message}
                    </span>
                    <button onClick={() => setNotification({ ...notification, show: false })} style={{ background: 'none', border: 'none', color: '#ffffff88', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1, paddingBottom: '2px' }}>×</button>
                </div>
            )}

            <div style={{ margin: "40px 0 20px", display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                <h4 style={{ fontSize: "1.8rem", fontWeight: 700, color: "#B2B2B2", textAlign: "center", margin: 0 }}>
                    {t("silverChart.title")}
                </h4>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={btnStyle(typeChart === 'bar')} onClick={() => setTypeChart('bar')}><FaChartBar size={'1.25rem'} /></span>
                    <span style={btnStyle(typeChart === 'line')} onClick={() => setTypeChart('line')}><FaChartLine size={'1.25rem'} /></span>
                    <span style={btnStyle(typeChart === 'table')} onClick={() => setTypeChart('table')}><MdOutlineTableChart size={'1.25rem'} /></span>
                </div>
            </div>

            <div className="sc-main-box">
                <div className={`sc-split-layout ${typeChart === 'table' ? 'is-table-mode' : ''}`}>
                    <div className="sc-left-panel">
                        <div className="sc-toolbar">
                            <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", padding: "10px 0" }}>
                                {TIME_RANGES.map(range => (
                                    <button key={range.urlParam} onClick={() => handleTimeRangeChange(range.urlParam)}
                                        style={{ padding: "8px 15px", margin: "5px", borderRadius: "8px", border: "none", cursor: "pointer", background: activeRange.urlParam === range.urlParam ? "#FFF443" : "#494A50", color: activeRange.urlParam === range.urlParam ? "#000" : "#FFF", fontWeight: activeRange.urlParam === range.urlParam ? "bold" : "normal" }}>
                                        {t(`silverChart.${range.label}`)}
                                    </button>
                                ))}
                            </div>
                            <label className="sc-label">{t("silverChart.changeRate")}</label>
                            <div className="sc-percentage-bar">
                                {["day1", "day2", "day3", "day4", "week1"].map((key) => (
                                    percentageChanges[key] != null && (
                                        <div key={key} className={`sc-percent-item ${percentageChanges[key] >= 0 ? "up" : "down"}`}>
                                            <span className="label">{t("silverChart.in")} {t(`silverChart.${key}`)}</span>
                                            <span className="value">{percentageChanges[key] >= 0 ? "+" : ""}{percentageChanges[key].toFixed(2)}%</span>
                                        </div>
                                    )
                                ))}
                            </div>
                            <div className="sc-avg-box">
                                <label className="sc-label2">{t("silverChart.avgHolding")}</label>
                                <div className="sc-avg-value">{formatNumber(averageHolding.toFixed(2))} <span>{t("silverChart.unit")}</span></div>
                                <div className="sc-avg-sub">{t("silverChart.inRange")} {t(`silverChart.${activeRange.label}`)}</div>
                            </div>
                            <div className="sc-update-box">
                                <label className="sc-label2">{t("silverChart.lastUpdate")}</label>
                                <div className="sc-update-item">{latestUpdateDate}</div>
                            </div>
                            {dailyBuySellUSD && !dailyBuySellUSD.isError ? ( // thêm kiểm tra lỗi
                                <div className="sc-avg-box">
                                    <label className="sc-label2">
                                        {dailyBuySellUSD.isZero
                                            ? t("silverChart.noTrade")
                                            : dailyBuySellUSD.isBuy
                                                ? t("silverChart.buyNet")
                                                : t("silverChart.sellNet")}
                                    </label>
                                    <div
                                        className="sc-avg-value"
                                        style={{ color: dailyBuySellUSD.isZero ? "#B2B2B2" : dailyBuySellUSD.isBuy ? "#32CD32" : "#FF4444" }}
                                    >
                                        {dailyBuySellUSD.isZero
                                            ? t("silverChart.noUsd")
                                            : `${dailyBuySellUSD.isBuy ? "+" : "-"}${dailyBuySellUSD.valueBillionUSD.toFixed(2)} ${t("silverChart.billionUsd")}`}
                                    </div>
                                    <div className="sc-avg-sub">{t("silverChart.changeNote")}</div>
                                </div>
                            ) : (
                                <div className="sc-avg-box">
                                    <label className="sc-label2">{t("silverChart.noData")}</label>
                                    <div className="sc-avg-value" style={{ color: "#B2B2B2" }}>
                                        {t("silverChart.noData")}
                                    </div>
                                    <div className="sc-avg-sub">{t("silverChart.changeNote")}</div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="sc-right-panel">
                        {typeChart === "bar" && <div style={{ height: "500px", padding: "20px" }}><Chart data={dataBar} options={optionsBar} /></div>}
                        {typeChart === "line" && (
                            <>
                                <div style={{ height: "300px", padding: "20px" }}><Chart data={dataLineHolding} options={getSingleLineOption(t("silverChart.holdingTon"), "yRight", "right")} /></div>
                                <div style={{ height: "300px", padding: "20px" }}><Chart data={dataLineTotalVal} options={getSingleLineOption(t("silverChart.totalValue"), "yRight", "right")} /></div>
                                <div style={{ height: "300px", padding: "20px" }}><Chart data={dataLineChange} options={getSingleLineOption(t("silverChart.changeTon"), "yRight", "right")} /></div>
                            </>
                        )}
                        {typeChart === "table" && (
                            <div className="sc-table-container">
                                <table className="sc-custom-table">
                                    <thead>
                                        <tr>
                                            <th>{t("silverChart.tableDate")}</th>
                                            <th>{t("silverChart.tableQty")}</th>
                                            <th>{t("silverChart.tableChange")}</th>
                                            <th>{t("silverChart.tableValue")}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[...rawDataFiltered].reverse().map((item, idx) => {
                                            const realIndex = rawDataFiltered.length - 1 - idx;
                                            const change = chartDataValues.changeVal[realIndex];
                                            return (
                                                <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.03)" }}>
                                                    <td style={{ textAlign: "left" }}>{chartLabels[realIndex]}</td>
                                                    <td>{formatNumber(item.amount)}</td>
                                                    <td style={{ color: change > 0 ? "#32CD32" : (change < 0 ? "#FF4444" : "#ccc") }}>{change > 0 ? "+" : ""}{formatNumber(change)}</td>
                                                    <td>{chartDataValues.totalVal[realIndex]}</td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
                <div style={{ height: "300px", marginBottom: "30px", padding: "20px" }}>
                    <Chart data={dataLineRSIVal} options={getSingleLineOption(t("silverChart.rsiPowerTitle"), "yLeft", "left", true)} />
                </div>
            </div>
        </div>
    );
}

export default SilverChart;