import React, { useState, useEffect } from "react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import "./TableComparisonDataWeek.css";
import { useTranslation } from "react-i18next";
// Register Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// --- Các hàm Format giữ nguyên ---
const formatDate = (ts) => {
    if (!ts) return "-";
    try {
        return new Date(ts).toLocaleDateString("vi-VN");
    } catch (e) { return "-"; }
};

const formatVND = (v) => {
    if (typeof v !== "number" || isNaN(v)) return "0";
    return Math.round(v).toLocaleString("en-US");
};

const formatVolume = (v) => {
    if (typeof v !== "number" || isNaN(v)) return "0.000";
    return parseFloat(v).toFixed(3);
};

// --- Component ChartView giữ nguyên Logic ---
const ChartView = ({ goldData, silverData }) => {
    const { t } = useTranslation();
    const [showAllWeeks, setShowAllWeeks] = useState(false);
    if (!goldData && !silverData) return null;

    const process = (arr) => (arr || []).sort((a, b) =>
        new Date(b.phantu_cuoituan?.timestamp).getTime() - new Date(a.phantu_cuoituan?.timestamp).getTime()
    );

    const goldSorted = process(goldData);
    const silverSorted = process(silverData);

    const maxWeeks = Math.max(goldSorted.length, silverSorted.length);
    const weeksToShow = showAllWeeks ? maxWeeks : Math.min(4, maxWeeks);

    const gSlice = goldSorted.slice(0, weeksToShow);
    const sSlice = silverSorted.slice(0, weeksToShow);

    const primaryWeeks = gSlice.length >= sSlice.length ? gSlice : sSlice;
    const categories = primaryWeeks.map((w, idx) => {
        const start = formatDate(w?.phantu_dautuan?.timestamp);
        const end = formatDate(w?.phantu_cuoituan?.timestamp);
        return `${t("TableComparisonDataWeek.period", { num: primaryWeeks.length - idx })}: ${start} - ${end}`;
    });

    return (
        <div className="chart-container">
            <div className="chart-header">
                <h3 className="chart-title">{t("TableComparisonDataWeek.chart.title")}</h3>
                <button className={`filter-btn ${showAllWeeks ? "active" : ""}`} onClick={() => setShowAllWeeks(!showAllWeeks)}>
                    {showAllWeeks
                        ? t("TableComparisonDataWeek.chart.collapse")
                        : t("TableComparisonDataWeek.chart.expand")}
                </button>
            </div>
            <div className="chart-wrapper">
                <Bar
                    data={{
                        labels: categories,
                        datasets: [
                            { label: t("TableComparisonDataWeek.gold"), data: gSlice.map(w => w.ti_le_tang_truong), backgroundColor: "#f1c40f", borderRadius: 4 },
                            { label: t("TableComparisonDataWeek.silver"), data: sSlice.map(w => w.ti_le_tang_truong), backgroundColor: "#c0c0c0", borderRadius: 4 }
                        ]
                    }}
                    plugins={[{
                        id: 'datalabels',
                        afterDraw: (chart) => {
                            const ctx = chart.ctx;
                            ctx.font = 'bold 11px Arial';
                            ctx.textAlign = 'center';
                            chart.data.datasets.forEach((dataset, i) => {
                                const meta = chart.getDatasetMeta(i);
                                meta.data.forEach((bar, index) => {
                                    const data = dataset.data[index];
                                    if (data) {
                                        ctx.fillStyle = data > 0 ? '#2ecc71' : '#e74c3c';
                                        ctx.fillText(data.toFixed(2) + '%', bar.x, data >= 0 ? bar.y - 6 : bar.y + 15);
                                    }
                                });
                            });
                        }
                    }]}
                    options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: "#fff" } }, tooltip: { enabled: false } } }}
                />
            </div>
        </div>
    );
};

// --- Component TableComponent giữ nguyên Logic ---
const TableComponent = ({ title, type, data }) => {
    const { t } = useTranslation();
    const [showExtra, setShowExtra] = useState(false);
    const [showAll, setShowAll] = useState(false);
    if (!data) return null;

    const sorted = [...data].sort((a, b) =>
        new Date(b.phantu_cuoituan?.timestamp).getTime() - new Date(a.phantu_cuoituan?.timestamp).getTime()
    );
    const weeks = showAll ? sorted : sorted.slice(0, 4);

    return (
        <div className="analysis-block">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className={`analysis-title-${type === "au" ? "gold" : "silver"}`}>{title}</h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="filter-btn" onClick={() => setShowAll(!showAll)}>{showAll
                        ? t("TableComparisonDataWeek.chart.collapse")
                        : t("TableComparisonDataWeek.chart.expand")}</button>
                    <button className="filter-btn" onClick={() => setShowExtra(!showExtra)}>{showExtra
                        ? t("TableComparisonDataWeek.table.hide")
                        : t("TableComparisonDataWeek.table.detail")}</button>
                </div>
            </div>
            <table className="analysis-table">
                <thead>
                    <tr>
                        <th>{t("TableComparisonDataWeek.table.time")}</th>
                        <th>{t("TableComparisonDataWeek.table.profit")}</th>
                        <th>{t("TableComparisonDataWeek.table.growth")}</th>
                        <th>{t("TableComparisonDataWeek.table.volume")}</th>
                        {showExtra && <>
                            <th>{t("TableComparisonDataWeek.table.sellStart")}</th>
                            <th>{t("TableComparisonDataWeek.table.buyStart")}</th>
                            <th>{t("TableComparisonDataWeek.table.sellEnd")}</th>
                            <th>{t("TableComparisonDataWeek.table.buyEnd")}</th>
                        </>}
                    </tr>
                </thead>
                <tbody>
                    {weeks.map((w, idx) => {
                        const loiNhuan = w.phantu_cuoituan?.close_price - w.phantu_dautuan?.open_price;
                        return (
                            <tr key={idx}>
                                <td><b>{t("TableComparisonDataWeek.period", { num: weeks.length - idx })}</b><br /><small>{formatDate(w.phantu_dautuan?.timestamp)} - {formatDate(w.phantu_cuoituan?.timestamp)}</small></td>
                                <td className={loiNhuan >= 0 ? "text-up" : "text-down"}>{formatVND(loiNhuan)} $</td>
                                <td style={{ color: w.ti_le_tang_truong >= 0 ? "#2ecc71" : "#e74c3c", fontWeight: "bold" }}>{w.ti_le_tang_truong.toFixed(2)}%</td>
                                <td>{formatVolume(w.volume_trungbinh)}</td>
                                {showExtra && <>
                                    <td>{formatVND(w.phantu_dautuan?.open_price)}</td>
                                    <td>{formatVND(w.phantu_dautuan?.close_price)}</td>
                                    <td>{formatVND(w.phantu_cuoituan?.open_price)}</td>
                                    <td>{formatVND(w.phantu_cuoituan?.close_price)}</td>
                                </>}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

// --- Main Component đã sửa để tự gọi API ---
const TableComparisonDataWeek = () => {
    const { t } = useTranslation();
    const [viewMode, setViewMode] = useState('chart');
    const [fomoData, setFomoData] = useState(null);

    useEffect(() => {
        fetch("https://api_gold.thinkdiff.us/tinh_tile_phat_trien_tung_ngay_tuan_thang")
            .then(res => res.json())
            .then(json => {
                const raw = json.tinh_tile_phat_trien_tung_ngay_tuan_thang;

                // Mapper: Chuyển đổi dữ liệu API mới về format code cũ đang dùng
                const mapper = (arr) => arr.map(item => ({
                    ti_le_tang_truong: item.ti_le_tang_truong,
                    volume_trungbinh: item.tong_volume,
                    phantu_dautuan: { timestamp: item.time_dautien, open_price: item.open, close_price: item.close },
                    phantu_cuoituan: { timestamp: item.time_dautien, open_price: item.open, close_price: item.close }
                }));

                setFomoData({
                    nhanxet_vang_tangtruong: mapper(raw.data_vang_7ngay_trave),
                    nhanxet_bac_tangtruong: mapper(raw.data_bac_7ngay_trave)
                });
            });
    }, []);

    if (!fomoData) return <div className="no-data-message"><p>{t("TableComparisonDataWeek.loading")}</p></div>;

    return (
        <div style={{ padding: '20px', backgroundColor: '#111827', minHeight: '100vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ color: '#f1c40f', margin: 0 }}>{t("TableComparisonDataWeek.title")}</h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`} onClick={() => setViewMode('table')}>{t("TableComparisonDataWeek.view.table")}</button>
                    <button className={`view-toggle-btn ${viewMode === 'chart' ? 'active' : ''}`} onClick={() => setViewMode('chart')}>{t("TableComparisonDataWeek.view.chart")}</button>
                </div>
            </div>

            {viewMode === 'chart' ? (
                <ChartView goldData={fomoData.nhanxet_vang_tangtruong} silverData={fomoData.nhanxet_bac_tangtruong} />
            ) : (
                <>
                    <TableComponent title={`${t("TableComparisonDataWeek.gold")}`}  type="au" data={fomoData.nhanxet_vang_tangtruong} />
                    <TableComponent title={`${t("TableComparisonDataWeek.silver")}`}  type="ag" data={fomoData.nhanxet_bac_tangtruong} />
                </>
            )}
        </div>
    );
};

export default TableComparisonDataWeek;