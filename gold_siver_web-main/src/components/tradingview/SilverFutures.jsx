import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
const API_URL = "https://ondemand.websol.barchart.com/getQuote.json";
const API_KEY = "2d8b3b803594b13e02a7dc827f4a63f8";

const SYMBOLS = {
  silver:
    "SIY00,SI*1,SI*2,SI*3,SI*4,SI*5,SI*6,SI*7,SI*8,SI*9,SI*10,SI*11,SI*12,SI*13,SI*14,SI*15,SI*16,SI*17,SI*18,SI*19,SI*20,SI*21,SI*22,SI*23,SI*24,SI*25,SI*26,SI*27,SI*28,SI*29,SI*30,SI*31,SI*32",
  gold:
    "GCY00,GC*1,GC*2,GC*3,GC*4,GC*5,GC*6,GC*7,GC*8,GC*9,GC*10,GC*11,GC*12,GC*13,GC*14"
};

const FIELDS =
  "open,high,low,lastPrice,settlement,netChange,percentChange,volume,previousClose,previousOpenInterest,tradeTimestamp";

const SilverFutures = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("gold");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(30);

  const fetchData = async (type) => {
    try {
      setLoading(true);
      setError(null);

      const body = new URLSearchParams({
        apikey: API_KEY,
        symbols: SYMBOLS[type],
        fields: FIELDS
      });

      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body
      });

      const json = await res.json();

      if (json.status?.code !== 200) {
        throw new Error(json.status?.message || "API error");
      }

      setData(json.results || []);
    } catch (e) {
      console.error(e);
      setError(t("Futures.error"));
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    setCountdown(30); // reset khi đổi tab
    fetchData(activeTab);

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchData(activeTab); // reload data
          return 30;             // reset đếm ngược
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTab]);

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ textAlign: "center" }}>{t("Futures.title")}</h2>

      {/* Tabs */}
      <p style={{ textAlign: "right", marginTop: 8, fontSize: 13 }}>
        🔄 {t("Futures.autoRefresh", { seconds: countdown })}
      </p>
      <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
        <Tab
          label={`🥇 ${t("Futures.gold")}`}
          active={activeTab === "gold"}
          onClick={() => setActiveTab("gold")}
        />
        <Tab
          label={`🥈 ${t("Futures.silver")}`}
          active={activeTab === "silver"}
          onClick={() => setActiveTab("silver")}
        />
      </div>

      {loading && <p style={{ textAlign: "center" }}>{t("Futures.loading")}</p>}
      {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}

      {!loading && <FuturesTable data={data} />}
    </div>
  );
};

/* ================= TABLE ================= */

const FuturesTable = ({ data }) => {
  const { t } = useTranslation();

  return (
    <div style={{ overflowX: "auto", marginTop: 16 }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#000" }}>
            <th style={th} colSpan={11}>{t("Futures.currentSession")}</th>
            <th style={th} colSpan={2}>{t("Futures.previousSession")}</th>
          </tr>
          <tr style={{ background: "#000" }}>
            <th style={th}>{t("Futures.symbol")}</th>
            <th style={th}>{t("Futures.expiry")}</th>
            <th style={th}>{t("Futures.open")}</th>
            <th style={th}>{t("Futures.high")}</th>
            <th style={th}>{t("Futures.low")}</th>

            {/* FIX KEY */}
            <th style={th}>{t("Futures.last")}</th>
            <th style={th}>{t("Futures.time")}</th>

            <th style={th}>{t("Futures.settlement")}</th>
            <th style={th}>{t("Futures.change")}</th>
            <th style={th}>{t("Futures.percent")}</th>
            <th style={th}>{t("Futures.volume")}</th>
            <th style={th}>{t("Futures.prevPrice")}</th>
            <th style={th}>{t("Futures.openInterest")}</th>
          </tr>
        </thead>

        <tbody>
          {data.map((item, index) => (
            <tr key={item.symbol}>
              <td style={{ ...tdBold, color: index === 0 ? "red" : "inherit" }}>
                {item.symbol}
              </td>

              {/* nhớ truyền t */}
              <td style={tdBold}>{getContractMonth(index, t)}</td>

              <td style={td}>{fmt(item.open)}</td>
              <td style={td}>{fmt(item.high)}</td>
              <td style={td}>{fmt(item.low)}</td>

              <td
                style={{
                  ...td,
                  fontWeight: "bold",
                  color: index === 0 ? "red" : "inherit"
                }}
              >
                {fmt(item.lastPrice)}
              </td>

              <td style={tdSmall}>{formatTime(item.serverTimestamp)}</td>

              <td style={td}>
                {item.settlement ? fmt(item.settlement) : "-"}
              </td>

              <td
                style={{
                  ...td,
                  color: item.netChange < 0 ? "red" : "green"
                }}
              >
                {item.netChange > 0 ? "+" : ""}
                {fmt(item.netChange)}
              </td>

              <td
                style={{
                  ...td,
                  color: item.percentChange < 0 ? "red" : "green"
                }}
              >
                {item.percentChange > 0 ? "+" : ""}
                {item.percentChange ? `${item.percentChange}%` : "-"}
              </td>

              <td style={td}>{item.volume?.toLocaleString() ?? "-"}</td>
              <td style={td}>{fmt(item.previousClose)}</td>
              <td style={td}>
                {item.previousOpenInterest
                  ? item.previousOpenInterest.toLocaleString()
                  : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/* ================= HELPERS ================= */

const fmt = (v) => (typeof v === "number" ? v.toFixed(4) : "-");

const formatTime = (ts) => {
  if (!ts) return "-";
  return new Date(ts).toLocaleString(i18n.language);
};

/* ================= UI ================= */

const Tab = ({ active, label, onClick }) => (
  <button
    onClick={onClick}
    style={{
      padding: "8px 16px",
      borderRadius: 6,
      border: active ? "1px solid #ccc" : "2px solid #333",
      background: active ? "#fff" : "#333",
      color: active ? "#000" : "#fff",
      cursor: "pointer"
    }}
  >
    {label}
  </button>
);

const th = {
  border: "1px solid #ccc",
  padding: 6,
  fontSize: 13,
  textAlign: "center"
};

const td = {
  border: "1px solid #ddd",
  padding: 6,
  fontSize: 13,
  textAlign: "center"

};

const START_MONTH = 1; // Feb (0=Jan)
const START_YEAR = 2026;
const getContractMonth = (index) => {
  if (index === 0) return i18n.t("Futures.cash");

  const m = START_MONTH + (index - 1);
  const year = START_YEAR + Math.floor(m / 12);
  const month = m % 12;

  const monthName = new Date(year, month).toLocaleString(i18n.language, {
    month: "short"
  });

  return `${monthName}'${String(year).slice(-2)}`;
};

const tdBold = { ...td, fontWeight: "bold" };
const tdSmall = { ...td, fontSize: 12 };

export default SilverFutures;
