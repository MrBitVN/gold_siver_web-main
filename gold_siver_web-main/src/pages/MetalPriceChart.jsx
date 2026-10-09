import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SilverHistoricalPrice from "./SilverHistoricalPrice";
import GoldHistoricalPrice from "./GoldHistoricalPrice";

const MetalPriceChart = () => {
    const { metal } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(metal === "gold" ? "gold" : "silver");

    useEffect(() => {
        if (metal === "gold" || metal === "silver") {
            setActiveTab(metal);
        } else {
            setActiveTab("silver");
            navigate("/duong-trung-binh/silver", { replace: true });
        }
    }, [metal, navigate]);

    const tabStyle = {
        display: "flex",
        gap: "8px",
        marginBottom: "20px",
        backgroundColor: "#000",
        padding: "10px",
    };

    const buttonStyle = (isActive) => ({
        padding: "12px 24px",
        backgroundColor: isActive ? "#00b060" : "#111",
        color: isActive ? "#fff" : "#999",
        border: "1px solid #333",
        borderRadius: "4px",
        cursor: "pointer",
        fontWeight: isActive ? "bold" : "normal",
        fontSize: "16px",
        transition: "all 0.3s",
    });

    return (
        <div style={{ background: "#000" }}>
            <div style={tabStyle}>
                <button
                    onClick={() => {
                        navigate("/duong-trung-binh/silver");
                        setActiveTab("silver");
                    }}
                    style={buttonStyle(activeTab === "silver")}
                >
                    Silver (XAG)
                </button>
                <button
                    onClick={() => {
                        navigate("/duong-trung-binh/gold");
                        setActiveTab("gold");
                    }}
                    style={buttonStyle(activeTab === "gold")}
                >
                    Gold (XAU)
                </button>
            </div>

            <div style={{ background: "#000" }}>
                {activeTab === "silver" && <SilverHistoricalPrice />}
                {activeTab === "gold" && <GoldHistoricalPrice />}
            </div>
        </div>
    );
};

export default MetalPriceChart;
