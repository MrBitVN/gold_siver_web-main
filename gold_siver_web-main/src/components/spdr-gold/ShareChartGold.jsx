import { useEffect, useMemo, useState } from "react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Tooltip,
    Legend,
    TimeScale,
    Filler,
} from "chart.js";
import { Chart } from "react-chartjs-2";
import "chartjs-adapter-date-fns";
import zoomPlugin from "chartjs-plugin-zoom";
import { vi } from "date-fns/locale";
import "./ShareChartGold.css";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Tooltip,
    Legend,
    TimeScale,
    Filler,
    zoomPlugin
);

const API_URL = "https://api_gold.thinkdiff.us/load_GLD_co_phieu";

/* ================= HELPERS ================= */

function formatDateTime(ts) {
    const d = new Date(ts);
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(
        d.getHours()
    )}:${pad(d.getMinutes())}`;
}


function getMinDateByRange(range, dates) {
    if (!dates?.length || range === "ALL") return null;

    const latest = new Date(Math.max(...dates.map((d) => +d)));

    switch (range) {
        case "7D":
            return new Date(latest.getTime() - 7 * 24 * 60 * 60 * 1000);
        case "30D":
            return new Date(latest.getTime() - 30 * 24 * 60 * 60 * 1000);
        case "90D":
            return new Date(latest.getTime() - 90 * 24 * 60 * 60 * 1000);
        case "1Y":
            return new Date(
                latest.getFullYear() - 1,
                latest.getMonth(),
                latest.getDate()
            );
        default:
            return null;
    }
}

function buildRangeCaption(dates) {
    if (!dates?.length) return "";
    const fmt = (d) =>
        d.toLocaleDateString("vi-VN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
        });
    return `${fmt(dates[0])} - ${fmt(dates[dates.length - 1])}`;
}

function formatDateOnly(date) {
    return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    });
}
function getLatestTimestampFromPayload(payload) {
    if (!payload) return null;

    const times = [];

    payload.stock_prices?.forEach(p => {
        if (p.record_time) times.push(new Date(p.record_time).getTime());
    });

    payload.stock_volumes?.forEach(v => {
        if (v.record_time) times.push(new Date(v.record_time).getTime());
    });

    payload.options_flow?.forEach(o => {
        if (o.trade_time) times.push(new Date(o.trade_time).getTime());
    });

    if (!times.length) return null;

    return new Date(Math.max(...times));
}
/* ================= COMPONENT ================= */

function ShareChartGold({ onlyMain = false, onlyExtra = false }) {
    const { t, i18n } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [payload, setPayload] = useState(null);

    const [priceRange, setPriceRange] = useState("7D");
    const [volumeRange, setVolumeRange] = useState("30D");

    const [showAllFlow, setShowAllFlow] = useState(false);
    const navigate = useNavigate();

    /* ================= FETCH ================= */

    useEffect(() => {
        let ignore = false;

        async function fetchData() {
            try {
                setLoading(true);
                const res = await fetch(API_URL);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const json = await res.json();
                if (!ignore) setPayload(json?.data?.data || null);
            } catch (e) {
                if (!ignore) setError(e.message);
            } finally {
                if (!ignore) setLoading(false);
            }
        }

        fetchData();
        return () => {
            ignore = true;
        };
    }, []);
    const RANGE_LABELS = {
        "7D": t("range.7d"),
        "30D": t("range.30d"),
        "90D": t("range.90d"),
        "1Y": t("range.1y"),
        "ALL": t("range.all"),
    };
    /* ================= PRICE CHART ================= */

    const priceChart = useMemo(() => {
        const prices = payload?.stock_prices || [];
        if (!prices.length) return null;

        const allDates = prices.map((p) => new Date(p.record_time));
        const minDate = getMinDateByRange(priceRange, allDates);

        const filtered = minDate
            ? prices.filter((p) => new Date(p.record_time) >= minDate)
            : prices;

        const labels = filtered.map((p) => new Date(p.record_time));
        const data = filtered.map((p) => p.close);

        return {
            data: {
                labels,
                datasets: [
                    {
                        type: "line",
                        data,
                        fill: true,
                        borderColor: "#3fb27f",
                        backgroundColor: "rgba(63,178,127,0.25)",
                        tension: 0.3,
                        pointRadius: 0,
                        borderWidth: 2,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: "index", intersect: false },
                scales: {
                    x: {
                        type: "time",
                        adapters: { date: { locale: vi } },
                        time: { unit: "day" },
                        ticks: { display: false },
                        grid: { display: false },
                    },
                    y: {
                        grid: { drawBorder: false },
                        beginAtZero: true,
                        min: 0
                    },
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        displayColors: false,
                        callbacks: {
                            title: (items) =>
                                new Date(items[0].parsed.x).toLocaleString(i18n.language === "vi" ? "vi-VN" : "en-US"),
                            label: (ctx) => {
                                const idx = ctx.dataIndex;
                                const close = ctx.raw;
                                const high = filtered[idx]?.high;
                                return high != null
                                    ? [`${t("gold.close")}: ${close.toFixed(2)}`, `${t("gold.high")}: ${high.toFixed(2)}`]
                                    : `${t("gold.close")}: ${close.toFixed(2)}`;
                            },
                        },
                    },
                },
            },
            range: buildRangeCaption(labels),
        };
    }, [payload, priceRange]);
    const calcPercentChange = (current, previous) => {
        if (previous == null || previous === 0) return null;
        return ((current - previous) / previous) * 100;
    };
    const percentageChanges = useMemo(() => {
        const prices = payload?.stock_prices;
        if (!prices || prices.length < 2) return {};

        const latestIdx = prices.length - 1;
        const latest = prices[latestIdx]?.close;

        const getPrev = (daysAgo) => {
            const idx = latestIdx - daysAgo;
            return idx >= 0 ? prices[idx]?.close : null;
        };

        return {
            day1: calcPercentChange(latest, getPrev(1)),
            day2: calcPercentChange(latest, getPrev(2)),
            day3: calcPercentChange(latest, getPrev(3)),
            day4: calcPercentChange(latest, getPrev(4)),
            week1: calcPercentChange(latest, getPrev(7)),
            month1: calcPercentChange(latest, getPrev(30)),
        };
    }, [payload]);

    /* ================= VOLUME CHART ================= */

    const volumeChart = useMemo(() => {
        const stock_volumes = payload?.stock_volumes || [];
        if (!stock_volumes.length) return null;
        const vols = stock_volumes.filter(item =>
            item.record_time.includes("T09:30:00")
        );

        // const allDates = vols.map((v) => new Date(v.record_time));
        // const minDate = getMinDateByRange(volumeRange, allDates);

        // const filtered = minDate
        //     ? vols.filter((v) => new Date(v.record_time) >= minDate)
        //     : vols;

        const data = vols.map((v) => ({
            x: v.record_time,
            y: v.volume,
        }));

        const colors = vols.map((v) =>
            v.color === "GREEN" ? "#26a69a" : "#ef5350"
        );

        return {
            data: {
                labels: data.map(item => item.x),
                datasets: [
                    {
                        type: "bar",
                        label: "Volume",
                        data: data.map(item => item.y),
                        backgroundColor: colors,
                        borderRadius: 3,
                        barPercentage: 0.9,
                        categoryPercentage: 0.9,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: "index", intersect: false },
                scales: {
                    x: {
                        type: "category",
                        // adapters: { date: { locale: vi } },
                        // time: {
                        //     unit: "day",
                        //     displayFormats: { day: "dd/MM" },
                        // },
                        grid: { display: false },
                        ticks: {
                            callback: function (value, index) {
                                const dateStr = this.getLabelForValue(value);
                                const [y, m, d] = dateStr.split("T")[0].split("-");
                                return `${Number(d)}/${Number(m)}`;
                            }
                        }
                    },
                    y: {
                        grid: { drawBorder: false },
                        ticks: {
                            callback: (v) =>
                                v >= 1_000_000
                                    ? `${(v / 1_000_000).toFixed(1)}M`
                                    : v >= 1_000
                                        ? `${(v / 1_000).toFixed(0)}k`
                                        : v,
                        },
                    },
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        displayColors: false,
                        callbacks: {
                            title: () => "",

                            label: function (ctx) {
                                const value = ctx.parsed.y;
                                return `${(value / 1_000_000).toFixed(3)}M`;
                            },

                            afterLabel: function (ctx) {
                                const iso = ctx.label;
                                const [datePart, timePart] = iso.split("T");
                                const [y, m, d] = datePart.split("-");
                                const [h, min] = timePart.split(":");

                                const monthName = new Date(`${y}-${m}-${d}`)
                                    .toLocaleString(i18n.language === "vi" ? "vi-VN" : "en-US", { month: "short" })

                                return [
                                    `${Number(d)} ${monthName}, ${y}`,
                                    `${h}:${min}`,
                                ];
                            },
                        },

                        labelFont: {
                            size: 16,        // to hơn
                            weight: "bold",  // đậm
                        },
                    },
                    zoom: {
                        pan: {
                            enabled: true,
                            mode: "x",
                            threshold: 5,
                        },
                        zoom: {
                            wheel: { enabled: true, speed: 0.1 },
                            pinch: { enabled: true },
                            mode: "x",
                        },
                        limits: {
                            x: {
                                min: "original",
                                max: "original",
                                minRange: 24 * 60 * 60 * 1000,
                            },
                        },
                    },
                },
            },
            // range: buildRangeCaption(data.map((d) => d.x)),
        };
    }, [payload, volumeRange]);

    /* ================= OPTIONS FLOW ================= */

    const optionsFlowRows = useMemo(() => {
        return (payload?.options_flow || [])
            .slice()
            .sort((a, b) => new Date(b.trade_time) - new Date(a.trade_time));
    }, [payload]);

    const shownRows = showAllFlow
        ? optionsFlowRows
        : optionsFlowRows.slice(0, 7);

    const latestUpdateDate = useMemo(() => {
        return getLatestTimestampFromPayload(payload);
    }, [payload]);

    /* ================= RENDER ================= */
    if (loading) return <p style={{ padding: 24 }}>{t("gold.loading")}</p>;
    if (error) return <p style={{ color: "tomato" }}>{error}</p>;

    return (
        <div className={`sharechart ${onlyExtra ? "sharechart-extra" : ""}`}>
            {!onlyExtra && (
                <>
                    <div
                        className="sc-header-title sc-header-link"
                        onClick={() => navigate("/spdr-shares")}
                        style={{ cursor: "pointer", textAlign: "center" }}
                    >
                        SPDR Gold Shares (GLD)
                    </div>

                    {latestUpdateDate && (
                        <div className="sc-header-sub">
                           {t("gold.last_update")}{" "}
                            <span
                                style={{
                                    textAlign: "center",
                                    fontSize: "16px",
                                    color: "#FFD700",
                                    marginTop: "4px",
                                    fontWeight: "700",
                                }}
                            >

                                {formatDateOnly(latestUpdateDate)}
                            </span>
                        </div>
                    )}
                    {/* ===== PERCENT CHANGE (GLD) ===== */}
                    {Object.keys(percentageChanges).length > 0 && !onlyExtra && (
                        <div className="sc-toolbar">
                            <label className="sc-label">{t("gold.percent_change")}</label>

                            <div className="sc-percentager-bar">
                                {[
                                    { key: "day1", label: t("gold.day1") },
                                    { key: "day2", label: t("gold.day2") },
                                    { key: "day3", label: t("gold.day3") },
                                    { key: "day4", label: t("gold.day4") },
                                    { key: "week1", label: t("gold.week1") },
                                    { key: "month1", label: t("gold.month1") },
                                ].map(({ key, label }) =>
                                    percentageChanges[key] != null && (
                                        <div
                                            key={key}
                                            className={`sc-percent-item ${percentageChanges[key] >= 0 ? "up" : "down"}`}
                                        >
                                            <span className="label">{t("gold.within", { value: label })}</span>
                                            <span className="value">
                                                {percentageChanges[key] >= 0 ? "+" : ""}
                                                {percentageChanges[key].toFixed(2)}%
                                            </span>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}



            {/* PRICE TIME BAR */}
            {!onlyExtra && (
                <div className="sc-timebar">
                    {["7D", "30D", "90D", "1Y", "ALL"].map((r) => (
                        <button
                            key={r}
                            className={`sc-time-btn ${priceRange === r ? "active" : ""}`}
                            onClick={() => setPriceRange(r)}
                        >
                            {RANGE_LABELS[r]}
                        </button>
                    ))}
                </div>
            )}

            {/* PRICE */}
            {!onlyExtra && (
                <section className="sc-section">
                    <div className="sc-chart-wrap sc-chart-wrap--price">
                        {priceChart && (
                            <Chart data={priceChart.data} options={priceChart.options} />
                        )}
                    </div>
                </section>
            )}

            {/* ===== EXTRA SECTIONS (Volume + Option Flow) ===== */}
            {!onlyMain && (
                <>
                    {/* ===== VOLUME ===== */}
                    <div className="sc-header">
                        <div className="sc-header-title2">
                            {t("gold.volume_chart")}
                        </div>
                    </div>

                    <section className="sc-section">
                        <div className="sc-chart-wrap sc-chart-wrap--volume">
                            {volumeChart && (
                                <Chart
                                    data={volumeChart.data}
                                    options={volumeChart.options}
                                />
                            )}
                        </div>
                        <div className="sc-caption">{volumeChart?.range}</div>
                    </section>

                    {/* ===== OPTION FLOW ===== */}

                    <div className="sc-header">
                        <div className="sc-header-title3">
                            {t("gold.option_flow")}
                        </div>
                    </div>
                    <section className="sc-section">
                        <div className="sc-section-header">
                            <h3 className="sc-section-title">
                                {showAllFlow ? t("gold.show_all") : t("gold.show_recent")}
                            </h3>

                            <button onClick={() => setShowAllFlow((s) => !s)}>
                                {showAllFlow ? t("gold.hide_more") : t("gold.show_all")}
                            </button>
                        </div>

                        <div className="sc-table-scroll">
                            <table className="sc-table">
                                <thead>
                                    <tr>
                                        <th>Date & Time</th>
                                        <th>Expiration</th>
                                        <th>Strike</th>
                                        <th>Type</th>
                                        <th>Size</th>
                                        <th>Open Interest</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {shownRows.map((r) => (
                                        <tr key={r.id}>
                                            <td>{formatDateTime(r.trade_time)}</td>
                                            <td>{formatDateTime(r.expiration_date).split(" ")[0]}</td>
                                            <td>{r.strike_price}</td>
                                            <td
                                                style={{
                                                    color:
                                                        r.contract_type === "CALL"
                                                            ? "#26a69a"
                                                            : "#ef5350",
                                                }}
                                            >
                                                {r.contract_type}
                                            </td>
                                            <td>{r.trade_size}</td>
                                            <td>{r.open_interest}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </>
            )}


        </div>
    );
}

export default ShareChartGold;
