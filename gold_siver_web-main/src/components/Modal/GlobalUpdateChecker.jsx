import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import UpdateDataModal from "../Modal/UpdateDataModal";

const toTimestamp = ({ day, month, year, hour, minute }) =>
    new Date(year, month - 1, day, hour, minute).getTime();

const GlobalUpdateChecker = () => {
    const params = useParams();
    const navigate = useNavigate();

    const [showModal, setShowModal] = useState(false);
    const [latestData, setLatestData] = useState(null);

    useEffect(() => {
        if (!params.day || !params.month || !params.year) return;

        const checkNewData = async () => {
            try {
                const res = await fetch(
                    `https://api_gold.thinkdiff.us/all_json_1_day/${params.day}_${params.month}_${params.year}`
                );
                if (!res.ok) return;

                const json = await res.json();
                if (!json?.data || json.data.length === 0) return;

                // 🔥 LẤY FILE MỚI NHẤT
                const latestFile = json.data.reduce((latest, item) => {
                    const t = new Date(item.modified_time.split(" ").reverse().join(" ")).getTime();
                    const lt = latest
                        ? new Date(latest.modified_time.split(" ").reverse().join(" ")).getTime()
                        : 0;
                    return t > lt ? item : latest;
                }, null);

                if (!latestFile) return;

                // 🔥 PARSE TIME TỪ modified_time
                const [d, m, y] = latestFile.modified_time.split(" ")[0].split("/");
                const [hh, mm] = latestFile.modified_time.split(" ")[1].split(":");

                const apiTime = toTimestamp({
                    day: Number(d),
                    month: Number(m),
                    year: Number(y),
                    hour: Number(hh),
                    minute: Number(mm),
                });

                const currentTime = toTimestamp({
                    day: Number(params.day),
                    month: Number(params.month),
                    year: Number(params.year),
                    hour: Number(params.hour || 0),
                    minute: Number(params.minute || 0),
                });

                if (apiTime > currentTime) {
                    setLatestData({
                        day: d,
                        month: m,
                        year: y,
                        hour: hh,
                        minute: mm,
                    });
                    setShowModal(true);
                }
            } catch (e) {
                console.warn("Global update check failed", e);
            }
        };

        checkNewData();
    }, [params]);


    return (
        <UpdateDataModal
            isVisible={showModal}
            latestData={latestData}
            onCancel={() => setShowModal(false)}
            onConfirm={() => {
                setShowModal(false);
                navigate(
                    `/vietnam/gold/${latestData.day}/${latestData.month}/${latestData.year}/${latestData.hour}/${latestData.minute}`
                );

            }}
        />
    );
};

export default GlobalUpdateChecker;
