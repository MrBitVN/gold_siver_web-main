import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './SLVVolumeCombinedTable.css';

const SLVVolumeCombinedTable = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = "https://api_gold.thinkdiff.us/slv_short_long";

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await axios.get(API_URL);
        setData(res.data);
        setError(null);
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Không thể tải dữ liệu. Kiểm tra Console (F12) để xem lỗi.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 300000);
    return () => clearInterval(interval);
  }, []);

  const formatNumber = (n) => {
    if (n === null || n === undefined || n === '') return n;
    const parsed = parseInt(n, 10);
    if (Number.isNaN(parsed)) return n;
    return new Intl.NumberFormat('en-US').format(parsed);
  };

  if (loading) return <div className="slv-loading">Đang tải dữ liệu...</div>;
  if (error) return <div className="slv-error">{error}</div>;

  return (
    <div className="slv-volume-scope">
      <div className="slv-volume-container">
        <header className="slv-volume-header">
          <div>
            <h2>FINRA / Combined Short Volume</h2>
          </div>
          {/* <div className="slv-volume-update">Last update: {new Date().toLocaleString()}</div> */}
        </header>

        <div className="slv-volume-table-container">
          <div className="slv-scroll-area">
            <table className="slv-volume-table">
              <thead>
                <tr>
                  <th className="slv-left">Market Date</th>
                  <th className="slv-right">FINRA Short Volume</th>
                </tr>
              </thead>
              <tbody>
                {data?.slv_volume_combined_fintel?.map((row, idx) => (
                  <tr key={idx}>
                    <td className="slv-left slv-gray">{row.market_date}</td>
                    <td className="slv-right slv-bold">
                      {formatNumber(row.finra_short_vol)}
                      {row.psx_bx_vol === '+' ? <span className="slv-plus"> &nbsp;+</span> : null}
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

export default SLVVolumeCombinedTable;
