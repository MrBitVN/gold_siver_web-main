import React, { useEffect, useState } from 'react';
import './SLVShortInterestTable.css';

export default function SLVShortInterestTable() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    fetch('https://api_gold.thinkdiff.us/slv_short_long')
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((json) => {
        const arr = json?.slv_short_interest_fintel || [];
        if (mounted) setData(arr);
      })
      .catch((err) => {
        if (mounted) setError(err.message || String(err));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  const fmtInt = (v) => {
    if (v === null || v === undefined || v === '') return '-';
    const n = Number(String(v).replace(/,/g, ''));
    if (Number.isNaN(n)) return v;
    return new Intl.NumberFormat().format(n);
  };

  const fmtFloat = (v, digits = 2) => {
    if (v === null || v === undefined || v === '') return '-';
    const n = Number(String(v).replace(/,/g, ''));
    if (Number.isNaN(n)) return v;
    return n.toFixed(digits);
  };

  return (
    <div className="slv-si">
      <div className="slv-si__container">
        <div className="slv-si__header">
          <h2 className="slv-si__title">Short Interest (Fintel)</h2>
        </div>
        <div className="slv-si__table-container">
          <div className="slv-scroll-area">
            {loading ? (
              <div className="slv-si__loading">Loading…</div>
            ) : error ? (
              <div className="slv-si__error">{error}</div>
            ) : (
              <table className="slv-si__table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th className="slv-right">Short Interest</th>
                    <th className="slv-right">Days to Cover</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((r, i) => (
                    <tr key={`${r.date}-${i}`}>
                      <td className="slv-left">{r.date}</td>
                      <td className="slv-right">{fmtInt(r.short_interest)}</td>
                      <td className="slv-right">{fmtFloat(r.days_to_cover, 2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
