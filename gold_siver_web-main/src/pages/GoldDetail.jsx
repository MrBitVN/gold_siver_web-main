import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PriceTable from "../components/table-price/PriceTable";
import { fetchVang247SingleFile, getVang247FileUrl } from "../services/allVang247Service";
// import { fetchAllDirnames } from "../services/dateGoldService";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import './GoldDetail.css'
import { logUserInfo } from "../utils/logUserInfo";
import TimeRangeFilter from "../components/candlestick/TimeRangeFilter";

/* >>> THÊM MỚI: Chart.js <<< */
import { Line } from "react-chartjs-2";
import { Chart as ChartJS } from "chart.js/auto";
import { convertToKey } from "../utils/convertToKey";

// --- CONSTANTS & HELPER FUNCTIONS ---

const API_BASE_URL = "https://api_gold.thinkdiff.us/"
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

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

function findApiForVendor(name) {
  if (!name) return null;

  const itemLower = name.toLowerCase().trim();
  if (GOLD_API_MAP[itemLower]) {
    return API_BASE_URL + GOLD_API_MAP[itemLower];
  }

  const cleanInput = itemLower.replace(/[^a-z0-9]/g, "");
  const foundKey = Object.keys(GOLD_API_MAP).find((mapKey) => {
    const cleanKey = mapKey
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "");
    return cleanKey.includes(cleanInput) || cleanInput.includes(cleanKey);
  });

  if (foundKey) {
    return API_BASE_URL + GOLD_API_MAP[foundKey];
  }
  return null;
}

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const toRad = (value) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// --- COMPONENT CON: BẢNG TĂNG TRƯỞNG (Tái sử dụng) ---
const GrowthTable = ({ title, data }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="gold-container" style={{ marginTop: '20px' }}>
      <h2 className="gold-header">{title}</h2>
      <div className="table-wrapper">
        <table className="gold-table">
          <thead>
            <tr>
              <th>Tuần</th>
              <th>Ngày bắt đầu</th>
              <th>Giá mua đầu</th>
              <th>Ngày kết thúc</th>
              <th>Giá mua cuối</th>
              <th className="text-right">Lợi nhuận</th>
              <th className="text-right">Tăng trưởng</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => {
              const isWeekly = !!item.cuoituan;
              const startNode = isWeekly ? item.dautuan : item.cuoi;
              const endNode = isWeekly ? item.cuoituan : item.dau;
              const percent = isWeekly ? item.tilephantram_1tuan : item.tilephantram_all;

              // Màu sắc
              const statusColor = item.loinhuan >= 0 ? '#16a34a' : '#dc2626';

              return (
                <tr key={index}>
                  <td className="font-bold">Tuần {index + 1}</td>
                  <td>{formatDate(startNode?.datetime)}</td>
                  <td>{formatCurrency(startNode?.buy)}</td>
                  <td>{formatDate(endNode?.datetime)}</td>
                  <td>{formatCurrency(endNode?.buy)}</td>

                  <td style={{ color: statusColor, fontWeight: 'bold', textAlign: 'left' }}>
                    {formatCurrency(item.loinhuan)}
                  </td>
                  <td style={{ color: statusColor, fontWeight: 'bold', textAlign: 'left', paddingLeft: '40px' }}>
                    {percent ? percent.toFixed(2) : 0}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- COMPONENT CHÍNH ---

const GoldDetail = () => {
  const { vendorName } = useParams();
  const navigate = useNavigate();
  const [vendorData, setVendorData] = useState(null);
  const [vendorMaps, setMaps] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addresses, setAddresses] = useState("");
  const [historyData, setHistoryData] = useState(null);
  const [historyApi, setHistoryApi] = useState("");
  const [tangtruongGold, setTangtruongGold] = useState(null);
  const [tangtruongSilver, setTangtruongSilver] = useState(null);
  const [activeRange, setActiveRange] = useState("ALL");
  const [type, setType] = useState("VANG");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Bắt đầu từ ngày mới nhất (hôm nay hoặc ngày từ latestDate)
        let currentDate = new Date();

        let filesData = null;

        while (!filesData) {
          // format ngày thành "dd_mm_yyyy" (hoặc "dd_mm_yyyy_hh_mm" nếu cần)
          const day = String(currentDate.getDate()).padStart(2, '0');
          const month = String(currentDate.getMonth() + 1).padStart(2, '0');
          const year = currentDate.getFullYear();

          const days = `${day}_${month}_${year}`;

          try {
            const resFiles = await fetch(`https://api_gold.thinkdiff.us/all_json_1_day/${days}`);
            const data = await resFiles.json();

            if (data && data.data && data.data.length > 0) {
              filesData = data;
              break; // tìm thấy dữ liệu → thoát vòng lặp
            } else {
              // Nếu rỗng → lùi ngày 1 ngày
              currentDate.setDate(currentDate.getDate() - 1);
            }
          } catch (err) {
            console.warn(`Không thể fetch dữ liệu ngày ${days}:`, err);
            // Lùi ngày nếu fetch lỗi
            currentDate.setDate(currentDate.getDate() - 1);
          }
        }

        // --- Xử lý file mới nhất ---
        const files = filesData.data.reduce((latest, current) => {
          const latestTime = new Date(latest.modified_time.split('/').reverse().join('-'));
          const currentTime = new Date(current.modified_time.split('/').reverse().join('-'));
          return currentTime > latestTime ? current : latest;
        }, filesData.data[0]).link;

        const fileName = files.match(/\/([^\/]+)\.json$/)[1];
        const [dayNum, monthNum, yearNum, hour, minute] = fileName.split('_').map(s => parseInt(s, 10));
        const fileUrl = getVang247FileUrl(dayNum, monthNum, yearNum, hour, minute);
        if (!fileUrl) throw new Error('Invalid parameters when building Vang247 file URL in GoldDetail');

        const data = await fetchVang247SingleFile(fileUrl);
        const listServer = data.data?.list_server;
        if (!Array.isArray(listServer)) throw new Error("list_server không phải mảng");

        // --- Tìm vendor ---
        const normalizeName = (str) => str ? str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "") : "";

        const vendor = listServer.find(item =>
          normalizeName(item.name) === normalizeName(vendorName) ||
          normalizeName(item.name).includes(normalizeName(vendorName))
        );

        if (!vendor) {
          console.warn("Không tìm thấy khớp. Danh sách server:", listServer.map(i => i.name));
          setError(`Không tìm thấy dữ liệu cho "${vendorName}"`);
        } else {
          // --- Maps & Distance ---
          const mapList = vendor.maps;
          let distance = null;
          if (Array.isArray(mapList) && mapList.length > 0) {
            const userPos = await new Promise((resolve) => {
              navigator.geolocation.getCurrentPosition(
                (pos) => resolve({ lat: pos.coords.latitude, long: pos.coords.longitude }),
                () => resolve(null),
                { enableHighAccuracy: true }
              );
            });

            if (userPos) {
              const listDistances = mapList.map((s) =>
                calculateDistance(userPos.lat, userPos.long, s.lat, s.long)
              );
              distance = Math.min(...listDistances);
            }
          }

          const vendorWithItems = {
            ...vendor,
            items: vendor.data?.data?.items || [],
            fetched_at: vendor.data?.data?.fetched_at || vendor.data?.data?.timestamp || null,
            distance: distance !== null ? distance.toFixed(2) : null
          };

          setMaps(Array.isArray(mapList) && mapList.length > 0 ? mapList : []);
          setVendorData(vendorWithItems);

          // --- Lịch sử API ---
          const matchedApi = findApiForVendor(convertToKey(vendorName));
          setHistoryApi(matchedApi);

          if (matchedApi) {
            const res = await fetch(matchedApi);
            const hdata = await res.json();

            setHistoryData(hdata);
            if (hdata?.data_bac?.tangtruong?.length) setTangtruongSilver(hdata.data_bac.tangtruong);
            if (hdata?.data_vang?.tangtruong?.length) setTangtruongGold(hdata.data_vang.tangtruong);
          }
        }

      } catch (err) {
        console.error("Lỗi khi fetch vendor:", err);
        setError(err.message || "Đã xảy ra lỗi khi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [vendorName]);

  useEffect(() => {
    const fetchAddressList = async () => {
      if (!Array.isArray(vendorMaps) || vendorMaps.length === 0) return;
      try {
        const results = [];
        for (let point of vendorMaps) {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${point.lat}&lon=${point.long}&format=json`
          );
          const data = await res.json();
          results.push({
            lat: point.lat,
            long: point.long,
            address: data.display_name
          });
        }
        setAddresses(results);
      } catch (err) {
        console.error("Lỗi lấy địa chỉ:", err);
      }
    };
    fetchAddressList();
  }, [vendorMaps]);

  useEffect(() => {
    (async () => {
      await logUserInfo("Màn hình GoldDetail.jsx")
    })();
  }, []);

  // --- XỬ LÝ CHART DATA ---
  const normalizedHistory = useMemo(() => {
    let raw = null;
    if (type === "VANG") raw = historyData?.data_vang?.data;
    if (type === "BAC") raw = historyData?.data_bac?.data;

    if (!raw || raw.length === 0) return [];

    const map = new Map();
    raw.forEach(item => {
      if (!item?.datetime) return;
      const day = item.datetime.split(" ")[0];
      if (!map.has(day)) {
        map.set(day, {
          time: day,
          buy: Number(item.buy),
          sell: Number(item.sell)
        });
      }
    });

    return [...map.values()].sort((a, b) => new Date(a.time) - new Date(b.time));
  }, [historyData, type]);

  const filterHistoryByRange = (data, range) => {
    if (range === "ALL") return data;
    if (!data || data.length === 0) return [];

    const now = new Date();
    let fromDate;

    switch (range) {
      case "1W":
        fromDate = new Date(now);
        fromDate.setDate(now.getDate() - 7);
        break;
      case "1M":
        fromDate = new Date(now);
        fromDate.setMonth(now.getMonth() - 1);
        break;
      case "6M":
        fromDate = new Date(now);
        fromDate.setMonth(now.getMonth() - 6);
        break;
      case "1Y":
        fromDate = new Date(now);
        fromDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return data;
    }
    return data.filter(item => new Date(item.time) >= fromDate);
  };

  const filteredHistory = filterHistoryByRange(normalizedHistory, activeRange);

  const chartData = useMemo(() => {
    if (!filteredHistory || filteredHistory.length === 0) return { labels: [], datasets: [] };

    const labels = filteredHistory.map(i => i.time);
    const datasets = [
      {
        label: "Giá mua",
        data: filteredHistory.map(i => i.buy),
        borderColor: "#0066ff",
        tension: 0.3
      },
      {
        label: "Giá bán",
        data: filteredHistory.map(i => i.sell),
        borderColor: "#ff0000",
        tension: 0.3
      }
    ];
    return { labels, datasets };
  }, [filteredHistory]);

  if (loading) return <div>Đang tải dữ liệu...</div>;
  if (error) return <div>{error}</div>;

  return (
    <>
      {/* --- PHẦN 1: THÔNG TIN CHI TIẾT & ĐỊA CHỈ --- */}
      <div>
        <a
          href="#"
          className="back-button"
          onClick={(e) => {
            e.preventDefault();
            navigate(-1);
          }}
        >
          <span className="icon">←</span> Quay lại
        </a>

        <div className="price-address-wrapper">
          <div className="max_with">
            <PriceTable vendorData={vendorData} />
          </div>

          <div className="address-list">
            <strong style={{ display: "block", marginBottom: "8px" }}>
              Danh sách địa chỉ:
            </strong>

            {Array.isArray(addresses) && addresses.length > 0 ? (
              addresses.map((item, index) => (
                <div
                  key={index}
                  className="address-item"
                  style={{
                    padding: "8px 4px",
                    borderBottom: index !== addresses.length - 1 ? "1px dashed #ccc" : "none",
                  }}
                >
                  <a
                    href={`https://www.google.com/maps/search/${item.lat},+${item.long}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: "none", color: "white", display: "block" }}
                  >
                    {index + 1}. {item.address}
                  </a>
                </div>
              ))
            ) : (
              <div style={{ color: "white", fontStyle: "italic" }}>
                Đang lấy địa chỉ…
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- PHẦN 2: BIỂU ĐỒ & BẢNG TĂNG TRƯỞNG --- */}
      <div style={{ width: "90%", maxWidth: "1200px", margin: "30px auto" }}>
        <h3>Lịch sử giá vàng</h3>
        {historyApi && <p style={{ fontSize: 12, color: "#666" }}>Nguồn: {historyApi}</p>}

        <div style={{ margin: '10px 0' }}>
          <button
            className={`btn-type ${type === "VANG" ? 'btn-active' : ''}`}
            onClick={() => setType("VANG")}
          >
            Vàng
          </button>
          <button
            className={`btn-type ${type === "BAC" ? 'btn-active' : ''}`}
            style={{ marginLeft: '20px' }}
            onClick={() => setType("BAC")}
          >
            Bạc
          </button>
        </div>

        <TimeRangeFilter
          activeRange={activeRange}
          onRangeChange={setActiveRange}
        />

        <Line data={chartData} />

        {/* Render bảng tăng trưởng bằng component tái sử dụng */}
        <GrowthTable title="Bảng Tăng Trưởng Giá Vàng" data={tangtruongGold} />
        <GrowthTable title="Bảng Tăng Trưởng Giá Bạc" data={tangtruongSilver} />

      </div>

      {/* --- PHẦN 3: BẢN ĐỒ --- */}
      <div style={{ height: '300px', width: '80%', marginTop: '20px', margin: "auto" }}>
        {vendorMaps && vendorMaps.length > 0 ? (
          <MapContainer
            center={[vendorMaps[0].lat, vendorMaps[0].long]}
            zoom={16}
            style={{ height: '300px', width: '100%' }}
          >
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution="Tiles © Esri"
            />
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}"
              attribution="Transportation data © Esri"
              opacity={0.6}
            />
            {vendorMaps.map((point, index) => (
              <Marker key={index} position={[point.lat, point.long]}>
                <Popup>
                  Địa Điểm {index + 1} <br />
                  {vendorData.name} - {vendorData.quoc_gia}
                  <PriceTable vendorData={vendorData} />
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        ) : (
          <p>Không có dữ liệu bản đồ</p>
        )}
      </div>
    </>
  );
};

export default GoldDetail;