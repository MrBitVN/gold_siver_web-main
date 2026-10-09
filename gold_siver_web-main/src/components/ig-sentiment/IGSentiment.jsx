import React, { useState, useEffect } from "react";
import "./IGSentiment.css";
import SentimentBarChart from "./IGSentimentChart";
import { Link } from "react-router-dom";
import IGInstrumentBlock from "./IGInstrumentBlock";
import { useTranslation } from "react-i18next";
const IGSentiment = () => {
    const { t } = useTranslation();
    const [sentimentData, setSentimentData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [displayLong, setDisplayLong] = useState(0);
    const [displayShort, setDisplayShort] = useState(0);

    useEffect(() => {
        const fetchSentimentData = async (isInitial = false) => {
            try {
                if (isInitial) setLoading(true);

                const response = await fetch("https://api_gold.thinkdiff.us/ig_sentiment");
                if (!response.ok) throw new Error(`API error: ${response.status}`);

                const data = await response.json();

                if (data.ig_sentiment?.length > 0) {
                    setSentimentData(data.ig_sentiment[0]);
                }
                setError(null);
            } catch (err) {
                setError(err.message || "Failed to fetch sentiment data");
            } finally {
                if (isInitial) setLoading(false);
            }
        };

        // ✅ load lần đầu
        fetchSentimentData(true);

        // ✅ update ngầm
        const interval = setInterval(() => fetchSentimentData(false), 30000);

        return () => clearInterval(interval);
    }, []);
    useEffect(() => {
        if (!sentimentData) return;

        const longPct = Number(sentimentData.sentiment_long);
        const shortPct = Number(sentimentData.sentiment_short);

        let frame;
        const duration = 600;
        const start = performance.now();

        const fromLong = displayLong;
        const fromShort = displayShort;

        const animate = (time) => {
            const progress = Math.min((time - start) / duration, 1);

            setDisplayLong(Math.round(fromLong + (longPct - fromLong) * progress));
            setDisplayShort(Math.round(fromShort + (shortPct - fromShort) * progress));

            if (progress < 1) frame = requestAnimationFrame(animate);
        };

        frame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frame);
    }, [sentimentData]);


    if (loading) {
        return <div className="sentiment-container loading">Loading sentiment data...</div>;
    }

    if (error) {
        return <div className="sentiment-container error">Error: {error}</div>;
    }

    if (!sentimentData) {
        return <div className="sentiment-container">No data available</div>;
    }

    const {
        gia_sell = 0,
        gia_buy = 0,
        bien_dong_gia = 0,
        bien_dong_phantram = 0,
        gia_high = 0,
        gia_low = 0,
        sentiment_long = 0,
        sentiment_short = 0,
        ngay_tao = "",
    } = sentimentData;

    const sell_price = gia_sell;
    const buy_price = gia_buy;
    const change = bien_dong_gia ?? 0;
    const change_percent = bien_dong_phantram ?? 0;
    const high = gia_high ?? 0;
    const low = gia_low ?? 0;

    // Dữ liệu sentiment_long và sentiment_short đã là percentages (0-100)
    const longPct = Number(sentiment_long);
    const shortPct = Number(sentiment_short);


    const changeColor = change >= 0 ? "#4CAF50" : "#FF6B6B";
    const changeSymbol = change >= 0 ? "+" : "";

    return (
        <div className="sentiment-container">
            <div className="sentiment-header">
                <h2>
                    <Link to="/ig-sentiment" className="ig-title-link" title="Xem trang IG Sentiment">
                        IG Sentiment (Silver)
                    </Link>
                </h2>
                <p className="update-time">{t('charts.lastUpdate')}: {ngay_tao}</p>
            </div>

            <div className="price-section">
                <div className="price-box sell">
                    <div className="price-label">{t('OrderFlowAnalysis.sell')}</div>
                    <div className="price-value">{sell_price.toLocaleString("en-US", {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 1,
                    })}</div>
                </div>

                <div className="price-change">
                    <div className="change-value" style={{ color: changeColor }}>
                        {changeSymbol}{change.toFixed(1)} ({changeSymbol}{change_percent.toFixed(2)}%)
                    </div>
                    <div className="high-low">
                        <div className="high1">High: <span className="num1">{high.toLocaleString("en-US", { maximumFractionDigits: 1 })}</span></div>
                        <div className="low1">Low: <span className="num2">{low.toLocaleString("en-US", { maximumFractionDigits: 1 })}</span></div>
                    </div>
                </div>

                <div className="price-box buy">
                    <div className="price-label">{t('OrderFlowAnalysis.buy')}</div>
                    <div className="price-value">{buy_price.toLocaleString("en-US", {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 1,
                    })}</div>
                </div>
            </div>

            <div className="sentiment-bar-section">
                <div className="sentiment-bar">
                    <div
                        className="sentiment-fill long"
                        style={{ width: `${displayLong}%` }}
                    />
                    <div
                        className="sentiment-fill short"
                        style={{ width: `${displayShort}%` }}
                    />
                </div>

                <div className="sentiment-labels">
                    <div className="sentiment-item long">
                        <span className="label">Long</span>
                        <span className="percent">{displayLong}%</span>
                    </div>
                    <div className="sentiment-item short">
                        <span className="label">Short</span>
                        <span className="percent">{displayShort}%</span>
                    </div>
                </div>
            </div>
            <IGInstrumentBlock/>
            <SentimentBarChart />
        </div>
    );
};

export default IGSentiment;
