import React, { useEffect, useState } from "react";
import "./SLVStatsCard.css";
import { useTranslation } from "react-i18next";
const SLVStats = () => {
    const { t } = useTranslation();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let alive = true;

        const load = async () => {
            try {
                const res = await fetch("https://api_gold.thinkdiff.us/SLV_von_vao");
                if (!res.ok) throw new Error(res.status);

                const data = await res.json();

                /**
                 * ⚠️ Giả sử object stats nằm trực tiếp
                 * Nếu API của bạn bọc trong mảng hay key khác
                 * chỉ cần sửa dòng này
                 */
                const info =
                    data?.slv_chartexchange_info_cophieu?.[0] ||
                    data?.slv_stats?.[0] ||
                    data?.slv_overview?.[0] ||
                    null;


                if (alive) setStats(info);
            } catch (err) {
                console.error("SLV Stats fetch error:", err);
            } finally {
                if (alive) setLoading(false);
            }
        };

        load();
        return () => (alive = false);
    }, []);

    if (!stats) return null;

    const formatNumber = (n) =>
        n?.toLocaleString(undefined, { maximumFractionDigits: 2 });

    return (
        <div className="slv-stats-card">
            <div className="slv-stats-header">
                {t("SLVStats.title", "SLV Stats")}
                <div className="slv-stats-timestamp">
                    {t("SLVTradingChart.lastUpdate")} {stats.time_insert}
                </div>
            </div>


            <div className="slv-stats-grid">
                <Stat label={t("SLVStats.marketCap", "Market Cap")} value={`${formatNumber(stats.market_cap)}`} />
                <Stat label={t("SLVStats.sharesOut", "Shares Out")} value={formatNumber(stats.shares_out)} />
                <Stat label={t("SLVStats.onOffExchange", "On / Off Exchange")} value={`${stats.On_Off_Exchange}% / ${100 - stats.On_Off_Exchange}%`} />

                <Stat label={t("SLVStats.avgVol10d", "Avg Vol (10 Day)")} value={formatNumber(stats.avg_vol_10_day)} />
                <Stat label={t("SLVStats.avgVol30d", "Avg Vol (30 Day)")} value={formatNumber(stats.avg_vol_30_day)} />

                <Stat label={t("SLVStats.beta6m", "6 Month Beta")} value={stats["6_Month_Beta"]} />
                <Stat label={t("SLVStats.beta1y", "1 Year Beta")} value={stats["1_Year_Beta"]} />
                <Stat label={t("SLVStats.beta2y", "2 Year Beta")} value={stats["2_Year_Beta"]} />
                <Stat label={t("SLVStats.beta3y", "3 Year Beta")} value={stats["3_Year_Beta"]} />

                <Stat label={t("SLVStats.low52w", "52 Week Low")} value={stats["52_Week_Low"]} />
                <Stat label={t("SLVStats.high52w", "52 Week High")} value={stats["52_Week_High"]} />

                <Stat label={t("SLVStats.sma50", "SMA50")} value={stats.SMA50} />
                <Stat label={t("SLVStats.sma200", "SMA200")} value={stats.SMA200} />
            </div>

            <div className="slv-returns">
                <Return label={t("SLVStats.1w", "1 Week")} value={stats["1_Week"]} />
                <Return label={t("SLVStats.1m", "1 Month")} value={stats["1_Month"]} />
                <Return label={t("SLVStats.3m", "3 Month")} value={stats["3_Month"]} />
                <Return label={t("SLVStats.6m", "6 Month")} value={stats["6_Month"]} />
                <Return label={t("SLVStats.1y", "1 Year")} value={stats["1Year"]} />
                <Return label={t("SLVStats.2y", "2 Year")} value={stats["2Year"]} />
                <Return label={t("SLVStats.5y", "5 Year")} value={stats["5Year"]} />
            </div>
        </div>
    );
};

const Stat = ({ label, value }) => (
    <div className="slv-stat">
        <span>{label}</span>
        <strong>{value}</strong>
    </div>
);

const Return = ({ label, value }) => {
    const positive = value >= 0;
    return (
        <div className={`slv-return ${positive ? "up" : "down"}`}>
            <span>{label}</span>
            <strong>{positive ? "+" : ""}{value}%</strong>
        </div>
    );
};

export default SLVStats;
