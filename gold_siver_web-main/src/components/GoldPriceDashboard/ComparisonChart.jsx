import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import './ComparisonChart.css';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    LineElement,
    PointElement,
    Tooltip,
    Legend,
    Title
} from "chart.js";
import { Chart } from "react-chartjs-2";
import zoomPlugin from 'chartjs-plugin-zoom';
import { useSearchParams } from 'react-router-dom';

ChartJS.register(
    CategoryScale,
    LinearScale,
    LineElement,
    PointElement,
    Tooltip,
    Legend,
    Title,
    zoomPlugin
);

const API_BASE_URL = "https://api_gold.thinkdiff.us/";

const GOLD_API_MAP = {
    "kim_khanh_viet_hung_da_nang": "history_KIM_KHANH_VIET_HUNG_DA_NANG",
    "kim_tung_an_giang": "history_KIM_TUNG_AN_GIANG",
    "quoc_bao_bien_hoa_dong_nai": "history_QUOC_BAO_BIEN_HOA_DONGNAI",
    "quoc_bao_lam_bien_hoa": "history_QUOC_BAO_LAM_BIEN_HOA",
    "kim_hung_phat": "history_KIM_HUNG_PHAT",
    "lap_duc_tan_phu_hcm": "history_LAP_DUC_TANPHU_HCM",
    "kim_ngoc_lam_dong": "history_KIMNGOC_LAMDONG",
    "kim_thuy_go_cong_tien_giang": "history_KIMTHUY_GO_CONG_TIEN_GIANG",
    "kim_yen_binh_chanh_hcm": "history_KIM_YEN_BINH_CHANH_HCM",
    "kim_phat_thoi_an_nha_be": "history_KIMPHAT_THOIAN_NHABE",
    "luc_ngoc_thanh_bien_hoa": "history_LUC_NGOC_THANH_BIENHOA",
    "phuoc_thanh_can_duoc_long_an": "history_PHUOCTHANH_CANDUOC_LONGAN",
    "kim_phat_hiep_thanh_quan_12_hcm": "history_KIM_PHAT_HIEPTHANH_QUAN12",
    "kim_phat_nha_be_hcm": "history_KIM_PHAT_NHA_BE_HCM",
    "kim_hanh_thu_duc_hcm": "history_KIMHANH_THUDUC_HCM",
    "quoc_bao_son_bien_hoa": "history_QUOCBAO_SON_BIENHOA",
    "minh_thanh_ben_luc_long_an": "history_MINHTHANH_BENLUC_LONGAN",
    "my_ngoc_long_thanh_long_an": "history_MYNGOC_LONGTHANH_LONGAN",
    "kim_ton_long_khanh_dong_nai": "history_KIMTON_LONGKHANH_DONGNAI",
    "yen_hien_nghia_hung_nam_dinh": "history_YENHIEN_NGHIAHUNG_NAMDINH",
    "xuan_mui_ninh_binh": "history_XUAN_MUI_NINH_BINH",
    "hai_sen_dien_bien": "history_HAISEN_DIENBIEN",
    "thanh_xuan_dong_anh_hn": "history_THANHXUAN_DONGANH_HN",
    "da_phuc_son_tay_hn": "history_DAPHUC_SONTAY_HN",
    "nha_huong_hai_phong": "history_NHAHUONG_HAIPHONG",
    "hjc_quang_ninh": "history_HJC_QUANGNINH",
    "kim_chung_le_hoan_thanh_hoa": "history_KIMCHUNG_LEHOAN_THANHHOA",
    "hoa_tung_quang_ngai": "history_HOATUNG_QUANGNGAI",
    "quy_tung_thai_nguyen": "history_QUY_TUNG_THAINGUYEN",
    "kim_lien_quang_yen_quang_ninh": "history_KIM_LIEN_QUANG_YEN_QUANG_NINH",
    "trung_sinh_thai_nguyen": "history_TRUNGSINH_THAINGUYEN",
    "huong_yen_hai_duong": "history_HUONGYEN_HAIDUONG",
    "kim_khanh_ha_nam": "history_KIMKHANH_HANAM",
    "hai_hong_hai_phong": "history_HAIHONG_HAIPHONG",
    "quang_hanh_hai_phong": "history_QUANGHANH_HAIPHONG",
    "son_ha_bac_ninh": "history_SONHA_BACNINH",
    "lu_huong_dong_hung_thai_binh": "history_LU_HUONG_DONG_HUNG_THAI_BINH",
    "anh_minh_ho_tung_mau_hn": "history_ANHMINH_HOTUNGMAU_HN",
    "huong_chi_bac_giang": "history_HUONGCHI_BACGIANG",
    "nhat_ha_hai_phong": "history_NHAHA_HAIPHONG",
    "phi_doan_ha_dong_hn": "history_PHIDOAN_HADONG",
    "dai_nghia_nam_dinh": "history_DAINGHIA_NAMDINH",
    "tien_ngoc_tu_son_bac_ninh": "history_TIENNGOC_TUSON_BACNINH",
    "phuc_thanh_nam_dinh": "history_PHUCTHANH_NAMDINH",
    "phuc_thanh_long_bien": "history_PHUCTHANH_LONGBIEN",
    "hoan_hue_lao_cai": "history_HOANHUE_LAOCAI",
    "gia_vang_mi_hong_sjc_tu_do_goldenfund_sjc_tu_do": "history_MIHONG_HCM",
    "vang_doji": "history_DOJI",
    "chow_tai_fook": "history_CHOW_TAI_FOOK",
    "chow_tai_seng": "history_CHOW_TAI_SENG",
    "lukfook_jewellery": "history_LukFook_Jewellery",
    "chow_sang_sang": "history_Chow_Sang_Sang",
    "vang_bac_huong_diu_bac_ninh": "history_HUONGDIU_BACNINH",
    "huy_thanh_doi_can_hn": "history_HUYTHANH_DOICAN_HN",
    "vang_nguyen_lieu_nam_dinh": "history_NGUYENLIEU_NAMDINH",
    "malabargoldanddiamonds": "history_malabargoldanddiamonds",
    "tokuriki_kanda_co_jp": "history_tokuriki_kanda_co_jp",
    "tanaka_co_jp": "history_tanaka_co_jp",
    "ishifuku": "history_ishifuku_JP",
    "kim_tin_cao_bang": "history_KIMTIN_CAOBANG",
    "bao_tin_manh_hai": "history_BAO_TIN_MANH_HAI",
    "phu_quy_vang": "history_PHUQUY_VANG",
    "anekalogam": "history_Anekalogam",
    "aurum24_russian": "history_aurum24_russian",
    "orient_singapore": "history_Orient_SINGAPORE",
    "goldheart": "history_Goldheart_SINGAPORE",
    "gvs_trading_dubai": "history_GVS_Trading_DUBAI",
    "kanz_jewels_dubai": "history_Kanz_Jewels_DUBAI",
    "igold": "history_IGOLD",
    "lam_ngoc_thanh_bien_hoa": "history_LAMNGOCTHANH_BIENHOA",
    "vang_ancarat": "history_VANG_ANCARAT",
    "bao_tin_lan_vy_cau_giay_hn": "history_BAO_TIN_LAN_VY_CAU_GIAY_HN",
    "kim_ngan_phuc_ha_noi": "history_KIM_NGAN_PHUC_HA_NOI",
    "chien_minh_cau_giay_hn": "history_CHIEN_MINH_CAU_GIAY_HN",
    "kim_chau_an_giang": "history_KIM_CHAU_AN_GIANG",
    "vang_kim_hoan_camau": "history_VANG_KIM_HOAN_CAMAU",
    "vang_pnj": "history_VANG_PNJ",
    "phu_tai_long_bien_hn": "history_PHU_TAI_LONG_BIEN_HN",
    "ngoc_tham_dong_thap": "history_NGOC_THAM_DONG_THAP",
    "vang_btmc": "history_VANG_BTMC",
    "sacombank_sbj_gold": "history_SACOMBANK_GOLD",
    "huong_chi_bac_ninh": "history_HUONGCHI_BACGIANG",

    //update them 17-12-2025
    "kim_hoa-phan_thiet-binh_thuan": "history_KIM_HOA_PHAN_THIET_BINH_THUAN",
    "tu_minh_vinh_long": "history_HONG_LINH_VINH_LONG",
    "hong_linh_vinh_long": "history_HONG_LINH_VINH_LONG",
    "hong_nga-cao_lanh-dong_thap": "history_HONG_NGA_CA_LANH_DONG_THAP",
    "kim_bao_tri-tan_phu-hcm": "history_KIM_BAO_TRI_TAN_PHU_HCM",
    "kim_chau_2-an_giang": "history_KIM_CHAU_2_AN_GIANG",
    "trong_nghia-quan_10-hcm": "history_TRONG_NGHIA_QUAN_10_HCM",
    "kim_hoang_ngoan-long_khanh-dong": "history_KIM_HOANG_NGOAN_LONG_KHAN_DONG_NAI",
    "kim_uyen-long_khanh-dong_nai": "history_KIM_UYEN_LONG_KHANH_DONG_NAI",
    "kim_loan-quan_6-hcm": "history_KIM_LOAN_QUAN_6_HCM",
    "kim_anh_tuan-long_khanh-dong_nai": "history_KIM_ANH_TUAN_Long_Khanh_Dong_Nai",
    "kieu_ngoc-ha_tinh": "history_KIEU_NGOC_HA_TINH",
    "ngoc_ha-quang_binh": "history_NGOC_HA_QUANG_BINH",
    "kim_viet-tam_ky-quang_nam": "history_KIM_VIET_TAM_KY_QUANG_NAM",
    "kim_thach_bich-nha_trang": "history_KIM_THACH_BICH_NHA_TRANG",
    "kim_khanh_viet_hung-lien_chieu-da_nang": "history_KIM_KHANH_VIET_HUNG_LIEN_CHIEU_DA_NANG",
    "my_long-quy_nhon": "history_MY_LONG_QUY_NHON",
    "ngoc_thien-binh_dinh": "history_NGOC_THIEN_BINH_DINH",
    "hoakimnguyen": "history_hoakimnguyen",
    "hoa_kim_nguyen-da_nang": "history_HOA_KIM_NGUYEN_DA_NANG",
    "nghia_tin-tam_ky-quang_nam": "history_NGHIA_TIN_TAM_KY_QUANG_NAM",
    "kim_thu-ca_mau": "history_KIM_THU_CA_MAU",
    "ngoc_hai-nhj-my_tho-tien_giang": "history_NGOC_HAI_NHJ_MY_THO_TIEN_GIANG",
    "sinh_dien_bac_ninh": "history_SINH_DIEN_BAC_NINH",
    "kim_thanh_h-binh_tan-hcm": "history_KIM_THANH_HBINH_TAN_HCM",
    "mao_thiet-thai_binh": "history_MAOTHIET_THAIBINH",
    "vietagold-me_tri-ntl-hn": "history_VIETAGOLD_ME_TRI",
    "bullionbypost": "history_bullionbypost",
    "korea_gold_exchange": "history_Korea_Gold_Exchange",
    "thanh_lien-hai phong": "history_Thanh_Lien_HAI_PHONG",
    "kim_chau_hai_hau_nam_đinh": "history_Kim_Chau_Hai_Hau_Nam_Dinh",
    "candere.com": "history_candere_com",
};


const formatPercent = (value) => {
    if (!value && value !== 0) return '---';
    return `${Number(value).toFixed(2)}%`;
};

const formatCurrency = (value, lang = 'vi') => {
    if (!value && value !== 0) return '---';
    return new Intl.NumberFormat(lang === 'vi' ? 'vi-VN' : 'en-US', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);
};


const chartColors = [
    "#FF5733", "#33FF57", "#3357FF", "#FF33A1", "#A133FF",
    "#33FFA1", "#FFA133", "#33A1FF", "#A1FF33", "#FF3333",
    "#FF6F91", "#FFC75F", "#F9F871", "#0089BA", "#845EC2",
    "#4B4453", "#C34A36", "#00C9A7", "#2C73D2", "#FF8066",
    "#AA96DA", "#FCBAD3", "#FFFFD2", "#A8E6CF", "#FDFFAB",
    "#FFAAA5", "#FFD3B6", "#D291BC", "#FEC8D8", "#C7CEEA",
    "#4D8076", "#BEBBBB", "#FFB5E8", "#B28DFF", "#AFF8DB",
    "#85E3FF", "#ACE7FF", "#D5AAFF", "#FFABAB", "#FFDAAB",
    "#FFB3BA", "#FFDFBA", "#FFFFBA", "#BAFFC9", "#BAE1FF",
    "#D7BAFF", "#FFC4E1", "#C4FFF9", "#F5A623", "#7ED321",
    "#BD10E0", "#50E3C2", "#4A90E2", "#D0021B", "#F8E71C",
    "#9013FE", "#B8E986", "#417505", "#8B572A", "#F5A623",
    "#29A7E5", "#E5295A", "#29E5C3", "#E5D129", "#9B29E5",
    "#E529D6", "#29E578", "#E56329", "#29C8E5", "#E55C29",
    "#FF7F50", "#6495ED", "#40E0D0", "#FF1493", "#7FFF00",
    "#00FA9A", "#FFD700", "#00CED1", "#1E90FF", "#DC143C"
];


const getGoldApiUrl = (arrNameGoldHouse) => {
    if (!arrNameGoldHouse || arrNameGoldHouse.length === 0) return [];

    return arrNameGoldHouse.map(item => {
        const itemLower = item.toLowerCase().trim();
        if (GOLD_API_MAP[itemLower]) {
            return API_BASE_URL + GOLD_API_MAP[itemLower];
        }
        const cleanInput = itemLower.replace(/[^a-z0-9]/g, "");
        const foundKey = Object.keys(GOLD_API_MAP).find(key => {
            const cleanKey = key.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
            return cleanKey.includes(cleanInput) || cleanInput.includes(cleanKey);
        });

        if (foundKey) {
            return API_BASE_URL + GOLD_API_MAP[foundKey];
        }
        return null;
    }).filter(url => url !== null);
};

function ComparisonChart() {
    const { t, i18n } = useTranslation();
    const [dataChart, setDataChart] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const [searchParams] = useSearchParams()
    // Lấy chuỗi về và tách lại thành mảng
    const dataString = searchParams.get('data');
    const nameGoldHouse = dataString ? dataString.split('|') : [];

    // === 1. THÊM STATE ĐỂ QUẢN LÝ CHẾ ĐỘ HIỂN THỊ ===
    const [priceMode, setPriceMode] = useState('buy'); // 'buy' (Mua vào) hoặc 'sell' (Bán ra)
    const [type, setType] = useState("VANG") // type Bạc hoặc Vàng

    useEffect(() => {
        if (!nameGoldHouse || nameGoldHouse.length === 0) {
            setDataChart([]);
            return;
        }

        const fetchData = async () => {
            setIsLoading(true);
            const urls = getGoldApiUrl(nameGoldHouse);

            if (urls.length === 0) {
                setIsLoading(false);
                return;
            }

            try {
                const promises = urls.map(url => fetch(url).then(res => res.json()));
                const results = await Promise.all(promises);
                const validData = results
                    .filter(res => res && res.status === 'success')
                    .map(res => res);

                setDataChart(validData);
            } catch (error) {
                console.error("Lỗi khi tải dữ liệu:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [dataString]);

    // console.log('check dataChart: ', dataChart);

    // === 2. CẬP NHẬT LOGIC LẤY DATA THEO PRICE MODE ===
    const chartData = useMemo(() => {
        if (!dataChart || dataChart.length === 0) return { labels: [], datasets: [] };

        const dataKey = type === "VANG" ? "data_vang" : "data_bac";

        const validDataItems = dataChart.filter(item => {
            const dataArray = item?.[dataKey]?.data;
            return Array.isArray(dataArray) && dataArray.length > 0;
        });

        if (validDataItems.length === 0) return { labels: [], datasets: [] };

        const labels = [...validDataItems[0][dataKey].data]
            .reverse()
            .map(item => item.datetime);

        const datasets = validDataItems.map((item, index) => {
            const reversedList = [...item[dataKey].data].reverse();

            return {
                label: reversedList[0]?.product || `Sản phẩm ${index + 1}`,
                data: reversedList.map(d => d[priceMode]),
                borderColor: chartColors[index % chartColors.length],
                backgroundColor: chartColors[index % chartColors.length],
                tension: 0.2,
                pointRadius: 2,
                type: 'line',
            };
        });

        return { labels, datasets };
    }, [dataChart, priceMode, type]);

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        scales: {
            y: {
                // Cập nhật title trục Y theo chế độ
                title: { display: true, text: priceMode === 'buy' ? `${t('ComparisonChart.buyMode')} (VND)` : `${t('ComparisonChart.sellMode')} (VND)` },
                ticks: {
                    callback: function (value) {
                        return new Intl.NumberFormat(i18n.language === 'vi' ? 'vi-VN' : 'en-US', { notation: "compact" }).format(value);
                    }
                }
            },
            x: {
                title: { display: true, text: t('ComparisonChart.endDate') },
                ticks: { maxTicksLimit: 10 }
            }
        },
        plugins: {
            legend: { position: 'top' },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        let line1 = context.dataset.label || '';
                        if (line1) {
                            line1 += ': ';
                        }
                        if (context.parsed.y !== null) {
                            line1 += formatCurrency(context.parsed.y, i18n.language);
                        }
                        return line1;
                    }
                }
            },
            zoom: {
                pan: { enabled: true, mode: 'x' },
                zoom: {
                    wheel: { enabled: true },
                    pinch: { enabled: true },
                    mode: 'x',
                }
            }
        },
    };

    console.log('check dataChart: ', dataChart);


    return (
        <>
            <div style={{ marginLeft: '40px', marginTop: '20px' }}>
                <button className={`btn-type ${type === "VANG" ? 'btn-active' : ''}`}
                    onClick={() => {
                        if (type !== "VANG") {
                            setType("VANG")
                        }
                    }}
                >
                    {t('ComparisonChart.compareGold')}
                </button>
                <button className={`btn-type ${type === "BAC" ? 'btn-active' : ''}`} style={{ marginLeft: '20px' }}
                    onClick={() => {
                        if (type !== "BAC") {
                            setType("BAC")
                        }
                    }}
                >
                    {t('ComparisonChart.compareSilver')}
                </button>
            </div>
            <div className="modal-box" style={{ height: '90vh', width: '95%', padding: '20px', borderRadius: '8px', display: 'flex', flexDirection: 'column', margin: 'auto', marginTop: '10px' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '10px' }}>{t('ComparisonChart.historyTitle')}</h2>

                {/* === 3. GIAO DIỆN NÚT CHUYỂN ĐỔI CHẾ ĐỘ === */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px', gap: '10px' }}>
                    <button
                        onClick={() => setPriceMode('buy')}
                        style={{
                            padding: '8px 16px',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            backgroundColor: priceMode === 'buy' ? '#2ecc71' : '#ecf0f1', // Xanh lá nếu active
                            color: priceMode === 'buy' ? 'white' : '#7f8c8d',
                            transition: 'all 0.3s'
                        }}
                    >
                        {t('ComparisonChart.buyMode')}
                    </button>
                    <button
                        onClick={() => setPriceMode('sell')}
                        style={{
                            padding: '8px 16px',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            backgroundColor: priceMode === 'sell' ? '#e74c3c' : '#ecf0f1', // Đỏ nếu active
                            color: priceMode === 'sell' ? 'white' : '#7f8c8d',
                            transition: 'all 0.3s'
                        }}
                    >
                        {t('ComparisonChart.sellMode')}
                    </button>
                </div>

                <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
                    {isLoading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                            {t('ComparisonChart.loadingData')}
                        </div>
                    ) : (!dataChart || dataChart.length > 0) ? (
                        <Chart
                            key={`${nameGoldHouse.join(',')}-${priceMode}`} // Reset chart khi đổi mode
                            type='line'
                            data={chartData}
                            options={options}
                        />
                    ) : (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                            {t('ComparisonChart.noDataMatched')}
                        </div>
                    )}
                </div>
            </div>

            {!isLoading && dataChart && dataChart.length > 0 && (
                <div style={{ marginTop: '20px', borderTop: '1px solid #eee', padding: '20px' }}>
                    <h3 style={{ marginBottom: '15px', fontSize: '18px' }}>{t('ComparisonChart.investmentEfficiencyGold')}</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                            <thead>
                                <tr style={{ textAlign: 'left' }}>
                                    <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{t('ComparisonChart.vendor')}</th>
                                    <th style={{ padding: '10px', borderBottom: '1px solid #ddd', textAlign: 'right' }}>{t('ComparisonChart.startDate')}</th>
                                    <th style={{ padding: '10px', borderBottom: '1px solid #ddd', textAlign: 'right' }}>{t('ComparisonChart.startPrice')}</th>
                                    <th style={{ padding: '10px', borderBottom: '1px solid #ddd', textAlign: 'right' }}>{t('ComparisonChart.endDate')}</th>
                                    <th style={{ padding: '10px', borderBottom: '1px solid #ddd', textAlign: 'right' }}>{t('ComparisonChart.endPrice')}</th>
                                    <th style={{ padding: '10px', borderBottom: '1px solid #ddd', textAlign: 'right' }}>{t('ComparisonChart.profit')}</th>
                                    <th style={{ padding: '10px', borderBottom: '1px solid #ddd', textAlign: 'right' }}>{t('ComparisonChart.growthRatio')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dataChart.map((item, index) => {
                                    const tangTruongArray = item?.data_vang?.tangtruong || [];
                                    const lengthRowSpan = tangTruongArray.length;

                                    return (
                                        <React.Fragment key={index}>
                                            {tangTruongArray.map((ite, i) => {
                                                // Logic xử lý key khác biệt giữa các dòng thường và dòng tổng kết (dòng cuối)
                                                const isLastRow = i === lengthRowSpan - 1;

                                                // Lấy dữ liệu linh hoạt dựa trên key (cuoituan hoặc cuoi)
                                                const dataEnd = isLastRow ? ite?.cuoi : ite?.cuoituan;
                                                const dataStart = isLastRow ? ite?.dau : ite?.dautuan;
                                                const percent = isLastRow ? ite?.tilephantram_all : ite?.tilephantram_1tuan;

                                                return (
                                                    <tr key={`${index}-${i}`} style={{ borderBottom: '1px solid #eee' }}>
                                                        {i === 0 && (
                                                            <td
                                                                rowSpan={lengthRowSpan}
                                                                style={{
                                                                    padding: '12px 10px',
                                                                    fontWeight: 'bold',
                                                                    verticalAlign: 'middle',
                                                                    color: chartColors[index % chartColors.length],
                                                                    borderRight: '1px solid #f0f0f0',
                                                                }}
                                                            >
                                                                {tangTruongArray[0]?.cuoituan?.product || tangTruongArray[0]?.cuoi?.product}
                                                            </td>
                                                        )}

                                                        <td style={{ padding: '10px', textAlign: 'right' }}>
                                                            {dataStart?.datetime?.split(' ')[0]}
                                                        </td>

                                                        <td style={{ padding: '10px', textAlign: 'right' }}>
                                                            {dataStart?.buy?.toLocaleString()}
                                                        </td>

                                                        <td style={{ padding: '10px', textAlign: 'right' }}>
                                                            {dataEnd?.datetime?.split(' ')[0]}
                                                        </td>

                                                        <td style={{ padding: '10px', textAlign: 'right' }}>
                                                            {dataEnd?.buy?.toLocaleString()}
                                                        </td>

                                                        <td style={{
                                                            padding: '10px',
                                                            textAlign: 'right',
                                                            color: ite?.loinhuan >= 0 ? '#27ae60' : '#e74c3c',
                                                            fontWeight: '500'
                                                        }}>
                                                            {ite?.loinhuan > 0 ? `+${ite.loinhuan.toLocaleString()}` : ite?.loinhuan?.toLocaleString()}
                                                        </td>

                                                        <td style={{
                                                            padding: '10px',
                                                            textAlign: 'right',
                                                            color: percent >= 0 ? '#27ae60' : '#e74c3c',
                                                            fontWeight: 'bold'
                                                        }}>
                                                            {percent?.toFixed(2)}%
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <h3 style={{ marginBottom: '15px', fontSize: '18px', marginTop: '80px', color: '#bdc3c7' }}>{t('ComparisonChart.investmentEfficiencySilver')}</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                            <thead>
                                <tr style={{ textAlign: 'left' }}>
                                    <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{t('ComparisonChart.vendor')}</th>
                                    <th style={{ padding: '10px', borderBottom: '1px solid #ddd', textAlign: 'right' }}>{t('ComparisonChart.startDate')}</th>
                                    <th style={{ padding: '10px', borderBottom: '1px solid #ddd', textAlign: 'right' }}>{t('ComparisonChart.startPrice')}</th>
                                    <th style={{ padding: '10px', borderBottom: '1px solid #ddd', textAlign: 'right' }}>{t('ComparisonChart.endDate')}</th>
                                    <th style={{ padding: '10px', borderBottom: '1px solid #ddd', textAlign: 'right' }}>{t('ComparisonChart.endPrice')}</th>
                                    <th style={{ padding: '10px', borderBottom: '1px solid #ddd', textAlign: 'right' }}>{t('ComparisonChart.profit')}</th>
                                    <th style={{ padding: '10px', borderBottom: '1px solid #ddd', textAlign: 'right' }}>{t('ComparisonChart.growthRatio')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dataChart.map((item, index) => {
                                    const tangTruongArray = item?.data_bac?.tangtruong || [];
                                    const lengthRowSpan = tangTruongArray.length;

                                    return (
                                        <React.Fragment key={index}>
                                            {tangTruongArray.map((ite, i) => {
                                                // Logic xử lý key khác biệt giữa các dòng thường và dòng tổng kết (dòng cuối)
                                                const isLastRow = i === lengthRowSpan - 1;

                                                // Lấy dữ liệu linh hoạt dựa trên key (cuoituan hoặc cuoi)
                                                const dataEnd = isLastRow ? ite?.cuoi : ite?.cuoituan;
                                                const dataStart = isLastRow ? ite?.dau : ite?.dautuan;
                                                const percent = isLastRow ? ite?.tilephantram_all : ite?.tilephantram_1tuan;

                                                return (
                                                    <tr key={`${index}-${i}`} style={{ borderBottom: '1px solid #eee' }}>
                                                        {i === 0 && (
                                                            <td
                                                                rowSpan={lengthRowSpan}
                                                                style={{
                                                                    padding: '12px 10px',
                                                                    fontWeight: 'bold',
                                                                    verticalAlign: 'middle',
                                                                    color: chartColors[index % chartColors.length],
                                                                    borderRight: '1px solid #f0f0f0',
                                                                }}
                                                            >
                                                                {tangTruongArray[0]?.cuoituan?.product || tangTruongArray[0]?.cuoi?.product}
                                                            </td>
                                                        )}

                                                        <td style={{ padding: '10px', textAlign: 'right' }}>
                                                            {dataStart?.datetime?.split(' ')[0]}
                                                        </td>

                                                        <td style={{ padding: '10px', textAlign: 'right' }}>
                                                            {dataStart?.buy?.toLocaleString()}
                                                        </td>

                                                        <td style={{ padding: '10px', textAlign: 'right' }}>
                                                            {dataEnd?.datetime?.split(' ')[0]}
                                                        </td>

                                                        <td style={{ padding: '10px', textAlign: 'right' }}>
                                                            {dataEnd?.buy?.toLocaleString()}
                                                        </td>

                                                        <td style={{
                                                            padding: '10px',
                                                            textAlign: 'right',
                                                            color: ite?.loinhuan >= 0 ? '#27ae60' : '#e74c3c',
                                                            fontWeight: '500'
                                                        }}>
                                                            {ite?.loinhuan > 0 ? `+${ite.loinhuan.toLocaleString()}` : ite?.loinhuan?.toLocaleString()}
                                                        </td>

                                                        <td style={{
                                                            padding: '10px',
                                                            textAlign: 'right',
                                                            color: percent >= 0 ? '#27ae60' : '#e74c3c',
                                                            fontWeight: 'bold'
                                                        }}>
                                                            {percent?.toFixed(2)}%
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <p style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '10px', fontStyle: 'italic' }}>
                        {t('ComparisonChart.disclaimer')}
                    </p>
                </div>
            )}

        </>

    );
}

export default ComparisonChart;