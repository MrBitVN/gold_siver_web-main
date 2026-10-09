import React, { useEffect, useRef, useState } from 'react';
// Import thêm CandlestickSeries và HistogramSeries từ thư viện
import { createChart, ColorType, CandlestickSeries, HistogramSeries } from 'lightweight-charts';
import { useTranslation } from "react-i18next";
import i18n from "i18next";
const ComexChartVolume = () => {
    const { t, i18n } = useTranslation();
    const chartContainerRef = useRef();
    const tooltipRef = useRef();
    const chartInstance = useRef(null);
    const candlestickSeriesRef = useRef(null);
    const volumeSeriesRef = useRef(null);

    const [asset, setAsset] = useState('silver');
    const [allData, setAllData] = useState({ gold: [], silver: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('https://api_gold.thinkdiff.us/load_giaodich_commex');
                const json = await response.json();
                if (json?.load_giaodich_commex) {
                    const process = (items) => (items || [])
                        .filter(item => item.minute === 15)
                        .map(item => ({
                            time: new Date(item.timestamp).getTime() / 1000,
                            open: item.open_price,
                            high: item.high_price,
                            low: item.low_price,
                            close: item.close_price,
                            volume: item.volume
                        })).sort((a, b) => a.time - b.time);

                    setAllData({
                        gold: process(json.load_giaodich_commex.gold),
                        silver: process(json.load_giaodich_commex.silver)
                    });
                }
                setLoading(false);
            } catch (error) {
                console.error("Lỗi tải API:", error);
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (!chartContainerRef.current) return;

        const chart = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height: 600,
            layout: {
                background: { type: ColorType.Solid, color: '#131722' },
                textColor: '#d1d4dc',
            },
            grid: { vertLines: { color: '#242733' }, horzLines: { color: '#242733' } },
            timeScale: {
                timeVisible: true, secondsVisible: false, minBarSpacing: 5, // Giới hạn thu nhỏ: nến không bao giờ nhỏ hơn 5px (mặc định thường là 0.5)
                barSpacing: 10,
            },
        });

        // --- CÚ PHÁP MỚI VERSION 5.x ---
        // Thay vì chart.addCandlestickSeries, ta dùng chart.addSeries
        const candlestickSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#26a69a',
            downColor: '#ef5350',
            borderVisible: false,
            wickUpColor: '#26a69a',
            wickDownColor: '#ef5350',
        });

        const volumeSeries = chart.addSeries(HistogramSeries, {
            color: '#26a69a',
            priceFormat: { type: 'volume' },
            priceScaleId: '',
        });
        // ------------------------------

        volumeSeries.priceScale().applyOptions({
            scaleMargins: { top: 0.8, bottom: 0 },
        });

        chart.subscribeCrosshairMove((param) => {
            if (!param.point || !param.time || !tooltipRef.current) {
                if (tooltipRef.current) tooltipRef.current.style.display = 'none';
                return;
            }
            tooltipRef.current.style.display = 'block';
            const dataPoint = param.seriesData.get(candlestickSeries);
            const volumePoint = param.seriesData.get(volumeSeries);

            if (dataPoint) {
                const dateStr = new Date(param.time * 1000).toLocaleString('vi-VN');
                tooltipRef.current.innerHTML = `
  <div style="color: #ffff00; font-weight: bold; margin-bottom: 4px;">
    ${asset === 'gold' ? t("comex.gold_code") : t("comex.silver_code")}
  </div>
  <div style="font-size: 11px; color: #d1d4dc; margin-bottom: 8px;">
    ${dateStr}
  </div>
  <div style="color: white">
    ${t("comex.tooltip.open")}: ${dataPoint.open} | 
    ${t("comex.tooltip.high")}: ${dataPoint.high}
  </div>
  <div style="color: white">
    ${t("comex.tooltip.low")}: ${dataPoint.low} | 
    ${t("comex.tooltip.close")}: ${dataPoint.close}
  </div>
  <div style="color: #26a69a">
    ${t("comex.tooltip.volume")}: ${volumePoint ? volumePoint.value : 0}
  </div>
`;
                tooltipRef.current.style.left = `${Math.min(param.point.x + 15, chartContainerRef.current.clientWidth - 160)}px`;
                tooltipRef.current.style.top = `${param.point.y + 15}px`;
            }
        });

        chartInstance.current = chart;
        candlestickSeriesRef.current = candlestickSeries;
        volumeSeriesRef.current = volumeSeries;

        const handleResize = () => chart.applyOptions({ width: chartContainerRef.current.clientWidth });
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, [asset, i18n.language]);

    useEffect(() => {
        const currentData = allData[asset];
        if (currentData?.length > 0 && candlestickSeriesRef.current && volumeSeriesRef.current) {
            candlestickSeriesRef.current.setData(currentData);
            volumeSeriesRef.current.setData(currentData.map(item => ({
                time: item.time,
                value: item.volume,
                color: item.close >= item.open ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)'
            })));
            chartInstance.current.timeScale().fitContent();
        }
    }, [allData, asset]);

    return (
        <div style={{ background: '#131722', padding: '20px', minHeight: '100vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h2 style={{ color: '#26a69a', margin: 0 }}>  {t("comex.title", {
                    asset: asset === "gold" ? t("comex.gold") : t("comex.silver")
                })}</h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => setAsset('silver')} style={btnStyle(asset === 'silver')}>{t("comex.silver_code")}</button>
                    <button onClick={() => setAsset('gold')} style={btnStyle(asset === 'gold')}>{t("comex.gold_code")}</button>
                </div>
            </div>
            <div style={{ position: 'relative', width: '100%' }}>
                <div ref={chartContainerRef} style={{ width: '100%', height: '600px', border: '1px solid #242733' }} />
                <div ref={tooltipRef} style={tooltipStyle} />
            </div>
        </div>
    );
};

const btnStyle = (active) => ({
    padding: '8px 16px', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold',
    background: active ? '#26a69a' : '#242733', color: 'white', border: '1px solid #64656a'
});

const tooltipStyle = {
    width: '160px', position: 'absolute', display: 'none', padding: '10px',
    zIndex: 1000, pointerEvents: 'none', borderRadius: '4px',
    background: 'rgba(25, 27, 34, 0.95)', border: '1px solid #64656a', color: 'white'
};

export default ComexChartVolume;