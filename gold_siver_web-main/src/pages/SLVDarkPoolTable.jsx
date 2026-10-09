import React, { useEffect, useState } from 'react';
import './SLVDarkPoolTable.css';

const SLVDarkPoolTable = () => {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const pageSize = 10;
    const [pageInput, setPageInput] = useState(1);
    const [lastUpdate, setLastUpdate] = useState("");

    useEffect(() => {
        let alive = true;

        const load = async () => {
            try {
                const res = await fetch('https://api_gold.thinkdiff.us/SLV_von_vao');
                if (!res.ok) throw new Error(res.status);

                const data = await res.json();
                const list = data?.slv_dark_pool_levels || [];

                if (!alive) return;
                setRows(list);
                if (list.length > 0) {
                    setLastUpdate(list[0].created_at);
                    // hoặc nếu không chắc API đã sort:
                    // setLastUpdate(
                    //   [...list].sort((a,b) => new Date(b.created_at) - new Date(a.created_at))[0].created_at
                    // );
                }
            } catch (err) {
                console.error('SLV Dark Pool fetch error:', err);
            } finally {
                if (alive) setLoading(false);
            }
        };

        load();
        return () => (alive = false);
    }, []);
    const totalPages = Math.ceil(rows.length / pageSize);

    const pagedRows = rows.slice(
        (page - 1) * pageSize,
        page * pageSize
    );

    if (loading) return <div className="dp-loading">Loading Dark Pool…</div>;
    if (!rows.length) return null;

    return (
        <div className="darkpool-card">
            <div className="darkpool-header">
                <div className="darkpool-title">SLV Dark Pool Levels</div>

            </div>



            <table className="darkpool-table">
                <thead>
                    <tr>
                        <th>Level</th>
                        <th>Traders</th>
                        <th>Volume</th>
                        <th>Premium</th>
                    </tr>
                </thead>
                <tbody>
                    {pagedRows.map((row, i) => (
                        <tr key={i}>
                            <td className="dp-level-cell">
                                <div className="dp-price">
                                    {row.price_level?.toFixed(2)}
                                </div>
                                <div className="dp-time">
                                    {row.created_at}
                                </div>
                            </td>

                            <td>{row.trade_count?.toLocaleString()}</td>
                            <td>{row.volume?.toLocaleString()}</td>
                            <td>
                                ${row.premium?.toLocaleString(undefined, {
                                    maximumFractionDigits: 0
                                })}
                            </td>
                        </tr>
                    ))}
                </tbody>

            </table>
            <div className="dp-pagination">
                <button
                    disabled={page === 1}
                    onClick={() => {
                        const newPage = page - 1;
                        setPage(newPage);
                        setPageInput(newPage);
                    }}
                >
                    ←
                </button>

                <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={pageInput}
                    onChange={(e) => setPageInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            let p = Number(pageInput);
                            if (p < 1) p = 1;
                            if (p > totalPages) p = totalPages;
                            setPage(p);
                            setPageInput(p);
                        }
                    }}
                    className="dp-page-input"
                />

                <span>/ {totalPages}</span>

                <button
                    disabled={page === totalPages}
                    onClick={() => {
                        const newPage = page + 1;
                        setPage(newPage);
                        setPageInput(newPage);
                    }}
                >
                    →
                </button>
            </div>


        </div>
    );
};

export default SLVDarkPoolTable;
