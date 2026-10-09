import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Tooltip,
    Legend,
    BarController,
    LineController,
} from "chart.js";
import { Chart } from "react-chartjs-2";
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Tooltip,
    Legend, BarController, LineController
);
import "./WeeklyReportChart.css";
const API_URL = "https://api_gold.thinkdiff.us/final_gold_silver_report_api";

/**
 * Biểu đồ cột (lợi nhuận) + đường (% lợi nhuận) theo tuần
 * Dùng cho Vàng hoặc Bạc qua prop `type`
 */
const WeeklyWeekChart = ({ weekData, formatDate }) => {
    const { t, i18n } = useTranslation();
    const locale = i18n.language && i18n.language.startsWith("en") ? "en-US" : "vi-VN";

    const sortedServers = [...weekData.servers].sort(
        (a, b) => b.percent - a.percent
    );

    const labels = sortedServers.map(s => s.name);
    const profitData = sortedServers.map(s => s.loinhuan);
    const percentData = sortedServers.map(s => s.percent);

    const data = {
        labels,
        datasets: [
            {
                type: "bar",
                label: t('menu.weeklyReportChart.profitLabel', { currency: t('menu.weeklyReportChart.currency') }),
                data: profitData,
                backgroundColor: profitData.map(v =>
                    v > 0 ? "#05fa2e" : v < 0 ? "#fa0505" : "#94a3b8"
                ),
                yAxisID: "y",
            },
            {
                type: "line",
                label: t('menu.weeklyReportChart.percentLabel'),
                data: percentData,
                borderColor: "#3b82f6",
                pointBackgroundColor: "#3b82f6",
                tension: 0.3,
                yAxisID: "y1",
            },
        ],
    };

    const first = weekData.servers[0];

    return (
        <div className="server-chart">
            <h3 className="server-title">
                {t('menu.weeklyReportChart.weekTitle', { week: weekData.weekIndex + 1 })}
                {first && (
                    <span style={{ fontWeight: 400, fontSize: 13 }}>
                        {" "}
                        ({new Date(first.dautuan).toLocaleDateString(locale)} -{" "}
                        {new Date(first.cuoituan).toLocaleDateString(locale)})
                    </span>
                )}
            </h3>

            <div style={{ height: 380 }}>
                <Chart type="bar" data={data} options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { mode: "index", intersect: false },
                    scales: {
                        y: { beginAtZero: true },
                        y1: {
                            beginAtZero: true,
                            position: "right",
                            grid: { drawOnChartArea: false },
                        },
                    },
                }} />
            </div>
        </div>
    );
};


const WeeklyProfitChart = ({ type }) => {
    const { t, i18n } = useTranslation();
    const locale = i18n.language && i18n.language.startsWith('en') ? 'en-US' : 'vi-VN';

    const [servers, setServers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedWeekIndex, setSelectedWeekIndex] = useState(null);
    // null = đang hiển thị 5 tuần đầu
    const [weekSort, setWeekSort] = useState("none");
    // none | profit_desc | profit_asc


    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        const d = new Date(dateStr);
        return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")
            }/${d.getFullYear()}`;
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const res = await fetch(API_URL);
                if (!res.ok) throw new Error("API error");
                const json = await res.json();

                const list =
                    json?.data?.tocdo_tang_truong?.results?.[type] ?? [];

                setServers(list);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [type]);
    const getWeekTotalProfit = (week) =>
        week.servers.reduce((sum, s) => sum + (s.loinhuan ?? 0), 0);

    const getWeekAvgPercent = (week) => {
        if (!week.servers.length) return 0;
        const total = week.servers.reduce((sum, s) => sum + (s.percent ?? 0), 0);
        return total / week.servers.length;
    };
    const getWeekMaxPercent = (week) => {
        if (!week.servers.length) return 0;
        return Math.max(...week.servers.map(s => s.percent ?? 0));
    };
    const formatPercent = (value) => {
        const fixed = value.toFixed(2);
        return value > 0 ? `+${fixed}%` : `${fixed}%`;
    };

    const weeklyGroupedData = useMemo(() => {
        if (!servers.length) return [];

        const maxWeeks = Math.max(
            ...servers.map(s => s.cac_tuan?.length ?? 0)
        );

        const result = [];

        for (let i = 0; i < maxWeeks; i++) {
            const weekServers = servers
                .map(server => {
                    const week = server.cac_tuan?.[i];
                    if (!week) return null;

                    return {
                        name: server.name_server,
                        loinhuan: week.loinhuan ?? 0,
                        percent: Number(
                            (week.tilephantram_1tuan ?? 0).toFixed(2)
                        ),
                        dautuan: week.dautuan?.datetime,
                        cuoituan: week.cuoituan?.datetime,
                    };
                })
                .filter(Boolean);

            result.push({
                weekIndex: i,
                servers: weekServers,
            });
        }

        return result;
    }, [servers]);
    const sortedWeeks = useMemo(() => {
        let arr = [...weeklyGroupedData];

        if (weekSort === "profit_desc") {
            arr.sort(
                (a, b) =>
                    getWeekMaxPercent(b) - getWeekMaxPercent(a)
            );
        }

        if (weekSort === "profit_asc") {
            arr.sort(
                (a, b) =>
                    getWeekMaxPercent(a) - getWeekMaxPercent(b)
            );
        }

        return arr;
    }, [weeklyGroupedData, weekSort]);


    const visibleWeeks = sortedWeeks.slice(0, 5);


    if (loading) return <p>{t('menu.weeklyReportChart.loading')}</p>;
    if (error) return <p style={{ color: "red" }}>{t('menu.weeklyReportChart.error')}: {error}</p>;
    if (!servers.length) return <p>{t('menu.weeklyReportChart.noData')}</p>;

    return (
        <div className="servers-chart-list">
            {sortedWeeks.length > 0 && (
                <div className="week-controls">
                    <select
                        value={selectedWeekIndex ?? ""}
                        onChange={(e) => {
                            const value = e.target.value;
                            setSelectedWeekIndex(value === "" ? null : Number(value));
                        }}
                        className="week-select"
                    >
                        <option value="">{t('menu.weeklyReportChart.showFirst5Weeks')}</option>

                        {sortedWeeks.map((week, index) => {
                            const first = week.servers[0] ?? null;
                            return (
                                <option key={week.weekIndex} value={index}>
                                    {t('menu.weeklyReportChart.weekTitle', { week: week.weekIndex + 1 })}
                                    {first
                                        ? ` (${formatDate(first.dautuan)} - ${formatDate(first.cuoituan)})`
                                        : ""}
                                    {` | ${t('menu.weeklyReportChart.maxLabel')}: `}
                                    {formatPercent(getWeekMaxPercent(week))}
                                </option>

                            );
                        })}
                    </select>

                    <div className="sort-buttons">
                        <button
                            className={`sort-btn ${weekSort === "profit_desc" ? "active" : ""}`}
                            onClick={() => {
                                setWeekSort("profit_desc");
                                setSelectedWeekIndex(null);
                            }}
                        >
                            {t('menu.weeklyReportChart.sortDesc')}
                        </button>

                        <button
                            className={`sort-btn ${weekSort === "profit_asc" ? "active" : ""}`}
                            onClick={() => {
                                setWeekSort("profit_asc");
                                setSelectedWeekIndex(null);
                            }}
                        >
                            {t('menu.weeklyReportChart.sortAsc')}
                        </button>

                        <button
                            className={`sort-btn ${weekSort === "none" ? "active" : ""}`}
                            onClick={() => {
                                setWeekSort("none");
                                setSelectedWeekIndex(null);
                            }}
                        >
                            {t('menu.weeklyReportChart.sortNone')}
                        </button>
                    </div>

                </div>
            )}


            {selectedWeekIndex !== null &&
                sortedWeeks[selectedWeekIndex] && (
                    <WeeklyWeekChart
                        weekData={sortedWeeks[selectedWeekIndex]}
                        formatDate={formatDate}
                    />
                )}


            {selectedWeekIndex === null &&
                visibleWeeks.map((week) => (
                    <WeeklyWeekChart
                        key={week.weekIndex}
                        weekData={week}
                        formatDate={formatDate}
                    />
                ))}

        </div>

    );

};



export default WeeklyProfitChart;
