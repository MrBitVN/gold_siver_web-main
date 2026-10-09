import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
const SLVShortCircle = () => {
    const { t, i18n } = useTranslation();
    const [todayData, setTodayData] = useState(null);
    const [history, setHistory] = useState([]);
    const [prediction, setPrediction] = useState(null);
    const [growthRate, setGrowthRate] = useState(null);
    const [giadudoan, setGiadudoan] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch("https://api_gold.thinkdiff.us/chartexchange_slv_short");
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

                const json = await res.json();

                setTodayData(json.data?.du_lieu_short_volume);
                setHistory(json.data?.chartexchange_short_volume || []);
                setPrediction(json.data?.gia_du_doan?.[0] ?? null);
                setGrowthRate(json.data?.ti_le_tang_truong ?? null);
                setGiadudoan(json.data);
            } catch (error) {
                console.error("Failed to fetch data:", error);
            }
        };

        fetchData();
    }, []);

    // loading + validate
    if (
        !todayData ||
        todayData.hom_nay_phan_tram == null ||
        todayData.trung_binh_30_ngay_phan_tram == null
    ) {
        return (
            <div style={{ color: "#fff", textAlign: "center", padding: "20px" }}>
                {t("slvShortCircle.loading")}
            </div>
        );
    }

    const avg = todayData.trung_binh_30_ngay_phan_tram;
    const today = todayData.hom_nay_phan_tram;

    const prev1 = history[1]?.total_short_volume_reported ?? null;
    const prev2 = history[2]?.total_short_volume_reported ?? null;
    const prev7 = history[6]?.total_short_volume_reported ?? null;

    const isSell = today > avg;

    const format = (num) =>
        typeof num === "number"
            ? new Intl.NumberFormat(i18n.language === "vi" ? "vi-VN" : "en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(num)
            : "--";
    const formatPrice = (num) =>
        typeof num === "number"
            ? new Intl.NumberFormat(i18n.language === "vi" ? "vi-VN" : "en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(num)
            : "--";

    const formatPercent = (num) =>
        typeof num === "number"
            ? new Intl.NumberFormat(i18n.language === "vi" ? "vi-VN" : "en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(num)
            : "--";
    const Circle = ({ value, label, size = 140 }) => {
        if (value == null) return null;

        const isSell = value > avg;

        return (
            <div style={{ textAlign: "center" }}>
                <div style={{
                    width: size,
                    height: size,
                    borderRadius: "50%",
                    background: `conic-gradient(${isSell ? '#FF4444' : '#2cfc03'} 0deg ${(value / 100) * 360}deg, rgba(255,255,255,0.1) ${(value / 100) * 360}deg 360deg)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                }}>
                    <div style={{
                        width: size - 30,
                        height: size - 30,
                        borderRadius: "50%",
                        background: "#1a1a1a",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                    }}>
                        <span style={{
                            fontSize: size / 6,
                            fontWeight: "bold",
                            color: isSell ? "#FF4444" : "#2cfc03"
                        }}>
                            {format(value)}%
                        </span>
                    </div>
                </div>

                <p style={{ marginTop: "8px", color: "#ccc" }}>{label}</p>
            </div>
        );
    };

    return (
        <div style={{
            padding: "20px",
            background: "rgba(255,255,255,0.05)",
            borderRadius: "10px"
        }}>
            <h2 style={{ textAlign: "center", color: "#fff" }}>
                {t("slvShortCircle.title")}
            </h2>

            <div style={{
                display: "flex",
                gap: "40px",
                flexWrap: "wrap",
                justifyContent: "center"
            }}>
                <div style={{ display: "flex", gap: "25px", flexWrap: "wrap" }}>
                    <Circle value={today} label={todayData.ngay_gio ?? "--"} />
                    <Circle value={prev1} label={t("slvShortCircle.prev1Day")} />
                    <Circle value={prev2} label={t("slvShortCircle.prev2Day")} />
                    <Circle value={prev7} label={t("slvShortCircle.prev7Day")} />
                </div>

                <div style={{ display: "flex", gap: "40px", color: "#ddd", fontSize: "16px" }}>
                    <div style={{ color: "#ddd", fontSize: "16px" }}>
                        <p><b>{todayData.ngay_gio ?? "--"}:</b> {format(today)}%</p>
                        <p><b>{t("slvShortCircle.avg30")}:</b> {format(avg)}%</p>
                        <p><b>{t("slvShortCircle.shortVolume")}:</b> {todayData.short_volume?.toLocaleString(
                            i18n.language === "vi" ? "vi-VN" : "en-US"
                        )}</p>

                        {/* 👇 THÊM MỚI */}
                        <p>
                            <b>{t("slvShortCircle.prediction")}:</b>{" "}
                            <span style={{ color: "#00ccff" }}>
                                {formatPrice(prediction)}
                            </span>
                        </p>

                        <p>
                            <b>{t("slvShortCircle.growth")}:</b>{" "}
                            <span style={{
                                color:
                                    growthRate == null
                                        ? "#ccc"
                                        : growthRate >= 0
                                            ? "#2cfc03"
                                            : "#FF4444",
                                fontWeight: "bold"
                            }}>
                                {formatPercent(growthRate)}%
                            </span>
                        </p>

                        <p style={{
                            marginTop: "10px",
                            fontWeight: "bold",
                            color: isSell ? "#FF4444" : "#2cfc03"
                        }}>
                            {isSell
                                ? t("slvShortCircle.sell")
                                : t("slvShortCircle.buy")}
                        </p>

                    </div>
                    <div style={{ flex: 1 }}>
                        <h4><b>{t("slvShortCircle.predictedprice")}</b></h4>
                        <p>
                            <b>{t("slvShortCircle.lowPrice")}:</b>{" "}
                            <span style={{ color: "#00ccff" }}>
                                {formatPrice(giadudoan?.gia_du_doan?.[0])}
                            </span>
                        </p>
                        <p><b>{t("slvShortCircle.highPrice")}:</b> {formatPrice(giadudoan?.gia_du_doan_cao_nhat)}</p>
                        <p><b>{t("slvShortCircle.closePrice")}:</b> {formatPrice(giadudoan?.gia_du_doan_dong_cua)}</p>
                        <p><b>{t("slvShortCircle.openPrice")}:</b> {formatPrice(giadudoan?.gia_du_doan_mo_cua)}</p>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default SLVShortCircle;