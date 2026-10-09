import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useDateGold } from '../../hooks/useDateGold';
import { useVang247Dates } from '../../hooks/useHourOneDay';
import './TimeRangeSelector.css'

// Định nghĩa một giá trị mặc định tạm thời 
const FALLBACK_DATE = { day: '01', month: '01', year: '2020', hour: '00', minute: '00' };

// Hàm extractDateParams - hỗ trợ cả route cũ và route mới
const extractDateParams = (urlPath, urlParams) => {
    // Ưu tiên đọc từ useParams (route mới: /:region/:type/vang247/:day/:month/:year/:hour/:minute)
    if (urlParams?.day && urlParams?.month && urlParams?.year && urlParams?.hour && urlParams?.minute) {
        return {
            day: String(parseInt(urlParams.day) || FALLBACK_DATE.day),
            month: String(parseInt(urlParams.month) || FALLBACK_DATE.month),
            year: String(parseInt(urlParams.year) || FALLBACK_DATE.year),
            hour: String(parseInt(urlParams.hour) || FALLBACK_DATE.hour),
            minute: String(parseInt(urlParams.minute) || FALLBACK_DATE.minute),
        };
    }

    // Fallback: đọc từ path (route cũ hoặc route /tong-hop/:type/DD/MM/YYYY/HH/MM)
    const pathParts = urlPath.split('/').filter(Boolean);
    if (pathParts[0] === 'tong-hop' && pathParts.length >= 7) {
        return {
            day: String(parseInt(pathParts[2]) || FALLBACK_DATE.day),
            month: String(parseInt(pathParts[3]) || FALLBACK_DATE.month),
            year: String(parseInt(pathParts[4]) || FALLBACK_DATE.year),
            hour: String(parseInt(pathParts[5]) || FALLBACK_DATE.hour),
            minute: String(parseInt(pathParts[6]) || FALLBACK_DATE.minute),
        };
    }
    if (pathParts.length >= 7) {
        return {
            day: String(parseInt(pathParts[2]) || FALLBACK_DATE.day),
            month: String(parseInt(pathParts[3]) || FALLBACK_DATE.month),
            year: String(parseInt(pathParts[4]) || FALLBACK_DATE.year),
            hour: String(parseInt(pathParts[5]) || FALLBACK_DATE.hour),
            minute: String(parseInt(pathParts[6]) || FALLBACK_DATE.minute),
        };
    }

    // Trả về giá trị mặc định dạng chuỗi
    return {
        day: String(FALLBACK_DATE.day), month: String(FALLBACK_DATE.month), year: String(FALLBACK_DATE.year),
        hour: String(FALLBACK_DATE.hour), minute: String(FALLBACK_DATE.minute),
    };
};

const filterDate = {
    sortBy: "datetime",
    sortOrder: "desc",
};

const TimeRangeSelector = ({ disableAutoRedirect = false }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const urlParams = useParams();
    console.log("urlParams", urlParams);

    const urlPath = location.pathname;

    // Đọc region và type từ URL params hoặc từ path
    const isTongHopPath = urlPath.startsWith('/tong-hop');
    const currentRegion = urlParams.region || 'vietnam';
    const currentType =
        urlParams.type ||
        (isTongHopPath ? urlPath.split('/').filter(Boolean)[1] || 'gold' : 'gold');

    const { displayedDates, isLoading: isDatesLoading, availableDates } = useDateGold(filterDate);
    console.log('temp1', displayedDates);

    const latestDateString = displayedDates.length > 0
        ? displayedDates[0]?.dirname
        : null;

    const [latestDay, latestMonth, latestYear] = latestDateString ? latestDateString.split("_") : [null, null, null];

    const { files: latestDateFiles, isLoading: isTimesLoading } = useVang247Dates(
        latestDay, latestMonth, latestYear
    );
    const latestFile = latestDateFiles?.length > 0 ? latestDateFiles[0] : null;

    const urlDateParams = useMemo(() => extractDateParams(urlPath, urlParams), [urlPath, urlParams]);

    const isUrlValid = urlDateParams.day !== FALLBACK_DATE.day;

    const initialDay = isUrlValid ? urlDateParams.day : latestDay || FALLBACK_DATE.day;
    const initialMonth = isUrlValid ? urlDateParams.month : latestMonth || FALLBACK_DATE.month;
    const initialYear = isUrlValid ? urlDateParams.year : latestYear || FALLBACK_DATE.year;

    const initialTime = isUrlValid && urlDateParams.hour !== FALLBACK_DATE.hour
        ? `${urlDateParams.hour}-${urlDateParams.minute}`
        : latestFile ? `${latestFile.hour}-${latestFile.minute}` : "";

    const [selectedDay, setSelectedDay] = useState(initialDay);
    const [selectedMonth, setSelectedMonth] = useState(initialMonth);
    const [selectedYear, setSelectedYear] = useState(initialYear);
    const [selectedTime, setSelectedTime] = useState(initialTime);

    const { files: currentSelectedDateFiles } = useVang247Dates(
        selectedDay, selectedMonth, selectedYear
    );
    console.log("currentSelectedDateFiles", currentSelectedDateFiles);

    // Tự động chọn ngày/giờ mới nhất trên trang tổng hợp khi disableAutoRedirect bật
    useEffect(() => {
        if (!disableAutoRedirect) return;
        if (isUserChangingRef.current || isChangingDateRef.current) return;

        const shouldUseLatestDate = !isUrlValid && latestDay && latestMonth && latestYear && latestFile;
        if (shouldUseLatestDate) {
            const formattedTime = `${String(latestFile.hour).padStart(2, '0')}-${String(latestFile.minute).padStart(2, '0')}`;
            if (
                selectedDay !== latestDay ||
                selectedMonth !== latestMonth ||
                selectedYear !== latestYear ||
                selectedTime !== formattedTime
            ) {
                setSelectedDay(latestDay);
                setSelectedMonth(latestMonth);
                setSelectedYear(latestYear);
                setSelectedTime(formattedTime);
                return;
            }
        }

        if (!selectedTime && currentSelectedDateFiles?.length) {
            const latestForDate = currentSelectedDateFiles[0];
            const formattedTime = `${String(latestForDate.hour).padStart(2, '0')}-${String(latestForDate.minute).padStart(2, '0')}`;
            setSelectedTime(formattedTime);
        }
    }, [disableAutoRedirect, isUrlValid, latestDay, latestMonth, latestYear, latestFile, currentSelectedDateFiles, selectedDay, selectedMonth, selectedYear, selectedTime]);

    // Đồng bộ state với URL params (chỉ khi URL thay đổi từ bên ngoài, không phải từ user action)
    useEffect(() => {
        // Bỏ qua nếu user đang thay đổi ngày
        if (isUserChangingRef.current || isChangingDateRef.current) {
            return;
        }

        const { day, month, year, hour, minute } = urlDateParams;

        if (day !== FALLBACK_DATE.day) {
            // Chỉ cập nhật nếu khác với state hiện tại (tránh vòng lặp)
            const expectedTime = `${hour}-${minute}`;
            if (selectedDay !== day || selectedMonth !== month || selectedYear !== year || selectedTime !== expectedTime) {
                setSelectedDay(day);
                setSelectedMonth(month);
                setSelectedYear(year);
                setSelectedTime(expectedTime);
            }
        }
    }, [urlDateParams]);

    // Tự động redirect về latest date nếu là trang chủ hoặc trang tổng hợp /tong-hop mà chưa có date params
    useEffect(() => {
        if (disableAutoRedirect) return;

        const hasDateParams = urlParams.day && urlParams.month && urlParams.year && urlParams.hour && urlParams.minute;
        const pathSegments = urlPath.split('/').filter(Boolean);
        const isRoot = urlPath === '/';
        const isRegionOnly = pathSegments.length === 1 && ['vietnam', 'international'].includes(pathSegments[0]);
        const isRegionType =
            pathSegments.length === 2 &&
            ['vietnam', 'international'].includes(pathSegments[0]) &&
            ['gold', 'silver'].includes(pathSegments[1]);
        const isTongHopDefault = urlPath.startsWith('/tong-hop') && pathSegments.length <= 2;
        const isDefaultUrl = isRoot || isRegionOnly || isRegionType || isTongHopDefault;

        if (!hasDateParams && !isDatesLoading && !isTimesLoading && latestFile && isDefaultUrl && latestDay && latestMonth && latestYear) {
            const formattedHour = String(latestFile.hour).padStart(2, '0');
            const formattedMinute = String(latestFile.minute).padStart(2, '0');
            const basePath = isTongHopPath ? `/tong-hop/${currentType}` : `/${currentRegion}/${currentType}`;
            const newPath = `${basePath}/${latestDay}/${latestMonth}/${latestYear}/${formattedHour}/${formattedMinute}`;
            if (!urlParams.symbol) navigate(newPath, { replace: true });
        }
    }, [disableAutoRedirect, isDatesLoading, isTimesLoading, latestFile, latestDay, latestMonth, latestYear, navigate, urlPath, currentRegion, currentType, urlParams.day, urlParams.month, urlParams.year, urlParams.hour, urlParams.minute, urlParams.region]);

    // Ref để theo dõi xem có đang trong quá trình chọn ngày mới không
    const isChangingDateRef = React.useRef(false);
    // Ref để ngăn useEffect đồng bộ URL override khi user đang chọn
    const isUserChangingRef = React.useRef(false);

    // Tự động navigate khi chọn ngày (chọn giờ đầu tiên nếu có)
    const changeDate = (dateString) => {
        const [day, month, year] = dateString.split("_");
        isChangingDateRef.current = true;
        isUserChangingRef.current = true; // Đánh dấu user đang thay đổi
        setSelectedDay(day);
        setSelectedMonth(month);
        setSelectedYear(year);
        setSelectedTime("");
    };

    // Tự động navigate khi chọn giờ
    const changeTime = (timeString) => {
        if (!timeString) return;
        isUserChangingRef.current = true; // Đánh dấu user đang thay đổi
        setSelectedTime(timeString);

        if (disableAutoRedirect) {
            return;
        }

        const [hour, minute] = timeString.split("-");
        if (selectedDay && selectedMonth && selectedYear && hour && minute) {
            // Đảm bảo format có 2 chữ số
            const formattedHour = String(hour).padStart(2, '0');
            const formattedMinute = String(minute).padStart(2, '0');
            const basePath = isTongHopPath ? `/tong-hop/${currentType}` : `/${currentRegion}/${currentType}`;
            const newPath = `${basePath}/${selectedDay}/${selectedMonth}/${selectedYear}/${formattedHour}/${formattedMinute}`;
            if (!urlParams.symbol) navigate(newPath, { replace: true });
            // Reset flag sau khi navigate
            setTimeout(() => {
                isUserChangingRef.current = false;
            }, 100);
        }
    };

    // Tự động navigate khi có đủ thông tin sau khi chọn ngày
    useEffect(() => {
        if (disableAutoRedirect) return;
        // Chỉ navigate khi đang trong quá trình thay đổi ngày và chưa có giờ được chọn
        if (isChangingDateRef.current && selectedDay && selectedMonth && selectedYear && !selectedTime && currentSelectedDateFiles?.length > 0) {
            // Tự động chọn giờ đầu tiên và navigate
            const firstFile = currentSelectedDateFiles[0];
            // Đảm bảo format có 2 chữ số
            const formattedHour = String(firstFile.hour).padStart(2, '0');
            const formattedMinute = String(firstFile.minute).padStart(2, '0');
            const timeString = `${formattedHour}-${formattedMinute}`;
            isChangingDateRef.current = false;
            isUserChangingRef.current = false; // Reset flag sau khi navigate xong
            setSelectedTime(timeString);
            const basePath = isTongHopPath ? `/tong-hop/${currentType}` : `/${currentRegion}/${currentType}`;
            const newPath = `${basePath}/${selectedDay}/${selectedMonth}/${selectedYear}/${formattedHour}/${formattedMinute}`;
            if (!urlParams.symbol) navigate(newPath, { replace: true });
        }
    }, [disableAutoRedirect, selectedDay, selectedMonth, selectedYear, selectedTime, currentSelectedDateFiles, currentRegion, currentType, navigate]);

    const dateSelectValue = `${selectedDay}_${selectedMonth}_${selectedYear}`;

    if (isDatesLoading || isTimesLoading) {
        return <div className="time-range-loading">Đang tải dữ liệu...</div>;
    }

    return (
        <div className="time-range-container">
            <div className="time-range-selects">
                <label className="pill-select">
                    <span className="label">Ngày</span>
                    <select
                        id="start-date-select"
                        onChange={(e) => changeDate(e.target.value)}
                        value={dateSelectValue}
                        style={{background:'#334155'}}
                    >
                        {displayedDates.filter(date => date.dirname !== 'image_tintuc').map(date => (
                            <option key={date.dirname} value={date.dirname}>
                                {date.dirname.split('_').join('/')}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="pill-select">
                    <span className="label">Giờ</span>
                    <select
                        id="time-select"
                        onChange={(e) => changeTime(e.target.value)}
                        value={selectedTime}
                        disabled={currentSelectedDateFiles?.length === 0}
                        style={{background:'#334155'}}
                    >
                        <option value="" disabled>-- Chọn giờ --</option>
                        {currentSelectedDateFiles?.map(d => (
                            <option key={d.link} value={`${d.hour}-${d.minute}`}>
                                {d.hour}:{d.minute}
                            </option>
                        )) ?? null}
                    </select>
                </label>
            </div>
        </div>
    );
}
export default React.memo(TimeRangeSelector);