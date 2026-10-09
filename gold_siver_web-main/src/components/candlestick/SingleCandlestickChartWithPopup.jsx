import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import SingleCandlestickChart from "./SingleCandlestickChart";
import TimeRangeFilter from "./TimeRangeFilter";
import { filterDataByTimeRange } from "../../utils/timeRangeHelper";

const SingleCandlestickChartWithPopup = ({
  data,
  title,
  timeRange,
  setTimeRange,
  chartKey,
  initialIsOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(initialIsOpen);
  const [searchParams, setSearchParams] = useSearchParams();
  const [popupTimeRange, setPopupTimeRange] = useState(timeRange);

  // Check if this chart should be open based on URL
  useEffect(() => {
    const chartParam = searchParams.get('chart');
    if (chartParam === chartKey) {
      setIsOpen(true);
    } else if (chartParam !== chartKey && isOpen) {
      setIsOpen(false);
    }
  }, [searchParams, chartKey]);

  // Handle opening popup
  const handleOpen = () => {
    setIsOpen(true);
    setSearchParams({ chart: chartKey });
  };

  // Handle closing popup
  const handleClose = () => {
    setIsOpen(false);
    const currentChart = searchParams.get('chart');
    if (currentChart === chartKey) {
      searchParams.delete('chart');
      setSearchParams(searchParams);
    }
  };

  // Filter data for popup
  const popupData = useMemo(
    () => filterDataByTimeRange(data, popupTimeRange),
    [data, popupTimeRange]
  );

  return (
    <>
      {/* Chart nhỏ */}
      <Link to={`/chart-detail/${chartKey}`} style={{ textDecoration: "none" }}>
        <div style={{ cursor: "pointer" }}>
          <SingleCandlestickChart
            data={data}
            title={title}
            timeRange={timeRange}
            setTimeRange={setTimeRange}
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
              activeRange={popupTimeRange}
              onRangeChange={setPopupTimeRange}
            />

            {/* Chart cập nhật dữ liệu mới */}
            <SingleCandlestickChart
              data={popupData}
              title={title}
              timeRange={popupTimeRange}
              setTimeRange={setPopupTimeRange}
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
              onClick={(e) => {
                e.stopPropagation();
                handleClose();
              }}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default SingleCandlestickChartWithPopup;
