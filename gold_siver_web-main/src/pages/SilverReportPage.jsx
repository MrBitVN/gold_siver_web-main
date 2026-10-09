import { useEffect, useState } from "react";
import { getSilverReport } from "../services/silverReportService";
import SilverReportTable from "./SilverReportTable";
import "./SilverReportPage.css";

const SilverReportPage = () => {
  const [data, setData] = useState([]);     // luôn là array
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const result = await getSilverReport();

        console.log("✅ SILVER REPORT DATA:", result);

        // 🔒 BẢO VỆ: bắt buộc là array
        if (mounted) {
          if (Array.isArray(result)) {
            setData(result);
          } else {
            console.warn("⚠️ Silver data không phải array:", result);
            setData([]);
            setError("Dữ liệu bạc không hợp lệ");
          }
        }
      } catch (err) {
        console.error("❌ SilverReport error:", err);
        if (mounted) {
          setData([]); // ❗ CỰC QUAN TRỌNG: tránh trắng trang
          setError(err.message || "Không lấy được dữ liệu bạc");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, []);

  // ===== UI STATES =====

  if (loading) {
    return <div className="silver-loading">Đang tải báo cáo giá bạc...</div>;
  }

  if (error) {
    return (
      <div className="silver-error">
        ❌ {error}
      </div>
    );
  }

  return (
    <div className="silver-report-page">
      <h1 className="silver-title">BÁO CÁO GIÁ BẠC QUỐC TẾ</h1>

      {data.length === 0 ? (
        <div className="silver-empty">
          Không có dữ liệu bạc trong ngày
        </div>
      ) : (
        <SilverReportTable data={data} />
      )}
    </div>
  );
};

export default SilverReportPage;
