import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as d3 from 'd3';
import { voronoiTreemap } from 'd3-voronoi-treemap';
import { heatmapData, heatmapTabs } from './symbolsConfig';
import { globalYahooStocks, setCompareDays } from '../real-time/YahooFinanceSocket';
import './MoneyFlowHeatmap.css';
import SectorBarChart from './SectorBarChart';
import StockDetailPanel from './StockDetailPanel';

const COMPARE_OPTIONS = [
    { label: '1D', days: 1, title: 'So với hôm qua' },
    { label: '5D', days: 5, title: 'So với 5 ngày trước' },
    { label: '1M', days: 21, title: 'So với 1 tháng trước' },
    { label: '3M', days: 63, title: 'So với 3 tháng trước' },
    { label: '6M', days: 126, title: 'So với 6 tháng trước' },
    { label: '1Y', days: 252, title: 'So với 1 năm trước' },
];

// Kích thước cố định — đủ rộng cho 200+ mã, scroll để xem
const MAP_WIDTH = 2400;
const MAP_HEIGHT = 1600;

const DISPLAY_NAMES = {
    'GC=F': 'Gold', 'SI=F': 'Silver', 'HG=F': 'Copper', 'PL=F': 'Platinum',
    'DX-Y.NYB': 'DXY',
    'BTC-USD': 'BTC', 'ETH-USD': 'ETH', 'SOL-USD': 'SOL', 'BNB-USD': 'BNB',
    'ADA-USD': 'ADA', 'AVAX-USD': 'AVAX', 'DOT-USD': 'DOT',
    'MATIC-USD': 'MATIC', 'ARB11841-USD': 'ARB', 'OP-USD': 'OP',
    'AAVE-USD': 'AAVE', 'LINK-USD': 'LINK',
    'MKR-USD': 'MKR',
    'FET-USD': 'FET', 'RNDR-USD': 'RNDR',
    'AXS-USD': 'AXS', 'SAND-USD': 'SAND', 'MANA-USD': 'MANA', 'GALA-USD': 'GALA',
    'FIL-USD': 'FIL',
    'DOGE-USD': 'DOGE', 'SHIB-USD': 'SHIB', 'PEPE24478-USD': 'PEPE', 'WIF-USD': 'WIF',
    'EURUSD=X': 'EUR/USD', 'USDJPY=X': 'USD/JPY', 'GBPUSD=X': 'GBP/USD',
    'USDCHF=X': 'USD/CHF', 'USDCAD=X': 'USD/CAD', 'AUDUSD=X': 'AUD/USD', 'NZDUSD=X': 'NZD/USD',
    'USDCNH=X': 'USD/CNH', 'USDKRW=X': 'USD/KRW', 'USDINR=X': 'USD/INR', 'USDSGD=X': 'USD/SGD',
    'USDBRL=X': 'USD/BRL', 'USDZAR=X': 'USD/ZAR', 'USDTRY=X': 'USD/TRY', 'USDMXN=X': 'USD/MXN',
    '^TNX': '10Y', '^TYX': '30Y', '^FVX': '5Y', '^IRX': '3M',
    '^GSPC': 'S&P500', '^IXIC': 'NASDAQ', '^DJI': 'DOW', '^RUT': 'RUT2000',
    '^FTSE': 'FTSE100', '^GDAXI': 'DAX', '^FCHI': 'CAC40',
    '^N225': 'Nikkei', '^HSI': 'HangSeng', '^BSESN': 'SENSEX', '^KS11': 'KOSPI',
    'TCEHY': 'Tencent', 'SIEGY': 'Siemens', 'XPEV': 'XPeng',
    'CL=F': 'WTI', 'BZ=F': 'Brent', 'NG=F': 'NatGas', 'RB=F': 'RBOB', 'HO=F': 'Heating Oil',
    'ZC=F': 'Corn', 'ZW=F': 'Wheat', 'ZS=F': 'Soybean', 'ZL=F': 'Soy Oil', 'ZM=F': 'Soy Meal',
    'KC=F': 'Coffee', 'CC=F': 'Cocoa', 'CT=F': 'Cotton', 'SB=F': 'Sugar', 'OJ=F': 'Orange',
    'LE=F': 'Cattle', 'HE=F': 'Hogs', 'GF=F': 'Feeder',
    '7203.T': 'Toyota', '6758.T': 'Sony', '9984.T': 'SoftBank', '9983.T': 'Fast Retail',
    '8306.T': 'MUFG', '8035.T': 'Tokyo Electron', '9432.T': 'NTT',
    '005930.KS': 'Samsung', '000660.KS': 'SK Hynix', '373220.KS': 'LG Energy',
    '005380.KS': 'Hyundai', '035420.KS': 'NAVER', '035720.KS': 'Kakao',
};

const MoneyFlowHeatmap = () => {
    const { t } = useTranslation();
    const svgRef = useRef(null);
    const containerRef = useRef(null);
    const heatmapAreaRef = useRef(null);
    const [stocksData, setStocksData] = useState(globalYahooStocks || {});
    const [selectedNode, setSelectedNode] = useState(null);
    const [selectedSector, setSelectedSector] = useState(null);
    const [stockCounts, setStockCounts] = useState({ ceiling: 0, up: 0, ref: 0, down: 0, floor: 0 });
    const [detailedStockSymbol, setDetailedStockSymbol] = useState(null);
    const [error, setError] = useState(null);
    const layoutRef = useRef(null);
    const [compareDays, setCompareDaysState] = useState(1);
    const [isLoadingCompare, setIsLoadingCompare] = useState(false);
    const [activeTabId, setActiveTabId] = useState(heatmapTabs[0]?.id || "overview");
    const activeTab = heatmapTabs.find(tab => tab.id === activeTabId) || heatmapTabs[0];
    const activeHeatmapData = activeTab?.data || heatmapData;

    // Tiến độ tải dữ liệu thời gian thực
    const [loadingPercentage, setLoadingPercentage] = useState(0);
    const [forceShow, setForceShow] = useState(false);

    // Cập nhật màu + % mà không vẽ lại layout
    const updateVisualsOnly = () => {
        if (!layoutRef.current || !svgRef.current) return;
        const svg = d3.select(svgRef.current);
        svg.selectAll(".leaf-path")
            .attr("fill", d => {
                if (!d || !d.data || !d.data.symbol) return "#eab308";
                const sym = decodeURIComponent(d.data.symbol);
                const stock = globalYahooStocks ? globalYahooStocks[sym] : null;
                const change = stock ? (stock.changePercent || 0) : 0;
                if (change >= 6.8) return "#c026d3";
                if (change > 0) return "#22c55e";
                if (change <= -6.8) return "#3b82f6";
                if (change < 0) return "#ef4444";
                return "#eab308";
            });
        svg.selectAll(".leaf-percent")
            .text(d => {
                if (!d || !d.data || !d.data.symbol) return "0.00%";
                const sym = decodeURIComponent(d.data.symbol);
                const stock = globalYahooStocks ? globalYahooStocks[sym] : null;
                const change = stock ? (stock.changePercent || 0) : 0;
                return `${change > 0 ? '+' : ''}${change.toFixed(2)}%`;
            });
    };

    const handleCompareDaysChange = async (days) => {
        if (days === compareDays) return;
        setIsLoadingCompare(true);
        setCompareDaysState(days);
        await setCompareDays(days);
        updateVisualsOnly();
        setIsLoadingCompare(false);
    };

    // Lắng nghe cập nhật giá real-time
    useEffect(() => {
        const handlePriceUpdate = (e) => {
            const decoded = e.detail;
            if (!decoded) return;
            let sym = decoded.symbol || decoded.id;
            try {
                sym = decodeURIComponent(sym);
            } catch (err) {}

            setStocksData(prev => {
                const prevData = prev || {};
                const updatedObj = {
                    ...prevData[sym],
                    ...decoded,
                    symbol: sym,
                    id: sym
                };
                
                const nextState = {
                    ...prevData,
                    [sym]: updatedObj
                };
                
                if (sym.endsWith('.VN')) {
                    const hmSym = sym.replace('.VN', '.HM');
                    nextState[hmSym] = updatedObj;
                } else if (sym.endsWith('.HM')) {
                    const vnSym = sym.replace('.HM', '.VN');
                    nextState[vnSym] = updatedObj;
                }
                
                return nextState;
            });
        };
        window.addEventListener('yahooPriceAlert', handlePriceUpdate);
        return () => window.removeEventListener('yahooPriceAlert', handlePriceUpdate);
    }, []);

    // Tính toán thống kê & Phần trăm tải dữ liệu
    useEffect(() => {
        const counts = { ceiling: 0, up: 0, ref: 0, down: 0, floor: 0 };
        const allSymbols = [];
        const traverse = (node) => {
            if (!node) return;
            if (node.symbol) {
                try {
                    allSymbols.push(decodeURIComponent(node.symbol));
                } catch (e) {
                    allSymbols.push(node.symbol);
                }
            }
            if (node.children && Array.isArray(node.children)) {
                node.children.forEach(traverse);
            }
        };
        traverse(activeHeatmapData);
        
        let loaded = 0;
        allSymbols.forEach(sym => {
            const stock = stocksData ? stocksData[sym] : null;
            if (stock && stock.price != null && stock.price > 0) {
                loaded++;
            }
            const change = stock ? (stock.changePercent || 0) : 0;
            if (change >= 6.8) counts.ceiling++;
            else if (change > 0) counts.up++;
            else if (change <= -6.8) counts.floor++;
            else if (change < 0) counts.down++;
            else counts.ref++;
        });

        const pct = allSymbols.length > 0 ? Math.round((loaded / allSymbols.length) * 100) : 0;
        setLoadingPercentage(pct);
        setStockCounts(counts);
        
        // Cập nhật visuals sau khi state stocksData thay đổi
        setTimeout(updateVisualsOnly, 50);
    }, [stocksData, activeHeatmapData]);

    useEffect(() => {
        setSelectedSector(null);
        setSelectedNode(null);
        layoutRef.current = null;
    }, [activeTabId]);

    // Vẽ bản đồ Voronoi — chỉ chạy lại khi đổi sector hoặc bắt đầu hiển thị
    useEffect(() => {
        // Không vẽ bất cứ thứ gì nếu không có dữ liệu tải
        if (loadingPercentage === 0 && !forceShow) {
            return;
        }

        try {
            const svg = d3.select(svgRef.current);
            svg.selectAll("*").remove();
            setError(null);

            let displayData = activeHeatmapData;
            if (selectedSector && activeHeatmapData && Array.isArray(activeHeatmapData.children)) {
                const targetSector = activeHeatmapData.children.find(s => s.name === selectedSector);
                if (targetSector) displayData = { ...targetSector };
            }

            const seededRandom = (seed) => () => {
                seed = (seed * 16807) % 2147483647;
                return (seed - 1) / 2147483646;
            };

            const vtreemap = voronoiTreemap()
                .clip([[0, 0], [MAP_WIDTH, 0], [MAP_WIDTH, MAP_HEIGHT], [0, MAP_HEIGHT]])
                .extent([[0, 0], [MAP_WIDTH, MAP_HEIGHT]])
                .maxIterationCount(50)
                .prng(seededRandom(42));

            const root = d3.hierarchy(displayData)
                .sum(d => d.weight || 1)
                .sort((a, b) => (b.value || 0) - (a.value || 0));

            vtreemap(root);
            layoutRef.current = root;

            const allNodes = root.descendants() || [];
            const leaves = root.leaves() || [];
            const sectors = root.children || [];

            const g = svg.append("g");

            const zoom = d3.zoom()
                .scaleExtent([0.2, 8])
                .on("zoom", (event) => g.attr("transform", event.transform));
            svg.call(zoom);

            const leafGroups = g.selectAll(".leaf")
                .data(leaves)
                .enter()
                .append("g")
                .attr("class", "leaf")
                .on("mouseenter", (event, d) => {
                    if (d && d.data) {
                        setSelectedNode(d.data);
                        d3.select(event.currentTarget).select(".leaf-path").attr("stroke-width", 2).attr("stroke", "#fff");
                    }
                })
                .on("mouseleave", (event, d) => {
                    setSelectedNode(null);
                    d3.select(event.currentTarget).select(".leaf-path").attr("stroke-width", 0.5).attr("stroke", "rgba(255,255,255,0.2)");
                })
                .on("click", (event, d) => {
                    if (d && d.data && d.data.symbol) {
                        setDetailedStockSymbol(decodeURIComponent(d.data.symbol));
                    }
                });

            leafGroups.append("path")
                .attr("class", "leaf-path")
                .attr("d", d => {
                    if (d && d.polygon) return "M" + d.polygon.join("L") + "Z";
                    return "";
                })
                .attr("fill", d => {
                    if (!d || !d.data || !d.data.symbol) return "#eab308";
                    const sym = decodeURIComponent(d.data.symbol);
                    const stock = globalYahooStocks ? globalYahooStocks[sym] : null;
                    const change = stock ? (stock.changePercent || 0) : 0;
                    if (change >= 6.8) return "#c026d3";
                    if (change > 0) return "#22c55e";
                    if (change <= -6.8) return "#3b82f6";
                    if (change < 0) return "#ef4444";
                    return "#eab308";
                })
                .attr("stroke", "rgba(255,255,255,0.15)")
                .attr("stroke-width", 0.5);

            leafGroups.append("text")
                .attr("class", "leaf-symbol")
                .attr("x", d => d.polygon ? d.polygon.site.x : 0)
                .attr("y", d => d.polygon ? d.polygon.site.y - 6 : 0)
                .attr("text-anchor", "middle")
                .attr("fill", "#fff")
                .attr("font-size", d => d.polygon ? Math.min(d.polygon.site.radius * 0.55, 14) : 12)
                .attr("font-weight", "bold")
                .text(d => {
                    if (!d || !d.data || !d.data.symbol) return "";
                    const sym = decodeURIComponent(d.data.symbol);
                    return DISPLAY_NAMES[sym] || sym.split('.')[0];
                });

            leafGroups.append("text")
                .attr("class", "leaf-percent")
                .attr("x", d => d.polygon ? d.polygon.site.x : 0)
                .attr("y", d => d.polygon ? d.polygon.site.y + 10 : 0)
                .attr("text-anchor", "middle")
                .attr("fill", "rgba(255,255,255,0.9)")
                .attr("font-size", d => d.polygon ? Math.min(d.polygon.site.radius * 0.42, 11) : 9)
                .text(d => {
                    if (!d || !d.data || !d.data.symbol) return "0.00%";
                    const sym = decodeURIComponent(d.data.symbol);
                    const stock = globalYahooStocks ? globalYahooStocks[sym] : null;
                    const change = stock ? (stock.changePercent || 0) : 0;
                    return `${change > 0 ? '+' : ''}${change.toFixed(2)}%`;
                });

            // Đường viền nhóm
            const allInternalNodes = allNodes.filter(d => d.depth > 0 && d.children);
            g.selectAll(".node-boundary")
                .data(allInternalNodes)
                .enter()
                .append("path")
                .attr("class", "node-boundary")
                .attr("d", d => {
                    if (d && d.polygon) return "M" + d.polygon.join("L") + "Z";
                    return "";
                })
                .attr("fill", "none")
                .attr("stroke", "#fff")
                .attr("stroke-width", d => d.depth === 1 ? 2 : 1)
                .style("pointer-events", "none")
                .style("opacity", d => d.depth === 1 ? 1 : 0.6);

            // Label nhóm ngành
            const sectorLabels = g.selectAll(".sector-pill")
                .data(sectors)
                .enter()
                .append("g")
                .attr("class", "sector-pill")
                .attr("transform", d => {
                    if (d && d.polygon) return `translate(${d.polygon.site.x}, ${d.polygon.site.y})`;
                    return "translate(0,0)";
                })
                .style("pointer-events", "none");

            sectorLabels.append("rect")
                .attr("x", -70).attr("y", -16).attr("width", 140).attr("height", 32).attr("rx", 16)
                .attr("fill", d => (d.data && d.data.color) ? d.data.color : "#444")
                .attr("stroke", "#fff").attr("stroke-width", 2).attr("opacity", 0.95);

            sectorLabels.append("text")
                .attr("text-anchor", "middle").attr("dominant-baseline", "central")
                .attr("fill", "#fff").attr("font-size", "13px").attr("font-weight", "900")
                .text(d => (d.data && d.data.name) ? d.data.name : "");

        } catch (err) {
            console.error("Heatmap Error:", err);
            setError(err.message);
        }
    }, [selectedSector, loadingPercentage, forceShow, activeHeatmapData]);

    const totalStockCount = stockCounts.ceiling + stockCounts.up + stockCounts.ref + stockCounts.down + stockCounts.floor;

    return (
        <div className="money-flow-map-shell">
        <div className="money-flow-tab-strip" role="tablist" aria-label="Money flow asset groups">
            {heatmapTabs.map(tab => (
                <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={activeTabId === tab.id}
                    className={`money-flow-tab-btn tab-${tab.id} ${activeTabId === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveTabId(tab.id)}
                >
                    {tab.icon && <span className="money-flow-tab-icon">{tab.icon}</span>}
                    <span className="money-flow-tab-label">{tab.label}</span>
                </button>
            ))}
        </div>

        <div className="heatmap-wrapper" ref={containerRef} style={{
            background: '#0b132b',
            height: '800px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderRadius: '12px',
            position: 'relative'
        }}>
            {error && <div className="error-overlay">{error}</div>}

            {/* Premium Glassmorphic Loading Screen */}
            {loadingPercentage < 95 && !forceShow ? (
                <div className="heatmap-loading-overlay">
                    <div className="premium-loader-container" style={{
                        textAlign: 'center',
                        maxWidth: '420px',
                        padding: '35px',
                        borderRadius: '24px',
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
                        backdropFilter: 'blur(20px)'
                    }}>
                        <div className="spinner-glow" style={{
                            position: 'relative',
                            width: '90px',
                            height: '90px',
                            margin: '0 auto 25px auto',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}>
                            <div className="double-spin" style={{
                                width: '100%',
                                height: '100%',
                                border: '4px solid rgba(245, 158, 11, 0.1)',
                                borderTop: '4px solid #f59e0b',
                                borderRight: '4px solid #f59e0b',
                                borderRadius: '50%',
                                animation: 'spin 1.2s linear infinite'
                            }}></div>
                            <span style={{
                                position: 'absolute',
                                fontSize: '20px',
                                fontWeight: '900',
                                color: '#f59e0b'
                            }}>{loadingPercentage}%</span>
                        </div>
                        <h3 style={{ color: '#fff', margin: '0 0 10px 0', fontSize: '18px', fontWeight: '800', letterSpacing: '0.5px' }}>
                            ĐANG TẢI DÒNG TIỀN THỊ TRƯỜNG
                        </h3>
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', margin: '0 0 25px 0', lineHeight: '1.6' }}>
                            Hệ thống đang kết nối luồng dữ liệu thời gian thực và đồng bộ snapshot dòng tiền toàn cầu...
                        </p>
                        {loadingPercentage > 5 && (
                            <button 
                                onClick={() => setForceShow(true)}
                                style={{
                                    background: 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)',
                                    color: '#000',
                                    border: 'none',
                                    padding: '10px 24px',
                                    fontSize: '12px',
                                    fontWeight: '900',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    boxShadow: '0 0 15px rgba(245,158,11,0.4)',
                                    transition: 'all 0.2s',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}
                            >
                                Bỏ qua & Xem bản đồ
                            </button>
                        )}
                    </div>
                </div>
            ) : null}

            {/* Toolbar */}
            <div className="heatmap-toolbar" style={{ flexShrink: 0 }}>
                <div className="toolbar-left">
                    <button className={`toolbar-btn ${!selectedSector ? 'active' : ''}`} onClick={() => setSelectedSector(null)}>
                        {t("MoneyFlowHeatmap.toolbar.all")}
                    </button>
                    <button className="toolbar-btn">{t("MoneyFlowHeatmap.toolbar.filter")}</button>
                    <button className="toolbar-btn">{t("MoneyFlowHeatmap.toolbar.sector")}</button>
                    <button className="toolbar-btn highlight">{t("MoneyFlowHeatmap.toolbar.netSell")}</button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '12px', borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: '12px' }}>
                        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', marginRight: '4px' }}>So sánh:</span>
                        {COMPARE_OPTIONS.map(opt => (
                            <button
                                key={opt.days}
                                title={opt.title}
                                onClick={() => handleCompareDaysChange(opt.days)}
                                style={{
                                    padding: '3px 8px', fontSize: '11px',
                                    fontWeight: compareDays === opt.days ? 'bold' : 'normal',
                                    background: compareDays === opt.days ? '#f59e0b' : 'rgba(255,255,255,0.1)',
                                    color: compareDays === opt.days ? '#000' : '#fff',
                                    border: 'none', borderRadius: '4px',
                                    cursor: isLoadingCompare ? 'wait' : 'pointer',
                                    opacity: isLoadingCompare && compareDays !== opt.days ? 0.5 : 1,
                                    transition: 'all 0.15s',
                                }}
                            >
                                {isLoadingCompare && compareDays === opt.days ? '...' : opt.label}
                            </button>
                        ))}
                    </div>
                </div>
                {selectedNode && (
                    <div className="node-detail">
                        <strong>{selectedNode.name} ({decodeURIComponent(selectedNode.symbol || '')})</strong>:
                        <span className={(stocksData[decodeURIComponent(selectedNode.symbol || '')]?.changePercent || 0) >= 0 ? 'text-green' : 'text-red'}>
                            {stocksData[decodeURIComponent(selectedNode.symbol || '')]
                                ? ` ${stocksData[decodeURIComponent(selectedNode.symbol || '')].price?.toLocaleString()} (${stocksData[decodeURIComponent(selectedNode.symbol || '')].changePercent?.toFixed(2)}%)`
                                : ' ---'}
                        </span>
                    </div>
                )}
            </div>

            {/* Bản đồ nhiệt — scroll ngang + dọc */}
            <div ref={heatmapAreaRef} style={{
                overflowX: 'auto',
                overflowY: 'auto',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: '8px',
                margin: '5px 10px',
                flexGrow: 1,
                minHeight: '400px',
                display: (loadingPercentage > 0 || forceShow) ? 'block' : 'none'
            }}>
                <svg
                    ref={svgRef}
                    width={MAP_WIDTH}
                    height={MAP_HEIGHT}
                    style={{ display: 'block' }}
                />
            </div>

            {/* Trạng thái không có dữ liệu */}
            {loadingPercentage === 0 && !forceShow ? (
                <div style={{
                    flexGrow: 1,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: 'rgba(255, 255, 255, 0.4)',
                    fontSize: '15px',
                    fontFamily: "'Inter', sans-serif"
                }}>
                    Đang kết nối API và đồng bộ snapshot...
                </div>
            ) : null}

            {/* Footer */}
            <div className="heatmap-footer" style={{ flexShrink: 0, padding: '5px 10px' }}>
                <div className="legend">
                    <span className="legend-item"><span className="box" style={{ backgroundColor: '#c026d3' }}></span> {t("MoneyFlowHeatmap.legend.upLimit")}: {stockCounts.ceiling}</span>
                    <span className="legend-item"><span className="box" style={{ backgroundColor: '#22c55e' }}></span> {t("MoneyFlowHeatmap.legend.up")}: {stockCounts.up}</span>
                    <span className="legend-item"><span className="box" style={{ backgroundColor: '#eab308' }}></span> {t("MoneyFlowHeatmap.legend.neutral")}: {stockCounts.ref}</span>
                    <span className="legend-item"><span className="box" style={{ backgroundColor: '#ef4444' }}></span> {t("MoneyFlowHeatmap.legend.down")}: {stockCounts.down}</span>
                    <span className="legend-item"><span className="box" style={{ backgroundColor: '#3b82f6' }}></span> {t("MoneyFlowHeatmap.legend.downLimit")}: {stockCounts.floor}</span>
                </div>
                <div className="footer-info">
                    {t("MoneyFlowHeatmap.totalStocks", { count: totalStockCount })} | {new Date().toLocaleTimeString()}
                </div>
            </div>

            {/* Bar chart */}
            <div style={{ flexShrink: 0, padding: '0 10px 10px 10px' }}>
                <SectorBarChart
                    stocksData={stocksData}
                    selectedSector={selectedSector}
                    onSectorClick={setSelectedSector}
                    data={activeHeatmapData}
                />
            </div>

            {/* Detail panel */}
            {detailedStockSymbol && (
                <StockDetailPanel
                    symbol={detailedStockSymbol}
                    stockData={stocksData ? stocksData[detailedStockSymbol] : null}
                    onClose={() => setDetailedStockSymbol(null)}
                />
            )}
        </div>
        </div>
    );
};

export default MoneyFlowHeatmap;
