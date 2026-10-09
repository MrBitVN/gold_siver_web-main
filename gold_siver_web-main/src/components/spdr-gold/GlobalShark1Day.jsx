import GlobalShark1DayChart from "./GlobalShark1DayChart";
import 'react-tooltip/dist/react-tooltip.css';
import { Tooltip } from 'react-tooltip';
import { useEffect, useState } from "react";
import ModalFullChartShark1Day from "./ModalFullChartShark1Day";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
function GlobalShark1Day({ data = [], zoomable = false }) {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const nameQuery = searchParams.get("name");
    const [isShowFullChart, setIsShowFullChart] = useState(false);
    const [chartSelect, setChartSelect] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    // Mở modal nếu có ?name= trên URL
    useEffect(() => {
        if (nameQuery && data.length > 0) {
            const found = data.find(item => item.name === nameQuery);
            if (found) {
                setChartSelect(found);
                setIsShowFullChart(true);
            }
        }
    }, [nameQuery, data]);

    // Format thời gian GMT+7
    const formatToGMT7 = (dateStr) => {
        const date = dateStr ? new Date(dateStr) : new Date();
        return date.toLocaleString("vi-VN", {
            timeZone: "Asia/Ho_Chi_Minh",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        });
    };

    return (
        <div
            style={{
                width: "100%",
                minHeight: "100vh",
                marginTop: 20,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center" // canh giữa theo chiều dọc
            }}
        >
            <h3 style={{
                color: "#08F405",
                fontWeight: 600,
                marginBottom: 20,
                textAlign: "center"
            }}>
                {t("GlobalShark1Day.title")}
            </h3>
            <div style={{
                minHeight: 480,
                width: "100%",
                display: "flex",
                gap: 20,
                flexWrap: "wrap",
                justifyContent: "center", // canh giữa theo chiều ngang
                alignItems: "flex-start" // các chart bắt đầu từ trên
            }}>
                {data.length > 0 ? data.map((item, index) => {
                    const chartPoints = Array.isArray(item?.data) ? item.data : [];

                    return (
                        <div key={index} style={{
                            width: "calc(50% - 20px)",
                            marginBottom: 30,
                            textAlign: "center",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center"
                        }}
                            onClick={() => {
                                if (zoomable) {
                                    setIsShowFullChart(true)
                                    navigate({
                                        pathname: location.pathname,
                                        search: `?name=${item?.name}`,
                                    })

                                }
                            }}
                        >
                            <p style={{ fontSize: 12, color: "#fff", marginBottom: 8 }}>{item?.name}</p>
                            <GlobalShark1DayChart rawData={chartPoints} />
                            <div style={{
                                fontSize: 11, color: "#08F405", marginTop: 10, fontWeight: "bold",
                                border: "1px solid rgba(8, 244, 5, 0.4)", padding: "4px 10px",
                                borderRadius: "4px", display: "inline-block"
                            }}>
                                {formatToGMT7(item?.date)}
                            </div>
                        </div>
                    );
                }) : (
                    <div style={{ color: "#fff", textAlign: "center" }}>
                        {t("GlobalShark1Day.loading")}
                    </div>
                )}
            </div>

            {/* MODAL CHI TIẾT */}
            {isShowFullChart && chartSelect && (
                <ModalFullChartShark1Day
                    setIsShowFullChart={setIsShowFullChart}
                    chartSelect={chartSelect}
                    setChartSelect={setChartSelect}
                    navigate={navigate}
                />
            )}
        </div>
    );
}

export default GlobalShark1Day;
