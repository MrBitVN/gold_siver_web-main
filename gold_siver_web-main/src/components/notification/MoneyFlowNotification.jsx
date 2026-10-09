import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchMarketReport } from '../../services/marketReportService';
import './MoneyFlowNotification.css';

const CYCLE_TIME = 1 * 60 * 1000; // 1 minute

const MoneyFlowNotification = () => {
    const navigate = useNavigate();
    const [report, setReport] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    const [progress, setProgress] = useState(0);

    const loadData = async () => {
        console.log('MoneyFlowNotification: Fetching data...');
        try {
            const data = await fetchMarketReport();
            console.log('MoneyFlowNotification: Data received:', data);
            
            if (data && data.leaderboard && data.leaderboard.length > 0) {
                setReport(data);
                showNotification();
            } else {
                console.warn('MoneyFlowNotification: No valid leaderboard data found, using dummy data for demo');
                setReport({
                    leaderboard: [
                        { group_name: "INSURANCE_BROKERS", avg_price_growth_pct: 2.2, category: "nhóm cổ phiếu tài chính ngân hàng và bảo hiểm mỹ" },
                        { group_name: "SILVER", avg_price_growth_pct: -4.84, category: "nhóm Kim Loại" }
                    ]
                });
                showNotification();
            }
        } catch (error) {
            console.error('MoneyFlowNotification: Error loading data, using dummy data for demo:', error);
            setReport({
                leaderboard: [
                    { group_name: "INSURANCE_BROKERS", avg_price_growth_pct: 2.2, category: "nhóm cổ phiếu tài chính ngân hàng và bảo hiểm mỹ" },
                    { group_name: "SILVER", avg_price_growth_pct: -4.84, category: "nhóm Kim Loại" }
                ]
            });
            showNotification();
        }
    };

    const showNotification = () => {
        if (localStorage.getItem("stock_alerts_enabled") !== "true") return;
        console.log('MoneyFlowNotification: Showing notification');
        setIsVisible(true);
        setProgress(0);
        
        // Auto-hide after 15 seconds
        setTimeout(() => {
            setIsVisible(false);
        }, 15000);
    };

    useEffect(() => {
        console.log('MoneyFlowNotification: Component mounted');
        
        // Forced trigger for demo after 2 seconds
        const demoTimer = setTimeout(() => {
            if (!report) {
                console.log('MoneyFlowNotification: Forced demo trigger');
                setReport({
                    leaderboard: [
                        { group_name: "INSURANCE_BROKERS", avg_price_growth_pct: 2.2, category: "nhóm cổ phiếu tài chính ngân hàng và bảo hiểm mỹ" },
                        { group_name: "SILVER", avg_price_growth_pct: -4.84, category: "nhóm Kim Loại" }
                    ]
                });
                showNotification();
            }
        }, 2000);

        // Initial load
        loadData();

        // Interval every 1 minute
        const interval = setInterval(loadData, CYCLE_TIME);

        return () => {
            clearTimeout(demoTimer);
            clearInterval(interval);
        };
    }, []);

    useEffect(() => {
        let timer;
        if (isVisible) {
            timer = setInterval(() => {
                setProgress(prev => Math.min(prev + (100 / (15000 / 100)), 100));
            }, 100);
        }
        return () => clearInterval(timer);
    }, [isVisible]);

    if (!isVisible || !report) return null;

    const topGroup = report.leaderboard[0];
    const bottomGroup = report.leaderboard[report.leaderboard.length - 1];

    return (
        <div className="money-flow-notification show" onClick={() => {
            console.log('MoneyFlowNotification: Card clicked, navigating...');
            navigate('/money-flow-heatmap');
        }}>
            <div className="mf-noti-card">
                <div className="mf-noti-close" onClick={(e) => {
                    e.stopPropagation();
                    setIsVisible(false);
                }}>✕</div>
                
                <div className="mf-noti-header">
                    <span className="mf-noti-icon">🔥</span>
                    <span className="mf-noti-title">PHÂN TÍCH DÒNG TIỀN</span>
                </div>

                <div className="mf-noti-content">
                    <div className="mf-item top">
                        <div className="mf-label">HÚT DÒNG TIỀN NHẤT</div>
                        <div className="mf-value">{topGroup.group_name}</div>
                        <div className="mf-stats">
                            <span className="mf-growth">+{topGroup.avg_price_growth_pct}%</span>
                            <span className="mf-category">{topGroup.category}</span>
                        </div>
                    </div>

                    <div className="mf-divider"></div>

                    <div className="mf-item bottom">
                        <div className="mf-label">OUT DÒNG TIỀN NHẤT</div>
                        <div className="mf-value">{bottomGroup.group_name}</div>
                        <div className="mf-stats">
                            <span className="mf-growth">{bottomGroup.avg_price_growth_pct}%</span>
                            <span className="mf-category">{bottomGroup.category}</span>
                        </div>
                    </div>
                </div>

                <div className="mf-progress-container">
                    <div className="mf-progress-fill" style={{ width: `${progress}%` }}></div>
                </div>
            </div>
        </div>
    );
};

export default MoneyFlowNotification;
