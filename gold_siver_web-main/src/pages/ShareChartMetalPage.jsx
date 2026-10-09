import { useState } from "react";
import ShareChartGold from "../components/spdr-gold/ShareChartGold";
import ShareChartSilver from "../components/spdr-gold/ShareChartSilver";
import "../components/spdr-gold/ShareChartMetalTabs.css";

const ShareChartMetalPage = () => {
  const [activeTab, setActiveTab] = useState("silver");

  return (
    <div className="metal-tabs" style={{ paddingBottom: 60 }}>

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

      {/* ===== TAB CONTENT (FULL 3 BIỂU ĐỒ) ===== */}
      <div className="metal-tabs-content">
        {activeTab === "gold" && (
          <ShareChartGold />
        )}

        {activeTab === "silver" && (
          <ShareChartSilver />
        )}
      </div>

    </div>
  );
};

export default ShareChartMetalPage;
