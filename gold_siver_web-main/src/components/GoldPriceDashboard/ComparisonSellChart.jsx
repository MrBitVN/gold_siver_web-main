import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ResponsiveContainer
} from "recharts";
import "./ComparisonSellChart.css"
import { useNavigate, useParams } from "react-router-dom";
import { UseGoldOneDayPrices } from "../../hooks/UseGoldOneDayPrices";
export default function ComparisonSellChart() {
    const { t } = useTranslation();
    const navigator = useNavigate()
    const params = useParams();
    const [selectedItem, setSelectedItem] = useState(null);

    const filterOptions = useMemo(
        () => ({
            day: params.day ? Number(params.day) : null,
            month: params.month ? Number(params.month) : null,
            year: params.year ? Number(params.year) : null,
            hour: params.hour ? Number(params.hour) : null,
            minute: params.minute ? Number(params.minute) : null,
            region: params.region || "Vietnam",
            type: params.type || "gold",
            level: params.level || "3"
        }),
        [params]
    );

    const {
        loading,
        error,
        displayedPrices,
        loadingProgress,
    } = UseGoldOneDayPrices(filterOptions);

    if (loading && displayedPrices.length === 0) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>{t('GoldPriceDashboard.loadingPrices')}</p>
                {loadingProgress.total > 0 && (
                    <p className="loading-progress">
                        {t('GoldPriceDashboard.loadingProgress', { loaded: loadingProgress.loaded, total: loadingProgress.total })}
                    </p>
                )}
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container">
                <p className="error-message">⚠️ {error}</p>
                <button className="retry-btn" onClick={() => window.location.reload()}>
                    {t('GoldPriceDashboard.retry')}
                </button>
            </div>
        );
    }
    const filteredItems = displayedPrices
        // 1. Lọc vendor đúng độ uy tín
        .filter(vendor => vendor.do_uy_tin == filterOptions.level)
        .map(vendor => {
            const firstItem = vendor.items.find(
                item =>
                    item.purity === "9999" ||
                    item.purity === "1KG_BAC_999"
            );

            if (!firstItem) return null;

            return {
                ...firstItem,
                difference: firstItem.sell - firstItem.buy,
                nameVendor: vendor.name,
                level: vendor.do_uy_tin,
            };
        })
        .filter(Boolean)
        .sort((a, b) => a.sell - b.sell);

    console.log("filteredItems: ", filteredItems)
    const handleClose = () => {
        navigator(-1)
    }
    return (
        <div className="modal-overlay-">
            <div className="modal-content-c">

                <div className="modal-header">
                    <h2>{t('ComparisonSellChart.chartTitle', { type: filterOptions.type === "gold" ? t('AnalysisGoldSilverTable.gold') : t('AnalysisGoldSilverTable.silver'), level: filterOptions.level })}</h2>

                </div>
                {filteredItems.length > 0 ? (<div className="chart-wrapper">
                    <ResponsiveContainer width="100%" height={450}>
                        <BarChart
                            data={filteredItems}
                            margin={{ top: 20, right: 20, bottom: 40, left: 20 }}
                        >

                            <CartesianGrid strokeDasharray="3 3" />

                            <XAxis
                                dataKey="nameVendor"
                                angle={-45}
                                textAnchor="end"
                                interval={0}
                                height={100}
                                padding={{ left: 20, right: 20 }}
                                tick={{ fontSize: 12, fill: "#ddd" }}
                            />

                            <YAxis
                                tickFormatter={(value) => value.toLocaleString()}
                                tick={{ fontSize: 12, fill: "#ddd" }}
                            />

                            <Tooltip formatter={(value) => value.toLocaleString()} />

                            <Bar
                                dataKey="sell"
                                barSize={40}
                                barCategoryGap="15%"
                                fill="#ae5f0fff"

                            />
                            <Bar
                                dataKey="buy"
                                barSize={40}
                                barCategoryGap="15%"
                                fill="#12631cff"
                            />
                            <Bar
                                dataKey="difference"
                                barSize={40}
                                barCategoryGap="15%"
                                fill="#d32b05ff"
                                onClick={(data, index) => {
                                    setSelectedItem(true);
                                }}
                            />

                        </BarChart>
                    </ResponsiveContainer>

                </div>) : (<p>{t('ComparisonSellChart.noData9999', { type: filterOptions.type === "gold" ? t('AnalysisGoldSilverTable.gold') : t('AnalysisGoldSilverTable.silver') })}</p>)
                }
                {selectedItem && (<div className="chart-wrapper">
                    <div className="bb">
                        <h2>{t('ComparisonSellChart.diffChartTitle', { type: filterOptions.type === "gold" ? t('AnalysisGoldSilverTable.gold') : t('AnalysisGoldSilverTable.silver'), level: filterOptions.level })}</h2>
                        <button
                        className="close-btn"
                        onClick={() => setSelectedItem(false)}
                    >
                        ✕
                    </button>
                    </div>
                    <ResponsiveContainer width="100%" height={450}>
                        <BarChart
                            data={filteredItems}
                            margin={{ top: 20, right: 20, bottom: 40, left: 20 }}
                        >

                            <CartesianGrid strokeDasharray="3 3" />

                            <XAxis
                                dataKey="nameVendor"
                                angle={-45}
                                textAnchor="end"
                                interval={0}
                                height={100}
                                padding={{ left: 20, right: 20 }}
                                tick={{ fontSize: 12, fill: "#ddd" }}
                            />

                            <YAxis
                                tickFormatter={(value) => value.toLocaleString()}
                                tick={{ fontSize: 12, fill: "#ddd" }}
                            />
                            <Tooltip formatter={(value) => value.toLocaleString()} />
                            <Bar
                                dataKey="difference"
                                barSize={40}
                                barCategoryGap="15%"
                                fill="#d32b05ff"

                            />

                        </BarChart>
                    </ResponsiveContainer>

                </div>)
                }

            </div>
        </div>
    );
}
