import { useParams } from "react-router-dom";
import "./EtfSharkDetail.css";
import ETF_MAP from "./ETFData";
import ETF_MAP_ENGLISH from "./ETFDataEnglish";
import { useState, useEffect } from "react";
import { translateETFData, quickTranslateETF } from "../../utils/etfTranslator";


const ProgressBar = ({ value }) => (
    <div className="progress-bar">
        <div
            className="progress-fill"
            style={{ width: `${value}%` }}
        />
    </div>
);

export default function EtfSharkDetail() {
    const { etfSlug } = useParams();
    const [etfData, setEtfData] = useState(null);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const loadETFData = async () => {
            // Ưu tiên dữ liệu tiếng Việt có sẵn
            let originalETF = ETF_MAP[etfSlug];
            let needsTranslation = false;

            // Nếu không có dữ liệu tiếng Việt, dùng dữ liệu tiếng Anh
            if (!originalETF) {
                originalETF = ETF_MAP_ENGLISH[etfSlug];
                needsTranslation = true;
            }

            if (!originalETF) {
                setLoading(false);
                return;
            }

            try {
                if (needsTranslation) {
                    // Dịch dữ liệu từ tiếng Anh sang tiếng Việt
                    const translatedETF = await translateETFData(originalETF);
                    setEtfData(translatedETF);
                } else {
                    // Sử dụng dữ liệu tiếng Việt có sẵn
                    setEtfData(originalETF);
                }
            } catch (error) {
                console.error('Error translating ETF data:', error);
                // Fallback: sử dụng quick translate
                const quickTranslated = {
                    ...originalETF,
                    name: quickTranslateETF(originalETF.name)
                };
                setEtfData(quickTranslated);
            } finally {
                setLoading(false);
            }
        };

        loadETFData();
    }, [etfSlug]);

    if (loading) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '400px',
                color: '#fff'
            }}>
                <div>Đang dịch thông tin ETF...</div>
            </div>
        );
    }

    if (!etfData) {
        return <div>ETF không tìm thấy</div>;
    }
    // return (
    //     <iframe
    //         src="/bieu-do-quy-ETF-iShares.html"
    //         width="100%"
    //         height="420"
    //         style={{ border: "none", borderRadius: "8px" }}
    //         title="ETF chart"
    //     />
    // );
    return (
        <div className="etf-detail">
            <h1 className="section-title">{etfData?.name}</h1>
            <p></p>

            <div className="description">
                <h2 className="section-title">Mô tả</h2>
                {etfData?.description?.map((para, index) => (
                    <p key={index}>{para}</p>
                ))}
            </div>

            <div>
                <h2 className="section-title">Những điều cơ bản</h2>

                <table className="basics-table">
                    <tbody>
                        {etfData.basics?.map((item, idx) => (
                            <tr key={idx}>
                                <td className="label">{item.key}</td>
                                <td className="value">
                                    {item.value}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <HoldingsSection holdings={etfData.holdings} />
            <OffersSection offers={etfData.offers} />
            <OrderFeesSection orderFees={etfData.orderFees} />
            <PerformanceSection performance={etfData.performance} />
            <RiskSection risk={etfData.risk} />
        </div>
    );
}


function HoldingsSection({ holdings }) {
    return (
        <div className="holdings-section">
            <h2 className="section-title">Công ty nắm giữ</h2>
            <p className="section-subtitle">
                Dưới đây là thông tin về thành phần của quỹ Global X Silver Miners UCITS ETF USD Accumulating.
            </p>

            <div className="holdings-grid">
                {/* ===== LEFT COLUMN ===== */}
                <div className="holdings-left">
                    <h3>Top 10 Holdings</h3>

                    <div className="summary-box">
                        <span>
                            Tỷ trọng của 10 khoản đầu tư hàng đầu trên {holdings.summary.totalHoldings}
                        </span>
                        <span className="summary-value">
                            {holdings.summary.top10Weight}%
                        </span>
                        <ProgressBar value={holdings.summary.top10Weight} />
                    </div>

                    {holdings.topHoldings.map((item) => (
                        <div key={item.name} className="row">
                            <span className="row-name">{item.name}</span>
                            <span className="row-value">{item.weight}%</span>
                            <ProgressBar value={item.weight} />
                        </div>
                    ))}
                </div>

                {/* ===== RIGHT COLUMN ===== */}
                <div className="holdings-right">
                    <div className="block">
                        <h3>Các quốc gia</h3>
                        {holdings.countries.map((item) => (
                            <div key={item.name} className="row">
                                <span className="row-name">{item.name}</span>
                                <span className="row-value">{item.weight}%</span>
                                <ProgressBar value={item.weight} />
                            </div>
                        ))}
                    </div>

                    <div className="block">
                        <h3>Các lĩnh vực</h3>
                        {holdings.sectors.map((item) => (
                            <div key={item.name} className="row">
                                <span className="row-name">{item.name}</span>
                                <span className="row-value">{item.weight}%</span>
                                <ProgressBar value={item.weight} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="asof">
                Tính đến ngày {new Date(holdings.asOfDate).toLocaleDateString("vi-VN")}
            </div>
        </div>
    );
}

const RatingStars = ({ value }) => {
    const fullStars = Math.floor(value);
    const halfStar = value % 1 !== 0;

    return (
        <div className="stars">
            {[...Array(fullStars)].map((_, i) => (
                <span key={i}>★</span>
            ))}
            {halfStar && <span>☆</span>}
        </div>
    );
};

export function OffersSection({ offers }) {
    return (
        <div className="offers-section">
            <h2 className="offers-title">Chương trình tiết kiệm ETF cung cấp</h2>
            <p className="offers-desc">{offers.description}</p>

            <div className="offers-filter">
                <span>Chọn số tiền bạn muốn tiết kiệm:</span>
                <select defaultValue={offers.defaultMonthlyAmount}>
                    <option value={offers.defaultMonthlyAmount}>
                        {offers.defaultMonthlyAmount} {offers.currency}
                    </option>
                </select>
            </div>

            <table className="offers-table">
                <thead>
                    <tr>
                        <th>Môi giới</th>
                        <th>Xếp hạng</th>
                        <th>Phí thực hiện</th>
                        <th>Phí tài khoản</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {offers.providers.map((p) => (
                        <tr key={p.name}>
                            <td className="provider">{p.name}</td>
                            <td>
                                <RatingStars value={p.rating} />
                            </td>
                            <td>{p.executionFee}</td>
                            <td>
                                {p.accountFee}
                                {p.note && <span className="note"> ⓘ</span>}
                            </td>
                            <td>
                                <button className="offer-btn">
                                    {p.actionLabel}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export function OrderFeesSection({ orderFees }) {
    return (
        <div className="offers-section">
            <h2 className="offers-title">
                Phí giao dịch ETF theo nhà môi giới
            </h2>

            <p className="offers-desc">
                {orderFees.description}
            </p>

            <div className="offers-filter">
                <span>Chọn khối lượng giao dịch:</span>
                <select defaultValue={orderFees.defaultOrderVolume}>
                    <option value={orderFees.defaultOrderVolume}>
                        {orderFees.defaultOrderVolume} {orderFees.currency}
                    </option>
                </select>
            </div>

            <table className="offers-table">
                <thead>
                    <tr>
                        <th>Môi giới</th>
                        <th>Xếp hạng</th>
                        <th>Phí giao dịch</th>
                        <th>Số ETF tiết kiệm</th>
                        <th></th>
                    </tr>
                </thead>

                <tbody>
                    {orderFees.providers.map((p) => (
                        <tr key={p.name}>
                            <td className="provider">{p.name}</td>

                            <td>
                                <RatingStars value={p.rating} />
                            </td>

                            <td>{p.orderFee}</td>

                            <td>
                                {p.etfSavingsPlans.toLocaleString("vi-VN")}
                                {p.note && (
                                    <span className="note"> ⓘ</span>
                                )}
                            </td>

                            <td>
                                <button className="offer-btn">
                                    {p.actionLabel}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}


export function PerformanceSection({ performance }) {
    const { summary, heatmap, currency } = performance;

    return (
        <div className="performance-section">
            <h2 className="section-title-performance">Hiệu suất</h2>
            <div className="performance-wrapper">
                {/* LEFT */}

                <div className="performance-left">
                    <h3>Tổng quan về chính sách hoàn trả</h3>
                    <div className="performance-table">

                        {summary.map((item) => (
                            <div className="perf-row" key={item.key}>
                                <span className="perf-label">{item.label}</span>
                                <span
                                    className={`perf-value ${item.value == null
                                        ? "neutral"
                                        : item.value >= 0
                                            ? "positive"
                                            : "negative"
                                        }`}
                                >
                                    {item.value == null ? "-" : `${item.value.toFixed(2)}%`}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT */}
                <div className="performance-right">
                    <h3 className="section-title">
                        Lợi nhuận hàng tháng được thể hiện trên bản đồ nhiệt
                    </h3>
                    <div className="heatmap">
                        <div className="heatmap-header">
                            <span></span>
                            {heatmap.months.map((m) => (
                                <span key={m}>{m}</span>
                            ))}
                        </div>

                        {Object.entries(heatmap.data).map(([year, values]) => (
                            <div className="heatmap-row" key={year}>
                                <span className="heatmap-year">{year}</span>
                                {values.map((v, i) => (
                                    <span
                                        key={i}
                                        className={`heatmap-cell ${getHeatClass(v)}`}
                                    >
                                        {v > 0 ? `+${v}` : v}
                                    </span>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
function getHeatClass(value) {
    if (value >= 20) return "heat-very-positive";
    if (value >= 10) return "heat-positive";
    if (value > 0) return "heat-light-positive";
    if (value === 0) return "heat-neutral";
    if (value > -5) return "heat-light-negative";
    if (value > -10) return "heat-negative";
    return "heat-very-negative";
}


export function RiskSection({ risk }) {
    const { overview, rollingVolatility } = risk;

    return (
        <div className="risk-wrapper">
            {/* LEFT */}
            <div className="risk-left">
                <h2 className="section-title">{risk.title}</h2>

                {risk.overview.map(item => (
                    <div key={item.key} className="risk-row">
                        <span>{item.label}</span>
                        <span className={item.value < 0 ? "negative" : ""}>
                            {item.value == null ? "-" : `${item.value}${item.unit}`}
                        </span>
                    </div>
                ))}

            </div>

            {/* RIGHT */}
            <div className="risk-right">
                <h2 className="section-title">{rollingVolatility.title}</h2>

                <div className="volatility-chart">
                    <img src={rollingVolatility.chartUrl} alt="Volatility Chart" />
                </div>
            </div>
        </div>
    );
}




