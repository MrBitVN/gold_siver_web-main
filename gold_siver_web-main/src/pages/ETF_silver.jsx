import React from "react";
import { Chart } from "react-chartjs-2";
import { useTranslation } from "react-i18next";
const ETF_Silver = ({ data, options }) => {
    const { t } = useTranslation();
    if (!data) return null;

    return (
        <div
            style={{
                background: "#000",
                padding: "10px",
                marginBottom: "40px"
            }}
        >
            <h2 style={{ color: "#C0C0C0", marginBottom: 15 }}>{t("ETFChart.ETF_silver")}</h2>

            <div style={{ height: 500 }}>
                <Chart type="line" data={data} options={options} />
            </div>
        </div>
    );
};

export default ETF_Silver;