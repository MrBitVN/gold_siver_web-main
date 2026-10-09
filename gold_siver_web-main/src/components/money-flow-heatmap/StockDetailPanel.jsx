import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { allHeatmapData as heatmapData } from './symbolsConfig';
import { translateText } from '../../services/translationService';
import { globalYahooStocks } from '../real-time/YahooFinanceSocket';
import './StockDetailPanel.css';

const formatNumber = (num) => {
    if (num === null || num === undefined) return 'N/A';
    if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    return num.toLocaleString();
};

// --- TIMEOUT FETCH HELPER (Hỗ trợ xử lý fallback 401, 522, timeout) ---
const fetchWithTimeout = async (url, options = {}, timeout = 6000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(id);
        if (!response.ok) {
            throw new Error(`HTTP Error ${response.status}`);
        }
        return response;
    } catch (error) {
        clearTimeout(id);
        throw error;
    }
};

/**
 * Convert Yahoo Finance symbol sang TradingView symbol
 * TradingView yêu cầu đúng exchange prefix cho mỗi loại tài sản
 */
const toTradingViewSymbol = (yahooSymbol) => {
    if (!yahooSymbol) return '';

    // Exact overrides
    const EXACT = {
        // Metals (Futures)
        'GC=F': 'TVC:GOLD',
        'SI=F': 'TVC:SILVER',
        'HG=F': 'COMEX:HG1!',
        'PL=F': 'TVC:PLATINUM',
        'PA=F': 'TVC:PALLADIUM',
        'CL=F': 'TVC:USOIL',
        'NG=F': 'TVC:NATURALGAS',
        'HRC=F': 'CME:HR1!',
        'SN=F': 'COMEX:SN1!',
        // Spot
        'XAUUSD=X': 'TVC:GOLD',
        'XAGUSD=X': 'TVC:SILVER',
        // US Indices
        '^GSPC': 'SP:SPX',
        '^IXIC': 'NASDAQ:COMP',
        '^DJI': 'DJ:DJI',
        '^RUT': 'TVC:RUT',
        '^VIX': 'TVC:VIX',
        // Bonds/Rates
        '^TNX': 'TVC:US10Y',
        '^TYX': 'TVC:US30Y',
        '^FVX': 'TVC:US05Y',
        '^IRX': 'TVC:US03MY',
        // Global Indices
        '^FTSE': 'TVC:UKX',
        '^GDAXI': 'XETR:DAX',
        '^FCHI': 'EURONEXT:PX1',
        '^N225': 'TVC:NI225',
        '^HSI': 'TVC:HSI',
        '^BSESN': 'BSE:SENSEX',
        '^KS11': 'KRX:KOSPI',
        '^SSEC': 'SSE:000001',
        '^TWII': 'TWSE:TAIEX',
        '^NSEI': 'NSE:NIFTY',
        // USD Index
        'DX-Y.NYB': 'TVC:DXY',
        // Crypto
        'BTC-USD': 'BINANCE:BTCUSDT',
        'ETH-USD': 'BINANCE:ETHUSDT',
        'SOL-USD': 'BINANCE:SOLUSDT',
        'BNB-USD': 'BINANCE:BNBUSDT',
        'ADA-USD': 'BINANCE:ADAUSDT',
        'AVAX-USD': 'BINANCE:AVAXUSDT',
        'DOT-USD': 'BINANCE:DOTUSDT',
        'MATIC-USD': 'BINANCE:MATICUSDT',
        'ARB11841-USD': 'BINANCE:ARBUSDT',
        'OP-USD': 'BINANCE:OPUSDT',
        'LINK-USD': 'BINANCE:LINKUSDT',
        'AAVE-USD': 'BINANCE:AAVEUSDT',
        'MKR-USD': 'BINANCE:MKRUSDT',
        'DOGE-USD': 'BINANCE:DOGEUSDT',
        'SHIB-USD': 'BINANCE:SHIBUSDT',
        'PEPE24478-USD': 'BINANCE:PEPEUSDT',
        'WIF-USD': 'BINANCE:WIFUSDT',
        'FET-USD': 'BINANCE:FETUSDT',
        'RNDR-USD': 'BINANCE:RNDRUSDT',
        'AXS-USD': 'BINANCE:AXSUSDT',
        'SAND-USD': 'BINANCE:SANDUSDT',
        'MANA-USD': 'BINANCE:MANAUSDT',
        'GALA-USD': 'BINANCE:GALAUSDT',
        'FIL-USD': 'BINANCE:FILUSDT',
        'LTC-USD': 'BINANCE:LTCUSDT',
        'XRP-USD': 'BINANCE:XRPUSDT',
        'TRX-USD': 'BINANCE:TRXUSDT',
        'ATOM-USD': 'BINANCE:ATOMUSDT',
        // Forex (Yahoo =X suffix -> FX:)
        'EURUSD=X': 'FX:EURUSD',
        'USDJPY=X': 'FX:USDJPY',
        'GBPUSD=X': 'FX:GBPUSD',
        'USDCHF=X': 'FX:USDCHF',
        'USDCAD=X': 'FX:USDCAD',
        'AUDUSD=X': 'FX:AUDUSD',
        'NZDUSD=X': 'FX:NZDUSD',
        'USDCNH=X': 'FX:USDCNH',
        'USDKRW=X': 'FX:USDKRW',
        'USDINR=X': 'FX:USDINR',
        'USDSGD=X': 'FX:USDSGD',
        'USDTHB=X': 'FX:USDTHB',
        'USDVND=X': 'FX:USDVND',
        'USDBRL=X': 'FX:USDBRL',
        'USDZAR=X': 'FX:USDZAR',
        'USDTRY=X': 'FX:USDTRY',
        'USDMXN=X': 'FX:USDMXN',
        'USDIDR=X': 'FX:USDIDR',
    };

    if (EXACT[yahooSymbol]) return EXACT[yahooSymbol];

    // Crypto: suffix -USD -> Binance USDT
    if (yahooSymbol.endsWith('-USD')) {
        const base = yahooSymbol.replace('-USD', '').toUpperCase();
        return `BINANCE:${base}USDT`;
    }

    // Forex: suffix =X -> FX:
    if (yahooSymbol.endsWith('=X')) {
        const pair = yahooSymbol.replace('=X', '').toUpperCase();
        return `FX:${pair}`;
    }

    // Futures: suffix =F -> generic
    if (yahooSymbol.endsWith('=F')) {
        return yahooSymbol.replace('=F', '1!').toUpperCase();
    }

    // Vietnamese stocks
    if (yahooSymbol.endsWith('.VN')) return `HOSE:${yahooSymbol.replace('.VN', '')}`;
    if (yahooSymbol.endsWith('.HM')) return `HNX:${yahooSymbol.replace('.HM', '')}`;

    // Fallback: return as-is (US stocks like NVDA, AAPL etc.)
    return yahooSymbol.toUpperCase();
};


const StockDetailPanel = ({ symbol: rawSymbol, stockData, onClose }) => {
    const { t, i18n } = useTranslation();
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [translatedDesc, setTranslatedDesc] = useState(null);
    const [isTranslating, setIsTranslating] = useState(false);
    const [showTranslated, setShowTranslated] = useState(false);

    // Giải mã symbol ngay lập tức để tránh các ký tự URL encoded
    let symbol = rawSymbol;
    try {
        if (rawSymbol) {
            symbol = decodeURIComponent(rawSymbol);
        }
    } catch (e) { }

    const localRealtime = globalYahooStocks?.[symbol] || {};
    const currentSymbolRef = useRef(symbol);

    useEffect(() => {
        currentSymbolRef.current = symbol;
        let isMounted = true;

        // Reset states immediately when symbol changes
        setDetails(null);
        setTranslatedDesc(null);
        setShowTranslated(false);
        setIsTranslating(false);

        const fetchDeepDetails = async () => {
            if (!symbol) {
                document.body.style.overflow = 'auto'; // Mở khóa cuộn khi đóng
                return;
            }

            // Khóa cuộn trang web khi bảng Detail mở
            document.body.style.overflow = 'hidden';

            setLoading(true);
            try {
                const summaryUrl = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=summaryDetail,defaultKeyStatistics,assetProfile,fundProfile,price`;

                const proxies = [
                    (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
                    (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
                    (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}&_=${Date.now()}`
                ];

                let resData = null;

                for (const proxyFn of proxies) {
                    try {
                        const res = await fetchWithTimeout(proxyFn(summaryUrl), {}, 6000);
                        if (!res.ok) continue;

                        const data = await res.json();
                        const result = data.contents ? JSON.parse(data.contents) : data;

                        if (result?.quoteSummary?.result) {
                            resData = result;
                            break;
                        }
                    } catch (e) {
                        console.warn(`Proxy fetch failed:`, e);
                    }
                }

                // Fallback: Sử dụng API Search của Yahoo
                let searchProfile = null;
                try {
                    const searchUrl = `https://query2.finance.yahoo.com/v1/finance/search?q=${symbol}`;
                    let searchRes = await fetchWithTimeout(searchUrl, {}, 6000).catch(() => null);

                    if (!searchRes || !searchRes.ok) {
                        for (const proxyFn of proxies) {
                            try {
                                const res = await fetchWithTimeout(proxyFn(searchUrl), {}, 6000);
                                if (res.ok) {
                                    searchRes = res;
                                    break;
                                }
                            } catch (err) { }
                        }
                    }

                    if (searchRes && searchRes.ok) {
                        const searchData = await searchRes.json();
                        const result = searchData.contents ? JSON.parse(searchData.contents) : searchData;
                        if (result.quotes && result.quotes.length > 0) {
                            searchProfile = result.quotes.find(q => q.symbol === symbol) || result.quotes[0];
                        }
                    }
                } catch (e) {
                    console.warn("Search API fallback failed", e);
                }

                if (!isMounted) return;

                if (resData?.quoteSummary?.result) {
                    setDetails({
                        ...resData.quoteSummary.result[0],
                        searchProfile
                    });
                } else if (searchProfile) {
                    setDetails({ searchProfile }); // Giữ lại search profile
                }
            } catch (err) {
                console.error("Deep fetch error:", err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchDeepDetails();

        // Cleanup function: Luôn mở lại cuộn khi thoát hoặc đóng panel, và prevent race condition
        return () => {
            isMounted = false;
            document.body.style.overflow = 'auto';
        };
    }, [symbol]);

    const priceData = details?.price || {};
    const summaryData = details?.summaryDetail || {};
    const assetProfile = details?.assetProfile || {};
    const fundProfile = details?.fundProfile || {};
    const searchProfile = details?.searchProfile || {};

    // Fallback: Tìm trực tiếp trong cấu trúc heatmapData do user định nghĩa
    let localSector = "N/A";
    let localIndustry = "N/A";
    if (heatmapData && heatmapData.children) {
        for (const sec of heatmapData.children) {
            if (sec.children) {
                for (const ind of sec.children) {
                    if (ind.children) {
                        for (const sym of ind.children) {
                            if (sym.symbol === symbol) {
                                localSector = sec.name;
                                localIndustry = ind.name;
                                break;
                            }
                        }
                    }
                }
            }
        }
    }

    const safeSymbol = symbol || "";
    const isETF = searchProfile.quoteType === "ETF" || fundProfile.legalType === "Exchange Traded Fund" || localIndustry.includes("ETF") || localSector.includes("ETF");
    const isCrypto = localSector.includes("Coin");
    const isVN = localSector.includes("VN Stocks");
    const isCurrency = localSector.includes("Lãi suất");
    const isJapan = safeSymbol.endsWith(".T");
    const isKorea = safeSymbol.endsWith(".KS") || safeSymbol.endsWith(".KQ");
    const isChina = safeSymbol.endsWith(".HK") || safeSymbol.endsWith(".SS") || safeSymbol.endsWith(".SZ");

    let defaultHq = "N/A";
    if (isETF || isCurrency) defaultHq = t("MoneyFlowHeatmap.hqGlobal", "Toàn cầu");
    else if (isCrypto) defaultHq = t("MoneyFlowHeatmap.hqDecentralized", "Phi tập trung");
    else if (isVN) defaultHq = t("MoneyFlowHeatmap.hqVietnam", "Việt Nam");
    else if (isJapan) defaultHq = t("MoneyFlowHeatmap.hqJapan", "Nhật Bản");
    else if (isKorea) defaultHq = t("MoneyFlowHeatmap.hqKorea", "Hàn Quốc");
    else if (isChina) defaultHq = t("MoneyFlowHeatmap.hqChina", "Trung Quốc");
    else defaultHq = t("MoneyFlowHeatmap.hqUnitedStates", "Hoa Kỳ");

    const translateCountry = (country) => {
        if (!country) return "";
        if (country === "United States" || country === "USA") return t("MoneyFlowHeatmap.hqUnitedStates", "Hoa Kỳ");
        if (country === "Vietnam" || country === "Viet Nam") return t("MoneyFlowHeatmap.hqVietnam", "Việt Nam");
        if (country === "China") return t("MoneyFlowHeatmap.hqChina", "Trung Quốc");
        if (country === "United Kingdom" || country === "UK") return t("MoneyFlowHeatmap.hqUK", "Vương Quốc Anh");
        if (country === "Japan") return t("MoneyFlowHeatmap.hqJapan", "Nhật Bản");
        if (country === "Germany") return t("MoneyFlowHeatmap.hqGermany", "Đức");
        return country;
    };

    const hqCityCountry = assetProfile.city ? (assetProfile.country ? `${assetProfile.city}, ${translateCountry(assetProfile.country)}` : assetProfile.city) : null;

    let finalDesc = assetProfile.longBusinessSummary || null;
    if (!finalDesc) {
        const typeStrEn = isETF ? "Exchange Traded Fund (ETF)" : isCrypto ? "digital asset (Cryptocurrency)" : isCurrency ? "currency and interest rate instrument" : "prominent company";
        const hqStrEn = defaultHq !== "Global" && defaultHq !== "Decentralized" && defaultHq !== "N/A" ? ` headquartered in ${defaultHq}` : "";

        const safeLongName = priceData.longName || searchProfile.longname || stockData?.longName || localRealtime.shortName || localRealtime.longName || priceData.shortName || searchProfile.shortname || stockData?.shortName || symbol;

        finalDesc = `${safeLongName} (${symbol}) is a ${typeStrEn}${hqStrEn}. It operates primarily within the ${localSector} sector and is categorized under the ${localIndustry} industry. As a key component of the financial markets, it reflects significant money flow and market dynamics. Investors closely monitor ${symbol} for its performance and strategic position in the global economy.`;
    }

    const displayData = {
        symbol: symbol,
        longName: priceData.longName || searchProfile.longname || stockData?.longName || localRealtime.shortName || localRealtime.longName || priceData.shortName || searchProfile.shortname || stockData?.shortName || symbol,
        price: priceData.regularMarketPrice?.raw || stockData?.regularMarketPrice || stockData?.price || localRealtime.price || 0,
        changePercent: priceData.regularMarketChangePercent?.raw !== undefined
            ? priceData.regularMarketChangePercent.raw * 100
            : (stockData?.regularMarketChangePercent || stockData?.changePercent || localRealtime.changePercent || 0),

        marketCap: priceData.marketCap?.raw ?? summaryData.marketCap?.raw ?? summaryData.totalAssets?.raw ?? stockData?.marketCap ?? stockData?.regularMarketCap ?? stockData?.totalAssets ?? localRealtime.marketCap ?? (isETF || isCrypto || isCurrency ? "N/A" : null),
        volume: priceData.regularMarketVolume?.raw ?? summaryData.volume?.raw ?? stockData?.regularMarketVolume ?? stockData?.volume ?? localRealtime.volume ?? 0,

        description: finalDesc,
        sector: t(`MoneyFlowHeatmap.sectors.${(assetProfile.sector || searchProfile.sector || fundProfile.categoryName || localSector).replace(/\s+/g, '')}`, assetProfile.sector || searchProfile.sector || fundProfile.categoryName || localSector),
        industry: t(`MoneyFlowHeatmap.industries.${(assetProfile.industry || searchProfile.industry || fundProfile.legalType || localIndustry).replace(/\s+/g, '')}`, assetProfile.industry || searchProfile.industry || fundProfile.legalType || localIndustry),
        headquarters: hqCityCountry || defaultHq,
        peRatio: summaryData.trailingPE?.raw ?? stockData?.trailingPE ?? "—",
        open: priceData.regularMarketOpen?.raw ?? summaryData.regularMarketOpen?.raw ?? stockData?.regularMarketOpen ?? stockData?.open ?? "—",
        low: priceData.regularMarketDayLow?.raw ?? summaryData.regularMarketDayLow?.raw ?? stockData?.regularMarketDayLow ?? stockData?.low ?? "—",
        high: priceData.regularMarketDayHigh?.raw ?? summaryData.regularMarketDayHigh?.raw ?? stockData?.regularMarketDayHigh ?? stockData?.high ?? "—"
    };

    const formatStat = (val) => {
        if (val === null || val === undefined || val === "—") return "—";
        if (typeof val === 'number') {
            return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
        return val;
    };

    const handleTranslate = async () => {
        if (showTranslated) {
            setShowTranslated(false);
            return;
        }

        if (translatedDesc) {
            setShowTranslated(true);
            return;
        }

        if (!displayData.description) return;

        const capturedSymbol = symbol;
        setIsTranslating(true);
        try {
            const targetLang = i18n.language && i18n.language.startsWith("en") ? "en" : "vi";
            const res = await translateText(displayData.description, targetLang);
            if (capturedSymbol === currentSymbolRef.current) {
                setTranslatedDesc(res);
                setShowTranslated(true);
            }
        } catch (err) {
            console.error("Translation failed", err);
            if (capturedSymbol === currentSymbolRef.current) {
                setTranslatedDesc(displayData.description);
                setShowTranslated(true);
            }
        } finally {
            if (capturedSymbol === currentSymbolRef.current) {
                setIsTranslating(false);
            }
        }
    };

    if (!symbol) return null;

    return (
        <div className={`stock-modal-overlay ${symbol ? 'active' : ''}`} onClick={onClose} style={{ opacity: symbol ? 1 : 0, visibility: symbol ? 'visible' : 'hidden' }}>
            <div className="stock-detail-panel" onClick={e => e.stopPropagation()} style={{ transform: symbol ? 'translateX(0)' : 'translateX(100%)' }}>
                <div className="panel-drag-handle"></div>
                <button className="close-panel-btn" onClick={onClose}>
                    <i className="fas fa-chevron-right"></i>
                </button>

                {loading && (!details || details.searchProfile === undefined) && !localRealtime.price ? (
                    <div className="loading-container">
                        <div className="pulse-loader"></div>
                        <p className="loading-msg">Đang tổng hợp dữ liệu...</p>
                    </div>
                ) : (
                    <div className="detail-scroll-area">
                        <header className="detail-header-premium">
                            <div className="header-meta">
                                <span className="symbol-tag">{displayData.symbol}</span>
                                <span className="sector-tag">{displayData.sector}</span>
                            </div>
                            <h1 className="company-full-name">{displayData.longName}</h1>
                            <div className="main-price-display">
                                <div className="price-big">
                                    <span className="price-num">
                                        {typeof displayData.price === 'number' ? displayData.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : displayData.price}
                                    </span>
                                    <span className="price-unit">{displayData.currency}</span>
                                </div>
                                <div className={`percent-badge ${displayData.changePercent >= 0 ? 'up' : 'down'}`}>
                                    {displayData.changePercent >= 0 ? '+' : ''}{displayData.changePercent.toFixed(2)}%
                                </div>
                            </div>
                        </header>

                        <div className="ai-insight-section">
                            <div className="insight-header">
                                <div className="ai-icon">
                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                    </svg>
                                </div>
                                <h3>AI INSIGHT</h3>
                                {loading && (
                                    <span style={{
                                        color: '#3b82f6',
                                        fontSize: '11px',
                                        marginLeft: 'auto',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}>
                                        <span className="pulse-dot" style={{
                                            width: '6px',
                                            height: '6px',
                                            backgroundColor: '#3b82f6',
                                            borderRadius: '50%',
                                            display: 'inline-block',
                                            animation: 'pulse-ring 1.2s infinite ease-in-out'
                                        }}></span>
                                        Đang nạp dữ liệu chuyên sâu...
                                    </span>
                                )}
                            </div>
                            <div className="insight-body">
                                <p>
                                    {showTranslated && translatedDesc
                                        ? translatedDesc
                                        : displayData.description
                                            ? (displayData.description.length > 300 ? displayData.description.substring(0, 300) + '...' : displayData.description)
                                            : `${displayData.longName} (${symbol}) đang giao dịch tại mức ${displayData.price}. Dựa trên dữ liệu thời gian thực, tài sản này đang có xu hướng ${displayData.changePercent > 0 ? 'tăng trưởng tích cực' : 'điều chỉnh kỹ thuật'} với mức biến động ${Math.abs(displayData.changePercent).toFixed(2)}% trong phiên hôm nay.`
                                    }
                                </p>
                            </div>

                            {/* Nút Dịch sang tiếng Việt */}
                            <button
                                className="btn-translate"
                                onClick={handleTranslate}
                                disabled={isTranslating}
                                style={{
                                    marginTop: '10px',
                                    padding: '6px 14px',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    background: showTranslated ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.07)',
                                    border: '1px solid rgba(59,130,246,0.4)',
                                    borderRadius: '8px',
                                    color: '#60a5fa',
                                    cursor: isTranslating ? 'wait' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    transition: 'all 0.2s',
                                }}
                            >
                                {isTranslating ? '⏳ Đang dịch...' : showTranslated ? '🔤 Xem bản gốc' : '🌐 Dịch tiếng Việt'}
                            </button>
                        </div>
                        <div className="technical-view">
                            <h3 className="section-title">BIỂU ĐỒ KỸ THUẬT</h3>
                            <div className="chart-wrapper-mini">
                                <iframe
                                    title="TradingView"
                                    src={`https://s.tradingview.com/widgetembed/?symbol=${encodeURIComponent(toTradingViewSymbol(symbol))}&interval=D&hidesidetoolbar=1&theme=dark&style=1&locale=vi_VN`}
                                    width="100%"
                                    height="300"
                                    frameBorder="0"
                                ></iframe>
                            </div>
                        </div>

                        <div className="action-footer">
                            <button className="btn-yahoo" onClick={() => window.open(`https://finance.yahoo.com/quote/${symbol}`, '_blank')}>
                                Xem trên Yahoo Finance
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StockDetailPanel;
