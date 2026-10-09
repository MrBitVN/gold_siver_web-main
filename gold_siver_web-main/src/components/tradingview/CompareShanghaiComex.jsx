import React, { useEffect, useState, useRef, useMemo } from 'react';
import { createChart, LineSeries, AreaSeries } from 'lightweight-charts';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './CompareShanghaiComex.css';

const API_URL = 'https://api_gold.thinkdiff.us/compare_shanghai_comex_silver';

function formatPercent(v) {
    return (v > 0 ? '+' : '') + Number(v).toFixed(2) + '%';
}

export default function CompareShanghaiComex({ apiUrl = API_URL, height = 450 }) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('silver'); 
    const [timeframe, setTimeframe] = useState('1w'); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const [shData, setShData] = useState([]);
    const [wData, setWData] = useState([]);
    const [premiumData, setPremiumData] = useState([]);
    const [rawArr, setRawArr] = useState([]); 
    const [displayArr, setDisplayArr] = useState([]); 

    const containerRef = useRef();
    const chartRef = useRef();

    useEffect(() => {
        let mounted = true;
        async function load() {
            try {
                setLoading(true);
                const res = await fetch(apiUrl);
                const json = await res.json();
                
                const assetType = activeTab.includes('gold') ? 'gold' : 'silver';
                const sourceData = json?.data?.[assetType]?.data || [];
                const fullData = sourceData.slice().sort((a, b) => new Date(a.date) - new Date(b.date));
                
                if (!mounted) return;
                setRawArr(fullData);

                // Lọc dữ liệu theo khung giờ được chọn
                const now = new Date();
                let filtered = [...fullData];
                if (timeframe !== 'ALL') {
                    const limitDate = new Date();
                    if (timeframe === '1w') limitDate.setDate(now.getDate() - 7);
                    else if (timeframe === '1m') limitDate.setMonth(now.getMonth() - 1);
                    else if (timeframe === '1y') limitDate.setFullYear(now.getFullYear() - 1);
                    filtered = fullData.filter(d => new Date(d.date) >= limitDate);
                }
                setDisplayArr(filtered);

                // Phân loại dữ liệu cho Series biểu đồ
                if (activeTab.includes('premium')) {
                    const p = filtered.map(d => ({ 
                        time: d.date, 
                        value: Number(d.premium || (d.shanghai - d.western)) 
                    }));
                    setPremiumData(p);
                    setShData([]); setWData([]);
                } else {
                    const sh = filtered.map(d => ({ time: d.date, value: Number(d.shanghai) }));
                    const w = filtered.map(d => ({ time: d.date, value: Number(d.western) }));
                    setShData(sh); setWData(w);
                    setPremiumData([]);
                }
            } catch (err) {
                setError(err?.message || 'Error fetching data');
            } finally {
                setLoading(false);
            }
        }
        load();
        return () => { mounted = false; };
    }, [apiUrl, activeTab, timeframe]);

    useEffect(() => {
        if (!containerRef.current || loading) return;
        const isMobile = window.innerWidth <= 768;

        const chart = createChart(containerRef.current, {
            width: containerRef.current.clientWidth,
            height: 300,
            layout: { background: { color: '#131722' }, textColor: '#d1d4dc' },
            grid: { vertLines: { color: '#2a2e39' }, horzLines: { color: '#2a2e39' } },
            timeScale: { borderColor: '#2a2e39', timeVisible: true },
            rightPriceScale: { 
                borderColor: '#2a2e39', 
                autoScale: true,
                scaleMargins: { top: 0.1, bottom: 0.1 } 
            },
        });

        chartRef.current = chart;

        if (activeTab.includes('premium')) {
            const color = activeTab === 'gold_premium' ? '#c9b458' : '#b5b7b9';
            const pSeries = chart.addSeries(AreaSeries, {
                lineColor: color,
                topColor: `${color}44`,
                bottomColor: `${color}00`,
                lineWidth: 2,
            });
            pSeries.setData(premiumData);
        } else {
            const shSeries = chart.addSeries(LineSeries, { color: '#e04646', lineWidth: 2 });
            const wSeries = chart.addSeries(LineSeries, { color: '#3b8be6', lineWidth: 2 });
            shSeries.setData(shData);
            wSeries.setData(wData);
        }

        chart.timeScale().fitContent();
        const handleResize = () => chart.applyOptions({ width: containerRef.current.clientWidth });
        window.addEventListener('resize', handleResize);
        return () => { window.removeEventListener('resize', handleResize); chart.remove(); };
    }, [loading, activeTab, shData, wData, premiumData]);

    // Tính toán chỉ số thống kê (Stats)
    const { latest, avgPremium, avgPremiumPercent, maxPremium, minPremium } = useMemo(() => {
        if (!rawArr.length) return { latest: null, avgPremium: 0, avgPremiumPercent: 0, maxPremium: 0, minPremium: 0 };
        const latest = rawArr[rawArr.length - 1];
        let sumP = 0, sumPP = 0, maxP = -Infinity, minP = Infinity;
        for (const d of rawArr) {
            const p = Number(d.premium || (d.shanghai - d.western));
            sumP += p; sumPP += Number(d.premiumPercent || 0);
            if (p > maxP) maxP = p; if (p < minP) minP = p;
        }
        return { 
            latest, 
            avgPremium: sumP / rawArr.length, 
            avgPremiumPercent: sumPP / rawArr.length, 
            maxPremium: maxP, 
            minPremium: minP 
        };
    }, [rawArr]);

    // Tính % thay đổi cho Legend
    const computeChangePercent = (arr) => {
        if (!arr || arr.length < 2) return 0;
        const first = arr[0].value;
        const last = arr[arr.length - 1].value;
        return ((last - first) / Math.abs(first || 1)) * 100;
    };

    const shPercent = computeChangePercent(shData);
    const wPercent = computeChangePercent(wData);

    return (
        <div className="compare-shanghai-comex__wrapper">
            <div className="compare-shanghai-comex__tabs">
                <button className={`tab-btn ${activeTab === 'gold' ? 'active' : ''}`} onClick={() => setActiveTab('gold')}>{t('compareShanghaiComex.tabGold')}</button>
                <button className={`tab-btn ${activeTab === 'silver' ? 'active' : ''}`} onClick={() => setActiveTab('silver')}>{t('compareShanghaiComex.tabSilver')}</button>
                <button className={`tab-btn premium-gold-btn ${activeTab === 'gold_premium' ? 'active' : ''}`} onClick={() => setActiveTab('gold_premium')}>{t('compareShanghaiComex.tabGoldPremium')}</button>
                <button className={`tab-btn premium-silver-btn ${activeTab === 'silver_premium' ? 'active' : ''}`} onClick={() => setActiveTab('silver_premium')}>{t('compareShanghaiComex.tabSilverPremium')}</button>
            </div>

            <div className="compare-shanghai-comex__stats-row">
                <div className="stat-card highlight">
                    <div className="stat-title">{t('compareShanghaiComex.statShanghai')}</div>
                    <div className="stat-value">{latest ? `$${Number(latest.shanghai).toFixed(2)}` : '–'}</div>
                    <div className="stat-sub">{t('compareShanghaiComex.perTroyOz')}</div>
                </div>
                <div className="stat-card highlight">
                    <div className="stat-title">{t('compareShanghaiComex.statWestern')}</div>
                    <div className="stat-value">{latest ? `$${Number(latest.western).toFixed(2)}` : '–'}</div>
                    <div className="stat-sub">{t('compareShanghaiComex.perTroyOz')}</div>
                </div>
                <div className="stat-card premium">
                    <div className="stat-title">{t('compareShanghaiComex.statPremium')}</div>
                    <div className="stat-value">
                        {latest ? `${Number(latest.premium || (latest.shanghai - latest.western)) > 0 ? '+' : ''}$${(Number(latest.premium || (latest.shanghai - latest.western))).toFixed(2)}` : '–'}
                    </div>
                    <div className="stat-sub">{t('compareShanghaiComex.perTroyOz')}</div>
                </div>
                <div className="stat-card premium">
                    <div className="stat-title">{t('compareShanghaiComex.statPremiumPercent')}</div>
                    <div className="stat-value">
                        {latest ? `${(latest.premiumPercent || 0) > 0 ? '+' : ''}${Number(latest.premiumPercent || 0).toFixed(2)}%` : '–'}
                    </div>
                    <div className="stat-sub">{t('compareShanghaiComex.legendWestern')}</div>
                </div>
                <div className="stat-card small">
                    <div className="stat-title">{t('compareShanghaiComex.statAvgPremium1Y')}</div>
                    <div className="stat-value">${avgPremium.toFixed(2)} <span className="muted">({avgPremiumPercent.toFixed(2)}%)</span></div>
                </div>
                <div className="stat-card small">
                    <div className="stat-title">{t('compareShanghaiComex.statMaxPremium')}</div>
                    <div className="stat-value">${maxPremium.toFixed(2)}</div>
                </div>
                <div className="stat-card small">
                    <div className="stat-title">{t('compareShanghaiComex.statMinPremium')}</div>
                    <div className="stat-value">${minPremium.toFixed(2)}</div>
                </div>
            </div>

            <div className="compare-shanghai-comex__header">
                <div className="compare-shanghai-comex__title" onClick={() => navigate('/shanghaichart')} style={{ cursor: 'pointer' }}>
                    {activeTab.includes('premium')
                        ? t('compareShanghaiComex.titlePremium', { asset: activeTab.includes('gold') ? t('compareShanghaiComex.tabGold') : t('compareShanghaiComex.tabSilver') })
                        : t('compareShanghaiComex.titleSpot', { asset: activeTab.includes('gold') ? t('compareShanghaiComex.tabGold') : t('compareShanghaiComex.tabSilver') })}
                </div>
                {!activeTab.includes('premium') && (
                    <div className="compare-shanghai-comex__legend">
                        <div className="legend-item">
                            <span className="dot dot-sh"></span>
                            <span className="legend-label">Shanghai Spot</span>
                            <span className="legend-value">{formatPercent(shPercent)}</span>
                        </div>
                        <div className="legend-item">
                            <span className="dot dot-w"></span>
                            <span className="legend-label">Western Spot</span>
                            <span className="legend-value">{formatPercent(wPercent)}</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="compare-shanghai-comex__chart-container">
                {loading ? <div className="loading-overlay">{t('compareShanghaiComex.loading')}</div> : <div ref={containerRef} style={{ width: '100%', height: '300px' }} />}
                {error && <div className="error-overlay">{t('compareShanghaiComex.noData')} ({error})</div>}
                
                <div className="timeframe-selector">
                    {[
                        { key: '1w', label: t('compareShanghaiComex.timeframe1w') },
                        { key: '1m', label: t('compareShanghaiComex.timeframe1m') },
                        { key: '1y', label: t('compareShanghaiComex.timeframe1y') },
                        { key: 'ALL', label: t('compareShanghaiComex.timeframeAll') }
                    ].map((tf) => (
                        <button 
                            key={tf.key} 
                            className={`tf-btn ${timeframe === tf.key ? 'active' : ''}`} 
                            onClick={() => setTimeframe(tf.key)}
                        >
                            {tf.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}