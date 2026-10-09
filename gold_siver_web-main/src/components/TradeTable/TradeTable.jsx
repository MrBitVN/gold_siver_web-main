import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { format } from 'date-fns';

import './TradeTable.css';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

// --- Cấu hình mặc định cho Chart.js chế độ tối ---
ChartJS.defaults.color = '#94A3B8'; // Màu text mặc định (Slate 400)
ChartJS.defaults.borderColor = '#334155'; // Màu border grid (Slate 700)

const TradeTable = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const API_URL = "https://api_gold.thinkdiff.us/slv_short_long";

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await axios.get(API_URL);
                setData(response.data);
                setError(null);
            } catch (err) {
                console.error("Lỗi fetch API:", err);
                setError("Không thể tải dữ liệu. Vui lòng kiểm tra Console (F12) xem có lỗi CORS không.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 300000);
        return () => clearInterval(interval);
    }, []);

    const availabilityChartData = useMemo(() => {
        if (!data || !data.slv_availability_fintel) return null;
        const sortedData = [...data.slv_availability_fintel].sort(
            (a, b) => new Date(a.timestamp_utc) - new Date(b.timestamp_utc)
        );
        return {
            labels: sortedData.map(item => format(new Date(item.timestamp_utc), 'dd/MM HH:mm')),
            datasets: [
                {
                    label: 'Shares Available',
                    data: sortedData.map(item => parseInt(item.availability, 10)),
                    borderColor: '#60A5FA', // Blue 400
                    backgroundColor: 'rgba(96, 165, 250, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3,
                    pointBackgroundColor: '#1E293B',
                    pointBorderColor: '#60A5FA',
                    borderWidth: 2,
                },
            ],
        };
    }, [data]);

    const feesChartData = useMemo(() => {
        if (!data || !data.slv_borrow_fees_fintel) return null;
        const sortedData = [...data.slv_borrow_fees_fintel].sort(
            (a, b) => new Date(a.date) - new Date(b.date)
        );
        return {
            labels: sortedData.map(item => item.date),
            datasets: [
                {
                    label: 'Latest Fee (%)',
                    data: sortedData.map(item => parseFloat(item.latest)),
                    backgroundColor: 'rgba(248, 113, 113, 0.7)', // Red 400
                    borderColor: '#F87171',
                    borderWidth: 1,
                    borderRadius: 4,
                    order: 2,
                },
                {
                    label: 'Max Fee (%)',
                    data: sortedData.map(item => parseFloat(item.max)),
                    type: 'line',
                    borderColor: '#FB923C', // Orange 400
                    borderWidth: 2,
                    pointRadius: 4,
                    pointBackgroundColor: '#1E293B',
                    pointBorderColor: '#FB923C',
                    tension: 0.3,
                    order: 1,
                }
            ],
        };
    }, [data]);

    // Options chung cho Chart để hiển thị đẹp trên nền tối
    const commonChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: { color: '#F1F5F9' } // Màu text legend sáng
            },
            tooltip: {
                backgroundColor: '#0F172A',
                titleColor: '#F8FAFC',
                bodyColor: '#CBD5E1',
                borderColor: '#334155',
                borderWidth: 1,
                padding: 10,
                displayColors: true,
            }
        },
        scales: {
            x: {
                grid: { color: '#334155', drawBorder: false },
                ticks: { color: '#94A3B8' }
            },
            y: {
                grid: { color: '#334155', borderDash: [5, 5], drawBorder: false },
                ticks: { color: '#94A3B8' }
            }
        }
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
    };

    if (loading) return <div className="slv-loading">Đang tải dữ liệu Dark Mode...</div>;
    if (error) return <div className="slv-error">{error}</div>;

    return (
        // Thêm class scope wrapper để biến CSS hoạt động đúng
        <div className="slv-dashboard-scope">
            <div className="slv-container">
                <div className="slv-wrapper">

                    {/* Header */}
                    <header className="slv-header">
                        <div>
                            <h1>SLV Market Intelligence</h1>
                            <p>Real-time Short Data & Dark Pool Flows (Dark Theme)</p>
                        </div>
                    </header>

                    {/* Grid Biểu đồ */}
                    <div className="slv-grid">
                        {/* Chart 1 */}
                        <div className="slv-card">
                            <div className="slv-card-title">
                                <span className="slv-indicator blue"></span>
                                Short Shares Availability
                            </div>
                            <div className="slv-chart-box">
                                {availabilityChartData && (
                                    <Line
                                        data={availabilityChartData}
                                        options={{
                                            ...commonChartOptions,
                                            scales: {
                                                ...commonChartOptions.scales,
                                                y: { ...commonChartOptions.scales.y, title: { display: true, text: 'Shares', color: '#64748B' } }
                                            }
                                        }}
                                    />
                                )}
                            </div>
                        </div>

                        {/* Chart 2 */}
                        <div className="slv-card">
                            <div className="slv-card-title">
                                <span className="slv-indicator orange"></span>
                                Borrow Fee Rates
                            </div>
                            <div className="slv-chart-box">
                                {feesChartData && (
                                    <Bar
                                        data={feesChartData}
                                        options={{
                                            ...commonChartOptions,
                                            scales: {
                                                ...commonChartOptions.scales,
                                                y: { ...commonChartOptions.scales.y, title: { display: true, text: 'Rate (%)', color: '#64748B' } }
                                            }
                                        }}
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Bảng Dữ liệu */}
                    <div className="slv-table-container">
                        <div className="slv-scroll-area">
                            <table className="slv-table">
                                <thead>
                                    <tr>
                                        {/* Căn chỉnh Header khớp với hình ảnh */}
                                        <th className="slv-left">Time</th>
                                        <th className="slv-left">Symbol</th>
                                        <th className="slv-left">Trade side</th>
                                        <th className="slv-left">Side</th>
                                        <th className="slv-center">Contract</th>
                                        <th className="slv-center">Expiry</th>
                                        <th className="slv-center">DTX</th>
                                        <th className="slv-center">Strike Price</th> {/* Trong ảnh Strike căn giữa */}
                                        <th className="slv-center">Spot Price</th>   {/* Trong ảnh Spot căn giữa */}
                                        <th className="slv-center">Strike / Spot (%)</th>
                                        <th className="slv-center">Cond</th>
                                        <th className="slv-center">Event</th>
                                        <th className="slv-center">Trade</th>
                                        <th className="slv-center">Open Int</th>
                                        <th className="slv-center">IVOL</th>
                                        <th className="slv-center">Premium Paid</th>
                                        <th className="slv-center">Premium Sigmas</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data?.slv_dark_pool_levels?.slice(0, 80).map((row, index) => (
                                        <tr key={index}>
                                            {/* Cột Time: Tách dòng Date và Time */}
                                            <td className="slv-left">
                                                <span className="slv-date">{row.date}</span>
                                                <span className="slv-time" style={{ marginLeft: '4px' }}>{row.time}</span>
                                            </td>

                                            {/* Cột Symbol */}
                                            <td className="slv-left">
                                                <span className="slv-date">{row.symbol}</span>
                                            </td>

                                            {/* Cột trade side */}
                                            <td className="slv-left">
                                                <span className={row.trade_side === 'BUY' ? 'slv-text-green' : 'slv-text-red'}>{row.trade_side}</span>
                                            </td>

                                            {/* Cột side */}
                                            <td className="slv-left">
                                                <span className="slv-date">{row.side}</span>
                                            </td>

                                            {/* Cột Contract: Badge nằm giữa */}
                                            <td className="slv-left">
                                                <span className={`slv-badge ${row.contract === 'CALL' ? 'slv-badge-call' : 'slv-badge-put'}`}>
                                                    {row.contract}
                                                </span>
                                            </td>

                                            {/* Expiry */}
                                            <td className="slv-left slv-gray">
                                                {row.expiry}
                                            </td>

                                            {/* DTX */}
                                            <td className="slv-left slv-gray">
                                                {row.dte}
                                            </td>

                                            {/* Strike: Bold trắng */}
                                            <td className="slv-left slv-bold">
                                                {row.strike_price}
                                            </td>

                                            {/* Spot: Màu xám */}
                                            <td className="slv-left slv-gray">
                                                {row.spot_price}
                                            </td>

                                            <td className="slv-left slv-gray">
                                                {row.strike_spot_pct}
                                            </td>

                                            <td className="slv-left slv-gray">
                                                {row.cond}
                                            </td>

                                            <td className="slv-left slv-gray">
                                                {row.event}
                                            </td>

                                            {/* Type: Buy/Sell màu + Loại lệnh bên dưới */}
                                            <td className="slv-left">
                                                <span className="slv-left">{row.trade_type}</span> {/* Dùng class slv-time cho chữ nhỏ màu xám */}
                                            </td>

                                            <td className="slv-left">
                                                <span className="slv-left">{row.open_int}</span>
                                            </td>

                                            <td className="slv-left">
                                                <span className="slv-left">{row.ivol}</span>
                                            </td>

                                            {/* Premium: Căn phải */}
                                            <td className="slv-left slv-bold">
                                                {formatCurrency(parseFloat(row.premium_paid))}
                                            </td>
                                            <td className="slv-left slv-bold">
                                                <span className="slv-left">{row.premium_sigmas}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default TradeTable;