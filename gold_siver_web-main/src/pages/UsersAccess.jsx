import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import TypeList from "../components/users-access/TypeList";
import TypeMap from "../components/users-access/TypeMap";
import { FaMapMarkedAlt, FaThList } from "react-icons/fa";
import { logUserInfo } from "../utils/logUserInfo";
function UsersAccess() {
    const { t, i18n } = useTranslation();
    const locale = i18n.language && i18n.language.startsWith('en') ? 'en-US' : 'vi-VN';

    // dataAccess: Lưu trữ dữ liệu chi tiết của ngày được chọn
    const [dataAccess, setDataAccess] = useState(null); 
    const [isShowMap, setIsShowMap] = useState(false);
    // validDates: Danh sách các ngày có thể truy cập (dùng cho input date)
    const [validDates, setValidDates] = useState([]); 
    // validDateUrls: Map lưu trữ 'yyyy-mm-dd' -> 'dd_mm_yyyy' (định dạng API chi tiết)
    const [validDateUrls, setValidDateUrls] = useState({}); 

    const params = useParams();
    const navigate = useNavigate();

    const today = new Date().toISOString().slice(0, 10); // yyyy-mm-dd
    const date = params.date ?? today; // Ngày hiện tại, định dạng yyyy-mm-dd

  
    useEffect(() => {
        const fetchDays = async () => {
            try {
                const res = await fetch(`https://api_gold.thinkdiff.us/all_day_history_access`); 
                const json = await res.json();

                if (json.status === "success") {
                    const dateMap = {};
                    const days = json.data.map(item => {
                        // Lấy tên file: "09_12_2025.json" -> "09_12_2025"
                        const apiDate = item.link.split("/").pop().replace(".json", ""); 
                        const [dd, mm, yyyy] = apiDate.split("_");
                        const inputDate = `${yyyy}-${mm}-${dd}`; // Chuyển sang yyyy-mm-dd

                        dateMap[inputDate] = apiDate; // Lưu map: 'yyyy-mm-dd' -> 'dd_mm_yyyy'
                        return inputDate;
                    });

                    setValidDateUrls(dateMap);
                    // Sắp xếp ngày để min/max hoạt động đúng và để lấy ngày mới nhất dễ hơn
                    const sortedDays = days.sort(); 
                    setValidDates(sortedDays);

                    // Điều hướng đến ngày mới nhất nếu ngày trên URL không có dữ liệu
                    if (!days.includes(date) && days.length > 0) {
                        navigate(`/luong-truy-cap/${sortedDays[sortedDays.length - 1]}`);
                    }
                }
            } catch (err) {
                console.error("Error fetching day list:", err);
            }
        };

        fetchDays();
    }, []); // Chỉ chạy một lần khi component mount


    useEffect(() => {
        const fetchData = async () => {
            const apiDate = validDateUrls[date]; 
            
            // 1. Nếu ngày không hợp lệ (không có trong danh sách), dừng lại
            if (!apiDate) {
                setDataAccess([]); 
                return;
            }

            try {
                // 2. Gọi API chi tiết với định dạng dd_mm_yyyy
                const res = await fetch(
                    `https://api_gold.thinkdiff.us/get_account_access/${apiDate}`
                );
                const json = await res.json();

                if (json.status === "success" || json.data?.status === "success") {
                    // Lấy dữ liệu tonghop
                    setDataAccess(json.data.tonghop ?? []); 
                } else {
                    setDataAccess([]); // API trả về thất bại -> xem như không có dữ liệu
                }

                await logUserInfo("User access with date " + date);

            } catch (err) {
                console.error("Error fetching access data:", err);
                setDataAccess([]);
            }
        };

        if (validDates.length > 0) {
             fetchData();
        }
    }, [date, validDateUrls, validDates]); 

    const handleChangeDate = (e) => {
        navigate(`/luong-truy-cap/${e.target.value}`);
    };

    const isDateValid = validDateUrls.hasOwnProperty(date); 

    return (
        <div>
            <div style={{ position: "relative" }}>
                <h3 style={{ textAlign: "center", padding: "20px 0" }}>
                    {t('usersAccess.title', { date, count: dataAccess?.length || 0 })}
                </h3>

                <div style={{ position: "absolute", top: "1rem", right: "6.5rem" }}>
                    <input
                        type="date"
                        value={date}
                       
                        onChange={handleChangeDate}
                        style={{
                            padding: "8px",
                            borderRadius: "8px",
                            border: "1px solid #ccc",
                            width: "135px",
                        }}
                    />
                </div>

                <div
                    style={{
                        position: "absolute",
                        top: "1rem",
                        right: "2rem",
                        width: "4rem",
                        height: "2.5rem",
                        backgroundColor: "#3b82f6",
                        borderRadius: "9999px",
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                    onClick={() => setIsShowMap(!isShowMap)}
                >
                    {isShowMap ? <FaThList color="white" /> : <FaMapMarkedAlt color="white" />}
                </div>
            </div>

            {dataAccess === null && validDates.length === 0 && (
                <p style={{ textAlign: "center", color: "#666" }}>{t('usersAccess.loadingDays')}</p>
            )}

            {validDates.length > 0 && !isDateValid && (
                <p style={{ textAlign: "center", color: "red", fontWeight: "bold" }}>
                    {t('usersAccess.invalidDate', { date })}
                </p>
            )}

            {isDateValid && dataAccess === null && (
                <p style={{ textAlign: "center", color: "#666" }}>{t('usersAccess.loadingData', { date })}</p>
            )}

            {isDateValid && dataAccess !== null && dataAccess.length === 0 && (
                <p style={{ textAlign: "center", color: "orange", fontWeight: "bold" }}>
                    {t('usersAccess.noDataForDate', { date })}
                </p>
            )}
            
            {isDateValid && dataAccess !== null && dataAccess.length > 0 && (
                <>
                    {!isShowMap && <TypeList data={dataAccess} />}
                    {isShowMap && <TypeMap data={dataAccess} />}
                </>
            )}
        </div>
    );
}

export default UsersAccess;