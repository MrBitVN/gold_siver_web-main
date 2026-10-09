import React, { useEffect, useState } from 'react';
import './SLVFailsToDeliverTable.css';

export default function SLVFailsToDeliverTable() {
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
        const arr = json?.slv_fails_to_deliver_fintel || [];
        if (mounted) setData(arr);
      })
      .catch((err) => {
        if (mounted) setError(err.message || String(err));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const formatInteger = (v) => {
    if (v === null || v === undefined || v === '') return '-';
    const n = Number(String(v).replace(/,/g, ''));
    if (Number.isNaN(n)) return v;
    return new Intl.NumberFormat().format(n);
  };

  const formatPrice = (p) => {
    if (p === null || p === undefined || p === '') return '-';
    const n = Number(String(p).replace(/,/g, ''));
    if (Number.isNaN(n)) return p;
    return n.toFixed(2);
  };

  const formatValue = (v) => {
    if (v === null || v === undefined || v === '') return '-';
    const n = Number(String(v).replace(/,/g, ''));
    if (Number.isNaN(n)) return v;
    return new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
  };

  return (
    <div className="slv-ftd">
      <div className="slv-ftd__container">
        <div className="slv-ftd__header">
          <h2 className="slv-ftd__title">Fails To Deliver (Fintel)</h2>
        </div>
        <div className="slv-ftd__table-container">
          <div className="slv-scroll-area">
            {loading ? (
              <div className="slv-ftd__loading">Loading…</div>
            ) : error ? (
              <div className="slv-ftd__error">{error}</div>
            ) : (
              <table className="slv-ftd__table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((r, i) => (
                    <tr key={`${r.date}-${r.quantity || i}`}>
                      <td className="slv-ftd__date">{r.date}</td>
                      <td className="slv-ftd__price">{formatPrice(r.price)}</td>
                      <td className="slv-ftd__qty">{formatInteger(r.quantity)}</td>
                      <td className="slv-ftd__value">{formatValue(r.value_usd)}</td>
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
