// EconomicCalendar.jsx
import React from "react";

export default function EconomicCalendar() {
    return (
        <div style={{  height: "700px", backgroundColor: "#fff", margin: "16px", borderRadius: "8px", padding: "15px", boxSizing:"border-box"}}>
            <h1 className="economic-calendar-title-" style={{ color: "#000", textAlign: "center" }}>Lịch Kinh Tế</h1>

            <div style={{ width: "full", height: "90%", padding: "20px", }}>
                <iframe
                    title="Economic Calendar"
                    src="https://sslecal2.investing.com/?columns=exc_flags,exc_currency,exc_importance,exc_actual,exc_forecast,exc_previous&importance=2,3&features=datepicker,timeselector,filters&countries=4,6,5,72,43,35,12,25&calType=day&timeZone=27&lang=52"
                    width="100%"
                    height="100%"
                    style={{ border: "none", overflow: "hidden", boxSizing: "border-box" }}
                    loading="lazy"
                />
            </div>
        </div>
    );
}
