import React, { useEffect, useState, useRef } from "react";
import { Bar, Line, getElementAtEvent } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { useTranslation } from "react-i18next";
import i18n from "i18next";
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

// --- STYLES ---
const containerStyle = {
    background: "#0f172a",
    color: "#333",
    padding: "20px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    minHeight: "100vh"
};

const cardStyle = {
    background: "rgba(30, 41, 59, 0.23)",
    padding: "24px",
    borderRadius: "12px",
    boxShadow: "0 2px 10px rgba(0, 0, 0, 0)",
    marginBottom: "24px",
    color: "#f9fbfc"
};

const tableHeaderStyle = {
    padding: "16px",
    textAlign: "left",
    borderBottom: "1px solid #343638",
    color: "#ffffff",
    fontSize: "12px",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.05em"
};

const tableCellStyle = {
    padding: "16px",
    borderBottom: "1px solid #606775",
    fontSize: "14px",
    fontWeight: "500",
    color: "#ffffff"
};

const btnStyle = {
    padding: "8px 16px",
    background: "#3b82f6",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "600",
    transition: "background 0.2s"
};

function CFTC_Chart() {
    const { t } = useTranslation();
    const [dataChart, setDataChart] = useState([]);
    const [selectedDetail, setSelectedDetail] = useState(null); // Lưu dữ liệu ngày được chọn
    const [isLoading, setIsLoading] = useState(false);
    const chartRef = useRef();

    const [currentDate, setCurrentDate] = useState(() => {
        const date = new Date();
        return { month: date.getMonth() + 1, year: date.getFullYear() };
    });
    const formatDate = (date) =>
        new Date(date).toLocaleDateString(
            i18n.language === "vi" ? "vi-VN" : "en-US"
        );
    // --- FETCH DỮ LIỆU ---
    useEffect(() => {
        setIsLoading(true);

        // Tạo danh sách 1 tháng
        const monthsToFetch = [];
        for (let i = 0; i < 1; i++) {
            let month = currentDate.month - i;
            let year = currentDate.year;
            if (month <= 0) {
                month += 12;
                year -= 1;
            }
            monthsToFetch.push({ month, year });
        }

        const urls = monthsToFetch.map(m => `https://api_gold.thinkdiff.us/cftc_tuonglai_thang/${m.month}/${m.year}`);
        console.log(`[Fetch] Đang gọi API cho tháng ${currentDate.month}/${currentDate.year}`);

        // Fetch tất cả URLs đồng thời
        Promise.all(urls.map(url => fetch(url).then(response => response.json())))
            .then(results => {
                let allData = [];
                results.forEach(res => {
                    if (res.status === "success" && Array.isArray(res.ketqua)) {
                        allData = allData.concat(res.ketqua);
                    }
                });
                // Sắp xếp ngày tăng dần
                const sortedData = allData.sort((a, b) => new Date(a.day) - new Date(b.day));
                setDataChart(sortedData);

                // Reset selection khi đổi tháng
                setSelectedDetail(null);
            })
            .catch(error => console.error("Error:", error))
            .finally(() => setIsLoading(false));
    }, [currentDate.month, currentDate.year]);

    const handleMonthChange = (direction) => {
        setCurrentDate(prev => {
            let newMonth = prev.month + direction;
            let newYear = prev.year;
            if (newMonth > 12) { newMonth = 1; newYear += 1; }
            else if (newMonth < 1) { newMonth = 12; newYear -= 1; }
            return { month: newMonth, year: newYear };
        });
    };

    // Helper: Lấy giá trị positions
    const getPos = (arr, type) => {
        const item = arr?.find(i => i.position_type === type);
        return item ? item.positions : 0;
    };

    // --- XỬ LÝ CLICK CHART TỔNG QUAN ---
    const onMainChartClick = (event) => {
        const { current: chart } = chartRef;
        if (!chart) return;
        const element = getElementAtEvent(chart, event);

        if (element.length > 0) {
            const { index } = element[0];
            const clickedDayData = dataChart[index];

            // Xử lý dữ liệu cho bảng và biểu đồ chi tiết
            if (clickedDayData) {
                // Tạo danh sách chi tiết cho bảng (Table)
                const tableData = [
                    ...(clickedDayData.vang || []).map(i => ({ ...i, commodity: t("CFTC_Chart.gold") })),
                    ...(clickedDayData.bac || []).map(i => ({ ...i, commodity: t("CFTC_Chart.silver") }))
                ];

                // Tạo dữ liệu cho 2 biểu đồ so sánh (Line Charts)
                const commodities = [t("CFTC_Chart.gold"), t("CFTC_Chart.silver")]; // Trục X
                const longValues = [getPos(clickedDayData.vang, "Long"), getPos(clickedDayData.bac, "Long")];
                const shortValues = [getPos(clickedDayData.vang, "Short"), getPos(clickedDayData.bac, "Short")];

                setSelectedDetail({
                    date: clickedDayData.day,
                    tableData: tableData,
                    chartData: {
                        labels: commodities,
                        long: longValues,
                        short: shortValues
                    }
                });
            }
        }
    };

    // 1. DATA CHO MAIN BAR CHART (LỊCH SỬ THÁNG)
    const mainChartLabels = dataChart.map(i => {
        const d = new Date(i.day);
        return `${d.getDate()}/${d.getMonth() + 1}`;
    });

    const mainChartData = {
        labels: mainChartLabels,
        datasets: [
            {
                label: t("CFTC_Chart.gold_total"),
                data: dataChart.map(i => getPos(i.vang, "Long") + getPos(i.vang, "Short")),
                backgroundColor: '#fbbf24',
                borderRadius: 4,
            },
            {
                label: t("CFTC_Chart.silver_total"),
                data: dataChart.map(i => getPos(i.bac, "Long") + getPos(i.bac, "Short")),
                backgroundColor: '#94a3b8',
                borderRadius: 4,
            }
        ]
    };

    // 2. DATA CHO LINE CHARTS (CHI TIẾT NGÀY) - Dựa trên selectedDetail
    const detailOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                titleColor: '#1f2937',
                bodyColor: '#1f2937',
                borderColor: '#e5e7eb',
                borderWidth: 1,
                padding: 10,
                displayColors: false,
                callbacks: {
                    label: (context) => `${context.parsed.y.toLocaleString(
                        i18n.language === "vi" ? "vi-VN" : "en-US"
                    )} ${t("contracts")}`
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: "#f3f4f6", borderDash: [5, 5] },
                ticks: { color: "#9ca3af" }
            },
            x: {
                grid: { display: false },
                ticks: { color: "#4b5563", font: { weight: 'bold' } }
            }
        },
        elements: {
            line: { tension: 0.4 }, // Đường cong mềm
            point: { radius: 6, hoverRadius: 8, borderWidth: 2, backgroundColor: "#fff" }
        }
    };

    return (
        <div style={containerStyle}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <button onClick={() => handleMonthChange(-1)} style={btnStyle}>{t("CFTC_Chart.prev_month")}</button>
                <h2 style={{ margin: 0, color: "#fcfdfd" }}>{t("CFTC_Chart.title", { month: currentDate.month, year: currentDate.year })}</h2>
                <button onClick={() => handleMonthChange(1)} style={btnStyle}>{t("CFTC_Chart.next_month")}</button>
            </div>

            {/* CHART 1: LỊCH SỬ (MAIN CHART) */}
            <div style={cardStyle}>
                <h3 style={{ margin: "0 0 16px 0", color: "#f5f5f5" }}>{t("CFTC_Chart.history")}</h3>
                <div style={{ height: "300px" }}>
                    <Bar
                        ref={chartRef}
                        data={mainChartData}
                        options={{ maintainAspectRatio: false, plugins: { legend: { position: 'top' } } }}
                        onClick={onMainChartClick}
                    />
                </div>
            </div>

            {/* PHẦN CHI TIẾT (HIỆN RA KHI CLICK) */}
            {selectedDetail && (
                <div className="detail-section">
                    <div style={{ textAlign: "center", marginBottom: "20px" }}>
                        <span style={{ background: "#dbeafe", color: "#1e40af", padding: "6px 16px", borderRadius: "20px", fontWeight: "bold", fontSize: "14px" }}>
                            {t("CFTC_Chart.date_label")}: {formatDate(selectedDetail.date)}
                        </span>
                    </div>

                    {/* HAI BIỂU ĐỒ ĐƯỜNG (LONG vs SHORT) */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>

                        {/* Biểu đồ Vị thế Mua */}
                        <div style={cardStyle}>
                            <h4 style={{ margin: "0 0 12px 0", color: "#3b82f6", fontSize: "16px" }}>{t("CFTC_Chart.long_position")}</h4>
                            <div style={{ height: "250px" }}>
                                <Line
                                    data={{
                                        labels: selectedDetail.chartData.labels,
                                        datasets: [{
                                            data: selectedDetail.chartData.long,
                                            borderColor: '#3b82f6',
                                            backgroundColor: (context) => {
                                                const ctx = context.chart.ctx;
                                                const gradient = ctx.createLinearGradient(0, 0, 0, 250);
                                                gradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
                                                gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');
                                                return gradient;
                                            },
                                            fill: true,
                                            pointBorderColor: '#3b82f6'
                                        }]
                                    }}
                                    options={detailOptions}
                                />
                            </div>
                        </div>

                        {/* Biểu đồ Vị thế Bán */}
                        <div style={cardStyle}>
                            <h4 style={{ margin: "0 0 12px 0", color: "#6366f1", fontSize: "16px" }}>{t("CFTC_Chart.short_position")}</h4>
                            <div style={{ height: "250px" }}>
                                <Line
                                    data={{
                                        labels: selectedDetail.chartData.labels,
                                        datasets: [{
                                            data: selectedDetail.chartData.short,
                                            borderColor: '#6366f1',
                                            backgroundColor: (context) => {
                                                const ctx = context.chart.ctx;
                                                const gradient = ctx.createLinearGradient(0, 0, 0, 250);
                                                gradient.addColorStop(0, 'rgba(99, 102, 241, 0.4)');
                                                gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');
                                                return gradient;
                                            },
                                            fill: true,
                                            pointBorderColor: '#6366f1'
                                        }]
                                    }}
                                    options={detailOptions}
                                />
                            </div>
                        </div>
                    </div>

                    {/* BẢNG CHI TIẾT */}
                    <div style={{ ...cardStyle, padding: "0", overflow: "hidden" }}>
                        <div style={{ padding: "16px 24px", borderBottom: "1px solid #e5e7eb", background: "#1c1f22" }}>
                            <h4 style={{ margin: 0, color: "#dadde3" }}>{t("CFTC_Chart.tabledataa")}</h4>
                        </div>
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead>
                                    <tr style={{ background: "#1a1b1d" }}>
                                        <th style={tableHeaderStyle}>{t("CFTC_Chart.table.commodity")}</th>
                                        <th style={tableHeaderStyle}>{t("CFTC_Chart.table.position_type")}</th>
                                        <th style={{ ...tableHeaderStyle, textAlign: "right" }}>{t("CFTC_Chart.table.quantity")}</th>
                                        <th style={{ ...tableHeaderStyle, textAlign: "right" }}>{t("CFTC_Chart.table.change")}</th>
                                        <th style={{ ...tableHeaderStyle, textAlign: "right" }}>{t("CFTC_Chart.table.previous")}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedDetail.tableData.map((row, idx) => (
                                        <tr key={idx} style={{ ":hover": { background: "#f9fafb" } }}>
                                            <td style={{ ...tableCellStyle, color: row.commodity === "Vàng" ? "#e3a155" : "#c6d0de", fontWeight: "bold" }}>
                                                {row.commodity}
                                            </td>
                                            <td style={tableCellStyle}>
                                                {row.position_type === "Long" ? <span style={{ color: "#2563eb", background: "#dbeafe", padding: "2px 8px", borderRadius: "4px", fontSize: "12px" }}>{t('CFTC_Chart.position.long')}</span> :
                                                    row.position_type === "Short" ? <span style={{ color: "#dc2626", background: "#fee2e2", padding: "2px 8px", borderRadius: "4px", fontSize: "12px" }}>{t('CFTC_Chart.position.short')}</span> :
                                                        t('CFTC_Chart.position.neutral')}
                                            </td>
                                            <td style={{ ...tableCellStyle, textAlign: "right", fontWeight: "bold" }}>
                                                {Number(row.positions).toLocaleString(i18n.language === "vi" ? "vi-VN" : "en-US")}
                                            </td>
                                            <td style={{ ...tableCellStyle, textAlign: "right", color: row.change_val > 0 ? "#16a34a" : row.change_val < 0 ? "#dc2626" : "#9ca3af" }}>
                                                {row.change_val > 0 ? "+" : ""}{Number(row.change_val).toLocaleString(i18n.language === "vi" ? "vi-VN" : "en-US")}
                                            </td>
                                            <td style={{ ...tableCellStyle, textAlign: "right", color: "#6b7280" }}>
                                                {Number(row.positions_prev).toLocaleString(i18n.language === "vi" ? "vi-VN" : "en-US")}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CFTC_Chart;