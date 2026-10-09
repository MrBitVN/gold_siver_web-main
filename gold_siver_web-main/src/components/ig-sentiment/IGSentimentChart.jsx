import React, { useEffect, useState } from "react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
    Legend
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Bar } from "react-chartjs-2";
import "./IGSentimentChart.css";
import { useTranslation } from "react-i18next";



ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const IGPriceBarChart = () => {
    const { t } = useTranslation();
    const [dataList, setDataList] = useState([]);
    const [timeRange, setTimeRange] = useState("7days");
    const [expanded, setExpanded] = useState(false);


    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch("https://api_gold.thinkdiff.us/ig_sentiment");
                const data = await res.json();

                if (!data.ig_sentiment) return;

                let filtered = [...data.ig_sentiment];

                // sort tăng dần
                filtered.sort(
                    (a, b) => new Date(a.ngay_tao) - new Date(b.ngay_tao)
                );

                const now = new Date();

                if (expanded) {
                    if (timeRange === "7days") {
                        const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
                        filtered = filtered.filter(
                            item => new Date(item.ngay_tao) >= sevenDaysAgo
                        );
                    } else if (timeRange === "30days") {
                        const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
                        filtered = filtered.filter(
                            item => new Date(item.ngay_tao) >= thirtyDaysAgo
                        );
                    }
                    // all => giữ nguyên
                } else {
                    // 👈 mặc định chỉ 10 bản ghi mới nhất
                    filtered = filtered.slice(-10);
                }

                setDataList(filtered);
            } catch (err) {
                console.error("Error fetching data:", err);
            }
        };

        fetchData();
    }, [timeRange, expanded]);



    const labels = dataList.map(item => {
        const date = new Date(item.ngay_tao);
        return date.toLocaleString("vi-VN", {
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        });
    });

    const chartData = {
        labels,
        datasets: [
            {
                label: "LONG (%)",
                data: dataList.map(i => i.sentiment_long),
                backgroundColor: "#4CAF50",
                borderRadius: 4,
                datalabels: {
                    display: true,
                    color: "#4CAF50",
                    anchor: "end",
                    align: "top",
                    font: {
                        weight: "bold",
                        size: 11
                    },
                    formatter: v => v + "%"
                }
            },

            {
                label: "SHORT (%)",
                data: dataList.map(i => i.sentiment_short),
                backgroundColor: "#F44336",
                borderRadius: 4,
                datalabels: {
                    display: false // 👈 chặn luôn
                }
            }

        ]
    };


    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "top",
                labels: {
                    color: "#fff",
                    font: { size: 12 }
                }
            },
            tooltip: {
                callbacks: {
                    label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y}%`
                },
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                titleColor: "#fff",
                bodyColor: "#fff"
            }
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { color: "#999" }
            },
            y: {
                min: 0,
                max: 100,
                ticks: {
                    color: "#999",
                    callback: value => value + "%"
                },
                grid: { color: "rgba(255, 255, 255, 0.1)" }
            }
        }
    };


    return (
        <div className="ig-chart-container">
            <div className="ig-chart-header">
                <h3>{t("IGPriceBarChart.title")}</h3>
                <div className="time-range-buttons">
                    <button
                        className={`time-btn ${timeRange === "7days" ? "active" : ""}`}
                        onClick={() => setTimeRange("7days")}
                    >
                        {t("IGPriceBarChart.7days")}
                    </button>
                    <button
                        className={`time-btn ${timeRange === "30days" ? "active" : ""}`}
                        onClick={() => setTimeRange("30days")}
                    >
                        {t("IGPriceBarChart.30days")}
                    </button>
                    <button
                        className={`time-btn ${timeRange === "all" ? "active" : ""}`}
                        onClick={() => setTimeRange("all")}
                    >
                        {t("IGPriceBarChart.all")}
                    </button>
                    <button
                        className="time-btn"
                        onClick={() => setExpanded(prev => !prev)}
                    >
                        {expanded ? t("IGPriceBarChart.hide10") : t("IGPriceBarChart.more")}
                    </button>


                </div>
            </div>
            <div className="ig-chart-wrapper">
                {dataList.length > 0 ? (
                    <Bar
                        data={chartData}
                        options={options}
                        plugins={[ChartDataLabels]} // 👈 chỉ chart này dùng
                    />
                ) : (
                    <div className="no-data">{t("IGPriceBarChart.error")}</div>
                )}
            </div>
        </div>
    );
};

export default IGPriceBarChart;
