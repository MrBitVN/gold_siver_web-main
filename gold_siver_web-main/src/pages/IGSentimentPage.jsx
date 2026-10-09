import React from "react";
import IGSentiment from "../components/ig-sentiment/IGSentiment";
import "./IGSentimentPage.css";

const IGSentimentPage = () => {
  return (
    <div className="ig-page">
      <header className="ig-page-header">
        <h1>IG Sentiment — Full View</h1>
        <p>Xem chi tiết sentiment và biểu đồ IG (Silver).</p>
      </header>

      <section className="ig-page-content">
        {/* Component tổng quan (giá + thanh sentiment) */}
        <div className="ig-overview">
          <IGSentiment />
        </div>

      </section>
    </div>
  );
};

export default IGSentimentPage;
