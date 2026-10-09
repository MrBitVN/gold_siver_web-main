import { useEffect, useState } from "react";
import GoldChart from "../components/spdr-gold/GoldChart";
import SilverChart from "../components/spdr-gold/SilverChart";
import ETFChart from "../components/spdr-gold/ETFChart";
import { getVang247FileUrl } from "../services/allVang247Service";
import { useParams } from "react-router-dom";
import { logUserInfo } from "../utils/logUserInfo";

function SPDRGold() {
    const [dataGoldTrust, setDataGoldTrust] = useState(null);
    const [dataSilverTrust, setDataSilverTrust] = useState(null);
    const [dataETF, setDataETF] = useState(null);
    const urlParams = useParams();

    const { day, month, year, hour, minute } = urlParams

    useEffect(() => {
        const load = async () => {
            try {
                const url = getVang247FileUrl(day, month, year, hour, minute);
                if (!url) {
                    console.warn('SPDRGold: invalid parameters for getVang247FileUrl', { day, month, year, hour, minute });
                    return;
                }
                const res = await fetch(url);
                if (!res.ok) {
                    console.warn('SPDRGold: fetch returned non-ok status', res.status);
                    return;
                }
                const json = await res.json();
                if (json.status === 'success') {
                    const arr = json?.data?.bieudo?.[3]?.data || [];

                    if (arr[0]?.status === 1) setDataGoldTrust(arr[0]);
                    if (arr[1]?.status === 1) setDataSilverTrust(arr[1]);
                    if (arr[3]?.status === 1 && arr[2]?.status === 1) setDataETF({ dataMonth: arr[3], dataWeek: arr[2] });
                }
            } catch (err) {
                console.error('SPDRGold load error', err);
            }
        };
        load();

        (async () => {
            await logUserInfo("Màn hình SPDR.jsx")
        })();
    }, []);


    return (
        <div>
            {dataGoldTrust && <GoldChart dataGoldTrust={dataGoldTrust} urlParams={urlParams} />}
            {dataSilverTrust && <SilverChart dataSilverTrust={dataSilverTrust} urlParams={urlParams} />}
            {/* {dataETF && <ETFChart dataETF={dataETF} urlParams={urlParams} />} */}
        </div>
    );
}

export default SPDRGold;
