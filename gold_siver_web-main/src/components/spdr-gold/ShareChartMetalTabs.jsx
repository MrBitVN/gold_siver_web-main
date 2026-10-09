import { useState } from "react";
import ShareChartGold from "./ShareChartGold";
import ShareChartSilver from "./ShareChartSilver";
import "./ShareChartMetalTabs.css";

const ShareChartMetalTabs = ({ charts, params }) => {
    const [activeTab, setActiveTab] = useState("silver");

    return (
        <div className="metal-tabs">

            {/* ===== TAB HEADER ===== */}
            <div className="metal-tabs-header">
                <button
                    className={activeTab === "gold" ? "active" : ""}
                    onClick={() => setActiveTab("gold")}
                >
                    🥇 Gold
                </button>

                <button
                    className={activeTab === "silver" ? "active" : ""}
                    onClick={() => setActiveTab("silver")}
                >
                    🥈 Silver
                </button>
            </div>

            {/* ===== TAB CONTENT ===== */}
            <div className="sharechart-split">

                {activeTab === "gold" && (
                    <>
                        {/* ===== LEFT: SPDR GOLD SHARES ===== */}
                        <div className="metal-left">
                            <ShareChartGold
                                dataShare={charts?.[3]?.data?.[2]}
                                urlParams={params}
                                onlyMain
                            />
                        </div>

                        {/* ===== RIGHT: VOLUME + OPTION FLOW ===== */}
                        <div className="metal-right">
                            <ShareChartGold
                                dataShare={charts?.[3]?.data?.[2]}
                                urlParams={params}
                                onlyExtra
                            />
                        </div>
                    </>
                )}

                {activeTab === "silver" && (
                    <>
                        <div className="metal-left">
                            <ShareChartSilver
                                dataShare={charts?.[3]?.data?.[3]}
                                urlParams={params}
                                onlyMain
                            />
                        </div>

                        <div className="metal-right">
                            <ShareChartSilver
                                dataShare={charts?.[3]?.data?.[3]}
                                urlParams={params}
                                onlyExtra
                            />
                        </div>
                    </>
                )}

            </div>
        </div>
    );
};

export default ShareChartMetalTabs;
