import { useEffect, useState } from "react";
import GlobalShark from "../components/spdr-gold/GlobalShark";
import { fetchSharkData } from "../services/sharkGlobalService";
import { useNavigate } from "react-router-dom";
import { logUserInfo } from "../utils/logUserInfo";
import DataEUR from "../components/spdr-gold/DataEUR";
import GlobalShark1Day from "../components/spdr-gold/GlobalShark1Day";
import { useTranslation } from "react-i18next";
export const SharkGlobalChart = () => {
    const { t } = useTranslation();
    const [allSeries, setAllSeries] = useState([]);
    const [allSeries1DAY, setAllSeries1DAY] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        (async () => {
            await fetchSharkData("ALL").then(data => {
                setAllSeries(data);
            });
        })();

        (async () => {
            await fetchSharkData("DAY").then(data => {
                setAllSeries1DAY(data);
            });
        })();

        (async () => {
            await logUserInfo("Màn hình SharkGlobalChart.jsx")
        })();
    }, []);

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                backgroundColor: "rgba(0,0,0,0.6)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 9999
            }}
            onClick={() => navigate('/shark-global')}
        >
            <div
                style={{
                    backgroundColor: "rgba(0,0,0,1)",
                    padding: 20,
                    borderRadius: 8,
                    width: "95%",
                    height: "90%",
                    position: "relative",
                    overflow: "auto",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <h2 style={{ cursor: 'pointer', fontWeight: 'bold', color: '#ffd700', textAlign: 'center', marginBottom: 10, marginTop: 30 }}>
                    {t("SharkGlobalChart.title")}
                </h2>
                <button
                    onClick={() => navigate('/shark-global')}
                    style={{
                        position: "absolute",
                        top: 10,
                        right: 10,
                        padding: "4px 10px",
                        borderRadius: 4,
                        background: "#ff3b30",
                        color: "#fff",
                        border: "none",
                        cursor: "pointer"
                    }}
                >
                    {t("SharkGlobalChart.close")}
                </button>

                {/* Chart */}
                <div style={{
                    width: '100%',
                    height: '80%',
                    display: 'flex'
                }}>
                    <GlobalShark1Day data={allSeries1DAY} zoomable={true} />
                    <DataEUR />
                    <GlobalShark data={allSeries} zoomable={true} time={'1Y'} />
                </div>
            </div>
        </div>
    );
}