import React from "react";
import { formatPrice, calculateSpread } from "../../services/goldService";
import { getTrustColor } from "../../utils/trustHelper";
import "./PriceInternationalTable.css";

const PriceInternationalTable = ({ vendorData }) => {
    if (!vendorData || !vendorData.items || vendorData.items.length === 0) {
        return null;
    }

    return (
        <div className="price-table-card">
            <div className="table-header">
                <div className="header-top">
                    <div className="header-left-info">
                        <h2 className="vendor-name">{vendorData.name}</h2>
                        <p className="update-time">
                            Cập nhật: {vendorData.fetched_at || vendorData.timestamp}
                        </p>
                    </div>
                    {vendorData.do_uy_tin !== undefined &&
                        vendorData.do_uy_tin !== null && (
                            <p
                                className="trust-badge"
                                style={{ color: getTrustColor(vendorData.do_uy_tin) }}
                            >
                                ⭐ Độ uy tín: {vendorData.do_uy_tin}
                            </p>
                        )}
                </div>
            </div>

            <div className="table-wrapper">
                <table className="price-table">
                    <thead>
                        <tr>
                            <th className="col-product">LOẠI VÀNG</th>
                            <th className="col-price">MUA VÀO</th>
                            <th className="col-price">GIÁ GỐC</th>
                            <th className="col-price">BÁN RA</th>
                            <th className="col-price">BÁN CHỢ ĐEN</th>
                            <th className="col-price">TỶ GIÁ CHỢ ĐEN</th>
                            <th className="col-price">TỶ GIÁ NGÂN HÀNG</th>

                        </tr>
                    </thead>
                    <tbody>
                        {(() => {
                            // Ghim lên đầu nếu là 1 trong 2 loại: vàng 9999 hoặc bạc 1KG 999
                            const isPriority = (it) =>
                                it.purity === "1KG_BAC_999" || it.purity === "9999";
                            const prioritized = vendorData.items.filter(isPriority);
                            const others = vendorData.items.filter((it) => !isPriority(it));
                            const items = [...prioritized, ...others];

                            return items.map((item, index) => {
                                const isGold9999 = item.purity === "9999";
                                const isSilver1kg = item.purity === "1KG_BAC_999";
                                const highlightClass = isGold9999
                                    ? "highlight-9999"
                                    : isSilver1kg
                                        ? "highlight-silver"
                                        : "";

                                return (
                                    <tr key={index} className={highlightClass}>
                                        <td className="product-name">
                                            {item.name || item.product}
                                            {isGold9999 && (
                                                <span className="gold-badge">⭐ 9999</span>
                                            )}
                                            {isSilver1kg && (
                                                <span className="silver-badge">⭐ 1KG</span>
                                            )}
                                        </td>
                                        <td className="price-buy">{formatPrice(item.buy)}</td>
                                        <td className="price-sell">{formatPrice(item.gia_goc)}</td>
                                        <td className="price-buy">{formatPrice(item.sell)}</td>
                                        <td className="price-sell">{formatPrice(item.sell_cho_den)}</td>
                                        <td className="price-buy">{formatPrice(item.ty_gia_cho_den)}</td>
                                        <td className="price-sell">{formatPrice(item.ty_gia_ngan_hang)}</td>
                                    </tr>
                                );
                            });
                        })()}
                    </tbody>
                </table>
            </div>

            <div className="table-footer">
                {(() => {
                    const gold9999 = vendorData.items.find(
                        (item) => item.purity === "9999"
                    );
                    const silver1kg = vendorData.items.find(
                        (item) => item.purity === "1KG_BAC_999"
                    );

                    const spread9999 = gold9999
                        ? calculateSpread(gold9999.sell, gold9999.buy)
                        : null;
                    const spreadSilver = silver1kg
                        ? calculateSpread(silver1kg.sell, silver1kg.buy)
                        : null;

                    return (
                        <div className="spread-info">
                            {spread9999 && (
                                <small className="spread-item">
                                    ⭐ Chênh lệch Vàng 9999:{" "}
                                    <strong>{formatPrice(spread9999)}</strong>
                                </small>
                            )}
                            {spreadSilver && (
                                <small className="spread-item">
                                    ⭐ Chênh lệch Bạc 1KG:{" "}
                                    <strong>{formatPrice(spreadSilver)}</strong>
                                </small>
                            )}
                        </div>
                    );
                })()}
            </div>
        </div>
    );
};

export default PriceInternationalTable;
