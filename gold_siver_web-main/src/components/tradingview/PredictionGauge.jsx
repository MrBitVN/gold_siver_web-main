import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import GaugeChart from "../fear-chart/GaugeChart";
import "./PredictionGauge.css";
import CountdownTimer from "../CountdownTime/CountdownTimer";
import { useTranslation } from "react-i18next";
// Component xử lý hiệu ứng sóng nước nhấp nhô
const WaveText = ({ text, color }) => {
    return (
        <div className="wave-content">
            <h2 className="wave-bg" style={{ WebkitTextStroke: `1px ${color}` }}>{text}</h2>
            <h2 className="wave-water" style={{ color: color }}>{text}</h2>
        </div>
    );
};

const PredictionGauge = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [goldPrediction, setGoldPrediction] = useState(null);
    const [silverPrediction, setSilverPrediction] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hoverGold, setHoverGold] = useState(false);
    const [hoverSilver, setHoverSilver] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [notification, setNotification] = useState(null);

    const audioRef = useRef(new Audio("/con_du_dia_tang.mp3"));
    const lastNotiTime = useRef(0);

    const fetchPrediction = async () => {
        try {
            setLoading(true);
            const response = await fetch("https://api_gold.thinkdiff.us/du_doan_gia_vang_gia_bac_trongngay");
            const data = await response.json();
            const timestamp = data.timestamp;
            setLastUpdated(timestamp);

            const goldDiff = data.predicted_gold_price - data.actual_gold_price;
            const silverDiff = data.predicted_silver_price - data.actual_silver_price;

            // Xanh lá (#00d084) khi thấp hơn dự đoán (diff >= 0)
            // Đỏ (#ff4444) khi cao hơn dự đoán (diff < 0)
            setGoldPrediction({
                change: (goldDiff / data.actual_gold_price) * 100,
                percentage: Math.min(Math.abs(goldDiff / data.actual_gold_price) * 100 / 5 * 100, 100),
                predicted: data.predicted_gold_price,
                actual: data.actual_gold_price,
                etfChange: data.gold_etf_change_pct,
                color: goldDiff >= 0 ? "#00d084" : "#ff4444",
            });

            setSilverPrediction({
                change: (silverDiff / data.actual_silver_price) * 100,
                percentage: Math.min(Math.abs(silverDiff / data.actual_silver_price) * 100 / 10 * 100, 100),
                predicted: data.predicted_silver_price,
                actual: data.actual_silver_price,
                etfChange: data.silver_etf_change_pct,
                color: silverDiff >= 0 ? "#00d084" : "#ff4444",
            });

            setError(null);
        } catch (err) {
            setError("Không thể tải dữ liệu");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPrediction();
        const interval = setInterval(fetchPrediction, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    if (loading || error || (!goldPrediction && !silverPrediction)) return null;

    return (
        <div className="prediction-containerer">
            <div className="header-row-custom">
                <div className="title-group">
                    <h2 className="prediction-title">
                        {t("predictionGauge.title")} <span className="highlight-time">
                            <CountdownTimer updateTime={new Date(lastUpdated).toLocaleString("vi-VN")} />
                        </span>
                    </h2>
                    <p className="prediction-updated">{t("predictionGauge.updated")} {new Date(lastUpdated).toLocaleString("vi-VN")}</p>
                </div>
                <button className="refresh-btn" onClick={fetchPrediction}>
                    {t("predictionGauge.refresh")}
                </button>
            </div>

            <div className="prediction-grid">
                {[
                    { item: goldPrediction, title: t("predictionGauge.gold"), hover: hoverGold, setHover: setHoverGold },
                    { item: silverPrediction, title: t("predictionGauge.silver"), hover: hoverSilver, setHover: setHoverSilver }
                ].map((p, index) => p.item && (
                    <div className="prediction-item" key={index}>
                        <h3>{t("predictionGauge.predicted")} {p.title}</h3>
                        <div className="prediction-info">
                            <p className="actual">{t("predictionGauge.actual")} ${p.item.actual.toFixed(2)}</p>

                            <div className="wave-text-wrapper">
                                <span className="label-sub">{t("predictionGauge.predicted")}</span>
                                <WaveText text={`$${p.item.predicted.toFixed(2)}`} color={p.item.color} />
                            </div>

                            {/* KHÔI PHỤC CÁC DÒNG THÔNG TIN CHI TIẾT */}
                            <p className={`etf-flow ${p.item.etfChange >= 0 ? 'positive' : 'negative'}`}>
                                {p.title.split(' ')[0]} ETF Flow: {p.item.etfChange >= 0 ? '+' : ''}{p.item.etfChange.toFixed(2)}%
                            </p>

                            <p className={`forecast-change ${p.item.change >= 0 ? 'positive' : 'negative'}`}>
                                {t("predictionGauge.compare", {
                                    type: p.item.change >= 0
                                        ? t("predictionGauge.higher")
                                        : t("predictionGauge.lower")
                                })}
                                {p.item.change >= 0 ? ' +' : ' '}{p.item.change.toFixed(2)}%
                            </p>
                        </div>

                        <div className="gauge-wrapper custom-gauge">
                            <div onMouseEnter={() => p.setHover(true)} onMouseLeave={() => p.setHover(false)}>
                                <GaugeChart value={Number(p.item.percentage.toFixed(1))} size="medium" showLabel={false} colors={[p.item.color]} />
                            </div>
                            <div className="gauge-center-text">
                                {p.hover ? `${p.item.percentage.toFixed(1)}%` : `$${p.item.predicted.toFixed(2)}`}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PredictionGauge;