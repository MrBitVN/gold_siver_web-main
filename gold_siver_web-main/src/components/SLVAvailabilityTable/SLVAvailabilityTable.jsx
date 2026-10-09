import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './SLVAvailabilityTable.css';

const SLVAvailabilityTable = () => {
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

    const formatNumber = (num) => {
        return new Intl.NumberFormat('en-US').format(parseInt(num, 10));
    };

    if (loading) return <div className="slv-loading">Đang tải dữ liệu...</div>;
    if (error) return <div className="slv-error">{error}</div>;

    return (
        <div className="slv-availability-scope">
            <div className="slv-availability-container">
                {/* Header */}
                <header className="slv-availability-header">
                    <div>
                        <h1>US:SLV Short Shares Availability</h1>
                        <p>Real-time Short Shares Availability Data</p>
                    </div>
                </header>
                {/* <div className="slv-availability-info">
                    <p>Last update: {new Date().toLocaleString()}</p>
                </div> */}

                {/* Bảng Dữ liệu */}
                <div className="slv-availability-table-container">
                    <div className="slv-scroll-area">
                        <table className="slv-availability-table">
                            <thead>
                                <tr>
                                    <th className="slv-left">Time Since Last Change</th>
                                    <th className="slv-center">Timestamp (UTC)</th>
                                    <th className="slv-right">US:SLV Short Shares Availability</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data?.slv_availability_fintel?.map((row, index) => (
                                    <tr key={index}>
                                        <td className="slv-left slv-gray">
                                            {row.time_since}
                                        </td>
                                        <td className="slv-center slv-gray">
                                            {row.timestamp_utc}
                                        </td>
                                        <td className="slv-right slv-bold slv-number">
                                            {formatNumber(row.availability)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default SLVAvailabilityTable;
