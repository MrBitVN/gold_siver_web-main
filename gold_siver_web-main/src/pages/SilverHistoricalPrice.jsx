import React, { useEffect, useState, useMemo } from "react";
import Highcharts from "highcharts/highstock";
import HighchartsReact from "highcharts-react-official";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import MarketAnalysis from "../components/report-comex/MarketAnalysis";
import { safeJsonFetch } from "../utils/apiHelper";


const SilverHistoricalPrice = () => {
    const { t, i18n } = useTranslation();
    const [ohlc, setOhlc] = useState([]);
    const [lineData, setLineData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [ma50Data, setMa50Data] = useState([]);
    const [ma100Data, setMa100Data] = useState([]);
    const [ma150Data, setMa150Data] = useState([]);
    const [ma200Data, setMa200Data] = useState([]);
    const [ma6Data, setMa6Data] = useState([]);
    const [ma10Data, setMa10Data] = useState([]);
    const [ma20Data, setMa20Data] = useState([]);
    const [chartType, setChartType] = useState("area");
    const [showCandlestickOverlay, setShowCandlestickOverlay] = useState(true);
    const [showMA50, setShowMA50] = useState(true);
    const [showMA100, setShowMA100] = useState(true);
    const [showMA150, setShowMA150] = useState(true);
    const [showMA200, setShowMA200] = useState(true);
    const [showMA6, setShowMA6] = useState(true);
    const [showMA10, setShowMA10] = useState(true);
    const [showMA20, setShowMA20] = useState(true);
    const [marketData, setMarketData] = useState(null);

    useEffect(() => {
        setLoading(true);
        setError(null);

        const fetchData = async () => {
            try {
                // Fetch Chart Data
                const chartJson = await safeJsonFetch("https://api_gold.thinkdiff.us/xag_duong_trung_binh");

                // Fetch Market Analysis
                const analysisJson = await safeJsonFetch("https://api_gold.thinkdiff.us/phantich_silver_history");


                if (analysisJson && analysisJson.market) {
                    setMarketData(analysisJson.market);
                }

                const items = chartJson.data?._embedded?.items || [];

                if (items.length === 0) {
                    setError("No data available");
                    setLoading(false);
                    return;
                }

                const ohlcTemp = [];
                const lineTemp = [];
                const ma50Temp = [];
                const ma100Temp = [];
                const ma150Temp = [];
                const ma200Temp = [];
                const ma6Temp = [];
                const ma10Temp = [];
                const ma20Temp = [];
                const closePrices = []; // Lưu tất cả giá close để tính MA100, MA150

                items.forEach((item) => {
                    const time = new Date(item.date).getTime();
                    const closePrice = item.close;

                    ohlcTemp.push([time, item.open, item.high, item.low, item.close]);

                    lineTemp.push({
                        x: time,
                        y: item.close,
                        open: item.open,
                        high: item.high,
                        low: item.low,
                        close: item.close,
                    });

                    closePrices.push(closePrice);

                    // Tính MA6, MA10, MA20
                    if (closePrices.length >= 6) {
                        const ma6Values = closePrices.slice(-6);
                        const ma6 = ma6Values.reduce((sum, price) => sum + price, 0) / 6;
                        ma6Temp.push([time, ma6]);
                    }
                    if (closePrices.length >= 10) {
                        const ma10Values = closePrices.slice(-10);
                        const ma10 = ma10Values.reduce((sum, price) => sum + price, 0) / 10;
                        ma10Temp.push([time, ma10]);
                    }
                    if (closePrices.length >= 20) {
                        const ma20Values = closePrices.slice(-20);
                        const ma20 = ma20Values.reduce((sum, price) => sum + price, 0) / 20;
                        ma20Temp.push([time, ma20]);
                    }

                    // Tính MA100: Trung bình của 100 giá close gần nhất
                    if (closePrices.length >= 100) {
                        const ma100Values = closePrices.slice(-100);
                        const ma100 = ma100Values.reduce((sum, price) => sum + price, 0) / 100;
                        ma100Temp.push([time, ma100]);
                    }

                    // Tính MA150: Trung bình của 150 giá close gần nhất
                    if (closePrices.length >= 150) {
                        const ma150Values = closePrices.slice(-150);
                        const ma150 = ma150Values.reduce((sum, price) => sum + price, 0) / 150;
                        ma150Temp.push([time, ma150]);
                    }

                    // Thêm MA50 và MA200 (chỉ khi có giá trị)
                    if (item.ma50 != null) {
                        ma50Temp.push([time, item.ma50]);
                    }
                    if (item.ma200 != null) {
                        ma200Temp.push([time, item.ma200]);
                    }
                });

                setOhlc(ohlcTemp);
                setLineData(lineTemp);
                setMa50Data(ma50Temp);
                setMa100Data(ma100Temp);
                setMa150Data(ma150Temp);
                setMa200Data(ma200Temp);
                setMa6Data(ma6Temp);
                setMa10Data(ma10Temp);
                setMa20Data(ma20Temp);
                setLoading(false);
            } catch (err) {
                console.error("Fetch data error:", err);
                setError("Failed to load data");
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const options = useMemo(() => {
        if (!ohlc.length) return null;

        Highcharts.setOptions({
            time: { useUTC: false },
        });

        // Series chính (giá XAG)
        const baseSeries = chartType === "candlestick"
            ? {
                type: "candlestick",
                name: "XAG",
                data: ohlc,
            }
            : {
                type: chartType,
                name: "XAG",
                data: lineData,
                color: "rgb(240, 215, 165)",
                fillOpacity: chartType === "area" ? 0.3 : 0,
                lineWidth: 2,
                threshold: null,
                marker: {
                    enabled: true,
                    radius: 2,
                    states: { hover: { radius: 4 } },
                },
            };

        // Các series bổ sung (MA50, MA200, MA150, overlay)
        const extraSeries = [];

        // Thêm MA chỉ ở chế độ Area và Line (không Candlestick)
        if (chartType !== "candlestick") {
            if (ma6Data.length > 0 && showMA6) {
                extraSeries.push({
                    type: "line",
                    name: "MA6",
                    data: ma6Data,
                    color: "#a6e22e",
                    lineWidth: 1.5,
                    marker: { enabled: false },
                    zIndex: 6,
                });
            }
            if (ma10Data.length > 0 && showMA10) {
                extraSeries.push({
                    type: "line",
                    name: "MA10",
                    data: ma10Data,
                    color: "#66ccff",
                    lineWidth: 1.5,
                    marker: { enabled: false },
                    zIndex: 5.8,
                });
            }
            if (ma20Data.length > 0 && showMA20) {
                extraSeries.push({
                    type: "line",
                    name: "MA20",
                    data: ma20Data,
                    color: "#ff66cc",
                    lineWidth: 1.5,
                    marker: { enabled: false },
                    zIndex: 5.5,
                });
            }
            if (ma50Data.length > 0 && showMA50) {
                extraSeries.push({
                    type: "line",
                    name: "MA50",
                    data: ma50Data,
                    color: "#ffcc00",
                    lineWidth: 2,
                    marker: { enabled: false },
                    zIndex: 5,
                });
            }
            if (ma100Data.length > 0 && showMA100) {
                extraSeries.push({
                    type: "line",
                    name: "MA100",
                    data: ma100Data,
                    color: "#ff1493",
                    lineWidth: 2,
                    marker: { enabled: false },
                    zIndex: 4.8,
                });
            }
            if (ma150Data.length > 0 && showMA150) {
                extraSeries.push({
                    type: "line",
                    name: "MA150",
                    data: ma150Data,
                    color: "#00d4ff",
                    lineWidth: 2,
                    marker: { enabled: false },
                    zIndex: 4.5,
                });
            }
            if (ma200Data.length > 0 && showMA200) {
                extraSeries.push({
                    type: "line",
                    name: "MA200",
                    data: ma200Data,
                    color: "#ff6600",
                    lineWidth: 2.5,
                    marker: { enabled: false },
                    zIndex: 4,
                });
            }
        }

        return {
            chart: {
                backgroundColor: "#000",
                height: 600,
                marginRight: 80,
            },

            rangeSelector: {
                selected: 3,
                inputEnabled: false,
                buttons: [
                    { type: "day", count: 1, text: "1D" },
                    { type: "day", count: 5, text: "5D" },
                    { type: "day", count: 30, text: "1M" },
                    { type: "day", count: 180, text: "6M" },
                    { type: "day", count: 365, text: "1Y" },
                    { type: "day", count: 1825, text: "5Y" },
                    { type: "all", text: "All" },
                ],
                buttonTheme: {
                    fill: "#111",
                    stroke: "#333",
                    style: { color: "#999" },
                    states: {
                        select: {
                            fill: "#00b060",
                            stroke: "#00ff80",
                            style: { color: "#fff" },
                        },
                    },
                },
            },

            title: {
                text: t("SilverHistoricalPrice.title"),
                style: { color: "#fff" },
            },

            xAxis: {
                crosshair: {
                    width: 1,
                    color: "#888",
                    dashStyle: "Dash",
                    snap: true,
                },
                gridLineColor: "#111",
                lineColor: "#333",
                labels: { enabled: false },
            },

            yAxis: {
                title: { text: t("SilverHistoricalPrice.price"), style: { color: "#00ff80" } },
                opposite: true,
                offset: 40,
                labels: { style: { color: "#00ff80" } },
                gridLineColor: "#222",
                min: null,
                startOnTick: false,
                endOnTick: false,
                crosshair: {
                    width: 1,
                    color: "#888",
                    dashStyle: "Dash",
                    snap: false,
                },
            },

            tooltip: {
                shared: true,
                crosshairs: true,
                followPointer: true,
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                borderColor: "none",
                borderRadius: 5,
                style: { color: "#fff" },
                // Giữ nguyên formatter cũ của bạn, hoặc nâng cấp như bên dưới nếu muốn hiển thị MA
                formatter: function () {
                    const date = Highcharts.dateFormat("%d/%m/%Y", this.x);

                    let html = `<b>${date}</b><br/>`;

                    const candle = this.points?.find(p => p.series.type === "candlestick");
                    const mainPoint = candle ? candle.point : this.points?.[0]?.point;

                    if (candle) {
                        html += `
  <div>${t("SilverHistoricalPrice.tooltip.open")} :</div> ${candle.point.open.toFixed(2)}<br/>
  <div>${t("SilverHistoricalPrice.tooltip.high")} :</div> ${candle.point.high.toFixed(2)}<br/>
  <div>${t("SilverHistoricalPrice.tooltip.low")} :</div> ${candle.point.low.toFixed(2)}<br/>
  <div>${t("SilverHistoricalPrice.tooltip.close")} :</div> ${candle.point.close.toFixed(2)}<br/>
                    `;
                    } else if (mainPoint) {
                        html += `
                        <div style="color:#02f2c2; font-weight:bold;">Close :</div> <span style="color:#ffd700;">${mainPoint.y.toFixed(2)}</span><br/>
                    `;
                    }

                    // Thêm MA vào tooltip (nếu có)
                    const ma6Point = this.points?.find(p => p.series.name === "MA6");
                    const ma10Point = this.points?.find(p => p.series.name === "MA10");
                    const ma20Point = this.points?.find(p => p.series.name === "MA20");
                    const ma50Point = this.points?.find(p => p.series.name === "MA50");
                    const ma100Point = this.points?.find(p => p.series.name === "MA100");
                    const ma150Point = this.points?.find(p => p.series.name === "MA150");
                    const ma200Point = this.points?.find(p => p.series.name === "MA200");

                    if (ma6Point) {
                        html += `<div style="color:#a6e22e; font-weight:bold;">MA6 :</div> <span style="color:#ffd700;">${ma6Point.y.toFixed(2)}</span><br/>`;
                    }
                    if (ma10Point) {
                        html += `<div style="color:#66ccff; font-weight:bold;">MA10 :</div> <span style="color:#ffd700;">${ma10Point.y.toFixed(2)}</span><br/>`;
                    }
                    if (ma20Point) {
                        html += `<div style="color:#ff66cc; font-weight:bold;">MA20 :</div> <span style="color:#ffd700;">${ma20Point.y.toFixed(2)}</span><br/>`;
                    }
                    if (ma50Point) {
                        html += `<div style="color:#ffcc00; font-weight:bold;">MA50 :</div> <span style="color:#ffd700;">${ma50Point.y.toFixed(2)}</span><br/>`;
                    }
                    if (ma100Point) {
                        html += `<div style="color:#ff1493; font-weight:bold;">MA100 :</div> <span style="color:#ffd700;">${ma100Point.y.toFixed(2)}</span><br/>`;
                    }
                    if (ma150Point) {
                        html += `<div style="color:#00d4ff; font-weight:bold;">MA150 :</div> <span style="color:#ffd700;">${ma150Point.y.toFixed(2)}</span><br/>`;
                    }
                    if (ma200Point) {
                        html += `<div style="color:#ff6600; font-weight:bold;">MA200 :</div> <span style="color:#ffd700;">${ma200Point.y.toFixed(2)}</span><br/>`;
                    }

                    return html;
                },
            },

            plotOptions: {
                candlestick: {
                    color: "#ff4648",
                    upColor: "#00b060",
                    lineColor: "#ff4648",
                    upLineColor: "#00b060",
                },
            },

            series: [
                baseSeries,
                ...extraSeries,  // ← Đây là chỗ thêm MA50 & MA200
                ...((chartType === "area" || chartType === "line") && showCandlestickOverlay ? [{
                    type: "candlestick",
                    name: "Candlestick Overlay",
                    data: ohlc,
                    zIndex: 10,
                }] : []),
            ],

            credits: { enabled: false },
        };
    }, [ohlc, lineData, ma50Data, ma100Data, ma150Data, ma200Data, ma6Data, ma10Data, ma20Data, chartType, showCandlestickOverlay, showMA50, showMA100, showMA150, showMA200, showMA6, showMA10, showMA20, i18n.language]);

    if (loading) {
        return (
            <div style={{ background: "#000", padding: "20px", color: "#fff", textAlign: "center" }}>
                {t("SilverHistoricalPrice.loading")}
            </div>
        );
    }

    if (error || !options) {
        return (
            <div style={{ background: "#000", padding: "20px", color: "#ff4648", textAlign: "center" }}>
                {t("SilverHistoricalPrice.error")}: {error || t("SilverHistoricalPrice.no_data")}
            </div>
        );
    }

    // Tính toán tăng trưởng từ lineData
    const calculateGrowth = (data) => {
        if (!data || data.length < 2) return {};

        const currentPrice = data[data.length - 1].y;
        const getDateDaysAgo = (days) => {
            const now = data[data.length - 1].x;
            const targetTime = now - (days * 24 * 60 * 60 * 1000);

            let closest = data[0];
            let minDiff = Infinity;

            data.forEach(d => {
                const diff = Math.abs(d.x - targetTime);
                if (diff < minDiff) {
                    minDiff = diff;
                    closest = d;
                }
            });

            return closest;
        };

        const timePeriods = [
            { label: "1D", days: 1 },
            { label: "2D", days: 2 },
            { label: "3D", days: 3 },
            { label: "1W", days: 7 },
            { label: "2W", days: 14 },
            { label: "3W", days: 21 },
            { label: "1M", days: 30 },
            { label: "2M", days: 60 },
            { label: "3M", days: 90 },
            { label: "6M", days: 180 },
            { label: "1Y", days: 365 },
        ];

        const growth = {};
        timePeriods.forEach(period => {
            const pastData = getDateDaysAgo(period.days);
            const pastPrice = pastData.y;
            const rate = ((currentPrice - pastPrice) / pastPrice) * 100;
            growth[period.label] = rate;
        });

        return growth;
    };

    const growthData = calculateGrowth(lineData);

    const GrowthBox = ({ label, rate }) => {
        const isPositive = rate >= 0;
        return (
            <div className={`growth-box ${isPositive ? 'positive' : 'negative'}`} style={{
                flex: "1 1 auto",
                minWidth: "80px",
                padding: "12px 8px",
                backgroundColor: isPositive ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                border: `1px solid ${isPositive ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)"}`,
                borderRadius: "12px",
                textAlign: "center",
                transition: "all 0.2s ease",
            }}>
                <div style={{ fontSize: "10px", color: "#64748b", fontWeight: "800", textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {label}
                </div>
                <div style={{
                    fontSize: "14px",
                    fontWeight: "800",
                    color: isPositive ? "#10b981" : "#ef4444",
                    marginTop: "4px",
                    fontFamily: "'JetBrains Mono', monospace"
                }}>
                    {isPositive ? "+" : ""}{rate.toFixed(2)}%
                </div>
            </div>
        );
    };

    return (
        <div style={{ background: "#000", padding: "10px", marginRight: "20px" }}>
            {/* Growth Stats */}
            <div style={{
                marginBottom: "20px",
                padding: "16px",
                backgroundColor: "rgba(15, 23, 42, 0.4)",
                borderRadius: "16px",
                border: "1px solid rgba(255, 255, 255, 0.05)",
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                backdropFilter: 'blur(8px)'
            }}>
                {Object.entries(growthData).map(([label, rate]) => (
                    <GrowthBox key={label} label={label} rate={rate} />
                ))}
            </div>

            {/* Market Analysis Section */}
            {marketData && (
                <div style={{ marginBottom: "25px" }}>
                    <MarketAnalysis data={marketData} />
                </div>
            )}

            {/* Chart Type Buttons */}
            <div style={{ marginBottom: "15px", display: "flex", gap: "8px" }}>
                <button
                    onClick={() => setChartType("candlestick")}
                    style={{
                        padding: "8px 16px",
                        backgroundColor:
                            chartType === "candlestick" ? "#00b060" : "#111",
                        color: chartType === "candlestick" ? "#fff" : "#999",
                        border: "1px solid #333",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontWeight: chartType === "candlestick" ? "bold" : "normal",
                        transition: "all 0.3s",
                    }}
                >
                    Candlestick
                </button>

                <button
                    onClick={() => setChartType("area")}
                    style={{
                        padding: "8px 16px",
                        backgroundColor: chartType === "area" ? "#00b060" : "#111",
                        color: chartType === "area" ? "#fff" : "#999",
                        border: "1px solid #333",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontWeight: chartType === "area" ? "bold" : "normal",
                        transition: "all 0.3s",
                    }}
                >
                    Area
                </button>

                <button
                    onClick={() => setChartType("line")}
                    style={{
                        padding: "8px 16px",
                        backgroundColor: chartType === "line" ? "#00b060" : "#111",
                        color: chartType === "line" ? "#fff" : "#999",
                        border: "1px solid #333",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontWeight: chartType === "line" ? "bold" : "normal",
                        transition: "all 0.3s",
                    }}
                >
                    Line
                </button>

                {(chartType === "area" || chartType === "line") && (
                    <button
                        onClick={() => setShowCandlestickOverlay((prev) => !prev)}
                        style={{
                            padding: "8px 16px",
                            backgroundColor: showCandlestickOverlay ? "#ff6b35" : "#111",
                            color: showCandlestickOverlay ? "#fff" : "#999",
                            border: "1px solid #333",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontWeight: showCandlestickOverlay ? "bold" : "normal",
                            transition: "all 0.3s",
                            marginLeft: "12px",
                        }}
                    >
                        {showCandlestickOverlay ? "✓ Candlestick" : "Candlestick Overlay"}
                    </button>
                )}
            </div>

            {/* MA50 & MA200 Toggle Buttons - Chỉ hiển thị ở Area và Line */}
            {chartType !== "candlestick" && (
                <div style={{ marginBottom: "15px", display: "flex", gap: "8px" }}>
                    <button
                        onClick={() => setShowMA6((prev) => !prev)}
                        style={{
                            padding: "8px 16px",
                            backgroundColor: showMA6 ? "#a6e22e" : "#111",
                            color: showMA6 ? "#000" : "#999",
                            border: "1px solid #333",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontWeight: showMA6 ? "bold" : "normal",
                            transition: "all 0.3s",
                        }}
                    >
                        {showMA6 ? "✓ MA6" : "MA6"}
                    </button>

                    <button
                        onClick={() => setShowMA10((prev) => !prev)}
                        style={{
                            padding: "8px 16px",
                            backgroundColor: showMA10 ? "#66ccff" : "#111",
                            color: showMA10 ? "#000" : "#999",
                            border: "1px solid #333",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontWeight: showMA10 ? "bold" : "normal",
                            transition: "all 0.3s",
                        }}
                    >
                        {showMA10 ? "✓ MA10" : "MA10"}
                    </button>

                    <button
                        onClick={() => setShowMA20((prev) => !prev)}
                        style={{
                            padding: "8px 16px",
                            backgroundColor: showMA20 ? "#ff66cc" : "#111",
                            color: showMA20 ? "#000" : "#999",
                            border: "1px solid #333",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontWeight: showMA20 ? "bold" : "normal",
                            transition: "all 0.3s",
                        }}
                    >
                        {showMA20 ? "✓ MA20" : "MA20"}
                    </button>
                    <button
                        onClick={() => setShowMA50((prev) => !prev)}
                        style={{
                            padding: "8px 16px",
                            backgroundColor: showMA50 ? "#ffcc00" : "#111",
                            color: showMA50 ? "#000" : "#999",
                            border: "1px solid #333",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontWeight: showMA50 ? "bold" : "normal",
                            transition: "all 0.3s",
                        }}
                    >
                        {showMA50 ? "✓ MA50" : "MA50"}
                    </button>

                    <button
                        onClick={() => setShowMA100((prev) => !prev)}
                        style={{
                            padding: "8px 16px",
                            backgroundColor: showMA100 ? "#ff1493" : "#111",
                            color: showMA100 ? "#fff" : "#999",
                            border: "1px solid #333",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontWeight: showMA100 ? "bold" : "normal",
                            transition: "all 0.3s",
                        }}
                    >
                        {showMA100 ? "✓ MA100" : "MA100"}
                    </button>

                    <button
                        onClick={() => setShowMA150((prev) => !prev)}
                        style={{
                            padding: "8px 16px",
                            backgroundColor: showMA150 ? "#00d4ff" : "#111",
                            color: showMA150 ? "#000" : "#999",
                            border: "1px solid #333",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontWeight: showMA150 ? "bold" : "normal",
                            transition: "all 0.3s",
                        }}
                    >
                        {showMA150 ? "✓ MA150" : "MA150"}
                    </button>

                    <button
                        onClick={() => setShowMA200((prev) => !prev)}
                        style={{
                            padding: "8px 16px",
                            backgroundColor: showMA200 ? "#ff6600" : "#111",
                            color: showMA200 ? "#fff" : "#999",
                            border: "1px solid #333",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontWeight: showMA200 ? "bold" : "normal",
                            transition: "all 0.3s",
                        }}
                    >
                        {showMA200 ? "✓ MA200" : "MA200"}
                    </button>
                </div>
            )}

            {options && (
                <HighchartsReact
                    highcharts={Highcharts}
                    constructorType={"stockChart"}
                    options={options}
                />
            )}
        </div>
    );
};

export default SilverHistoricalPrice;
