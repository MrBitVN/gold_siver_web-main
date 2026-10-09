import { getProxyUrl } from "../utils/apiHelper";

const API_DATA_GLOBAL_SHARK = [
    'https://api_gold.thinkdiff.us/global_x_silver_miners',
    'https://api_gold.thinkdiff.us/UBS_Solactive_Global_Pure_Gold_Miners',
    'https://api_gold.thinkdiff.us/VanEck_Gold_Miners_UCITS_ETF',
    'https://api_gold.thinkdiff.us/VanEck_Junior_Gold_Miners_UCITS',
    'https://api_gold.thinkdiff.us/LG_Gold_Mining_UCITS_ETF',
    'https://api_gold.thinkdiff.us/iShares_Gold_Producers_UCITS',
    'https://api_gold.thinkdiff.us/global_x_silver_miners_etf',
    'https://api_gold.thinkdiff.us/HANetf_AuAg_ESG_Gold_Mining_UCITS',
    'https://api_gold.thinkdiff.us/Market_Access_NYSE_Arca_Gold_Bugs_UCITS',
    'https://api_gold.thinkdiff.us/VanEck_SP_Global_Mining_UCITS_ETF_A'
];

const API_DATA_GLOBAL_SHARK_1DAY = [
    'https://api_gold.thinkdiff.us/global_x_silver_miners_1day',
    'https://api_gold.thinkdiff.us/VanEck_SP_Global_Mining_UCITS_ETF_A_1day',
    'https://api_gold.thinkdiff.us/UBS_Solactive_Global_Pure_Gold_Miners_1day',
    'https://api_gold.thinkdiff.us/VanEck_Gold_Miners_UCITS_ETF_1day',
    'https://api_gold.thinkdiff.us/VanEck_Junior_Gold_Miners_UCITS_1day',
    'https://api_gold.thinkdiff.us/LG_Gold_Mining_UCITS_ETF_1day',
    'https://api_gold.thinkdiff.us/iShares_Gold_Producers_UCITS_1day',
    'https://api_gold.thinkdiff.us/HANetf_AuAg_ESG_Gold_Mining_UCITS_1day',
    'https://api_gold.thinkdiff.us/Market_Access_NYSE_Arca_Gold_Bugs_UCITS_1day'
];

const extractNameFromURL = (url) => {
    const parts = url.split('/');
    return parts[parts.length - 1];
};

const toVNDate = (utcString) => {
    const d = new Date(utcString);
    return new Date(
        d.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" })
    );
};

export async function fetchSharkData(type) {
    let responses = null
    // Lấy dữ liệu từ API
    if (type === "DAY") {
        const rawResponses = await Promise.all(
            API_DATA_GLOBAL_SHARK_1DAY.map(url =>
                fetch(getProxyUrl(url))
                    .then(r => {
                        if (!r.ok) throw new Error(`HTTP Error ${r.status}`);
                        return r.json();
                    })
                    .catch(err => {
                        console.warn(`Lỗi khi gọi link: ${url}`, err);
                        return null; // Trả về null để đánh dấu là thất bại nhưng không làm sập Promise.all
                    })
            )
        );

        // 2. Lọc bỏ các giá trị null (các link bị lỗi)
        responses = rawResponses.filter(item => item !== null);

    }

    if (type === "ALL") {
        responses = await Promise.all(
            API_DATA_GLOBAL_SHARK.map(url => fetch(getProxyUrl(url)).then(r => r.json()))
        );
    }

    // Bước 1: chuyển về dạng series {x, y} và sắp xếp
    const tempSeries = responses.map((r, i) => {
        const series = r?.data?.series || [];
        const sorted = [...series].sort((a, b) => new Date(a.date) - new Date(b.date));
        const dateLastest = sorted.at(-1)?.date
        return {
            name: extractNameFromURL(API_DATA_GLOBAL_SHARK[i]),
            data: sorted.map(s => ({
                x: new Date(s.date).getTime() + (7 * 60 * 60 * 1000),
                y: Number(s.value.raw),
            })),
            date: dateLastest
        };
    });

    // Bước 2: lấy tất cả các ngày xuất hiện trong tất cả series
    // const allDates = Array.from(
    //     new Set(tempSeries.flatMap(s => s.data.map(d => d.x.getTime())))
    // ).sort((a, b) => a - b);

    // Bước 3: chuẩn hóa từng series theo tất cả ngày
    // const alignedSeries = tempSeries.map(series => ({
    //     name: series.name,
    //     data: allDates.map(date => {
    //         const point = series.data.find(d => d.x.getTime() === date);
    //         return point ? { x: new Date(date), y: point.y } : { x: new Date(date), y: null };
    //     })
    // }));

    return tempSeries;
}
