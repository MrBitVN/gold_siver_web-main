import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import DoubleLineChart from "./DoubleLineChart";
import TimeRangeFilter from "./TimeRangeFilter";
import { filterDataByTimeRange } from "../../utils/timeRangeHelper";
import "./DoubleLineChartPopUp.css";

const ChartWithPopup = ({
  allData,
  buyData,
  sellData,
  keyIndex,
  title,
  time,
  initialIsOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(initialIsOpen);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState(time);
  const [selectedOption, setSelectedOption] = useState(keyIndex);
  const [selectedTitle, setSelectedTitle] = useState(title);

  const currentBuyData = allData[`buy${selectedOption}`] || [];
  const currentSellData = allData[`sell${selectedOption}`] || [];

  // Check if this chart should be open based on URL (only on initial load)
  useEffect(() => {
    const chartParam = searchParams.get('chart');
    if (chartParam === keyIndex && !isOpen) {
      setIsOpen(true);
    }
  }, [searchParams, keyIndex]); // Removed isOpen from dependencies to avoid conflicts

  // Handle opening popup
  const handleOpen = () => {
    setIsOpen(true);
    setSearchParams({ chart: keyIndex });
  };

  // Handle closing popup
  const handleClose = () => {
    setIsOpen(false);
    const currentChart = searchParams.get('chart');
    if (currentChart === keyIndex) {
      searchParams.delete('chart');
      setSearchParams(searchParams);
    }
  };

  // Dữ liệu hiển thị dựa trên timeRange
  const filteredBuyData = useMemo(
    () => filterDataByTimeRange(buyData, timeRange),
    [buyData, timeRange]
  );
  const filteredSellData = useMemo(
    () => filterDataByTimeRange(sellData, timeRange),
    [sellData, timeRange]
  );

  const filteredcurrentBuyData = useMemo(
    () => filterDataByTimeRange(currentBuyData, timeRange),
    [currentBuyData, timeRange]
  );
  const filteredcurrentSellData = useMemo(
    () => filterDataByTimeRange(currentSellData, timeRange),
    [currentSellData, timeRange]
  );

  const optionTitleMap = {
    DataHistoryGooonusVANGPHUQUY: "History 1 Năm VANGPHUQUY",
    DatatoryGooonusNhanTronPhuQuy9999: "Nhẫn tròn phú quý 9999",
    DataHistoryGooonusVangMiengSjc: "Vàng miếng SJC",
    DataHistoryGooonusVangTrangSuc98: "Vàng trang sức 98",
    DataHistoryGooonusVangTrangSuc99: "Vàng trang sức 99",
    DataHistoryGooonusVangTrangSuc999: "Vàng trang sức 999",
    DataHistoryGooonusVangTrangSuc9999: "Vàng trang sức 9999",
    DataHistoryGooonusVangHanQuoc: "Vàng Hàn Quốc", //
    DataHistoryGooonusVangSac: "Vàng Sac",
    DataHistoryGooonusBacSac: "Bạc Sac",
  };

  return (
    <>
      {/* Chart nhỏ */}
      <Link to={`/chart-detail/${keyIndex}`} style={{ textDecoration: "none" }}>
        <div style={{ cursor: "pointer" }}>
          <DoubleLineChart
            buyData={filteredBuyData}
            sellData={filteredSellData}
            title={title}
            isZoom={isOpen}
          />
        </div>
      </Link>

      {/* Modal */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            textAlign: "center",
          }}
          onClick={handleClose}
        >
          <div
            style={{
              width: "97%",
              maxWidth: "2000px",
              height: "90%",
              backgroundColor: "var(--background-dark)",
              padding: "20px",
              borderRadius: "10px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Filter trong popup */}
            <TimeRangeFilter
              activeRange={timeRange}
              onRangeChange={setTimeRange}
            />

            {keyIndex === "DataHistoryGooonusVANGPHUQUY" && (
              <select
                class="custom-select"
                value={selectedOption}
                onChange={(e) => {
                  const value = e.target.value;
                  setSelectedOption(value);
                  setSelectedTitle(optionTitleMap[value]);
                }}
              >
                <option
                  key={"DataHistoryGooonusVANGPHUQUY"}
                  value={"DataMatDataHistoryGooonusVANGPHUQUYerial"}
                >
                  History 1 Năm VANGPHUQUY
                </option>
                <option
                  key={"DataHistoryGooonusNhanTronPhuQuy9999"}
                  value={"DataHistoryGooonusNhanTronPhuQuy9999"}
                >
                  Nhẫn tròn phú quý 9999
                </option>
                <option
                  key={"DataHistoryGooonusVangMiengSjc"}
                  value={"DataHistoryGooonusVangMiengSjc"}
                >
                  Vàng miếng SJC
                </option>
                <option
                  key={"DataHistoryGooonusVangTrangSuc98"}
                  value={"DataHistoryGooonusVangTrangSuc98"}
                >
                  Vàng trang sức 98
                </option>
                <option
                  key={"DataHistoryGooonusVangTrangSuc99"}
                  value={"DataHistoryGooonusVangTrangSuc99"}
                >
                  Vàng trang sức 99
                </option>
                <option
                  key={"DataHistoryGooonusVangTrangSuc999"}
                  value={"DataHistoryGooonusVangTrangSuc999"}
                >
                  Vàng trang sức 999
                </option>
                <option
                  key={"DataHistoryGooonusVangTrangSuc9999"}
                  value={"DataHistoryGooonusVangTrangSuc9999"}
                >
                  Vàng trang sức 9999
                </option>

                {/* <option
                  key={"DataHistoryGooonusVangHanQuoc"}
                  value={"DataHistoryGooonusVangHanQuoc"}
                >
                  Vàng Hàn Quốc
                </option> */}
              </select>
            )}
            {/* 

                        {/* Chart cập nhật dữ liệu mới */}
            <DoubleLineChart
              buyData={filteredcurrentBuyData}
              sellData={filteredcurrentSellData}
              title={selectedTitle}
              isZoom={isOpen}
            />

            <button
              style={{
                marginTop: "20px",
                padding: "6px 12px",
                borderRadius: "6px",
                border: "none",
                backgroundColor: "#EF4444",
                color: "#fff",
                cursor: "pointer",
              }}
              onClick={handleClose}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChartWithPopup;
