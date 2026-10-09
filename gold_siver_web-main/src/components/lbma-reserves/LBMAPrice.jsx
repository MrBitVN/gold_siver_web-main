import React, { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
    Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
    Legend
);

const API = {
    gold: "https://api_gold.thinkdiff.us/lbma_gold_price",
    silver: "https://api_gold.thinkdiff.us/lbma_silver_price",
};

const LBMAPrice = () => {
    const { t } = useTranslation();
    const [rawData, setRawData] = useState([]);
    const [yearRange, setYearRange] = useState("all");
    const [timeRange, setTimeRange] = useState("month");
    const [activeMetal, setActiveMetal] = useState("silver");

    /* ================= FETCH DATA ================= */
    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(API[activeMetal]);
                const json = await res.json();

                const data = json?.data || [];
                data.sort((a, b) => new Date(a.date) - new Date(b.date));

                setRawData(data);
            } catch (err) {
                console.warn("LBMA fetch error:", err);
                setRawData([]);
            }
        };

        fetchData();
    }, [activeMetal]);

    const calculatePercentageChange = (current, previous) => {
        if (previous === 0 || previous == null) return null;
        return ((current - previous) / previous) * 100;
    };

    const percentageChanges = React.useMemo(() => {
        if (!rawData || rawData.length < 2) return {};

        // sort theo time (timestamp)
        const sorted = [...rawData].sort(
            (a, b) => Number(a.time) - Number(b.time)
        );

        const lastIndex = sorted.length - 1;
        const current = sorted[lastIndex].value;

        const getChange = (daysAgo) => {
            const idx = lastIndex - daysAgo;
            if (idx < 0) return null;

            const previous = sorted[idx].value;
            return calculatePercentageChange(current, previous);
        };

        return {
            day5: getChange(5),
            month1: getChange(30),
            month6: getChange(180),
        };
    }, [rawData]);

    const lastUpdatedDate = React.useMemo(() => {
        if (!rawData || rawData.length === 0) return null;

        const latest = rawData[rawData.length - 1].time;
        const d = new Date(latest);

        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = d.getFullYear();

        const hours = String(d.getHours()).padStart(2, "0");
        const minutes = String(d.getMinutes()).padStart(2, "0");
        const seconds = String(d.getSeconds()).padStart(2, "0");

        return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    }, [rawData]);

    const formatDate = (time) => {
        const d = new Date(time);

        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = String(d.getFullYear()).padStart(2, "0");
        const hours = String(d.getHours()).padStart(2, "0");
        const minutes = String(d.getMinutes()).padStart(2, "0");

        return `${day}/${month}/${year} ${hours}:${minutes}`;
    };


    /* ================= FILTER ================= */
    const getYear = (ts) => new Date(Number(ts)).getFullYear();

    const years = useMemo(() => {
        if (!rawData.length) return ["all"];

        const list = [...new Set(rawData.map(i => getYear(i.time)))];

        // Sắp xếp năm mới nhất lên trên
        list.sort((a, b) => b - a);

        return ["all", ...list];
    }, [rawData]);

    const getLatestTime = (data) => {
        if (!data.length) return null;
        return Math.max(...data.map(i => Number(i.time)));
    };

    const filteredData = useMemo(() => {
        if (!rawData.length) return [];

        const latestTime = getLatestTime(rawData);
        if (!latestTime) return rawData;

        const latestDate = new Date(latestTime);

        // ===== 7 NGÀY =====
        if (timeRange === "week") {
            const fromDate = new Date(latestDate);
            fromDate.setDate(fromDate.getDate() - 7);

            return rawData.filter(
                i => Number(i.time) >= fromDate.getTime()
            );
        }

        // ===== 1 THÁNG =====
        if (timeRange === "month") {
            const fromDate = new Date(latestDate);
            fromDate.setMonth(fromDate.getMonth() - 1);

            return rawData.filter(
                i => Number(i.time) >= fromDate.getTime()
            );
        }

        // ===== 1 NĂM =====
        if (timeRange === "year_rolling") {
            const latestTime = getLatestTime(rawData);
            if (!latestTime) return rawData;

            const toDate = new Date(latestTime);
            const fromDate = new Date(toDate);
            fromDate.setFullYear(fromDate.getFullYear() - 1);

            return rawData.filter(
                i =>
                    Number(i.time) >= fromDate.getTime() &&
                    Number(i.time) <= toDate.getTime()
            );
        }

        // ===== NĂM CỤ THỂ (THEO SELECT) =====
        if (timeRange === "year_fixed" && yearRange !== "all") {
            return rawData.filter(
                i => getYear(i.time) === Number(yearRange)
            );
        }

        return rawData;
    }, [rawData, yearRange, timeRange]);

    useEffect(() => {
        if (timeRange === "year_fixed" && years.length > 1 && yearRange === "all") {
            setYearRange(String(years[1]));
        }
    }, [years, timeRange]);

    /* ================= SUMMARY ================= */
    const summaryValues = useMemo(() => {
        if (!filteredData.length) return {};

        const values = filteredData.map((i) => i.value);

        return {
            max: Math.max(...values),
            min: Math.min(...values),
            current: values[values.length - 1],
        };
    }, [filteredData]);

    /* ================= CHART ================= */
    const isGold = activeMetal === "gold";

    const chartData = {
        labels: filteredData.map(i => formatDate(i.time)),
        datasets: [
            {
                label: isGold
                    ? t("lbmaPrice.goldPrice")
                    : t("lbmaPrice.silverPrice"),
                data: filteredData.map(i => i.value),
                borderColor: isGold
                    ? "rgba(212,175,55,1)"     // vàng 
                    : "rgba(192,192,192,1)",  // bạc
                backgroundColor: isGold
                    ? "rgba(212,175,55,0.7)"
                    : "rgba(192,192,192,0.7)",
                pointBackgroundColor: isGold
                    ? "rgba(212,175,55,1)"
                    : "rgba(192,192,192,1)",
                pointRadius: 2,
                pointHoverRadius: 5,
                tension: 0.3,
                fill: true,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: "index",
            intersect: false,
        },
        plugins: { legend: { position: "top" } },
        scales: {
            y: {
                title: {
                    display: true,
                    text: "USD",
                },
                beginAtZero: true,
                min: 0
            },
        },
    };

    if (!rawData || rawData.length === 0) return null;

    return (
        <div className="comex-inventory-container">
            {/* Header */}
            <div className="comex-inventory-header header-row">
                <div className="header-left">
                    <h2>{t("lbmaPrice.title")}</h2>
                    <p className="subtitle">
                        {t("lbmaPrice.subtitle")}
                    </p>
                </div>
                {lastUpdatedDate && (
                    <div className="header-right">
                        <label className="last-updated-label"> {t("lbmaPrice.lastUpdated")}: </label>
                        <span className="last-updated">
                            {lastUpdatedDate}
                        </span>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="comex-tab-navigation">
                <button
                    className={`tab-button ${activeMetal === "gold" ? "active" : ""}`}
                    onClick={() => setActiveMetal("gold")}
                >
                    {t("lbmaPrice.lbmaGold")}
                </button>
                <button
                    className={`tab-button ${activeMetal === "silver" ? "active" : ""}`}
                    onClick={() => setActiveMetal("silver")}
                >
                    {t("lbmaPrice.lbmaSilver")}
                </button>
            </div>

            {/* Layout */}
            <div className="comex-desktop-layout">
                {/* Left column */}
                <div className="comex-left-column">
                    <div className="percentage-changes-container">
                        <h3>{t("lbmaPrice.summary")}</h3>

                        <div className="percentage-grid">
                            <div className="percentage-item">
                                <span className="percentage-label">{t("lbmaPrice.maxPrice")}</span>
                                <span className="percentage-value3">
                                    {summaryValues.max?.toLocaleString()} USD
                                </span>
                            </div>

                            <div className="percentage-item">
                                <span className="percentage-label">{t("lbmaPrice.minPrice")}</span>
                                <span className="percentage-value3">
                                    {summaryValues.min?.toLocaleString()} USD
                                </span>
                            </div>

                            <div className="percentage-item">
                                <span className="percentage-label">{t("lbmaPrice.currentPrice")}</span>
                                <span className="percentage-value3" style={{ color: "#1bb553" }}>
                                    {summaryValues.current?.toLocaleString()} USD
                                </span>
                            </div>
                        </div>

                    </div>
                    <div className="percentage-changes-container">
                        <h3>{t("lbmaPrice.changeRate")}</h3>
                        <div className="percentage-grid">
                            {[
                                [t("lbmaPrice.in5Days"), percentageChanges.day5],
                                [t("lbmaPrice.in1Month"), percentageChanges.month1],
                                [t("lbmaPrice.in6Months"), percentageChanges.month6],
                            ].map(
                                ([label, value]) =>
                                    typeof value === "number" && (
                                        <div key={label} className="percentage-item">
                                            <span className="percentage-label">{label}</span>
                                            <span
                                                className={`percentage-value ${value >= 0 ? "positive" : "negative"
                                                    }`}
                                            >
                                                {value >= 0 ? "+" : ""}
                                                {value.toFixed(2)}%
                                            </span>
                                        </div>
                                    )
                            )}
                        </div>
                    </div>
                    <div className="percentage-item">
                        <span className="percentage-label">{t("lbmaPrice.timeRange")}</span>

                        <div className="time-filter-buttons">
                            <button
                                className={timeRange === "all" ? "active" : ""}
                                onClick={() => setTimeRange("all")}
                            >
                                {t("lbmaPrice.all")}
                            </button>

                            <button
                                className={timeRange === "week" ? "active" : ""}
                                onClick={() => setTimeRange("week")}
                            >
                                {t("lbmaPrice.week7Days")}
                            </button>

                            <button
                                className={timeRange === "month" ? "active" : ""}
                                onClick={() => setTimeRange("month")}
                            >
                                {t("lbmaPrice.month1")}
                            </button>

                            <button
                                className={timeRange === "year_rolling" ? "active" : ""}
                                onClick={() => {
                                    setTimeRange("year_rolling");
                                    setYearRange("all"); // không dùng select
                                }}
                            >
                                {t("lbmaPrice.year1")}
                            </button>
                            <button
                                className={timeRange === "year_fixed" ? "active" : ""}
                                onClick={() => {
                                    setTimeRange("year_fixed");

                                    // mặc định năm mới nhất
                                    if (years.length > 1) {
                                        setYearRange(String(years[1]));
                                    }
                                }}
                            >
                                {t("lbmaPrice.selectYear")}
                            </button>

                        </div>

                        {/* SELECT NĂM */}
                        {timeRange === "year_fixed" && (
                            <select
                                value={yearRange}
                                onChange={(e) => setYearRange(e.target.value)}
                                className="lbma-year-select"
                            >
                                {years
                                    .filter(y => y !== "all")
                                    .map((y) => (
                                        <option key={y} value={y}>
                                            {y}
                                        </option>
                                    ))}
                            </select>
                        )}
                    </div>
                </div>

                {/* Right column */}
                <div className="comex-right-column">
                    <div className="comex-chart-wrapper">
                        <Line data={chartData} options={options} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LBMAPrice;
