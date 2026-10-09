import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './SLVBorrowFeesTable.css';

const SLVBorrowFeesTable = () => {
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

    if (loading) return <div className="slv-loading">Đang tải dữ liệu...</div>;
    if (error) return <div className="slv-error">{error}</div>;

    return (
        <div className="slv-borrow-fees-scope">
            <div className="slv-borrow-fees-container">
                {/* Header */}
                <header className="slv-borrow-fees-header">
                    <div>
                        <h1>SLV Borrow Fee Rates</h1>
                        <p>Daily Borrow Fee Statistics</p>
                    </div>
                </header>
                {/* <div className="slv-borrow-fees-info">
                    <p>Last update: {new Date().toLocaleString()}</p>
                </div> */}
                {/* Bảng Dữ liệu */}
                <div className="slv-borrow-fees-table-container">
                    <div className="slv-scroll-area">
                        <table className="slv-borrow-fees-table">
                            <thead>
                                <tr>
                                    <th className="slv-center">Date</th>
                                    <th className="slv-center">Start</th>
                                    <th className="slv-center">Min</th>
                                    <th className="slv-center">Max</th>
                                    <th className="slv-center">Latest</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data?.slv_borrow_fees_fintel?.map((row, index) => (
                                    <tr key={index}>
                                        <td className="slv-center slv-gray">
                                            {row.date}
                                        </td>
                                        <td className="slv-center">
                                            {parseFloat(row.start).toFixed(2)}
                                        </td>
                                        <td className="slv-center">
                                            {parseFloat(row.min).toFixed(2)}
                                        </td>
                                        <td className="slv-center">
                                            {parseFloat(row.max).toFixed(2)}
                                        </td>
                                        <td className="slv-center slv-bold">
                                            {parseFloat(row.latest).toFixed(2)}
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

export default SLVBorrowFeesTable;
