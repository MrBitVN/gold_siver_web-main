import React, { useEffect, useRef, useState } from "react";
import {
    createChart,
    ColorType,
    LineSeries
} from "lightweight-charts";
import { color } from "highcharts";
const StatCard = ({ title, value, date, changeValue, changePercent, label }) => {

    const color =
        changeValue > 0 ? "#00ff80" :
            changeValue < 0 ? "#ff4d4d" : "#999";
    const arrow =
        changeValue > 0 ? "↗" :
            changeValue < 0 ? "↘" : "";
    return (
        <div style={{
            background: "#0a0a0a",
            border: "1px solid #222",
            padding: "15px",
            borderRadius: "6px"
        }}>

            <div style={{ color: "#aaa", fontSize: "12px" }}>
                {title}
            </div>

            <div style={{
                color: "#fff",
                fontSize: "20px",
                fontWeight: "700",
                marginTop: "6px"
            }}>
                {value}
            </div>

            {date && (
                <div style={{ fontSize: "11px", color: "#777" }}>
                    {date}
                </div>
            )}

            {changeValue !== undefined && (
                <>
                    <div style={{ color, fontSize: "12px", fontWeight: "600" }}>
                        {arrow} {changeValue > 0 ? "+" : ""}
                        {(changeValue / 1e6).toFixed(2)}M oz
                    </div>

                    {changePercent !== undefined && (
                        <div style={{ color, fontSize: "11px" }}>
                            {arrow} {changePercent > 0 ? "+" : ""}
                            {changePercent.toFixed(2)}% {label}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
const formatDate = (date) => {
    let d;

    if (typeof date === "number") {
        d = new Date(date * 1000); // timestamp seconds
    } else {
        d = new Date(date); // date string
    }

    return d.toLocaleDateString("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh"
    });
};
const formatOz = (num) => {
    if (!num) return "0";

    if (num >= 1e6) return (num / 1e6).toFixed(2) + "M oz";
    if (num >= 1e3) return (num / 1e3).toFixed(1) + "K oz";

    return num.toFixed(0) + " oz";
};
const ComexSilverInventoryPage = () => {
    const chartContainerRef = useRef();
    const tooltipRef = useRef();

    const chartInstance = useRef(null);
    const totalSeriesRef = useRef(null);
    const registeredSeriesRef = useRef(null);
    const eligibleSeriesRef = useRef(null);

    const [chartData, setChartData] = useState([]);
    const [selectedPeriod, setSelectedPeriod] = useState(180);
    const [filteredData, setFilteredData] = useState([]);
    const [inventoryInfo, setInventoryInfo] = useState(null);
    const [dashboardStats, setDashboardStats] = useState(null);
    const [deliveryData, setDeliveryData] = useState([]);
    const [deliveryStats, setDeliveryStats] = useState(null);
    const [deliveryFiltered, setDeliveryFiltered] = useState([]);
    const [depositoryData, setDepositoryData] = useState([]);
    const [depositoryDates, setDepositoryDates] = useState([]);
    const [currentDepositoryIndex, setCurrentDepositoryIndex] = useState(0);
    // ================= FETCH DATA =================
    useEffect(() => {
        fetch("https://api_gold.thinkdiff.us/comex_silver_inventory")
            .then(res => res.json())
            .then(res => {
                const list = res.data.silver_inventory;

                const processed = list.map(item => ({
                    time: Math.floor(new Date(item.date).getTime() / 1000),
                    total: item.total,
                    registered: item.registered,
                    eligible: item.eligible
                })).sort((a, b) => a.time - b.time);

                setChartData(processed);

                // thêm đoạn này
                if (res.data.delevery_history) {
                    setDeliveryData(res.data.delevery_history);
                };
                if (res.data.depositories_history) {
                    setDepositoryData(res.data.depositories_history);
                }
            })
            .catch(err => console.error("Error fetching data:", err));
    }, []);

    const timePeriods = [
        { label: "1M", days: 30 },
        { label: "3M", days: 90 },
        { label: "6M", days: 180 },
        { label: "1Y", days: 365 },
        { label: "5Y", days: 365 * 5 },
        { label: "All", days: "all" }
    ];

    useEffect(() => {
        if (!chartData.length) return;

        const last = chartData[chartData.length - 1];
        const prev = chartData[chartData.length - 2];

        const last30 = chartData.slice(-30);
        const last365 = chartData.slice(-365);
        const change30 = last.total - last30[0].total;
        const percent30 = ((last.total - last30[0].total) / last30[0].total) * 100;
        const totalPercent = ((last.total - prev.total) / prev.total) * 100;
        const registeredPercent = ((last.registered - prev.registered) / prev.registered) * 100;
        const eligiblePercent = ((last.eligible - prev.eligible) / prev.eligible) * 100;
        setDashboardStats({
            total: last.total,
            totalChange: last.total - prev.total,
            totalPercent,

            registered: last.registered,
            registeredChange: last.registered - prev.registered,
            registeredPercent,

            eligible: last.eligible,
            eligibleChange: last.eligible - prev.eligible,
            eligiblePercent,

            change30,
            percent30,

            high1y: Math.max(...last365.map(d => d.total)),
            low1y: Math.min(...last365.map(d => d.total)),

            date: last.time
        });

    }, [chartData]);

    // ================= FILTER DATA =================
    useEffect(() => {
        if (!chartData.length) return;

        let filtered;
        if (selectedPeriod === "all") {
            filtered = chartData;
        } else {
            const lastTime = chartData[chartData.length - 1].time;
            const cutoff = lastTime - selectedPeriod * 86400;
            filtered = chartData.filter(d => d.time >= cutoff);
        }

        setFilteredData(filtered);

        if (filtered.length) {
            const last = filtered[filtered.length - 1];
            const first = filtered[0];

            setInventoryInfo({
                totalCurrent: last.total,
                totalPrevious: chartData.length > 1 ? chartData[chartData.length - 2].total : last.total,
                registeredCurrent: last.registered,
                registeredPrevious: chartData.length > 1 ? chartData[chartData.length - 2].registered : last.registered,
                eligibleCurrent: last.eligible,
                eligiblePrevious: chartData.length > 1 ? chartData[chartData.length - 2].eligible : last.eligible,
                totalMin: Math.min(...filtered.map(d => d.total)),
                totalMax: Math.max(...filtered.map(d => d.total)),
                registeredMin: Math.min(...filtered.map(d => d.registered)),
                registeredMax: Math.max(...filtered.map(d => d.registered)),
                eligibleMin: Math.min(...filtered.map(d => d.eligible)),
                eligibleMax: Math.max(...filtered.map(d => d.eligible)),
                totalChange: ((last.total - first.total) / first.total) * 100,
                registeredChange: ((last.registered - first.registered) / first.registered) * 100,
                eligibleChange: ((last.eligible - first.eligible) / first.eligible) * 100
            });
        }
    }, [chartData, selectedPeriod]);

    // ================= UPDATE CHART DATA =================
    useEffect(() => {
        if (!filteredData.length) return;

        if (totalSeriesRef.current && registeredSeriesRef.current && eligibleSeriesRef.current) {
            totalSeriesRef.current.setData(
                filteredData.map(d => ({
                    time: d.time,
                    value: d.total
                }))
            );

            registeredSeriesRef.current.setData(
                filteredData.map(d => ({
                    time: d.time,
                    value: d.registered
                }))
            );

            eligibleSeriesRef.current.setData(
                filteredData.map(d => ({
                    time: d.time,
                    value: d.eligible
                }))
            );

            chartInstance.current.timeScale().fitContent();
        }
    }, [filteredData]);

    // ================= CREATE CHART =================
    useEffect(() => {
        if (!chartContainerRef.current) return;

        const chart = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height: 600,
            layout: {
                background: { type: ColorType.Solid, color: "#000" },
                textColor: "#d1d4dc"
            },
            grid: {
                vertLines: { color: "#111" },
                horzLines: { color: "#222" }
            },
            timeScale: {
                timeVisible: true,
                secondsVisible: false
            }
        });

        const totalSeries = chart.addSeries(LineSeries, {
            color: "#d4af37",
            lineWidth: 2,
            title: "Total"
        });

        const registeredSeries = chart.addSeries(LineSeries, {
            color: "#ffffff",
            lineWidth: 2,
            title: "Registered"
        });

        const eligibleSeries = chart.addSeries(LineSeries, {
            color: "#42a5f5",
            lineWidth: 2,
            title: "Eligible"
        });

        // Tooltip
        chart.subscribeCrosshairMove((param) => {
            if (!param.point || !param.time || !tooltipRef.current) {
                tooltipRef.current.style.display = "none";
                return;
            }

            const total = param.seriesData.get(totalSeries);
            const registered = param.seriesData.get(registeredSeries);
            const eligible = param.seriesData.get(eligibleSeries);

            if (!total) return;

            const d = new Date(param.time * 1000);
            const date = `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")
                }/${d.getFullYear()}`;

            tooltipRef.current.style.display = "block";
            tooltipRef.current.innerHTML = `
        <div style="color:#d4af37;font-weight:bold">COMEX Silver Inventory</div>
        <div style="font-size:11px;margin-bottom:6px">${date}</div>
        <div style="color:#d4af37">Total: ${(total.value / 1000000).toFixed(2)}M oz</div>
        <div style="color:#ffffff">Registered: ${(registered.value / 1000000).toFixed(2)}M oz</div>
        <div style="color:#42a5f5">Eligible: ${(eligible.value / 1000000).toFixed(2)}M oz</div>
      `;

            tooltipRef.current.style.left = `${param.point.x + 15}px`;
            tooltipRef.current.style.top = `${param.point.y + 15}px`;
        });

        chartInstance.current = chart;
        totalSeriesRef.current = totalSeries;
        registeredSeriesRef.current = registeredSeries;
        eligibleSeriesRef.current = eligibleSeries;

        const handleResize = () =>
            chart.applyOptions({ width: chartContainerRef.current.clientWidth });

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
            chart.remove();
        };
    }, []);

    useEffect(() => {
        setChartData([]);
        setFilteredData([]);
        setInventoryInfo(null);
    }, []);

    useEffect(() => {
        if (!deliveryData.length) return;

        const today = deliveryData[0];

        const currentYear = new Date().getFullYear();

        const ytdTotal = deliveryData
            .filter(d => new Date(d.date).getFullYear() === currentYear)
            .reduce((sum, d) => sum + d.daily_issued, 0);

        setDeliveryStats({
            todayIssued: today.daily_issued,
            todayStopped: today.daily_stopped,
            mtdTotal: today.mtd_cumulative,
            ytdTotal,
            date: today.date
        });

    }, [deliveryData]);
    useEffect(() => {
        if (!deliveryData.length) return;

        let filtered;

        if (selectedPeriod === "all") {
            filtered = deliveryData;
        } else {
            const last = new Date(deliveryData[0].date);
            const cutoff = new Date(last);
            cutoff.setDate(cutoff.getDate() - selectedPeriod);

            filtered = deliveryData.filter(d => new Date(d.date) >= cutoff);
        }

        setDeliveryFiltered(filtered);

    }, [deliveryData, selectedPeriod]);
    const [latestDepositories, setLatestDepositories] = useState([]);

    useEffect(() => {
        if (!depositoryData.length) return;

        const dates = [...new Set(depositoryData.map(d => d.date))];

        setDepositoryDates(dates);
        setCurrentDepositoryIndex(0);

    }, [depositoryData]);
    useEffect(() => {
        if (!depositoryDates.length) return;

        const date = depositoryDates[currentDepositoryIndex];

        const filtered = depositoryData.filter(
            d => d.date === date
        );

        setLatestDepositories(filtered);

    }, [currentDepositoryIndex, depositoryDates, depositoryData]);
    return (
        <div style={{ background: '#131722', padding: '20px', minHeight: '100vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h2 style={{ color: '#26a69a', margin: 0 }}>COMEX Silver Inventory Chart</h2>
            </div>
            {dashboardStats && (
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
                    gap: "15px",
                    marginBottom: "20px"
                }}>

                    <StatCard
                        title="Total Inventory"
                        value={(dashboardStats.total / 1e6).toFixed(2) + "M oz"}
                        date={formatDate(dashboardStats.date)}
                        changeValue={dashboardStats.totalChange}
                        changePercent={dashboardStats.totalPercent}
                        label="vs prev day"
                    />

                    <StatCard
                        title="Registered"
                        value={(dashboardStats.registered / 1e6).toFixed(2) + "M oz"}
                        changeValue={dashboardStats.registeredChange}
                        changePercent={dashboardStats.registeredPercent}
                        label="vs prev day"
                    />

                    <StatCard
                        title="Eligible"
                        value={(dashboardStats.eligible / 1e6).toFixed(2) + "M oz"}
                        changeValue={dashboardStats.eligibleChange}
                        changePercent={dashboardStats.eligiblePercent}
                        label="vs prev day"
                    />

                    <StatCard
                        title="30 Day Change"
                        value={(dashboardStats.change30 / 1e6).toFixed(2) + "M oz"}
                        changeValue={dashboardStats.change30}
                        changePercent={dashboardStats.percent30}
                        label="last 30 days"
                    />

                    <StatCard
                        title="1Y High"
                        value={(dashboardStats.high1y / 1e6).toFixed(2) + "M oz"}
                    />

                    <StatCard
                        title="1Y Low"
                        value={(dashboardStats.low1y / 1e6).toFixed(2) + "M oz"}
                    />

                </div>
            )}
            <div style={{
                display: 'flex',
                gap: '30px',
                marginBottom: '20px',
                padding: '10px',
                background: '#0a0a0a',
                border: '1px solid #222',
                borderRadius: '8px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '20px', height: '2px', background: '#d4af37' }} />
                    <span style={{ color: '#d4af37', fontWeight: '600' }}>Total</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '20px', height: '2px', background: '#ffffff' }} />
                    <span style={{ color: '#ffffff', fontWeight: '600' }}>Registered</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '20px', height: '2px', background: '#42a5f5' }} />
                    <span style={{ color: '#42a5f5', fontWeight: '600' }}>Eligible</span>
                </div>
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", paddingBottom: "10px" }}>
                {timePeriods.map((p) => (
                    <button
                        key={p.label}
                        onClick={() => setSelectedPeriod(p.days)}
                        style={{
                            padding: "5px 10px",
                            borderRadius: "4px",
                            border: "1px solid #333",
                            background: selectedPeriod === p.days ? "#26a69a" : "#1a1a1a",
                            color: "#fff",
                            cursor: "pointer",
                            fontSize: "14px",
                            fontWeight: "600"
                        }}
                    >
                        {p.label}
                    </button>
                ))}
            </div>

            <div style={{ position: 'relative', width: '100%', marginBottom: '20px' }}>
                <div ref={chartContainerRef} style={{ width: '100%', height: '600px', border: '1px solid #242733' }} />
                <div ref={tooltipRef} style={tooltipStyle} />
            </div>
            {/* Delivery Table */}

            <div style={{
                background: "#0a0a0a",
                border: "1px solid #222",
                borderRadius: "8px",
                overflow: "hidden"
            }}>

                <div style={{
                    padding: "12px",
                    borderBottom: "1px solid #222",
                    fontWeight: "600",
                    color: "#fff"
                }}>
                    Delivery Notices
                </div>
                {deliveryStats && (
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
                        gap: "10px",
                        padding: "12px",
                        borderBottom: "1px solid #222"
                    }}>

                        <div style={deliveryStatBox}>
                            <div style={deliveryStatLabel}>Today Issued</div>

                            <div style={{ ...deliveryStatValue, color: "#00ff80" }}>
                                {deliveryStats.todayIssued.toLocaleString()}
                            </div>

                            <div style={{ fontSize: "13px", color: "#888" }}>
                                {formatDate(deliveryStats.date)}
                            </div>
                        </div>
                        <div style={deliveryStatBox}>
                            <div style={deliveryStatLabel}>Today Stopped</div>

                            <div style={{ ...deliveryStatValue, color: "#ff4d4d" }}>
                                {deliveryStats.todayStopped.toLocaleString()}
                            </div>

                            <div style={{ fontSize: "13px", color: "#888" }}>
                                {formatDate(deliveryStats.date)}
                            </div>
                        </div>

                        <div style={deliveryStatBox}>
                            <div style={deliveryStatLabel}>MTD Total</div>
                            <div style={deliveryStatValue}>
                                {deliveryStats.mtdTotal.toLocaleString()}
                            </div>
                        </div>

                        <div style={deliveryStatBox}>
                            <div style={deliveryStatLabel}>YTD Total</div>
                            <div style={deliveryStatValue}>
                                {deliveryStats.ytdTotal.toLocaleString()}
                            </div>
                        </div>

                    </div>
                )}
                <table style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    color: "#ccc",
                    fontSize: "14px"
                }}>
                    <thead>
                        <tr style={{ background: "#111" }}>
                            <th style={thStylee}>Date</th>
                            <th style={thStylee}>Issued</th>
                            <th style={thStylee}>Stopped</th>
                            <th style={thStylee}>MTD Cumulative</th>
                        </tr>
                    </thead>

                    <tbody>
                        {deliveryFiltered.map((d, i) => (
                            <tr key={i} style={{ borderBottom: "1px solid #222" }}>

                                <td style={{ padding: "10px", textAlign: "center", fontWeight: "600" }}>
                                    {new Date(d.date).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric"
                                    })}
                                </td>

                                <td style={{ ...tdStylee, color: "#00ff80" }}>
                                    {d.daily_issued.toLocaleString()}
                                </td>

                                <td style={{ ...tdStylee, color: "#ff4d4d" }}>
                                    {d.daily_stopped.toLocaleString()}
                                </td>

                                <td style={{ ...tdStylee, color: "#ffd700" }}>
                                    {d.mtd_cumulative.toLocaleString()}
                                </td>

                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div style={{
                marginTop: "30px",
                background: "#0a0a0a",
                border: "1px solid #222",
                borderRadius: "8px",
                overflow: "hidden"
            }}>

                <div style={{
                    padding: "12px",
                    borderBottom: "1px solid #222",
                    fontWeight: "600",
                    color: "#fff"
                }}>
                    Depository Breakdown
                </div>
                <div style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "15px",
                    padding: "10px",
                    borderBottom: "1px solid #222"
                }}>

                    <button
                        onClick={() =>
                            setCurrentDepositoryIndex(i =>
                                Math.min(i + 1, depositoryDates.length - 1)
                            )
                        }
                        style={navButton}
                    >
                        ◀ Previous
                    </button>

                    <span style={{ color: "#fff", fontWeight: "600" }}>
                        {depositoryDates[currentDepositoryIndex] ?
                            formatDate(depositoryDates[currentDepositoryIndex]) : ""}
                    </span>

                    <button
                        onClick={() =>
                            setCurrentDepositoryIndex(i =>
                                Math.max(i - 1, 0)
                            )
                        }
                        style={navButton}
                    >
                        Next ▶
                    </button>

                </div>
                <table style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    color: "#ccc",
                    fontSize: "14px"
                }}>

                    <thead>
                        <tr style={{ background: "#111" }}>
                            <th style={thStyle}>Depository</th>
                            <th style={thStyle}>Registered</th>
                            <th style={thStyle}>Eligible</th>
                            <th style={thStyle}>Total</th>
                            <th style={thStyle}>Change</th>
                        </tr>
                    </thead>

                    <tbody>
                        {latestDepositories.map((d, i) => {

                            const change = d.total - d.prev_total;
                            const color = change > 0 ? "#00ff80" : change < 0 ? "#ff4d4d" : "#999";

                            return (
                                <tr key={i} style={{ borderBottom: "1px solid #222" }}>

                                    <td style={tdStyle1}>
                                        {d.depository}{" "}
                                        <span style={{ color: "#888", fontSize: "13px", fontWeight: "500" }}>
                                            ( {formatDate(d.date)} )
                                        </span>
                                    </td>

                                    <td style={tdStyle}>
                                        {formatOz(d.registered)}
                                    </td>

                                    <td style={tdStyle}>
                                        {formatOz(d.eligible)}
                                    </td>

                                    <td style={tdStyle}>
                                        {formatOz(d.total)}
                                    </td>

                                    <td style={{ ...tdStyle, color }}>
                                        {change !== 0 ? formatOz(change) : "0"}
                                    </td>

                                </tr>
                            );
                        })}
                    </tbody>

                </table>
            </div>
        </div>
    );
};

const tooltipStyle = {
    width: "220px",
    position: "absolute",
    display: "none",
    padding: "10px",
    zIndex: 1000,
    pointerEvents: "none",
    borderRadius: "4px",
    background: "rgba(25,27,34,0.95)",
    border: "1px solid #64656a",
    color: "white"
};
const thStyle = {
    padding: "10px",
    textAlign: "left",
    fontWeight: "600",
    color: "#aaa"
};
const thStylee = {
    padding: "10px",
    textAlign: "center",
    fontWeight: "600",
    color: "#aaa"
};

const tdStyle1 = {
    padding: "10px",
    color: "#ffd700"
};
const tdStyle = {
    padding: "10px",
};
const tdStylee = {
    textAlign: "center",
}
const deliveryStatBox = {
    background: "#111",
    border: "1px solid #222",
    padding: "10px",
    borderRadius: "6px"
};

const deliveryStatLabel = {
    fontSize: "11px",
    color: "#888"
};

const deliveryStatValue = {
    fontSize: "18px",
    fontWeight: "700",
    color: "#fff"
};

const navButton = {
    padding: "6px 12px",
    borderRadius: "4px",
    border: "1px solid #333",
    background: "#1a1a1a",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "600"
};
export default ComexSilverInventoryPage;
