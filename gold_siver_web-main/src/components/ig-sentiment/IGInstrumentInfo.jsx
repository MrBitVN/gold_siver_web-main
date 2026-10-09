import React, { useEffect, useState } from "react";
import "./IGInstrumentInfo.css";

const IGInstrumentInfo = ({ info: infoProp = null }) => {
    const [info, setInfo] = useState(infoProp);
    useEffect(() => {
        if (infoProp) return; // nếu parent truyền info thì không fetch

        const fetchData = async () => {
            try {
                const res = await fetch("https://api_gold.thinkdiff.us/ig_sentiment");
                const data = await res.json();

                console.log("API raw:", data);

                // Hỗ trợ nhiều dạng trả về: { ig_sentiment: [...] }, array, hoặc object trực tiếp
                const pickLatestByDateOrFallback = (arr) => {
                    const objs = arr.filter(it => it && typeof it === 'object');
                    if (objs.length === 0) return null;

                    // Nếu có trường ngay_tao -> chọn bản ghi có ngày lớn nhất
                    const withDates = objs.map(it => {
                        const raw = it.ngay_tao || it.created_at || null;
                        const ts = raw ? new Date(String(raw).replace(' ', 'T')).getTime() : NaN;
                        return { it, ts };
                    });

                    const validDates = withDates.filter(x => !Number.isNaN(x.ts));
                    if (validDates.length > 0) {
                        validDates.sort((a, b) => b.ts - a.ts);
                        return validDates[0].it;
                    }

                    // fallback: tìm phần tử cuối cùng có trường trọng yếu
                    for (let i = objs.length - 1; i >= 0; i--) {
                        const it = objs[i];
                        if ('min_size' in it || 'contract_size' in it || 'one_pip_means' in it || 'symbol' in it || 'gia_sell' in it) {
                            return it;
                        }
                    }

                    // fallback cuối cùng: trả bản ghi cuối cùng
                    return objs[objs.length - 1];
                };

                let latest = null;

                if (data && Array.isArray(data.ig_sentiment) && data.ig_sentiment.length > 0) {
                    latest = pickLatestByDateOrFallback(data.ig_sentiment);
                } else if (Array.isArray(data) && data.length > 0) {
                    latest = pickLatestByDateOrFallback(data);
                } else if (data && typeof data === 'object') {
                    latest = data;
                }

                if (latest) {
                    console.log('Selected latest instrument (by date/fallback):', latest.ngay_tao, latest.id, latest);
                    setInfo(latest);
                } else {
                    console.warn('No IG instrument info found in API response');
                }
            } catch (err) {
                console.error("Fetch instrument info error:", err);
            }
        };

        fetchData();
    }, [infoProp]);




    if (!info) {
        return <div className="instrument-card">Đang tải dữ liệu...</div>;
    }

    return (
        <div className="instrument-card">
            <h3 className="instrument-title">{info.symbol} (Dealing)</h3>

            <div className="instrument-row">
                <span>Minimum size</span>
                <span>{info.min_size ?? '—'}</span>
            </div>

            <div className="instrument-row">
                <span>Contract size</span>
                <span>{info.contract_size ?? '—'}</span>
            </div>

            <div className="instrument-row">
                <span>One Pip means</span>
                <span>{info.one_pip_means ?? '—'}</span>
            </div>

            <div className="instrument-row">
                <span>Value of one Pip</span>
                <span>{info.value_one_pip ?? '—'}</span>
            </div>

            <div className="instrument-row">
                <span>Margin</span>
                <span>{info.margin ?? '—'}</span>
            </div>


            <div className="instrument-row">
                <span>Minimum stop distance</span>
                <span>{info.min_stop_dist ?? '—'}</span>
            </div>

            <div className="instrument-row">
                <span>Minimum guaranteed stop distance</span>
                <span>{info.min_guaranteed_stop ?? '—'}</span>
            </div>
        </div>
    );
};

export default IGInstrumentInfo;
