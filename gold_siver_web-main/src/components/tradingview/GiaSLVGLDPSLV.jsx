import React, { useEffect, useState } from "react";
import "./GiaSLVGLDPSLV.css";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  Legend
} from "chart.js";
import { Chart } from "react-chartjs-2";
import zoomPlugin from "chartjs-plugin-zoom";
import { useTranslation } from "react-i18next";
ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  zoomPlugin
);

const GiaSLVGLDPSLV = () => {
  const { t, i18n } = useTranslation();
  const [data, setData] = useState({
    slv: null,
    gld: null,
    pslv: null
  });
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  /* ================= FETCH DATA ================= */
  const fetchAll = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        "https://api_gold.thinkdiff.us/phantich_quy_vang_bac"
      );
      const json = await res.json();

      setData({
        slv: json.slv,
        gld: json.gld,
        pslv: json.PSLV
      });

      const updatedAt =
        json.slv?.json_goc?.chart_section?.quote?.updated_at;

      if (updatedAt) {
        setLastUpdate(formatDateTime(updatedAt));
      }
    } catch (err) {
      console.error(err);
      setError("Không load được dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  /* ================= FORMAT TIME ================= */
  const formatDateTime = (time) => {
    if (!time) return null;

    const d =
      typeof time === "number"
        ? new Date(time < 1e12 ? time * 1000 : time)
        : new Date(time);

    const pad = (n) => String(n).padStart(2, "0");

    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(
      d.getSeconds()
    )} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  };

  const formatLabelWithDate = (timeLabel, updatedAt) => {
    if (!timeLabel || !updatedAt) return timeLabel || "";

    let time24 = timeLabel;
    const match = timeLabel.match(/(\d{1,2}):(\d{2})?\s?(AM|PM)/i);

    if (match) {
      let hour = Number(match[1]);
      const minute = match[2] || "00";

      // ÉP PM thành AM
      if (hour === 12) hour = 0; // 12am / 12pm đều về 00

      time24 = `${hour.toString().padStart(2, "0")}:${minute}`;
    }

    let date;
    if (typeof updatedAt === "number") {
      date = new Date(updatedAt < 1e12 ? updatedAt * 1000 : updatedAt);
    } else {
      date = new Date(updatedAt);
    }

    const dateStr = date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });

    return `${time24} ${dateStr}`;
  };


  /* ================= CHART DATA ================= */
  const getChartData = (item) => {
    const points =
      item?.json_goc?.chart_section?.chart?.lines?.[1]?.segments
        ?.flatMap(segment => segment?.points ?? []);

    if (!Array.isArray(points)) {
      return { data: { labels: [], datasets: [] }, options: {} };
    }
    const secondaryColorApi =
      item?.json_goc?.chart_section?.default_display?.secondary_value
        ?.main?.color?.dark;

    const lineColor = mapApiColorToCss(secondaryColorApi);

    const labels = points.map((p) =>
      formatLabelWithDate(
        p?.cursor_data?.label?.value,
        lastUpdate
      )
    );

    const values = points.map((p) =>
      Number(p?.cursor_data?.price_chart_data?.dollar_value?.amount)
    );

    return {
      data: {
        labels,
        datasets: [
          {
            label: "Giá ($)",
            data: values,
            borderColor: lineColor,
            backgroundColor:
              secondaryColorApi === "negative"
                ? "rgba(211,47,47,0.15)"
                : "rgba(46,125,50,0.15)",
            tension: 0.3,
            pointRadius: 0,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: "index",
          intersect: false
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `Giá: $${ctx.parsed.y}`
            }
          },
          zoom: {
            zoom: {
              wheel: { enabled: true },
              pinch: { enabled: true },
              mode: "x"
            },
            pan: {
              enabled: true,
              mode: "x"
            }
          }
        },
        scales: {
          x: { ticks: { maxTicksLimit: 6 } },
          y: { beginAtZero: false }
        }
      }
    };
  };
  const mapApiColorToCss = (color) => {
    switch (color) {
      case "negative":
        return "red";
      case "positive":
        return "green";
      case "fg":
      default:
        return "#333"; // hoặc màu chữ mặc định
    }
  };

  const formatSecondaryValue = (value, color) => {
    if (!value) return value;
    let text = String(value);

    // Tách phần chính và phần % trong ngoặc (nếu có)
    const match = text.match(/([-\d.,$]+)\s*\(([-\d.,%]+)\)/);
    let main = text;
    let percent = null;

    if (match) {
      main = match[1];
      percent = match[2];
    }
    main = main.replace(/^[-+]/, "");
    if (percent) percent = percent.replace(/^[-+]/, "");
    if (color === "negative") {
      main = `-${main}`;
      if (percent) percent = `-${percent}`;
    }
    if (color === "positive") {
      main = `+${main}`;
      if (percent) percent = `+${percent}`;
    }
    return percent ? `${main} (${percent})` : main;
  };

  /* ================= BOX ================= */
  const renderBox = (title, item) => {
    const primary =
      item?.json_goc?.chart_section?.default_display?.primary_value?.value;

    const secondaryRaw =
      item?.json_goc?.chart_section?.default_display?.secondary_value?.main
        ?.value;

    const secondaryColorApi =
      item?.json_goc?.chart_section?.default_display?.secondary_value
        ?.main?.color?.dark;

    const secondaryColor = mapApiColorToCss(secondaryColorApi);
    const secondary = formatSecondaryValue(
      secondaryRaw,
      secondaryColorApi
    );

    return (
      <div
        className="box"
        onClick={() => setSelectedItem({ title, item })}
        style={{
          flex: 1,
          border: "1px solid #ddd",
          borderRadius: 8,
          padding: 16,
          textAlign: "center",
          cursor: "pointer"
        }}
      >
        <h2>{title}</h2>

        {primary ? (
          <>
            <div className="price-main">{primary}</div>

            {secondary && (
              <div style={{ color: secondaryColor }}>
                {secondary}
              </div>
            )}
          </>
        ) : (
          <p>{t("GiaSLVGLDPSLV.loading")}</p>
        )}
      </div>
    );
  };

  const primary =
    selectedItem?.item?.json_goc?.chart_section
      ?.default_display?.primary_value?.value;

  const secondaryRaw =
    selectedItem?.item?.json_goc?.chart_section
      ?.default_display?.secondary_value?.main?.value;

  const secondaryColorApi =
    selectedItem?.item?.json_goc?.chart_section
      ?.default_display?.secondary_value?.main?.color?.dark;

  const secondaryColor = mapApiColorToCss(secondaryColorApi);
  const secondary = formatSecondaryValue(
    secondaryRaw,
    secondaryColorApi
  );
  /* ================= RENDER ================= */
  if (error || (!data.slv && !data.gld && !data.pslv)) {
    return null;
  }

  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ textAlign: "center", padding: "8px 0" }}>
        {t("GiaSLVGLDPSLV.title")}
      </h1>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16
        }}
      >
        {lastUpdate && (
          <h3 style={{ margin: 0 }}>
            {t("GiaSLVGLDPSLV.lastUpdate")}
            <span style={{ color: "#1976d2" }}> {lastUpdate}</span>
          </h3>
        )}

        <button className="refresh-btn" onClick={fetchAll} disabled={loading}>
          {loading ? t("GiaSLVGLDPSLV.loading") : t("GiaSLVGLDPSLV.refresh")}
        </button>
      </div>

      {error && <p style={{ color: "red" }}>{t("GiaSLVGLDPSLV.error")}</p>}

      {selectedItem && (

        <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
          <div
            className="price-modal-container"
            onClick={(e) => e.stopPropagation()}
            style={{ width: "80%", height: "70vh" }}
          >
            <div className="price-modal-header">
              <h2 className="price-modal-title">{selectedItem.title}</h2>
              <button
                className="price-modal-close-btn"
                onClick={() => setSelectedItem(null)}
              >
                ✕
              </button>
            </div>
            <p>
              {t("GiaSLVGLDPSLV.currentPrice")}
              <strong>
                {" "}
                {primary}<br />
                <span style={{ color: secondaryColor, paddingLeft: "40px" }}>
                  {secondary}
                </span>
              </strong>
            </p>
            <div style={{ width: "100%", height: 550 }}>
              <Chart
                type="line"
                data={getChartData(selectedItem.item).data}
                options={getChartData(selectedItem.item).options}
              />
            </div>
          </div>
        </div>
      )}

      <div
        className="box-container"
        style={{ display: "flex", gap: 16, justifyContent: "center" }}
      >
        {renderBox("SLV", data.slv)}
        {renderBox("GLD", data.gld)}
        {renderBox("PSLV", data.pslv)}
      </div>
    </div>
  );
};

export default GiaSLVGLDPSLV;
