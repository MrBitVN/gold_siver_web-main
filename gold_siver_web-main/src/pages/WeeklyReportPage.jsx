import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import WeeklyProfitChart from "./WeeklyReportChart";
import "./WeeklyReportChart.css";

const WeeklyProfitPage = () => {

    const { t } = useTranslation();
    const [type, setType] = useState("vang");
    const [data, setData] = useState([]);

    const fetchSingleAPI = async (url) => {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        // Kiểm tra cấu trúc dữ liệu
        if (data.status === "success" && data.data && data.data.data) {
            const priceData = data.data.data;
            // ✅ Kiểm tra priceData không null trước khi truy cập
            if (!priceData || !priceData.site) {
                throw new Error("Invalid priceData structure: missing site");
            }
            const site = priceData.site || data.data.site;

            // name, do_uy_tin và quoc_gia nằm ở root level của response
            const name = data.name || site;
            const do_uy_tin =
                typeof data.do_uy_tin !== "undefined" && data.do_uy_tin !== null
                    ? data.do_uy_tin
                    : undefined;
            const quoc_gia = data.quoc_gia || "Vietnam"; // Default Vietnam

            return {
                site,
                name,
                fetched_at: priceData.fetched_at || priceData.time_date_get,
                items: priceData.items || [],
                timestamp: priceData.site_timestamp || priceData.time_date_get,
                do_uy_tin,
                quoc_gia,
            };
        }

        throw new Error("Invalid data structure");
    };

    return (
        <div className="weekly-chart-wrapper">
            <div className="weekly-chart-card">
                <h2 style={{ marginBottom: 20, color: "#e5e7eb" }}>
                    {t('menu.weeklyReportTitle', { metal: type === 'vang' ? t('menu.weeklyReport.metalGold') : t('menu.weeklyReport.metalSilver') })}
                </h2>

                {/* ===== TABS ===== */}
                <div className="chart-tabs">
                    <button
                        className={`chart-tab-btn ${type === "vang" ? "active" : ""}`}
                        onClick={() => {
                            setType("vang");
                        }}
                    >
                        {t('menu.weeklyReport.metalGold')}
                    </button>
                    <button
                        className={`chart-tab-btn ${type === "bac" ? "active" : ""}`}
                        onClick={() => {
                            setType("bac");
                        }}
                    >
                        {t('menu.weeklyReport.metalSilver')}
                    </button>
                </div>

                {/* ===== CHART ===== */}
                <WeeklyProfitChart type={type} />

            </div>
        </div>
    );
};

export default WeeklyProfitPage;
