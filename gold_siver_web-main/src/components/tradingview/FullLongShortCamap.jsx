// File: FullLongShortCamap.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import SaveLSCamap from "./SaveLSCamapGold"; // import component chart
import "./FullLongShortCamap.css";

const FullLongShortCamap = () => {
  const { gold, silver } = useParams();
  const type = gold || silver || "gold";

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dayList, setDayList] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);

  const [timeList, setTimeList] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);

  const fetchDays = async () => {
    try {
      const res = await axios.get(
        "https://api_gold.thinkdiff.us/all_day_ca_map"
      );
      const list = res.data?.data || [];
      setDayList(list);
      if (list.length > 0) setSelectedDay(list[list.length - 1].dirname);
    } catch (err) {
      console.error("Fetch days error:", err);
    }
  };

  const fetchTimes = async (type, date) => {
    try {
      const res = await axios.get(
        `https://api_gold.thinkdiff.us/all_ca_map_json_1_day/${type}/${date}`
      );
      const list = res.data?.data || [];
      const sorted = [...list].sort((a, b) => {
        const parseTime = (t) => {
          const [datePart, timePart] = t.split(" ");
          const [d, m, y] = datePart.split("/");
          return new Date(`${y}-${m}-${d}T${timePart}`);
        };
        return parseTime(a.modified_time) - parseTime(b.modified_time);
      });
      setTimeList(sorted);
      if (sorted.length > 0) setSelectedTime(sorted[sorted.length - 1]);
    } catch (err) {
      console.error("Fetch times error:", err);
    }
  };

  useEffect(() => { fetchDays(); }, []);
  useEffect(() => { if (selectedDay) fetchTimes(type, selectedDay); }, [selectedDay, type]);

  const fetchByTime = async (timeItem) => {
    try {
      const res = await axios.get(timeItem.link);
      return res.data?.data?.list_data || [];
    } catch (err) {
      console.error("Fetch data error:", err);
      return [];
    }
  };

  useEffect(() => {
    const load = async () => {
      if (!selectedTime) return;
      setLoading(true);
      const res = await fetchByTime(selectedTime);
      setData(res);
      setLoading(false);
    };
    load();
  }, [selectedTime]);

  const toMillionUSD = (value) => (value ? (value / 1_000_000).toFixed(2) : 0);

  const DataTable = ({ title, data }) => {
    const [sortType, setSortType] = useState("value");
    if (!data || data.length === 0)
      return <p style={{ color: "white" }}>Không có dữ liệu {title}</p>;

    const handleRowClick = (item) => {
      if (item.wallet_link) window.open(item.wallet_link, "_blank");
    };
    const getValue = (item) => item.value ?? item.giatri ?? 0;
    const sortedData = [...data].sort((a, b) => {
      if (sortType === "value") return Math.abs(getValue(b)) - Math.abs(getValue(a));
      if (sortType === "time") return new Date(b.openTime).getTime() - new Date(a.openTime).getTime();
      return 0;
    });

    return (
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ color: "white" }}>{title}</h2>
        <div style={{ marginBottom: 12, display: "flex", alignItems: "center" }}>
          <button
            className={`sort-btn ${sortType === "value" ? "active" : ""}`}
            onClick={() => setSortType("value")}
          >
            🔢 Giá trị
          </button>
          <button
            className={`sort-btn ${sortType === "time" ? "active" : ""}`}
            onClick={() => setSortType("time")}
            style={{ marginLeft: 8 }}
          >
            ⏱ Thời gian
          </button>
          <select
            value={selectedDay || ""}
            onChange={(e) => setSelectedDay(e.target.value)}
            style={{ marginLeft: 12, backgroundColor: "#000", color: "#fff" }}
          >
            {dayList.map((d, idx) => (
              <option key={idx} value={d.dirname} style={{ color: "#fff" }}>
                {d.dirname}
              </option>
            ))}
          </select>
          <select
            value={selectedTime?.modified_time || ""}
            onChange={(e) => {
              const found = timeList.find((t) => t.modified_time === e.target.value);
              setSelectedTime(found);
            }}
            style={{ marginLeft: 8, backgroundColor: "#000", color: "#fff" }}
          >
            {timeList.map((t, idx) => (
              <option key={idx} value={t.modified_time} style={{ color: "#fff" }}>
                {t.modified_time.split(" ")[1]}
              </option>
            ))}
          </select>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", backgroundColor: "#000", color: "white" }}>
          <thead>
            <tr style={{ background: "#111" }}>
              <th style={{ border: "1px solid #444", padding: 8 }}>Giá đặt lệnh</th>
              <th style={{ border: "1px solid #444", padding: 8 }}>Tổng giá trị</th>
              <th style={{ border: "1px solid #444", padding: 8 }}>Thời gian mở lệnh</th>
              <th style={{ border: "1px solid #444", padding: 8 }}>Side</th>
              <th style={{ border: "1px solid #444", padding: 8 }}>Size</th>
              <th style={{ border: "1px solid #444", padding: 8 }}>Ví</th>
              <th style={{ border: "1px solid #444", padding: 8 }}>Coin</th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((item, idx) => (
              <tr key={idx} onClick={() => handleRowClick(item)} style={{ cursor: "pointer", textAlign: "center", background: idx % 2 === 0 ? "#000" : "#111" }}>
                <td style={{ border: "1px solid #444", padding: 8 }}>{item.entryPrice}</td>
                <td style={{ border: "1px solid #444", padding: 8 }}>{toMillionUSD(getValue(item))} triệu USD</td>
                <td style={{ border: "1px solid #444", padding: 8 }}>
                  <strong>
                    {new Date(item.openTime).toLocaleString("vi-VN")} (
                    {Math.floor((Date.now() - new Date(item.openTime).getTime()) / (1000 * 60 * 60 * 24))} ngày)
                  </strong>
                </td>
                <td style={{ border: "1px solid #444", padding: 8, color: item.side === "long" ? "#0f0" : "#f00", fontWeight: "bold" }}>
                  {item.side}
                </td>
                <td style={{ border: "1px solid #444", padding: 8, color: item.side === "long" ? "#0f0" : "#f00", fontWeight: "bold" }}>
                  {item.danhsach?.[0].size}
                </td>
                <td style={{ border: "1px solid #444", padding: 8 }}>{item.wallet_link ? item.wallet_link.slice(-10) : ""}</td>
                <td style={{ border: "1px solid #444", padding: 8 }}>{item.coin || item.danhsach?.[0]?.coin || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (loading) return <p style={{ color: "white" }}>Đang tải dữ liệu...</p>;

  const title = type === "gold" ? "💰 Gold" : "🥈 Silver";

  return (
    <>
      <div>
        {/* Hiển thị chart trước bảng */}
        <SaveLSCamap type={type} />
      </div>
      <div style={{ padding: 20, backgroundColor: "#000", minHeight: "100vh", marginTop: "500px" }}>

        {/* Bảng dữ liệu */}
        <DataTable title={title} data={data} />
      </div>
    </>

  );
};

export default FullLongShortCamap;